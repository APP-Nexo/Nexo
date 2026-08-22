#!/bin/sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 0 * * *}"
CRON_LOG="$PROJECT_DIR/backups/cron.log"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-$PROJECT_DIR/.env}"
CRON_JOB="$CRON_SCHEDULE cd \"$PROJECT_DIR\" && set -a && . \"$BACKUP_ENV_FILE\" && set +a && \"$BACKUP_SCRIPT\" >> \"$CRON_LOG\" 2>&1"

if [ ! -r "$BACKUP_ENV_FILE" ]; then
    printf 'Arquivo de ambiente não encontrado ou sem leitura: %s\n' "$BACKUP_ENV_FILE" >&2
    exit 1
fi

mkdir -p "$PROJECT_DIR/backups"

(
    { crontab -l 2>/dev/null || true; } |
        while IFS= read -r line; do
            case "$line" in
                *"$BACKUP_SCRIPT"*) ;;
                *) printf '%s\n' "$line" ;;
            esac
        done
    printf '%s\n' "$CRON_JOB"
) | crontab -

printf 'Cron configurado:\n'
printf '  Horário: %s\n' "$CRON_SCHEDULE"
printf '  Ambiente: %s\n' "$BACKUP_ENV_FILE"
printf '  Log: %s\n' "$CRON_LOG"
printf '  Backup: %s\n\n' "$BACKUP_SCRIPT"
printf 'Para verificar: crontab -l\n'
printf 'Para remover: crontab -e\n'
