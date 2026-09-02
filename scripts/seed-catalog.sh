#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

# --- Defaults ---
RESET=false
FORCE=false
ENVIRONMENT="${NODE_ENV:-development}"
RUN_MIGRATIONS=false

# --- Parse flags ---
for arg in "$@"; do
  case "$arg" in
    --reset) RESET=true ;;
    --force) FORCE=true ;;
    --migrate) RUN_MIGRATIONS=true ;;
    --environment=*) ENVIRONMENT="${arg#*=}" ;;
    --help|-h)
      echo "Usage: $0 [--reset] [--force] [--migrate] [--environment=<env>]"
      echo ""
      echo "Flags:"
      echo "  --reset         Clear and re-seed all data (destructive)"
      echo "  --force         Allow destructive operations in production"
      echo "  --migrate       Run database migrations before seeding"
      echo "  --environment   Target environment (default: \$NODE_ENV or 'development')"
      echo "  --help          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown flag: $arg"
      exit 1
      ;;
  esac
done

# --- Validation ---
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed"
  exit 1
fi

if ! command -v pnpm &> /dev/null; then
  echo "Error: pnpm is not installed"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d. -f1)
if [ "$MAJOR_VERSION" -lt 22 ]; then
  echo "Error: Node.js >= 22 required (found $NODE_VERSION)"
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "Error: .env file not found. Copy .env.example and configure it."
  exit 1
fi

# --- Production safety ---
if [ "$ENVIRONMENT" = "production" ]; then
  if [ "$RESET" = true ] && [ "$FORCE" != true ]; then
    echo "Error: --reset in production requires --force"
    exit 1
  fi
  if [ "$FORCE" != true ]; then
    echo "Error: Seeding in production requires --force"
    exit 1
  fi
  export SEED_ALLOW_PRODUCTION=true
fi

export SEED_ALLOW_DESTRUCTIVE=true

# --- Print status ---
echo "=== DADAN Catalog Seeder ==="
echo "  Environment: $ENVIRONMENT"
echo "  Reset:       $RESET"
echo "  Migrate:     $RUN_MIGRATIONS"
echo ""

# --- Optional migrations ---
if [ "$RUN_MIGRATIONS" = true ]; then
  echo "Running database migrations..."
  pnpm db:migrate
  echo ""
fi

# --- Run seeder ---
SEED_ARGS=""
if [ "$RESET" = true ]; then
  SEED_ARGS="--reset"
fi

echo "Running catalog seeder..."
pnpm --filter @dadan/db db:seed $SEED_ARGS --environment="$ENVIRONMENT"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "=== Seeding completed successfully ==="
else
  echo ""
  echo "=== Seeding FAILED (exit code: $EXIT_CODE) ==="
  exit $EXIT_CODE
fi
