#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env. Run: cp .env.example .env" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${DB_PASSWORD:?DB_PASSWORD must be set in .env}"
export DB_URL="jdbc:postgresql://127.0.0.1:${DB_HOST_PORT:-5434}/dashboard"
export DB_USERNAME="dashboard"
export MAIL_HOST="127.0.0.1"
export MAIL_PORT="${MAIL_SMTP_HOST_PORT:-1026}"

cd backend
exec ./gradlew bootRun
