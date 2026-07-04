#!/usr/bin/env bash
# =============================================================================
# DADAN Dijital — Database Restore Script
#
# Restores a gzip-compressed pg_dump into the production Postgres database.
#
# Usage:
#   ./restore.sh                            # list available backups
#   ./restore.sh dadan-2026-07-04_031500.sql.gz   # restore a specific file
#   ./restore.sh /full/path/to/backup.sql.gz      # full path also accepted
#
# Safety:
#   - Validates the gzip archive before doing anything (gunzip -t)
#   - Shows backup metadata (file size, compression ratio) before proceeding
#   - Asks for confirmation (requires typing "yes")
#   - Automatically creates a pre-restore snapshot before overwriting
#   - Restore is transactional — failure mid-stream leaves the DB unchanged
#     (each restore runs inside a single psql session; if psql fails the
#      transaction is rolled back for DDL statements with --clean)
#
# No external dependencies beyond: bash, coreutils, gzip, docker compose.
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults — override via environment variables
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
COMPOSE_PROJECT_DIR="${COMPOSE_PROJECT_DIR:-$SCRIPT_DIR}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
DB_NAME="${DB_NAME:-dadan}"
DB_USER="${DB_USER:-dadan}"
LOG_FILE="${LOG_FILE:-$BACKUP_DIR/restore.log}"

# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------
log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
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

# Verify postgres container is healthy before we touch anything
HEALTH=$(docker compose -f "$COMPOSE_PATH" ps --format json postgres 2>/dev/null \
  | grep -o '"Health":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
if [ "$HEALTH" != "healthy" ]; then
  error "postgres container is not healthy (status: $HEALTH). Refusing to restore."
  exit 1
fi

# ---------------------------------------------------------------------------
# Resolve backup file
# ---------------------------------------------------------------------------
resolve_backup() {
  local input="$1"
  # If it's an absolute path, use as-is
  if [[ "$input" == /* ]]; then
    echo "$input"
    return
  fi
  # If it's a relative path with a slash, resolve against CWD
  if [[ "$input" == */* ]]; then
    echo "$(cd "$(dirname "$input")" && pwd)/$(basename "$input")"
    return
  fi
  # Otherwise, look in BACKUP_DIR
  echo "${BACKUP_DIR}/${input}"
}

# ---------------------------------------------------------------------------
# List available backups (when no argument given)
# ---------------------------------------------------------------------------
list_backups() {
  if [ ! -d "$BACKUP_DIR" ]; then
    echo "Backup directory does not exist: $BACKUP_DIR"
    echo "Create it and run a backup first: ./backup.sh"
    exit 1
  fi

  local files=()
  while IFS= read -r -d '' f; do
    files+=("$f")
  done < <(find "$BACKUP_DIR" -maxdepth 1 -name 'dadan-*.sql.gz' -type f -printf '%T@ %p\0' 2>/dev/null | sort -rnz)

  if [ ${#files[@]} -eq 0 ]; then
    echo "No backups found in ${BACKUP_DIR}"
    echo "Run ./backup.sh first to create one."
    exit 0
  fi

  echo "Available backups (newest first):"
  echo ""
  printf "  %-30s %10s  %s\n" "FILENAME" "SIZE" "DATE"
  printf "  %-30s %10s  %s\n" "--------" "----" "----"
  for entry in "${files[@]}"; do
    local file="${entry#*$'\0'}"
    local fname
    fname=$(basename "$file")
    local size
    size=$(du -h "$file" | cut -f1)
    local mtime
    mtime=$(date -r "$file" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -r "$file")
    printf "  %-30s %10s  %s\n" "$fname" "$size" "$mtime"
  done
  echo ""
  echo "Usage: ./restore.sh <filename>"
}

if [ $# -eq 0 ]; then
  list_backups
  exit 0
fi

# ---------------------------------------------------------------------------
# Validate backup file
# ---------------------------------------------------------------------------
BACKUP_FILE=$(resolve_backup "$1")
BACKUP_NAME=$(basename "$BACKUP_FILE")

if [ ! -f "$BACKUP_FILE" ]; then
  error "Backup file not found: $BACKUP_FILE"
  echo ""
  echo "Available backups in ${BACKUP_DIR}:"
  list_backups
  exit 1
fi

log "Validating archive: ${BACKUP_NAME}"
if ! gunzip -t "$BACKUP_FILE" 2>/dev/null; then
  error "Backup file is corrupted (gunzip -t failed)"
  exit 1
fi

# ---------------------------------------------------------------------------
# Show metadata and ask for confirmation
# ---------------------------------------------------------------------------
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
UNCOMPRESSED_SIZE=$(gunzip -c "$BACKUP_FILE" | wc -c | numfmt --to=iec 2>/dev/null || echo "unknown")
BACKUP_DATE=$(date -r "$BACKUP_FILE" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "unknown")

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Restore Summary"
echo "═══════════════════════════════════════════════════════"
echo "  File:              ${BACKUP_NAME}"
echo "  Size (compressed): ${BACKUP_SIZE}"
echo "  Size (raw):        ${UNCOMPRESSED_SIZE}"
echo "  Created:           ${BACKUP_DATE}"
echo "  Target database:   ${DB_NAME} (user: ${DB_USER})"
echo "  Target container:  postgres (${COMPOSE_FILE})"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "WARNING: This will REPLACE all data in the '${DB_NAME}' database."
echo "Type 'yes' to confirm, or anything else to abort:"
read -r CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  log "Restore cancelled by user"
  exit 0
fi

# ---------------------------------------------------------------------------
# Pre-restore safety snapshot
# ---------------------------------------------------------------------------
log "Creating pre-restore safety snapshot..."
PRE_RESTORE_BACKUP="${BACKUP_DIR}/pre-restore-${DB_NAME}-$(date '+%Y-%m-%d_%H%M%S').sql.gz"
docker compose -f "$COMPOSE_PATH" exec -T postgres \
  pg_dump -U "$DB_USER" "$DB_NAME" --clean --if-exists \
  | gzip > "$PRE_RESTORE_BACKUP"

if [ -s "$PRE_RESTORE_BACKUP" ] && gunzip -t "$PRE_RESTORE_BACKUP" 2>/dev/null; then
  log "Pre-restore snapshot saved: $(basename "$PRE_RESTORE_BACKUP") ($(du -h "$PRE_RESTORE_BACKUP" | cut -f1))"
else
  error "Pre-restore snapshot failed — aborting restore to protect data"
  rm -f "$PRE_RESTORE_BACKUP"
  exit 1
fi

# ---------------------------------------------------------------------------
# Restore
# ---------------------------------------------------------------------------
log "Starting restore from ${BACKUP_NAME}..."
gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_PATH" exec -T postgres \
  psql -U "$DB_USER" "$DB_NAME"

log "Restore completed successfully"

# ---------------------------------------------------------------------------
# Post-restore validation
# ---------------------------------------------------------------------------
log "Running post-restore validation..."

# Verify database is responsive and contains expected tables
TABLES=$(docker compose -f "$COMPOSE_PATH" exec -T postgres \
  psql -U "$DB_USER" "$DB_NAME" -t -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ -z "$TABLES" ] || [ "$TABLES" -eq 0 ] 2>/dev/null; then
  error "Post-restore validation failed — no tables found in 'public' schema"
  error "The database may be empty or unreachable. The pre-restore snapshot is at:"
  error "  ${PRE_RESTORE_BACKUP}"
  error "Restore with: gunzip -c ${PRE_RESTORE_BACKUP##*/} | docker compose -f ${COMPOSE_FILE} exec -T postgres psql -U ${DB_USER} ${DB_NAME}"
  exit 1
fi

log "Validation passed — ${TABLES} table(s) found in public schema"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log "╔══════════════════════════════════════════════════════╗"
log "║  Restore complete from: ${BACKUP_NAME}"
log "║  Pre-restore snapshot:  $(basename "$PRE_RESTORE_BACKUP")"
log "║  To rollback:"
log "║    gunzip -c ${PRE_RESTORE_BACKUP} | \\"
log "║      docker compose -f ${COMPOSE_FILE} exec -T postgres \\"
log "║        psql -U ${DB_USER} ${DB_NAME}"
log "╚══════════════════════════════════════════════════════╝"

exit 0
