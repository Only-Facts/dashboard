#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env. Run: cp .env.example .env" >&2
  exit 1
fi

docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db mailpit

echo "Development dependencies started."
echo "PostgreSQL: 127.0.0.1:${DB_HOST_PORT:-5434}"
echo "Mailpit SMTP: 127.0.0.1:${MAIL_SMTP_HOST_PORT:-1026}"
echo "Mailpit UI: http://127.0.0.1:${MAIL_UI_PORT:-8025}"
