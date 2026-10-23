#!/bin/sh
# Container entrypoint: runs the service named by $APP from the built image.
set -eu

case "${APP:-}" in
  api-gateway | admin-gateway | auth-service | user-service | course-service | \
    assessment-service | ai-service | subscription-service)
    exec node "dist/apps/$APP/main.js"
    ;;
  *)
    echo "Set APP to one of: api-gateway, admin-gateway, auth-service," >&2
    echo "user-service, course-service, assessment-service, ai-service," >&2
    echo "subscription-service (got '${APP:-}')." >&2
    exit 1
    ;;
esac
