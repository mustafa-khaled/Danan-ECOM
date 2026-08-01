#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

# E2E/dev must use a writable uploads dir; /app/uploads is Docker-only.
if [ -z "${STORAGE_LOCAL_PATH:-}" ] || [ "$STORAGE_LOCAL_PATH" = "/app/uploads" ]; then
  export STORAGE_LOCAL_PATH="/tmp/dadan-uploads"
fi
mkdir -p "$STORAGE_LOCAL_PATH"

# Playwright E2E runs many validate-key attempts from one IP; always raise the
# limit (do not inherit the restrictive local/production .env value).
export AUTH_RATE_LIMIT_MAX="100"

missing=0
for var in DATABASE_URL REDIS_URL JWT_SECRET CERT_SIGNING_SECRET BASE_URL; do
  if [ -z "${!var:-}" ]; then
    echo "Missing required env var: $var (copy .env.example to .env and start Postgres/Redis)" >&2
    missing=1
  fi
done
if [ "$missing" -ne 0 ]; then
  exit 1
fi

if [ "${CI:-}" = "true" ]; then
  STANDALONE="$ROOT_DIR/apps/web/.next/standalone"
  # The standalone output nests the app under the detected tracing root
  # (e.g. <standalone>/<repo-path>/apps/web/server.js), so locate server.js
  # instead of assuming a flat apps/web layout.
  WEB_APP_DIR="$(find "$STANDALONE" -type d -path "*/apps/web" | head -n 1)"
  if [ -z "$WEB_APP_DIR" ] || [ ! -f "$WEB_APP_DIR/server.js" ]; then
    echo "Standalone build missing apps/web/server.js under $STANDALONE (run pnpm --filter @dadan/web build first)" >&2
    exit 1
  fi
  mkdir -p "$WEB_APP_DIR/.next"
  cp -r "$ROOT_DIR/apps/web/.next/static" "$WEB_APP_DIR/.next/static"
  cp -r "$ROOT_DIR/apps/web/public" "$WEB_APP_DIR/public"

  node apps/api/dist/main.js &
  API_PID=$!
  (
    cd "$STANDALONE"
    PORT=3000 HOSTNAME=0.0.0.0 node "${WEB_APP_DIR#"$STANDALONE"/}/server.js"
  ) &
  WEB_PID=$!
else
  pnpm --filter @dadan/api dev &
  API_PID=$!
  pnpm --filter @dadan/web dev &
  WEB_PID=$!
fi

cleanup() {
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
  wait "$API_PID" "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait_for_url() {
  local url="$1"
  curl -sfL "$url" >/dev/null 2>&1
}

echo "Waiting for API and web to become ready..."
for _ in $(seq 1 120); do
  if wait_for_url "http://127.0.0.1:4000/health/live" \
    && wait_for_url "http://127.0.0.1:3000/beta"; then
    echo "Servers are ready."
    wait "$API_PID" "$WEB_PID"
    exit 0
  fi
  sleep 2
done

echo "Timed out waiting for dev servers." >&2
exit 1
