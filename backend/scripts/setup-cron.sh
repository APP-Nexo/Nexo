#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 0 * * *}"
CRON_LOG="$PROJECT_DIR/backups/cron.log"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
CRON_JOB="$CRON_SCHEDULE cd $PROJECT_DIR && $BACKUP_SCRIPT >> $CRON_LOG 2>&1"

mkdir -p "$PROJECT_DIR/backups"

(
    crontab -l 2>/dev/null || true
    echo "$CRON_JOB"
) | crontab -

echo "Cron configurado:"
echo "  Horário: $CRON_SCHEDULE"
echo "  Log: $CRON_LOG"
echo "  Backup: $BACKUP_SCRIPT"
echo ""
echo "Para verificar: crontab -l"
echo "Para remover: crontab -e"
