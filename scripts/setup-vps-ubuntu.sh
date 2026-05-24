#!/usr/bin/env bash
set -Eeuo pipefail

# Ubuntu VPS setup for ANCS Studio.
# Target layout:
# - MariaDB runs on the host.
# - Redis, Next.js, chat worker, and Nginx run through Docker Compose.
# - HTTPS is issued with a one-off certbot Docker container.
#
# Before running:
#   1. Clone/upload the project to APP_DIR.
#   2. Copy .env.example to .env.
#   3. Fill .env with production values.
#
# Usage:
#   sudo APP_DIR=/opt/agency bash scripts/setup-vps-ubuntu.sh

APP_DIR="${APP_DIR:-/opt/agency}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/.env}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"
SEED_ADMIN="${SEED_ADMIN:-false}"
INSTALL_MARIADB="${INSTALL_MARIADB:-true}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root or with sudo."
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "APP_DIR does not exist: $APP_DIR"
  echo "Clone or upload the project there first."
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Copy .env.example to .env, fill it, then run this script again."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "Installing base packages..."
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release git openssl python3 ufw

env_get() {
  local key="$1"
  local default_value="${2:-}"
  python3 - "$ENV_FILE" "$key" "$default_value" <<'PY'
import sys
from pathlib import Path

env_file = Path(sys.argv[1])
target = sys.argv[2]
default = sys.argv[3]

for raw_line in env_file.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#"):
        continue
    if line.startswith("export "):
        line = line[7:].strip()
    if "=" not in line:
        continue
    key, value = line.split("=", 1)
    key = key.strip()
    if key != target:
        continue
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
        value = value[1:-1]
    print(value)
    sys.exit(0)

print(default)
PY
}

required_env() {
  local key="$1"
  local value
  value="$(env_get "$key")"
  if [[ -z "$value" ]]; then
    echo "Missing required .env value: $key"
    exit 1
  fi
  printf "%s" "$value"
}

sql_escape() {
  printf "%s" "$1" | sed "s/'/''/g"
}

APP_NAME="$(env_get APP_NAME "Ancs Studio")"
DOMAIN_NAME="$(env_get DOMAIN_NAME)"
CERTBOT_EMAIL="$(env_get CERTBOT_EMAIL)"
ENABLE_HTTPS="$(env_get ENABLE_HTTPS "true")"
SSH_PORT="$(env_get SSH_PORT "22")"
DATABASE_URL="$(required_env DATABASE_URL)"
MYSQL_PORT="$(env_get MYSQL_PORT "3306")"
MYSQL_ROOT_PASSWORD="$(env_get MYSQL_ROOT_PASSWORD)"
MYSQL_DATABASE="$(required_env MYSQL_DATABASE)"
MYSQL_USER="$(required_env MYSQL_USER)"
MYSQL_PASSWORD="$(required_env MYSQL_PASSWORD)"
BETTER_AUTH_SECRET="$(required_env BETTER_AUTH_SECRET)"
BETTER_AUTH_URL="$(required_env BETTER_AUTH_URL)"
NEXT_PUBLIC_BETTER_AUTH_URL="$(required_env NEXT_PUBLIC_BETTER_AUTH_URL)"

if [[ "$DATABASE_URL" == *"@127.0.0.1:"* || "$DATABASE_URL" == *"@localhost:"* ]]; then
  echo "DATABASE_URL must use host.docker.internal because Next.js runs inside Docker."
  echo "Example: mysql://${MYSQL_USER}:URL_ENCODED_PASSWORD@host.docker.internal:${MYSQL_PORT}/${MYSQL_DATABASE}"
  exit 1
fi

if [[ "$DATABASE_URL" != *"@host.docker.internal:${MYSQL_PORT}/"* ]]; then
  echo "DATABASE_URL should point to host.docker.internal:${MYSQL_PORT} for this Docker layout."
  exit 1
fi

if [[ "$BETTER_AUTH_SECRET" == CHANGE_ME* || "$MYSQL_PASSWORD" == CHANGE_ME* ]]; then
  echo "Replace CHANGE_ME values in .env before running this in production."
  exit 1
fi

if [[ "$ENABLE_HTTPS" == "true" ]]; then
  if [[ -z "$DOMAIN_NAME" || -z "$CERTBOT_EMAIL" ]]; then
    echo "ENABLE_HTTPS=true requires DOMAIN_NAME and CERTBOT_EMAIL in .env."
    exit 1
  fi
  if [[ "$BETTER_AUTH_URL" != "https://${DOMAIN_NAME}" || "$NEXT_PUBLIC_BETTER_AUTH_URL" != "https://${DOMAIN_NAME}" ]]; then
    echo "For HTTPS production, set BETTER_AUTH_URL and NEXT_PUBLIC_BETTER_AUTH_URL to https://${DOMAIN_NAME}."
    exit 1
  fi
fi

echo "App: ${APP_NAME}"
echo "App dir: ${APP_DIR}"
echo "Domain: ${DOMAIN_NAME:-http-only}"
echo "MariaDB: ${MYSQL_DATABASE} on host port ${MYSQL_PORT}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker Engine from Docker's official apt repository..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  . /etc/os-release
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  echo "Docker is already installed."
fi

if [[ "$INSTALL_MARIADB" == "true" ]]; then
  echo "Installing and configuring MariaDB on the host..."
  apt-get install -y mariadb-server mariadb-client

  cat > /etc/mysql/mariadb.conf.d/99-ancs-studio.cnf <<MARIADB_CNF
[mysqld]
bind-address = 0.0.0.0
port = ${MYSQL_PORT}
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
max_connections = 80
skip-name-resolve
MARIADB_CNF

  systemctl enable --now mariadb
  systemctl restart mariadb

  mysql_root_cmd=(mariadb -uroot)
  if ! mariadb -uroot --protocol=socket -e "SELECT 1" >/dev/null 2>&1; then
    if [[ -z "$MYSQL_ROOT_PASSWORD" ]]; then
      echo "MariaDB root password is already set, but MYSQL_ROOT_PASSWORD is empty."
      exit 1
    fi
    mysql_root_cmd=(mariadb -uroot "-p${MYSQL_ROOT_PASSWORD}")
  fi

  db_name="$(sql_escape "$MYSQL_DATABASE")"
  db_user="$(sql_escape "$MYSQL_USER")"
  db_pass="$(sql_escape "$MYSQL_PASSWORD")"
  root_pass="$(sql_escape "$MYSQL_ROOT_PASSWORD")"

  "${mysql_root_cmd[@]}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${db_name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${db_user}'@'%' IDENTIFIED BY '${db_pass}';
ALTER USER '${db_user}'@'%' IDENTIFIED BY '${db_pass}';
GRANT ALL PRIVILEGES ON \`${db_name}\`.* TO '${db_user}'@'%';
FLUSH PRIVILEGES;
SQL

  if [[ -n "$MYSQL_ROOT_PASSWORD" ]] && mariadb -uroot --protocol=socket -e "SELECT 1" >/dev/null 2>&1; then
    mariadb -uroot --protocol=socket <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${root_pass}';
FLUSH PRIVILEGES;
SQL
  fi
fi

echo "Configuring UFW..."
ufw allow "${SSH_PORT}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny "${MYSQL_PORT}/tcp"
ufw --force enable

cd "$APP_DIR"

if [[ -d .git ]]; then
  git config core.fileMode false
fi

mkdir -p deploy/nginx deploy/certbot/www deploy/certbot/conf

write_http_nginx_config() {
  local server_name="${1:-_}"
  cat > deploy/nginx/default.conf <<NGINX
upstream agency_next {
  server web:3000;
  keepalive 32;
}

server {
  listen 80;
  server_name ${server_name};

  client_max_body_size 25m;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
    try_files \$uri =404;
  }

  proxy_http_version 1.1;
  proxy_set_header Host \$host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_set_header Upgrade \$http_upgrade;
  proxy_set_header Connection "";

  location /api/realtime {
    proxy_pass http://agency_next;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 1h;
    proxy_send_timeout 1h;
    add_header X-Accel-Buffering no;
  }

  location / {
    proxy_pass http://agency_next;
    proxy_buffering on;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
  }
}
NGINX
}

write_https_nginx_config() {
  local server_name="$1"
  cat > deploy/nginx/default.conf <<NGINX
upstream agency_next {
  server web:3000;
  keepalive 32;
}

server {
  listen 80;
  server_name ${server_name};

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
    try_files \$uri =404;
  }

  location / {
    return 301 https://\$host\$request_uri;
  }
}

server {
  listen 443 ssl http2;
  server_name ${server_name};

  ssl_certificate /etc/letsencrypt/live/${server_name}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${server_name}/privkey.pem;
  ssl_session_timeout 1d;
  ssl_session_cache shared:TLS:10m;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers off;

  client_max_body_size 25m;

  proxy_http_version 1.1;
  proxy_set_header Host \$host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto https;
  proxy_set_header Upgrade \$http_upgrade;
  proxy_set_header Connection "";

  location /api/realtime {
    proxy_pass http://agency_next;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 1h;
    proxy_send_timeout 1h;
    add_header X-Accel-Buffering no;
  }

  location / {
    proxy_pass http://agency_next;
    proxy_buffering on;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
  }
}
NGINX
}

echo "Writing initial HTTP Nginx config..."
write_http_nginx_config "${DOMAIN_NAME:-_}"

echo "Building and starting Docker services..."
docker compose up -d --build redis web chat-worker nginx

if [[ "$RUN_MIGRATIONS" == "true" ]]; then
  echo "Running database migrations..."
  docker compose run --rm web bun run db:migrate
  docker compose up -d web chat-worker nginx
fi

if [[ "$SEED_ADMIN" == "true" ]]; then
  echo "Seeding admin user..."
  docker compose run --rm web bun run seed:admin
fi

if [[ "$ENABLE_HTTPS" == "true" ]]; then
  echo "Requesting or renewing Let's Encrypt certificate for ${DOMAIN_NAME}..."
  if [[ ! -f "deploy/certbot/conf/live/${DOMAIN_NAME}/fullchain.pem" ]]; then
    docker run --rm \
      -v "${APP_DIR}/deploy/certbot/conf:/etc/letsencrypt" \
      -v "${APP_DIR}/deploy/certbot/www:/var/www/certbot" \
      certbot/certbot certonly \
      --webroot \
      --webroot-path /var/www/certbot \
      -d "${DOMAIN_NAME}" \
      --email "${CERTBOT_EMAIL}" \
      --agree-tos \
      --no-eff-email \
      --non-interactive
  else
    docker run --rm \
      -v "${APP_DIR}/deploy/certbot/conf:/etc/letsencrypt" \
      -v "${APP_DIR}/deploy/certbot/www:/var/www/certbot" \
      certbot/certbot renew \
      --webroot \
      --webroot-path /var/www/certbot \
      --quiet
  fi

  echo "Switching Nginx to HTTPS config..."
  write_https_nginx_config "${DOMAIN_NAME}"
  docker compose up -d nginx

  cat > /usr/local/sbin/ancs-certbot-renew.sh <<RENEW
#!/usr/bin/env bash
set -euo pipefail
cd "${APP_DIR}"
docker run --rm \\
  -v "${APP_DIR}/deploy/certbot/conf:/etc/letsencrypt" \\
  -v "${APP_DIR}/deploy/certbot/www:/var/www/certbot" \\
  certbot/certbot renew --webroot --webroot-path /var/www/certbot --quiet
docker compose exec -T nginx nginx -s reload
RENEW
  chmod +x /usr/local/sbin/ancs-certbot-renew.sh
  cat > /etc/cron.d/ancs-certbot-renew <<'CRON'
17 3 * * * root /usr/local/sbin/ancs-certbot-renew.sh >/var/log/ancs-certbot-renew.log 2>&1
CRON
fi

echo "Current service status:"
docker compose ps

echo ""
echo "Done."
echo "- App: ${BETTER_AUTH_URL}"
echo "- MariaDB is on host port ${MYSQL_PORT}; UFW denies public access to that port."
echo "- Docker services: redis, web, chat-worker, nginx."
echo "- Logs: cd ${APP_DIR} && docker compose logs -f web chat-worker nginx redis"
