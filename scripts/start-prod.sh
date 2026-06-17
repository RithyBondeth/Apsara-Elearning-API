#!/usr/bin/env bash
# Boot RabbitMQ + every built service (dist) and tear them down together on exit.
# Run `npm run build:all` first.
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose up -d
for _ in $(seq 1 30); do nc -z localhost 5672 2>/dev/null && break; sleep 1; done

# Consumers before gateways so message handlers are ready.
APPS=(auth-service user-service course-service assessment-service ai-service subscription-service api-gateway admin-gateway)
PIDS=()
for app in "${APPS[@]}"; do
  if [[ ! -f "dist/apps/$app/main.js" ]]; then
    echo "✗ dist/apps/$app/main.js missing — run 'npm run build:all' first." >&2
    exit 1
  fi
  node "dist/apps/$app/main.js" &
  PIDS+=($!)
  echo "  started $app (pid $!)"
done

trap 'echo; echo "Stopping…"; kill "${PIDS[@]}" 2>/dev/null || true' EXIT INT TERM
wait
