#!/bin/zsh
set -euo pipefail

APP_ROOT="/Users/anicca/anicca-job-search-loop/apps/job-search-loop"
AGENTS="/Users/anicca/Library/LaunchAgents"
UID_VALUE="$(id -u)"
mkdir -p "$AGENTS" /Users/anicca/.local/state/anicca/job-search/logs
chmod 700 /Users/anicca/.local/state/anicca/job-search

for name in ai.anicca.job-search-daily ai.anicca.job-search-inbox; do
  launchctl bootout "gui/$UID_VALUE/$name" 2>/dev/null || true
  cp "$APP_ROOT/launchd/$name.plist" "$AGENTS/$name.plist"
  plutil -lint "$AGENTS/$name.plist"
  launchctl bootstrap "gui/$UID_VALUE" "$AGENTS/$name.plist"
done
