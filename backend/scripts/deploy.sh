#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(dirname -- "$SCRIPT_DIR")
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env}"
READY_URL="${READY_URL:-http://127.0.0.1:3000/api/verify/ready}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"
LOCK_DIR="${TMPDIR:-/tmp}/nexo-deploy.lock"

usage() {
    printf '%s\n' "Usage: $0 [--pull] [--no-backup]"
    printf '%s\n' '  --pull       Fast-forward the Git checkout before building.'
    printf '%s\n' '  --no-backup  Skip the database backup before migrations.'
}

fail() {
    printf 'Deploy failed: %s\n' "$1" >&2
    exit 1
}

pull_code=false
for argument in "$@"; do
    case "$argument" in
        --pull)
            pull_code=true
            ;;
        --no-backup)
            BACKUP_BEFORE_DEPLOY=false
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            usage >&2
            fail "Unknown option: $argument"
            ;;
    esac
done

command -v docker >/dev/null 2>&1 || fail 'docker is required.'
command -v curl >/dev/null 2>&1 || fail 'curl is required.'
[ -r "$ENV_FILE" ] || fail "Environment file not found or unreadable: $ENV_FILE"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    fail "Another deploy is already running: $LOCK_DIR"
fi
cleanup() {
    rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT

compose() {
    docker compose \
        --project-directory "$PROJECT_DIR" \
        --env-file "$ENV_FILE" \
        "$@"
}

if [ "$pull_code" = true ]; then
    command -v git >/dev/null 2>&1 || fail 'git is required with --pull.'
    if ! git -C "$PROJECT_DIR" diff --quiet || ! git -C "$PROJECT_DIR" diff --cached --quiet; then
        fail 'Cannot use --pull with a dirty working tree.'
    fi
    git -C "$PROJECT_DIR" pull --ff-only || fail 'Git fast-forward failed.'
fi

compose config --quiet || fail 'Invalid Docker Compose configuration or missing environment variables.'

printf '%s\n' 'Building API and migration images...'
compose build --pull api migrate || fail 'Docker image build failed.'

if [ "$BACKUP_BEFORE_DEPLOY" = true ]; then
    printf '%s\n' 'Creating database backup...'
    compose --profile tools run --rm db-tools || fail 'Database backup failed.'
fi

printf '%s\n' 'Starting database, migrations, seeds and API...'
compose up -d --remove-orphans || fail 'Docker Compose startup failed.'

ready=false
attempt=1
while [ "$attempt" -le 60 ]; do
    if curl --fail --silent "$READY_URL" >/dev/null 2>&1; then
        ready=true
        break
    fi
    sleep 2
    attempt=$((attempt + 1))
done

if [ "$ready" != true ]; then
    compose ps >&2 || true
    compose logs --no-color --tail=150 migrate api >&2 || true
    fail "API did not become ready: $READY_URL"
fi

compose ps
printf '%s\n' 'Deploy completed successfully.'
