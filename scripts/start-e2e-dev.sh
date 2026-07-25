#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p "${STORAGE_LOCAL_PATH:-/tmp/dadan-uploads}"

if [ "${CI:-}" = "true" ]; then
  STANDALONE="$ROOT_DIR/apps/web/.next/standalone"
  mkdir -p "$STANDALONE/apps/web/.next"
  cp -r "$ROOT_DIR/apps/web/.next/static" "$STANDALONE/apps/web/.next/static"
  cp -r "$ROOT_DIR/apps/web/public" "$STANDALONE/apps/web/public"

  node apps/api/dist/main.js &
  API_PID=$!
  (
    cd "$STANDALONE"
    PORT=3000 HOSTNAME=0.0.0.0 node apps/web/server.js
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
