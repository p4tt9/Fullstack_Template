#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
umask 077
backup_dir="${BACKUP_DIRECTORY:-./backups}/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"
compose=(docker compose --env-file .env.prod)
if [ -f .images.env ]; then compose+=(--env-file .images.env); fi
compose+=(-f compose.prod.yml)
"${compose[@]}" exec -T postgresql sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_dir/app.dump"
[% if auth_mode == "bundled" %]
"${compose[@]}" exec -T postgresql sh -c 'pg_dump -U "$POSTGRES_USER" -d keycloak_db -Fc' > "$backup_dir/keycloak.dump"
[% endif %]
printf 'Backup: %s\n' "$backup_dir"
