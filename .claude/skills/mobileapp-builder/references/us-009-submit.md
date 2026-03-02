# US-009: App Store Submission

Source: rshankras WORKFLOW.md Phase 6 + rudrankriyam asc-release-flow

## Skills to Read
1. `.claude/skills/asc-submission-health/SKILL.md` — rudrankriyam: preflight
2. `.claude/skills/asc-release-flow/SKILL.md` — rudrankriyam: submit

## Quality Gate (MANDATORY — US-008 検証)
```bash
# asc validate must have passed
asc validate --app "$APP_ID" --version-id "$VERSION_ID" --platform IOS 2>&1 | grep -q "Errors: 0" \
  || { echo "GATE FAIL: validation errors exist"; exit 1; }
```

## Step 1: App Privacy（CLI 自動）

Source: end.md Q2.E + asc CLI 0.36.1
> 「asc web privacy apply + publish」

**人間介入不要。** `asc web privacy` で完全自動化。

### 1.1: Web セッション確認
```bash
# セッションが有効か確認（無効なら Step 5 の ASC App Creation で既にログイン済みのはず）
asc web auth status 2>&1 | grep -q "authenticated" || {
  echo "⚠️ Web session expired. Re-authenticate needed."
  # 2FA は ASC App Creation (Step 5) で既に完了しているはず
}
```

### 1.2: Privacy 宣言（DATA_NOT_COLLECTED パターン）
```bash
# 収集データなしの場合（ほとんどの MVP アプリ）
cat > /tmp/privacy.json << 'EOF'
{
  "privacyChoices": {
    "dataNotCollected": true
  }
}
EOF

# 適用 + 公開
asc web privacy apply --app $APP_ID --file /tmp/privacy.json
asc web privacy publish --app $APP_ID
```

### 1.3: 収集データありの場合
```bash
# AnalyticsService がある場合など
cat > /tmp/privacy.json << 'EOF'
{
  "privacyChoices": {
    "dataNotCollected": false,
    "dataTypes": [
      {
        "dataType": "USAGE_DATA",
        "purposes": ["ANALYTICS"],
        "dataProtections": ["DATA_NOT_LINKED_TO_USER"]
      }
    ]
  }
}
EOF

asc web privacy apply --app $APP_ID --file /tmp/privacy.json
asc web privacy publish --app $APP_ID
```

## Step 2: Submit for Review
```bash
asc review submissions-create --app $APP_ID
asc review items-add --submission-id $SUBMISSION_ID --version-id $VERSION_ID
asc review submissions-submit --submission-id $SUBMISSION_ID
```
Source: CRITICAL RULE 22
> 「提出の正解コマンドは submissions-create + items-add + submissions-submit」

## Step 3: Confirm
```bash
asc review submissions-list --app $APP_ID
# state = WAITING_FOR_REVIEW を確認
```

## Acceptance Criteria
- .app-privacy-done exists
- asc review submissions-submit succeeds
- State = WAITING_FOR_REVIEW
- Slack #metrics notified: 「🎉 WAITING_FOR_REVIEW」
