#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${ROOT_DIR}/app"

echo "[1/4] Install dependencies"
cd "${APP_DIR}"
npm ci

echo "[2/4] Lint"
npm run lint

echo "[3/4] Build"
npm run build

echo "[4/4] Prisma schema validate"
cd "${APP_DIR}/src"
if [[ -f "${APP_DIR}/.env" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${APP_DIR}/.env"
    set +a
fi
if [[ -z "${DIRECT_DATABASE_URL:-}" && -n "${DATABASE_URL:-}" ]]; then
    export DIRECT_DATABASE_URL="${DATABASE_URL}"
fi
npx prisma validate

echo "CI quality checks passed."
