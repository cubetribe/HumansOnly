#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${ROOT_DIR}/app"

echo "[1/3] Lint"
cd "${APP_DIR}"
npm run lint

echo "[2/3] Build"
npm run build

echo "[3/3] Prisma migration status"
cd "${APP_DIR}/src"
npx prisma migrate status

echo
echo "Baseline checks passed."
