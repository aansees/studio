#!/usr/bin/env bash
set -Eeuo pipefail

COMPOSE="${COMPOSE:-docker compose}"

show_help() {
  cat <<'HELP'
Usage:
  bash docker.sh --nextjs
  bash docker.sh --nextjs --restart
  bash docker.sh --nginx --restart
  bash docker.sh --redis --restart
  bash docker.sh --worker --restart
  bash docker.sh --app
  bash docker.sh --all
  bash docker.sh --logs --nextjs
  bash docker.sh --status

Targets:
  --nextjs    Build/deploy only the Next.js web service
  --app       Build/deploy the shared app services: web + chat-worker
  --web       Build/deploy only the web service
  --worker    Build/deploy only the chat-worker service
  --nginx     Deploy or restart Nginx
  --redis     Deploy or restart Redis
  --all       Build/deploy all services

Actions:
  default     docker compose up -d --build for buildable targets, up -d otherwise
  --restart   Restart selected service(s) without rebuilding
  --pull      Pull image(s) before deploy
  --logs      Follow logs for selected service(s)
  --status    Show docker compose ps
  --help      Show this help
HELP
}

require_compose_file() {
  if [[ ! -f docker-compose.yml ]]; then
    echo "docker-compose.yml not found. Run this from the project root."
    exit 1
  fi
}

main() {
  require_compose_file

  local restart=false
  local pull=false
  local logs=false
  local status=false
  local selected=false
  local services=()

  if [[ "$#" -eq 0 ]]; then
    show_help
    exit 0
  fi

  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --nextjs)
        selected=true
        services+=(web)
        ;;
      --app)
        selected=true
        services+=(web chat-worker)
        ;;
      --web)
        selected=true
        services+=(web)
        ;;
      --worker|--chat-worker)
        selected=true
        services+=(chat-worker)
        ;;
      --nginx)
        selected=true
        services+=(nginx)
        ;;
      --redis)
        selected=true
        services+=(redis)
        ;;
      --all)
        selected=true
        services+=(redis web chat-worker nginx)
        ;;
      --restart)
        restart=true
        ;;
      --pull)
        pull=true
        ;;
      --logs)
        logs=true
        ;;
      --status)
        status=true
        ;;
      --help|-h)
        show_help
        exit 0
        ;;
      *)
        echo "Unknown option: $1"
        echo ""
        show_help
        exit 1
        ;;
    esac
    shift
  done

  mapfile -t services < <(printf "%s\n" "${services[@]}" | awk '!seen[$0]++')

  if [[ "$status" == true ]]; then
    $COMPOSE ps
    exit 0
  fi

  if [[ "$selected" == false ]]; then
    echo "Select at least one target."
    echo ""
    show_help
    exit 1
  fi

  if [[ "$logs" == true ]]; then
    $COMPOSE logs -f "${services[@]}"
    exit 0
  fi

  if [[ "$restart" == true ]]; then
    $COMPOSE restart "${services[@]}"
    exit 0
  fi

  if [[ "$pull" == true ]]; then
    $COMPOSE pull "${services[@]}"
  fi

  if printf "%s\n" "${services[@]}" | grep -Eq "^(web|chat-worker)$"; then
    $COMPOSE up -d --build "${services[@]}"
  else
    $COMPOSE up -d "${services[@]}"
  fi
}

main "$@"
