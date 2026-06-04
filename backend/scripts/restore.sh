#!/bin/sh
set -e

if [ -z "$1" ]; then
    echo "Uso: $1 <arquivo.sql.gz>"
    exit 1
fi

DB_NAME="${DB_NAME:-NexoAPI}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

gunzip -c "$1" | psql "postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "Restaurado de: $1"
