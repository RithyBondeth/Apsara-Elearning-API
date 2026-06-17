#!/usr/bin/env bash
# Boot RabbitMQ + every microservice in watch mode with one command.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Starting RabbitMQ (docker compose)…"
docker compose up -d

echo "▶ Waiting for RabbitMQ on :5672…"
for _ in $(seq 1 30); do
  if nc -z localhost 5672 2>/dev/null; then echo "  RabbitMQ is up."; break; fi
  sleep 1
done

echo "▶ Starting all services (watch mode). Ctrl-C to stop."
npm run start:all
