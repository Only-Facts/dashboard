#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/2] Backend production build"
(
  cd "$ROOT/backend"
  ./gradlew clean bootJar
)

echo "[2/2] Frontend lint + production build"
(
  cd "$ROOT/frontend"
  npm ci
  npm run lint
  npm run build
)

echo "All checks passed."
