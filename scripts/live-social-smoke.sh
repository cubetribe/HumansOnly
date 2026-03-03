#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://humans-only.de}"

echo "[1/5] Health endpoint"
health_response="$(curl -sS "${BASE_URL}/api/health")"
if [[ "${health_response}" != *'"success":true'* ]]; then
    echo "Health check failed: ${health_response}" >&2
    exit 1
fi


echo "[2/5] Auth smoke"
"$(dirname "$0")/auth-smoke-local.sh" "${BASE_URL}" >/tmp/live-auth-smoke.log

echo "[3/5] Privacy + interaction restrictions"
ua="wave5a$(date +%s)"
ub="wave5b$(date +%s)"
pa="Wave5Pass123!"
pb="Wave5Pass456!"
ca="$(mktemp)"
cb="$(mktemp)"
trap 'rm -f "${ca}" "${cb}"' EXIT

create_user() {
    local username="$1" password="$2" cookie_file="$3"
    curl -sS -c "${cookie_file}" -H 'Content-Type: application/json' \
        -d "{\"username\":\"${username}\",\"password\":\"${password}\",\"name\":\"${username}\"}" \
        "${BASE_URL}/api/users/create"
}

login_user() {
    local username="$1" password="$2" cookie_file="$3"
    curl -sS -b "${cookie_file}" -c "${cookie_file}" -H 'Content-Type: application/json' \
        -d "{\"username\":\"${username}\",\"password\":\"${password}\"}" \
        "${BASE_URL}/api/auth/login"
}

create_a="$(create_user "${ua}" "${pa}" "${ca}")"
create_b="$(create_user "${ub}" "${pb}" "${cb}")"
login_a="$(login_user "${ua}" "${pa}" "${ca}")"
login_b="$(login_user "${ub}" "${pb}" "${cb}")"

if [[ "${create_a}" != *'"success":true'* || "${create_b}" != *'"success":true'* ]]; then
    echo "User creation failed." >&2
    exit 1
fi
if [[ "${login_a}" != *'"success":true'* || "${login_b}" != *'"success":true'* ]]; then
    echo "User login failed." >&2
    exit 1
fi

curl -sS -b "${ca}" -H 'Content-Type: application/json' -d '{"text":"wave5 private post"}' \
    "${BASE_URL}/api/tweets/create" >/tmp/live-wave5-create.json

pref_set="$(curl -sS -b "${ca}" -H 'Content-Type: application/json' -d '{"isPrivate":true,"messagePrivacy":"followers"}' "${BASE_URL}/api/users/preferences")"
a_tweets="$(curl -sS -b "${ca}" "${BASE_URL}/api/tweets/${ua}")"
tweet_id="$(echo "${a_tweets}" | rg -o '"id":"[^"]+"' | head -n1 | sed 's/"id":"//;s/"//')"

b_profile="$(curl -sS -b "${cb}" "${BASE_URL}/api/users/${ua}")"
b_tweets="$(curl -sS -b "${cb}" "${BASE_URL}/api/tweets/${ua}")"
b_like="$(curl -sS -b "${cb}" -H 'Content-Type: application/json' -d '{}' "${BASE_URL}/api/tweets/${ua}/${tweet_id}/like")"

if [[ "${pref_set}" != *'"success":true'* ]]; then
    echo "Preference update failed: ${pref_set}" >&2
    exit 1
fi
if [[ "${b_profile}" != *'"canViewContent":false'* ]]; then
    echo "Privacy gate failed on profile response: ${b_profile}" >&2
    exit 1
fi
if [[ "${b_tweets}" != *'"tweets":[]'* ]]; then
    echo "Privacy gate failed on tweet list: ${b_tweets}" >&2
    exit 1
fi
if [[ "${b_like}" != *'"success":false'* ]]; then
    echo "Like restriction failed: ${b_like}" >&2
    exit 1
fi


echo "[4/5] Delete route hardening"
delete_with_mismatch_slug="$(curl -sS -b "${ca}" -H 'Content-Type: application/json' -d '{}' "${BASE_URL}/api/tweets/${ub}/${tweet_id}/delete")"
a_tweets_after_delete="$(curl -sS -b "${ca}" "${BASE_URL}/api/tweets/${ua}")"

if [[ "${delete_with_mismatch_slug}" != *'"success":true'* ]]; then
    echo "Delete hardening check failed: ${delete_with_mismatch_slug}" >&2
    exit 1
fi
if [[ "${a_tweets_after_delete}" == *"${tweet_id}"* ]]; then
    echo "Deleted post still returned in timeline: ${a_tweets_after_delete}" >&2
    exit 1
fi


echo "[5/5] Block + DM restriction"
a_block="$(curl -sS -b "${ca}" -H 'Content-Type: application/json' -d '{}' "${BASE_URL}/api/users/${ub}/block")"
b_dm="$(curl -sS -b "${cb}" -H 'Content-Type: application/json' -d "{\"recipient\":\"${ua}\",\"text\":\"hello\"}" "${BASE_URL}/api/messages/create")"
a_blocked="$(curl -sS -b "${ca}" "${BASE_URL}/api/users/blocked")"

if [[ "${a_block}" != *'"success":true'* ]]; then
    echo "Block request failed: ${a_block}" >&2
    exit 1
fi
if [[ "${b_dm}" != *'"success":false'* ]]; then
    echo "DM restriction failed: ${b_dm}" >&2
    exit 1
fi
if [[ "${a_blocked}" != *"${ub}"* ]]; then
    echo "Blocked list missing expected user: ${a_blocked}" >&2
    exit 1
fi

echo "Live social smoke passed for ${BASE_URL}."
