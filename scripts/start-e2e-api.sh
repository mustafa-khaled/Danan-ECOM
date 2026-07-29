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

if [ -z "${STORAGE_LOCAL_PATH:-}" ] || [ "$STORAGE_LOCAL_PATH" = "/app/uploads" ]; then
  export STORAGE_LOCAL_PATH="/tmp/dadan-uploads"
fi
mkdir -p "$STORAGE_LOCAL_PATH"

# Playwright E2E runs many validate-key attempts from one IP; raise the limit unless set.
if [ -z "${AUTH_RATE_LIMIT_MAX:-}" ]; then
  export AUTH_RATE_LIMIT_MAX="100"
fi

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
  exec node apps/api/dist/main.js
else
  exec pnpm --filter @dadan/api dev
fi
