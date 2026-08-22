#!/bin/sh
set -eu

if [ "$#" -ne 1 ] || [ ! -r "$1" ]; then
    printf 'Uso: %s <arquivo.sql.gz>\n' "$0" >&2
    exit 1
fi

DB_URL="${DATABASE_URL:?DATABASE_URL is required}"
DB_URL_CLEAN=$(
    printf '%s' "$DB_URL" |
        sed -E 's/([?&])schema=[^&]*&?/\1/; s/\?&/?/; s/[?&]$//'
)
TEMP_SQL=$(mktemp "${TMPDIR:-/tmp}/nexo_restore.sql.XXXXXX")
cleanup() {
    rm -f "$TEMP_SQL"
}
trap cleanup EXIT INT TERM

gzip -t "$1"
gunzip -c "$1" > "$TEMP_SQL"
test -s "$TEMP_SQL"
psql "$DB_URL_CLEAN" --set ON_ERROR_STOP=1 --single-transaction --file "$TEMP_SQL"

printf 'Restaurado de: %s\n' "$1"
