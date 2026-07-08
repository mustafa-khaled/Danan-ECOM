#!/usr/bin/env bash
# =============================================================================
# DADAN Dijital — Database Backup Script
#
# Creates a timestamped, gzip-compressed pg_dump of the production Postgres
# database and enforces a retention policy on old backups.
#
# Usage:
#   ./backup.sh                          # uses defaults
#   ./backup.sh -o /custom/path          # custom output dir
#   ./backup.sh -f custom.yml            # alternate compose file
#   ./backup.sh -k 30                    # keep 30 days
#   ./backup.sh -v                       # verbose
#
# Expected in crontab (runs script from the project directory):
#   15 3 * * * /home/deploy/danan/backup.sh
#
# No external dependencies beyond: bash, coreutils, gzip, docker compose.
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults — override via CLI flags or by editing here
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
COMPOSE_PROJECT_DIR="${COMPOSE_PROJECT_DIR:-$SCRIPT_DIR}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
DB_NAME="${DB_NAME:-dadan}"
DB_USER="${DB_USER:-dadan}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
LOG_FILE="${LOG_FILE:-$BACKUP_DIR/backup.log}"
VERBOSE=false

# ---------------------------------------------------------------------------
# Parse CLI flags
# ---------------------------------------------------------------------------
while getopts "o:f:k:v" opt; do
  case $opt in
    o) BACKUP_DIR="$OPTARG" ;;
    f) COMPOSE_FILE="$OPTARG" ;;
    k) RETENTION_DAYS="$OPTARG" ;;
    v) VERBOSE=true ;;
    *) echo "Usage: $0 [-o output_dir] [-f compose_file] [-k retention_days] [-v]" >&2; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------
log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" >> "$LOG_FILE" || true
  [ "$VERBOSE" = true ] && echo "$msg"
}

error() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*"
  echo "$msg" >&2
  echo "$msg" >> "$LOG_FILE"
}

# ---------------------------------------------------------------------------
# Trap — log unexpected failures with line number
# ---------------------------------------------------------------------------
trap_err() {
  local line=$1
  error "Failed at line $line"
  exit 1
}
trap 'trap_err $LINENO' ERR

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

if ! command -v docker &>/dev/null; then
  error "docker not found — is Docker installed?"
  exit 1
fi

if ! docker compose version &>/dev/null; then
  error "docker compose not available"
  exit 1
fi

COMPOSE_PATH="$COMPOSE_PROJECT_DIR/$COMPOSE_FILE"
if [ ! -f "$COMPOSE_PATH" ]; then
  error "Compose file not found: $COMPOSE_PATH"
  exit 1
fi

# Verify the postgres container is running and healthy
HEALTH=$(docker compose -f "$COMPOSE_PATH" ps --format json postgres 2>/dev/null | grep -o '"Health":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
if [ "$HEALTH" != "healthy" ]; then
  error "postgres container is not healthy (status: $HEALTH). Backup aborted."
  exit 1
fi

# ---------------------------------------------------------------------------
# Backup
# ---------------------------------------------------------------------------
TIMESTAMP=$(date '+%Y-%m-%d_%H%M%S')
FILENAME="dadan-${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${FILENAME}"

log "Starting backup → ${BACKUP_PATH}"

# pg_dump via docker compose exec (uses trust auth for local connections
# inside the postgres container — no PGPASSWORD needed).
#   -T  no TTY allocation (required for pipe)
#   --clean  include DROP + CREATE statements so restore is idempotent
#   --if-exists  avoid errors on missing objects
docker compose -f "$COMPOSE_PATH" exec -T postgres \
  pg_dump -U "$DB_USER" "$DB_NAME" --clean --if-exists \
  | gzip > "$BACKUP_PATH"

# Verify the backup is valid (non-empty gzip)
if [ ! -s "$BACKUP_PATH" ]; then
  error "Backup file is empty"
  rm -f "$BACKUP_PATH"
  exit 1
fi

if ! gunzip -t "$BACKUP_PATH" 2>/dev/null; then
  error "Backup file is corrupted (gunzip -t failed)"
  rm -f "$BACKUP_PATH"
  exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
log "Backup complete — ${BACKUP_SIZE} (${FILENAME})"

# ---------------------------------------------------------------------------
# Retention — delete backups older than RETENTION_DAYS
# ---------------------------------------------------------------------------
log "Applying retention policy: keep ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -maxdepth 1 -name 'dadan-*.sql.gz' -type f -mtime "+${RETENTION_DAYS}" \
  -exec rm -v {} \; >> "$LOG_FILE" 2>&1

DELETED=$(find "$BACKUP_DIR" -maxdepth 1 -name 'dadan-*.sql.gz' -type f -mtime "+${RETENTION_DAYS}" -print)
if [ -z "$DELETED" ]; then
  log "No backups older than ${RETENTION_DAYS} days to prune"
else
  log "Pruned $(echo "$DELETED" | wc -l) old backup(s)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log "Backup finished successfully"
exit 0
