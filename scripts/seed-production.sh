#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# DADAN — production catalog seeder
#
# Runs the single-source-of-truth seeder inside the running `api` container.
# The image already contains the seeder-assets directory (copied by
# apps/api/Dockerfile to /app/seeder-assets), and the API service provides
# DATABASE_URL, STORAGE_LOCAL_PATH=/app/uploads, and all secrets via compose.
#
# Destructive: wipes the database and the uploads directory, then re-creates
# the full canonical dataset. Requires --force.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

COMPOSE="docker compose -f docker-compose.prod.yml"

# --- Parse flags ---
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    --help|-h)
      echo "Usage: $0 [--force]"
      echo ""
      echo "  --force   Acknowledge that this wipes the database and uploads."
      echo "  --help    Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown flag: $arg"
      exit 1
      ;;
  esac
done

if [ "$FORCE" != true ]; then
  echo "Error: this script wipes the production database and uploads directory."
  echo "Re-run with --force to proceed."
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "Error: docker is not installed"
  exit 1
fi

if ! $COMPOSE ps api >/dev/null 2>&1; then
  echo "Error: the 'api' service is not running. Start it first with:"
  echo "  $COMPOSE up -d"
  exit 1
fi

echo "=== DADAN Production Catalog Seeder ==="
echo "  Target: api container (docker compose -f docker-compose.prod.yml)"
echo ""

# Sanity check: seed assets must be present inside the image.
if ! $COMPOSE exec -T api test -d /app/seeder-assets; then
  echo "Error: /app/seeder-assets not found in the api image."
  echo "Rebuild the image (docker compose build api) and try again."
  exit 1
fi

# pnpm links workspace package bins under packages/db/node_modules/.bin (not
# the workspace root .bin), mirroring docker-entrypoint.sh's prisma invocation.
$COMPOSE exec -T \
  -e SEED_ALLOW_DESTRUCTIVE=true \
  -e SEED_ALLOW_PRODUCTION=true \
  -e SEED_ASSETS_DIR=/app/seeder-assets \
  -w /app/packages/db \
  api ./node_modules/.bin/tsx prisma/seed.ts

echo ""
echo "=== Production seeding completed successfully ==="
