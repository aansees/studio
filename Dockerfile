FROM oven/bun:1.3.8-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS builder
WORKDIR /app

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN DATABASE_URL=mysql://agency:agency@127.0.0.1:3306/agency \
    BETTER_AUTH_SECRET=build-time-secret-change-in-runtime-1234567890 \
    BETTER_AUTH_URL=http://localhost:3000 \
    NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000 \
    bun run build

FROM oven/bun:1.3.8-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app ./

EXPOSE 3000
CMD ["bun", "run", "start"]
