#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
USERNAME="humanlayer$(date +%s)"
PASSWORD="HumanLayerPass123!"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "${COOKIE_FILE}"' EXIT

extract_json_string() {
    local json="$1"
    local key="$2"
    echo "${json}" | rg -o "\"${key}\":\"[^\"]+\"" | head -n1 | sed "s/\"${key}\":\"//;s/\"$//"
}

request_with_status() {
    local method="$1"
    local url="$2"
    local body="${3:-}"

    if [[ "${method}" == "GET" ]]; then
        curl -sS -b "${COOKIE_FILE}" -c "${COOKIE_FILE}" -w '\n%{http_code}' "${url}"
        return
    fi

    curl -sS -b "${COOKIE_FILE}" -c "${COOKIE_FILE}" \
        -X "${method}" \
        -H "Content-Type: application/json" \
        -d "${body}" \
        -w '\n%{http_code}' \
        "${url}"
}

split_status_and_body() {
    local response="$1"
    local -n out_status="$2"
    local -n out_body="$3"
    out_status="${response##*$'\n'}"
    out_body="${response%$'\n'*}"
}

echo "[1/8] Create and login smoke user (${USERNAME})"
create_payload=$(printf '{"username":"%s","password":"%s","name":"Human Layer Smoke"}' "${USERNAME}" "${PASSWORD}")
login_payload=$(printf '{"username":"%s","password":"%s"}' "${USERNAME}" "${PASSWORD}")

create_response="$(curl -sS -c "${COOKIE_FILE}" -H 'Content-Type: application/json' -d "${create_payload}" "${BASE_URL}/api/users/create")"
if [[ "${create_response}" != *'"success":true'* ]]; then
    echo "Create user failed: ${create_response}" >&2
    exit 1
fi

login_response="$(curl -sS -b "${COOKIE_FILE}" -c "${COOKIE_FILE}" -H 'Content-Type: application/json' -d "${login_payload}" "${BASE_URL}/api/auth/login")"
if [[ "${login_response}" != *'"success":true'* ]]; then
    echo "Login failed: ${login_response}" >&2
    exit 1
fi

echo "[2/8] Rules endpoint: current policy metadata"
rules_current="$(curl -sS -b "${COOKIE_FILE}" -c "${COOKIE_FILE}" "${BASE_URL}/api/rules/current")"
if [[ "${rules_current}" != *'"success":true'* ]]; then
    echo "Rules current failed: ${rules_current}" >&2
    exit 1
fi

version="$(extract_json_string "${rules_current}" "version")"
checksum="$(extract_json_string "${rules_current}" "checksum")"
if [[ -z "${version}" || -z "${checksum}" ]]; then
    echo "Could not parse rules version/checksum: ${rules_current}" >&2
    exit 1
fi

echo "[3/8] Rules endpoint: reject bad checksum"
accept_bad_raw="$(request_with_status POST "${BASE_URL}/api/rules/accept" "{\"version\":\"${version}\",\"checksum\":\"deadbeef\"}")"
split_status_and_body "${accept_bad_raw}" accept_bad_status accept_bad_body
if [[ "${accept_bad_status}" != "409" || "${accept_bad_body}" != *'"success":false'* ]]; then
    echo "Expected 409 on bad rules checksum, got ${accept_bad_status}: ${accept_bad_body}" >&2
    exit 1
fi

echo "[4/8] Rules endpoint: accept current policy"
accept_good_raw="$(request_with_status POST "${BASE_URL}/api/rules/accept" "{\"version\":\"${version}\",\"checksum\":\"${checksum}\"}")"
split_status_and_body "${accept_good_raw}" accept_good_status accept_good_body
if [[ "${accept_good_status}" != "200" || "${accept_good_body}" != *'"success":true'* || "${accept_good_body}" != *'"accepted":true'* ]]; then
    echo "Rules accept failed: HTTP ${accept_good_status}: ${accept_good_body}" >&2
    exit 1
fi

rules_current_after="$(curl -sS -b "${COOKIE_FILE}" -c "${COOKIE_FILE}" "${BASE_URL}/api/rules/current")"
if [[ "${rules_current_after}" != *'"accepted":true'* ]]; then
    echo "Rules acceptance state not persisted: ${rules_current_after}" >&2
    exit 1
fi

echo "[5/8] Trust + moderation auth guards"
trust_raw="$(request_with_status GET "${BASE_URL}/api/me/trust")"
split_status_and_body "${trust_raw}" trust_status trust_body
if [[ "${trust_status}" != "200" || "${trust_body}" != *'"success":true'* || "${trust_body}" != *'"tier":"'* ]]; then
    echo "Trust endpoint failed: HTTP ${trust_status}: ${trust_body}" >&2
    exit 1
fi

moderation_raw="$(request_with_status GET "${BASE_URL}/api/moderation/authenticity?status=open&limit=1")"
split_status_and_body "${moderation_raw}" moderation_status moderation_body
if [[ "${moderation_status}" != "403" || "${moderation_body}" != *'"success":false'* ]]; then
    echo "Expected moderator guard on authenticity queue, got ${moderation_status}: ${moderation_body}" >&2
    exit 1
fi

echo "[6/8] Challenge endpoint input validation"
challenge_invalid_raw="$(request_with_status POST "${BASE_URL}/api/human/challenge/verify" '{"action":"invalid_action"}')"
split_status_and_body "${challenge_invalid_raw}" challenge_invalid_status challenge_invalid_body
if [[ "${challenge_invalid_status}" != "400" || "${challenge_invalid_body}" != *'"success":false'* ]]; then
    echo "Expected invalid action rejection, got ${challenge_invalid_status}: ${challenge_invalid_body}" >&2
    exit 1
fi

echo "[7/8] Challenge + post gating behavior (adaptive to dry-run/strict)"
challenge_probe_raw="$(request_with_status POST "${BASE_URL}/api/human/challenge/verify" "{\"action\":\"post_create\",\"ruleVersion\":\"${version}\"}")"
split_status_and_body "${challenge_probe_raw}" challenge_probe_status challenge_probe_body

tweet_text="human-layer-smoke-$(date +%s)"

if [[ "${challenge_probe_status}" == "200" && "${challenge_probe_body}" == *'"success":true'* ]]; then
    challenge_session_id="$(extract_json_string "${challenge_probe_body}" "challengeSessionId")"
    if [[ -z "${challenge_session_id}" ]]; then
        echo "Challenge verification returned success without session id: ${challenge_probe_body}" >&2
        exit 1
    fi

    create_once_raw="$(request_with_status POST "${BASE_URL}/api/tweets/create" "{\"text\":\"${tweet_text}\",\"challengeSessionId\":\"${challenge_session_id}\",\"ruleVersion\":\"${version}\"}")"
    split_status_and_body "${create_once_raw}" create_once_status create_once_body
    if [[ "${create_once_status}" != "200" && "${create_once_status}" != "202" ]]; then
        echo "Post create with challenge session failed: HTTP ${create_once_status}: ${create_once_body}" >&2
        exit 1
    fi

    create_replay_raw="$(request_with_status POST "${BASE_URL}/api/tweets/create" "{\"text\":\"${tweet_text}-replay\",\"challengeSessionId\":\"${challenge_session_id}\",\"ruleVersion\":\"${version}\"}")"
    split_status_and_body "${create_replay_raw}" create_replay_status create_replay_body

    if [[ "${create_replay_status}" == "403" && "${create_replay_body}" == *'"code":"challenge_invalid"'* ]]; then
        echo "Detected strict replay protection."
    elif [[ "${create_replay_status}" == "200" || "${create_replay_status}" == "202" ]]; then
        echo "Detected dry-run challenge bypass path (expected while HUMAN_DRY_RUN=true)."
    else
        echo "Unexpected replay behavior: HTTP ${create_replay_status}: ${create_replay_body}" >&2
        exit 1
    fi
elif [[ "${challenge_probe_status}" == "403" && "${challenge_probe_body}" == *'"code":"challenge_required"'* ]]; then
    create_without_session_raw="$(request_with_status POST "${BASE_URL}/api/tweets/create" "{\"text\":\"${tweet_text}\"}")"
    split_status_and_body "${create_without_session_raw}" create_without_session_status create_without_session_body
    if [[ "${create_without_session_status}" != "403" || "${create_without_session_body}" != *'"code":"challenge_required"'* ]]; then
        echo "Strict mode expected challenge_required on post create, got ${create_without_session_status}: ${create_without_session_body}" >&2
        exit 1
    fi
    echo "Detected strict mode challenge enforcement."
else
    echo "Unexpected challenge probe response: HTTP ${challenge_probe_status}: ${challenge_probe_body}" >&2
    exit 1
fi

echo "[8/8] Human layer smoke complete"
echo "Human layer smoke passed for ${BASE_URL}."
