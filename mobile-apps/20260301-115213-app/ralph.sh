#!/bin/bash
# ralph.sh — snarktank/ralph complete copy
# Source: https://github.com/snarktank/ralph/blob/main/ralph.sh
# Slack notify: https://notes.kodekloud.com/docs/GitHub-Actions/Reusable-Workflows-and-Reporting/Slack-Notify-GitHub-Action/page
# Log files: tee to file (same tee pattern as ralph original)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAX_ITERATIONS="${1:-20}"
SLACK_CHANNEL="C091G3PKHL2"

# Source secrets from .env (Twelve-Factor App: https://12factor.net/config)
if [ -f ~/.config/mobileapp-builder/.env ]; then
  set -a
  source ~/.config/mobileapp-builder/.env
  set +a
fi

mkdir -p "$SCRIPT_DIR/logs"

echo "🏭 ralph.sh 起動: MAX_ITERATIONS=$MAX_ITERATIONS"
echo "🏭 作業ディレクトリ: $SCRIPT_DIR"

notify_slack() {
  openclaw message send --channel slack --target "$SLACK_CHANNEL" --text "$1" 2>/dev/null || true
}

notify_slack "🏭 ralph.sh 起動: $(basename "$SCRIPT_DIR")"

PREV_PASSES=""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "🏭 ========================================"
  echo "🏭 Iteration $i / $MAX_ITERATIONS 開始: $(date)"
  echo "🏭 ========================================"

  LOG_FILE="$SCRIPT_DIR/logs/iteration-$i.log"

  OUTPUT=$(claude --dangerously-skip-permissions --print < "$SCRIPT_DIR/CLAUDE.md" 2>&1 | tee "$LOG_FILE") || true

  echo ""
  echo "🏭 Iteration $i 終了: $(date)"

  # Snapshot passes BEFORE validation (to detect what CC just changed)
  # Source: SonarQube quality gate pattern — external process validates, not the worker
  # https://docs.sonarsource.com/sonarqube-cloud/standards/managing-quality-gates/introduction-to-quality-gates
  BEFORE_PASSES=""
  if [ -n "$PREV_PASSES" ]; then
    BEFORE_PASSES="$PREV_PASSES"
  fi

  # Detect newly completed US and notify Slack
  if [ -f "$SCRIPT_DIR/prd.json" ]; then
    CURR_PASSES=$(python3 -c "
import json
with open('$SCRIPT_DIR/prd.json') as f: d = json.load(f)
for us in d['userStories']:
    if us['passes']: print(us['id'] + ': ' + us['title'])
" 2>/dev/null || true)

    while IFS= read -r line; do
      if [ -n "$line" ] && ! echo "$PREV_PASSES" | grep -qF "$line"; then
        notify_slack "✅ $line"
      fi
    done <<< "$CURR_PASSES"

    PREV_PASSES="$CURR_PASSES"
  fi

  # EXTERNAL VALIDATION GATE
  # Source: SonarQube — "mandatory evaluations a piece of code must pass before progressing"
  # Source: fastlane deliver — "Automatically uses precheck to ensure your app has the highest chances"
  # https://docs.fastlane.tools/actions/precheck/
  if [ -f "$SCRIPT_DIR/validate.sh" ]; then
    echo "🔍 External validation gate running..."
    VALIDATE_LOG="$SCRIPT_DIR/logs/validate-$i.log"
    if bash "$SCRIPT_DIR/validate.sh" 2>&1 | tee "$VALIDATE_LOG"; then
      echo "🟢 Validation PASSED"
    else
      echo "🔴 Validation FAILED — resetting newly completed US"
      python3 -c "
import json
with open('"'"'$SCRIPT_DIR/prd.json'"'"') as f: d = json.load(f)
before = set('"'"'$BEFORE_PASSES'"'"'.strip().split(chr(10))) if '"'"'$BEFORE_PASSES'"'"'.strip() else set()
for us in d['"'"'userStories'"'"']:
    line = us['"'"'id'"'"'] + '"'"': '"'"' + us['"'"'title'"'"']
    if us['"'"'passes'"'"'] and line not in before:
        us['"'"'passes'"'"'] = False
        us['"'"'notes'"'"'] = (us.get('"'"'notes'"'"','"'"''"'"') + '"'"' | VALIDATION_FAILED'"'"').strip()
        print(f'"'"'🔴 Reset {us["id"]} to passes:false'"'"')
with open('"'"'$SCRIPT_DIR/prd.json'"'"','"'"'w'"'"') as f: json.dump(d, f, indent=2)
" 2>/dev/null || true
      notify_slack "🔴 Validation FAILED: external gate rejected. CC must fix and retry."
    fi
  fi

  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo "🏭 ✅ COMPLETE 検出。全 US 完了。"
    notify_slack "🎉 全 US 完了！App Store に提出しました。"
    exit 0
  fi

  echo "🏭 sleep 2..."
  sleep 2
done

echo "🏭 ❌ MAX_ITERATIONS ($MAX_ITERATIONS) に到達。完了せず。"
notify_slack "❌ MAX_ITERATIONS ($MAX_ITERATIONS) に到達。完了せず。"
exit 1
