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

## Step 1: App Privacy (人間介入 — STOP)

Source: mobileapp-builder CRITICAL RULE 25
> 「App Privacy は ASC API 不可。手動のみ」

CC は以下を実行:
1. progress.txt に「Waiting for App Privacy setup」と書く
2. passes: false のまま終了

CC は progress.txt に以下を書いて passes:false で終了:
```
WAITING_FOR_HUMAN: App Privacy setup
⏸️ App Privacy を ASC Web で設定してください
URL: https://appstoreconnect.apple.com/apps/<APP_ID>
App → App Privacy → Get Started → 設定 → Save
完了したら Slack で「done」と返信してください
```

ralph.sh が progress.txt の WAITING_FOR_HUMAN を検出 → Slack に投稿。

### 待ちパターン (.app-privacy-done)
Source: v3 spec §9
1. Dais が ASC Web で設定 → Slack で「done」
2. Anicca（OpenClaw）が `touch .app-privacy-done`
3. 次の ralph iteration で CC が `.app-privacy-done` を検出
4. → Step 2 へ進む

```bash
# CC がチェック:
test -f .app-privacy-done || { echo "App Privacy not done yet. passes:false"; exit 0; }
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
