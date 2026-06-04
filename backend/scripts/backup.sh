#!/bin/sh
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/NexoAPI}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="${BACKUP_DIR}/nexo_${TIMESTAMP}.sql.gz"

# pg_dump doesn't support Prisma's ?schema=public parameter
DB_URL_CLEAN=$(echo "$DB_URL" | sed -E 's/\?schema=[^&]+//')

mkdir -p "$BACKUP_DIR"

pg_dump "$DB_URL_CLEAN" | gzip > "$FILENAME"

find "$BACKUP_DIR" -name "nexo_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup criado: $FILENAME"
