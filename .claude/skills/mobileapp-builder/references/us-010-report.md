# US-010: Build Report (Token Usage + Slack + X Post)

依存: US-009（App Store提出完了）

## Step 1: Token Usage 集計

logs/iteration-*.log の全ファイルから usage を集計する。

```python
import json, glob

total_tokens = 0
total_duration_ms = 0
iteration_count = 0

for f in sorted(glob.glob('logs/iteration-*.log')):
    with open(f) as fh:
        for line in fh:
            try:
                d = json.loads(line.strip())
                if d.get('type') == 'result':
                    u = d.get('usage', {})
                    tokens = (u.get('input_tokens', 0) +
                              u.get('cache_creation_input_tokens', 0) +
                              u.get('cache_read_input_tokens', 0) +
                              u.get('output_tokens', 0))
                    total_tokens += tokens
                    total_duration_ms += d.get('duration_ms', 0)
                    iteration_count += 1
            except:
                pass

WEEKLY_CAP = 560_000_000
MONTHLY_CAP = WEEKLY_CAP * 4
cost_in_plan = (total_tokens / MONTHLY_CAP) * 200
weekly_pct = (total_tokens / WEEKLY_CAP) * 100
window_pct = (total_tokens / 90_000_000) * 100
duration_min = total_duration_ms / 60000
```

## Step 2: アプリ情報取得

prd.json から以下を読む:
- `appName` — アプリ名（例: FrostDip）
- `appSlogan` — 1行説明（例: Cold plunge timer & breathing guide）

これらは毎アプリ異なる。ハードコードしない。

## Step 3: build-report.json 保存

アプリディレクトリ直下に保存する。

```json
{
  "appName": "<prd.jsonから>",
  "appSlogan": "<prd.jsonから>",
  "totalTokens": 50000000,
  "costInPlan": 4.46,
  "iterationCount": 18,
  "durationMinutes": 130,
  "weeklyUsagePercent": 8.9,
  "windowUsagePercent": 55.6,
  "buildDate": "2026-03-08"
}
```

## Step 4: スクショ取得

US-008a で ASC にアップロードした製品ページスクショを使う。

パス: `screenshots/raw-65/en-US/*.png`（CWD = アプリディレクトリ）

最大4枚。ファイルが5枚以上あれば先頭4枚。

## Step 5: Slack 投稿

```bash
source ~/.config/mobileapp-builder/.env

# build-report.json から値を読む
REPORT="build-report.json"
APP_NAME=$(python3 -c "import json; print(json.load(open('$REPORT'))['appName'])")
APP_SLOGAN=$(python3 -c "import json; print(json.load(open('$REPORT'))['appSlogan'])")
COST=$(python3 -c "import json; print(f\"{json.load(open('$REPORT'))['costInPlan']:.2f}\")")
ITERS=$(python3 -c "import json; print(json.load(open('$REPORT'))['iterationCount'])")
DURATION=$(python3 -c "import json; print(f\"{json.load(open('$REPORT'))['durationMinutes']:.0f}\")")
TOKENS=$(python3 -c "import json; d=json.load(open('$REPORT')); print(f\"{d['totalTokens']/1_000_000:.0f}M\")")
W5=$(python3 -c "import json; print(f\"{json.load(open('$REPORT'))['windowUsagePercent']:.0f}\")")
WK=$(python3 -c "import json; print(f\"{json.load(open('$REPORT'))['weeklyUsagePercent']:.1f}\")")

TEXT="🏭 ${APP_NAME} → App Store\n\n📱 ${APP_SLOGAN}\n💰 \$${COST} / \$200 plan\n⏱️ ${ITERS} iterations | ${DURATION}min\n📊 ${TOKENS} tokens | 5h: ${W5}% | weekly: ${WK}%\n\n#BuildInPublic"

curl -X POST "https://hooks.slack.com/services/$SLACK_WEBHOOK_PATH" \
  -H "Content-Type: application/json" \
  -d "{\"channel\":\"C091G3PKHL2\",\"text\":\"$TEXT\"}"
```

## Step 6: X 投稿（Postiz API + 製品ページスクショ）

```bash
source ~/.config/mobileapp-builder/.env

# Step 6a: スクショを Postiz media API でアップロード（最大4枚）
SCREENSHOTS=$(ls screenshots/raw-65/en-US/*.png 2>/dev/null | head -4)
MEDIA_IDS=""
for IMG in $SCREENSHOTS; do
  MEDIA_ID=$(curl -s -X POST "https://api.postiz.com/public/v1/media" \
    -H "Authorization: Bearer $POSTIZ_API_KEY" \
    -F "file=@$IMG" | jq -r '.id')
  MEDIA_IDS="$MEDIA_IDS\"$MEDIA_ID\","
done
MEDIA_IDS="[${MEDIA_IDS%,}]"

# Step 6b: 投稿
REPORT="build-report.json"
APP_NAME=$(python3 -c "import json; print(json.load(open('$REPORT'))['appName'])")
APP_SLOGAN=$(python3 -c "import json; print(json.load(open('$REPORT'))['appSlogan'])")
COST=$(python3 -c "import json; print(f\"{json.load(open('$REPORT'))['costInPlan']:.2f}\")")
ITERS=$(python3 -c "import json; print(json.load(open('$REPORT'))['iterationCount'])")
DURATION=$(python3 -c "import json; print(f\"{json.load(open('$REPORT'))['durationMinutes']:.0f}\")")
TOKENS=$(python3 -c "import json; d=json.load(open('$REPORT')); print(f\"{d['totalTokens']/1_000_000:.0f}M\")")
W5=$(python3 -c "import json; print(f\"{json.load(open('$REPORT'))['windowUsagePercent']:.0f}\")")
WK=$(python3 -c "import json; print(f\"{json.load(open('$REPORT'))['weeklyUsagePercent']:.1f}\")")

TEXT="🏭 ${APP_NAME} → App Store\n\n📱 ${APP_SLOGAN}\n💰 \$${COST} / \$200 plan\n⏱️ ${ITERS} iterations | ${DURATION}min\n📊 ${TOKENS} tokens | 5h: ${W5}% | weekly: ${WK}%\n\n#BuildInPublic"

curl -X POST "https://api.postiz.com/public/v1/posts" \
  -H "Authorization: Bearer $POSTIZ_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"$TEXT\",\"integration\":\"$POSTIZ_X_INTEGRATION_ID\",\"media\":$MEDIA_IDS,\"type\":\"now\"}"
```

## Acceptance Criteria

| Criteria | Evidence |
|----------|----------|
| build-report.json saved | `test -f build-report.json` |
| Slack posted | curl response 200/ok |
| X posted | Postiz response contains post ID |
