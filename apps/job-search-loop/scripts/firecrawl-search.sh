#!/bin/zsh
set -euo pipefail

if [[ $# -ne 1 ]]; then
  print -u2 "usage: firecrawl-search.sh <query>"
  exit 2
fi
set -a
source /Users/anicca/.openclaw/.env
set +a
exec /opt/homebrew/bin/firecrawl search "$1" \
  --limit 10 --country JP --scrape --scrape-formats markdown --json

