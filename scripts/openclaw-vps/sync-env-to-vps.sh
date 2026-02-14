#!/usr/bin/env bash
# ローカル anicca-project/.env を VPS の .env 2 箇所に同期する。
# 使い方: プロジェクトルートで ./scripts/openclaw-vps/sync-env-to-vps.sh
# 前提: ssh anicca@46.225.70.241 が通ること。

set -e
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
VPS_HOST="anicca@46.225.70.241"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env not found at $ENV_FILE"
  exit 1
fi

echo "Syncing .env to VPS (openclaw + home)..."
ssh "$VPS_HOST" "mkdir -p /home/anicca/.openclaw && cat > /home/anicca/.openclaw/.env" < "$ENV_FILE"
ssh "$VPS_HOST" "cat > /home/anicca/.env" < "$ENV_FILE"
echo "Done. VPS paths: /home/anicca/.openclaw/.env, /home/anicca/.env"
