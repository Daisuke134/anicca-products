#!/bin/bash
# VPS ~/.openclaw/.env へローカルで持っているキーを反映（値は表示しない）
set -e
cd "$(dirname "$0")/../.."
set -a
source ./.env 2>/dev/null || true
source ./scripts/anicca-agent/.env 2>/dev/null || true
set +a

VPS_HOST="${VPS_HOST:-46.225.70.241}"
VPS_USER="${VPS_USER:-anicca}"
REMOTE_ENV="/home/anicca/.openclaw/.env"

KEYS="API_BASE_URL ANICCA_AGENT_TOKEN APIFY_API_TOKEN TWITTERAPI_KEY REDDAPI_API_KEY MOLTBOOK_BASE_URL MOLTBOOK_ACCESS_TOKEN INTERNAL_API_TOKEN"

for k in $KEYS; do
  v="${!k}"
  [ -z "$v" ] && continue
  # シングルクォートをエスケープ（' -> '\''）
  v_escaped="${v//\'/\'\\\'\'}"
  ssh "${VPS_USER}@${VPS_HOST}" "mkdir -p /home/anicca/.openclaw && touch $REMOTE_ENV"
  ssh "${VPS_USER}@${VPS_HOST}" "grep -v '^${k}=' $REMOTE_ENV > /tmp/env.tmp 2>/dev/null || true; echo '${k}=${v_escaped}' >> /tmp/env.tmp; mv /tmp/env.tmp $REMOTE_ENV"
done

echo "Done. Run VPS verification next."
