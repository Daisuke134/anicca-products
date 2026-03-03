# US-009: App Store Submission

## Step -1: Dependency Check (MANDATORY)

Source: Microsoft Azure Pipelines — Stages
https://learn.microsoft.com/en-us/azure/devops/pipelines/process/stages
> "a stage runs if all of the stages that it depends on have completed and succeeded"

**US-001~008 全てが passes:true でないと US-009 は実行しない:**

```bash
INCOMPLETE=$(jq -r '.userStories[] | select(.passes == false and .id != "US-009") | .id' prd.json)
if [ -n "$INCOMPLETE" ]; then
  echo "❌ Cannot proceed: $INCOMPLETE still passes:false"
  echo "US-009 requires all prior US to be completed."
  exit 0  # passes:false のまま終了
fi
echo "✅ All dependencies passed"
```

## Step 0: apple-appstore-reviewer Audit (MANDATORY)

Source: apple-appstore-reviewer SKILL.md
> "You are the review gatekeeper"
> "P0 (Blocker): Very likely to cause rejection"

**提出前に apple-appstore-reviewer スキルを実行し、P0/P1 = 0 までループ:**

1. apple-appstore-reviewer スキルを実行（コードベース全体をレビュー）
2. Risk Register を取得
3. P0/P1 がある → 修正 → 再実行
4. P0/P1 = 0 になるまでループ

### PROHIBITED
- ⛔ P0/P1 > 0 で提出するな
- ⛔ レビューをスキップするな



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
asc web auth status 2>&1 | grep -q '"authenticated":true' || {
  echo "⚠️ Web session expired. Re-authenticate needed."
  exit 1
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
asc web privacy publish --app $APP_ID --confirm
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
asc web privacy publish --app $APP_ID --confirm
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
