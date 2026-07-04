#!/usr/bin/env bash
# =============================================================================
# DADAN Dijital — Deployment Automation
#
# Pulls latest code, builds images, restarts containers, verifies health, and
# rolls back automatically if anything fails.
#
# Usage:
#   ./deploy.sh                          # basic deploy
#   ./deploy.sh -t                       # deploy with TLS compose override
#   ./deploy.sh -f docker-compose.tls.yml # same effect
#   ./deploy.sh -s                       # skip pre-deploy backup (faster)
#   ./deploy.sh -d                       # dry-run (show what would happen)
#
# Idempotent: running twice with no new commits produces no changes.
#
# Dependencies: bash, git, docker, docker compose, gzip, coreutils (tput).
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Colours (tput for portability; fall back to ANSI escapes on missing tput)
# ---------------------------------------------------------------------------
if command -v tput &>/dev/null; then
  BOLD=$(tput bold)
  GREEN=$(tput setaf 2)
  YELLOW=$(tput setaf 3)
  RED=$(tput setaf 1)
  BLUE=$(tput setaf 4)
  MAGENTA=$(tput setaf 5)
  RESET=$(tput sgr0)
else
  BOLD='\e[1m'
  GREEN='\e[32m'
  YELLOW='\e[33m'
  RED='\e[31m'
  BLUE='\e[34m'
  MAGENTA='\e[35m'
  RESET='\e[0m'
fi

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FLAGS=(-f docker-compose.prod.yml)
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
DB_NAME="${DB_NAME:-dadan}"
DB_USER="${DB_USER:-dadan}"
HEALTH_TIMEOUT=120
HEALTH_INTERVAL=5
SKIP_BACKUP=false
DRY_RUN=false
LOG_FILE="${LOG_FILE:-$BACKUP_DIR/deploy.log}"

# ---------------------------------------------------------------------------
# Parse CLI flags
# ---------------------------------------------------------------------------
while getopts "f:tsdh" opt; do
  case $opt in
    f) COMPOSE_FLAGS=(-f "$OPTARG") ;;
    t) COMPOSE_FLAGS=(-f docker-compose.prod.yml -f docker-compose.tls.yml) ;;
    s) SKIP_BACKUP=true ;;
    d) DRY_RUN=true ;;
    h)
      echo "Usage: $0 [-f compose_file] [-t] [-s] [-d]"
      echo "  -f  Use specific compose file (default: docker-compose.prod.yml)"
      echo "  -t  Include docker-compose.tls.yml override"
      echo "  -s  Skip pre-deploy database backup"
      echo "  -d  Dry-run — print actions without executing"
      exit 0
      ;;
    *) echo "Usage: $0 [-f compose_file] [-t] [-s] [-d]" >&2; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log() {
  local level=$1; shift
  local colour=$1; shift
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ${level} $*"
  echo -e "${colour}${msg}${RESET}" | tee -a "$LOG_FILE" >&2
}
info()  { log "INFO"  "$BLUE"    "$@"; }
ok()    { log "OK"    "$GREEN"   "$@"; }
warn()  { log "WARN"  "$YELLOW"  "$@"; }
err()   { log "ERROR" "$RED"     "$@"; }
header(){ echo -e "\n${BOLD}${MAGENTA}── $* ──${RESET}\n" | tee -a "$LOG_FILE" >&2; }

# ---------------------------------------------------------------------------
# Trap
# ---------------------------------------------------------------------------
trap_err() {
  local line=$1
  err "Unexpected failure at line ${line} — entering rollback"
  do_rollback
}
trap 'trap_err $LINENO' ERR

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
run() {
  info "$ $*"
  if $DRY_RUN; then
    warn "[dry-run] would execute: $*"
    return 0
  fi
  "$@"
}

# Extract health status for a given service from `docker compose ps --format json`
service_health() {
  local svc=$1
  docker compose "${COMPOSE_FLAGS[@]}" ps --format json "$svc" 2>/dev/null \
    | grep -o '"Health":"[^"]*"' | cut -d'"' -f4 || echo "unknown"
}

wait_for_healthy() {
  local svc=$1
  local timeout=$2
  local elapsed=0
  while [ $elapsed -lt $timeout ]; do
    local health
    health=$(service_health "$svc")
    if [ "$health" = "healthy" ]; then
      return 0
    fi
    sleep "$HEALTH_INTERVAL"
    elapsed=$((elapsed + HEALTH_INTERVAL))
  done
  return 1
}

# ===========================================================================
# Rollback — called from the ERR trap or on health check failure
# ===========================================================================
do_rollback() {
  header "ROLLBACK — reverting to previous commit"

  local compose_path_str=""
  for f in "${COMPOSE_FLAGS[@]}"; do
    compose_path_str="$compose_path_str $f"
  done

  info "Checking out previous commit: ${PRE_DEPLOY_SHORT}"

  # Disable the ERR trap during rollback (one failure path is enough)
  trap '' ERR

  if ! git -C "$SCRIPT_DIR" checkout "$PRE_DEPLOY_COMMIT" --force 2>/dev/null; then
    err "git checkout failed — manual intervention required"
    err "  cd ${SCRIPT_DIR}"
    err "  git checkout ${PRE_DEPLOY_SHORT}"
    err "  docker compose ${compose_path_str} up -d --build"
    exit 1
  fi

  info "Rebuilding images for rollback..."
  if ! docker compose "${COMPOSE_FLAGS[@]}" build 2>/dev/null; then
    err "Docker build failed during rollback — manual intervention required"
    exit 1
  fi

  info "Restarting containers (rollback)..."
  if ! docker compose "${COMPOSE_FLAGS[@]}" up -d 2>/dev/null; then
    err "Docker compose up failed during rollback — manual intervention required"
    exit 1
  fi

  info "Waiting for rollback health checks..."
  local rollback_ok=true
  for svc in postgres redis api web nginx; do
    if ! wait_for_healthy "$svc" "$HEALTH_TIMEOUT"; then
      err "  ${svc} — NOT healthy after rollback"
      rollback_ok=false
    else
      ok "  ${svc} — healthy"
    fi
  done

  if [ "$rollback_ok" = false ]; then
    err "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    err "  ROLLBACK PARTIALLY FAILED — some services unhealthy"
    err ""
    err "  The code was reverted to ${PRE_DEPLOY_SHORT} but not all"
    err "  services recovered. The pre-deploy database backup is at:"
    err "    ${BACKUP_FILE:-<not created (used -s)>}"
    err ""
    err "  Restore steps if DB schema is incompatible:"
    err "    1. ./restore.sh $(basename "${BACKUP_FILE:-<backup-file>}")"
    err "    2. docker compose ${compose_path_str} up -d --build"
    err "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
  fi

  # Warn about DB schema possibly being ahead of code
  warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  warn "  Rollback completed. The code is at ${PRE_DEPLOY_SHORT}."
  warn ""
  warn "  If new Prisma migrations were applied during the failed"
  warn "  deploy, the database schema may be ahead of the code."
  warn "  This is typically safe (migrations are additive), but"
  warn "  verify:"
  warn "    docker compose ${compose_path_str} logs api --tail=50"
  warn ""
  warn "  If the API fails due to schema mismatch, restore the"
  warn "  pre-deploy backup and re-deploy after fixing the issue:"
  warn "    ./restore.sh $(basename "${BACKUP_FILE:-<backup-file>}")"
  warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
}

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
header "Pre-flight checks"

mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

if ! command -v git &>/dev/null; then
  err "git not found"
  exit 1
fi

if ! command -v docker &>/dev/null; then
  err "docker not found"
  exit 1
fi

if ! docker compose version &>/dev/null; then
  err "docker compose not available"
  exit 1
fi

# Must be inside the git repo
if ! git -C "$SCRIPT_DIR" rev-parse --git-dir &>/dev/null; then
  err "Not a git repository: $SCRIPT_DIR"
  exit 1
fi

# Working tree must be clean (no uncommitted changes)
if ! git -C "$SCRIPT_DIR" diff --quiet --exit-code; then
  err "Working tree has uncommitted changes. Commit or stash them first."
  exit 1
fi
if [ -n "$(git -C "$SCRIPT_DIR" status --porcelain)" ]; then
  err "Working tree has untracked files. Commit, stash, or .gitignore them."
  exit 1
fi

# Validate compose file(s)
for f in "${COMPOSE_FLAGS[@]}"; do
  # Skip -f flag values that are just the flag itself
  [ "$f" = "-f" ] && continue
  [ -f "$SCRIPT_DIR/$f" ] && continue
  # Also check absolute paths
  if [[ "$f" == /* ]] && [ -f "$f" ]; then
    continue
  fi
  err "Compose file not found: $f"
  exit 1
done

info "All pre-flight checks passed"

# ---------------------------------------------------------------------------
# Record pre-deploy state
# ---------------------------------------------------------------------------
header "Recording pre-deploy state"

PRE_DEPLOY_COMMIT=$(git -C "$SCRIPT_DIR" rev-parse HEAD)
PRE_DEPLOY_SHORT=$(git -C "$SCRIPT_DIR" rev-parse --short HEAD)
PRE_DEPLOY_BRANCH=$(git -C "$SCRIPT_DIR" rev-parse --abbrev-ref HEAD)
PRE_DEPLOY_TAG=$(git -C "$SCRIPT_DIR" tag --points-at HEAD | head -1 || true)

info "Current commit: ${PRE_DEPLOY_SHORT} (${PRE_DEPLOY_BRANCH})${PRE_DEPLOY_TAG:+ tagged: ${PRE_DEPLOY_TAG}}"

# Snapshot container health before deploy
declare -A PRE_HEALTH
for svc in postgres redis api web nginx; do
  PRE_HEALTH[$svc]=$(service_health "$svc")
  info "  ${svc}: ${PRE_HEALTH[$svc]}"
done

# Pre-deploy database backup (safety net for migration rollback)
if $SKIP_BACKUP; then
  warn "Skipping pre-deploy database backup (-s flag)"
else
  header "Pre-deploy database backup"
  BACKUP_FILE="${BACKUP_DIR}/pre-deploy-${DB_NAME}-$(date '+%Y-%m-%d_%H%M%S').sql.gz"
  info "Creating pre-deploy backup: ${BACKUP_FILE}"

  if $DRY_RUN; then
    warn "[dry-run] would create backup"
  else
    # pg_dump via compose exec (trust auth inside the postgres container)
    docker compose "${COMPOSE_FLAGS[@]}" exec -T postgres \
      pg_dump -U "$DB_USER" "$DB_NAME" --clean --if-exists \
      | gzip > "$BACKUP_FILE"

    if [ ! -s "$BACKUP_FILE" ] || ! gunzip -t "$BACKUP_FILE" 2>/dev/null; then
      err "Pre-deploy backup failed or is corrupted"
      rm -f "$BACKUP_FILE"
      exit 1
    fi

    ok "Pre-deploy backup saved ($(du -h "$BACKUP_FILE" | cut -f1))"
  fi
fi

# ---------------------------------------------------------------------------
# Pull latest code
# ---------------------------------------------------------------------------
header "Pulling latest code"

if $DRY_RUN; then
  warn "[dry-run] would run: git pull"
else
  run git -C "$SCRIPT_DIR" pull
fi

NEW_COMMIT=$(git -C "$SCRIPT_DIR" rev-parse HEAD)
NEW_SHORT=$(git -C "$SCRIPT_DIR" rev-parse --short HEAD)

if [ "$NEW_COMMIT" = "$PRE_DEPLOY_COMMIT" ]; then
  info "Already at latest commit (${NEW_SHORT}) — no code changes"
else
  info "Updated: ${PRE_DEPLOY_SHORT} → ${NEW_SHORT}"
fi

# ---------------------------------------------------------------------------
# Build images
# ---------------------------------------------------------------------------
header "Building images"

run docker compose "${COMPOSE_FLAGS[@]}" build

# ---------------------------------------------------------------------------
# Restart containers
# ---------------------------------------------------------------------------
header "Restarting containers"

run docker compose "${COMPOSE_FLAGS[@]}" up -d

# ---------------------------------------------------------------------------
# Wait for health checks
# ---------------------------------------------------------------------------
header "Waiting for services to become healthy (timeout: ${HEALTH_TIMEOUT}s)"

ALL_HEALTHY=true
FAILED_SERVICES=()

# Ordered by dependency: postgres → redis → api → web → nginx
for svc in postgres redis api web nginx; do
  info "  Waiting for ${svc}..."

  if $DRY_RUN; then
    warn "[dry-run] would wait for ${svc} to become healthy"
    continue
  fi

  if wait_for_healthy "$svc" "$HEALTH_TIMEOUT"; then
    ok "  ${svc} — healthy"
  else
    err "  ${svc} — NOT healthy after ${HEALTH_TIMEOUT}s"
    ALL_HEALTHY=false
    FAILED_SERVICES+=("$svc")
  fi
done

# ---------------------------------------------------------------------------
# Rollback if anything failed
# ---------------------------------------------------------------------------
if [ "$ALL_HEALTHY" = false ]; then
  err "${#FAILED_SERVICES[@]} service(s) failed health check(s): ${FAILED_SERVICES[*]}"
  do_rollback
  # do_rollback does not return on failure
  exit 0
fi

# ---------------------------------------------------------------------------
# Success
# ---------------------------------------------------------------------------
header "Deployment complete"

NEW_TAG=$(git -C "$SCRIPT_DIR" tag --points-at HEAD | head -1 || true)
ok "  Previous commit:  ${PRE_DEPLOY_SHORT}${PRE_DEPLOY_TAG:+ (${PRE_DEPLOY_TAG})}"
ok "  Current commit:   ${NEW_SHORT}${NEW_TAG:+ (${NEW_TAG})}"

# Display health summary
for svc in postgres redis api web nginx; do
  health=$(service_health "$svc")
  icon="${GREEN}●${RESET}"
  [ "$health" != "healthy" ] && icon="${RED}✖${RESET}"
  echo -e "    ${icon} ${svc}: ${health}" | tee -a "$LOG_FILE"
done

# Prune old images (non-critical)
info "Cleaning up old Docker images..."
docker image prune -f >/dev/null 2>&1 || true

ok "Deploy finished successfully"
exit 0
