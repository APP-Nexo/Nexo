#!/bin/sh
set -eu

umask 077
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_URL="${DATABASE_URL:?DATABASE_URL is required}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="${BACKUP_DIR}/nexo_${TIMESTAMP}.sql.gz"
DB_URL_CLEAN=$(
    printf '%s' "$DB_URL" |
        sed -E 's/([?&])schema=[^&]*&?/\1/; s/\?&/?/; s/[?&]$//'
)

mkdir -p "$BACKUP_DIR"
TEMP_SQL=$(mktemp "${BACKUP_DIR}/.nexo_${TIMESTAMP}.sql.XXXXXX")
TEMP_GZIP="${TEMP_SQL}.gz"
cleanup() {
    rm -f "$TEMP_SQL" "$TEMP_GZIP"
}
trap cleanup EXIT INT TERM

if ! pg_dump --no-owner --no-privileges --file "$TEMP_SQL" "$DB_URL_CLEAN"; then
    printf '%s\n' 'Falha ao criar o dump do PostgreSQL.' >&2
    exit 1
fi

gzip -c "$TEMP_SQL" > "$TEMP_GZIP"
gzip -t "$TEMP_GZIP"
test -s "$TEMP_GZIP"
mv "$TEMP_GZIP" "$FILENAME"
rm -f "$TEMP_SQL"

find "$BACKUP_DIR" -type f -name 'nexo_*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete
printf 'Backup criado: %s\n' "$FILENAME"
