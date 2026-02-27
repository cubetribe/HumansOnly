#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
USERNAME="smoke$(date +%s)"
PASSWORD="SmokePass123!"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "${COOKIE_FILE}"' EXIT

create_payload=$(printf '{"username":"%s","password":"%s","name":"Smoke User","description":"auth smoke"}' "${USERNAME}" "${PASSWORD}")
login_payload=$(printf '{"username":"%s","password":"%s"}' "${USERNAME}" "${PASSWORD}")

echo "[1/3] Create user: ${USERNAME}"
create_response="$(curl -sS -c "${COOKIE_FILE}" -H 'Content-Type: application/json' -d "${create_payload}" "${BASE_URL}/api/users/create")"
if [[ "${create_response}" != *"\"success\":true"* ]]; then
    echo "Create failed: ${create_response}" >&2
    exit 1
fi

echo "[2/3] Login user: ${USERNAME}"
login_response="$(curl -sS -b "${COOKIE_FILE}" -c "${COOKIE_FILE}" -H 'Content-Type: application/json' -d "${login_payload}" "${BASE_URL}/api/auth/login")"
if [[ "${login_response}" != *"\"success\":true"* ]]; then
    echo "Login failed: ${login_response}" >&2
    exit 1
fi

token="$(awk '$6=="token"{print $7}' "${COOKIE_FILE}" | tail -n1)"
if [[ -z "${token}" ]]; then
    echo "Verify failed: no token cookie set." >&2
    exit 1
fi

echo "[3/3] Verify token payload"
verify_response="$(curl -sS -H 'Content-Type: application/json' -d "{\"token\":\"${token}\"}" "${BASE_URL}/api/auth/verify")"
if [[ "${verify_response}" != *"\"username\":\"${USERNAME}\""* ]]; then
    echo "Verify failed: ${verify_response}" >&2
    exit 1
fi

echo "Auth smoke passed."
