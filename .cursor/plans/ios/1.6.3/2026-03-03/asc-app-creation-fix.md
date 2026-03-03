# ASC App Creation 修正: asc web → ~/bin/asc apps create

## 背景

- `asc web apps create` / `asc web auth login` は非公式(EXPERIMENTAL)で、Keychainハング問題あり
- `asc apps create` は iris パッケージを使い、`~/.asc/iris/` にファイルベースでセッション保存
- 2026-03-03 に実機検証済み: 2FA一回通した後、2FA無しで3つのアプリを連続作成成功

## 検証結果

```
TestDeleteMe  → APP_ID: 6759954834 ✅ (2FA付き、セッションキャッシュ作成)
TestDeleteMe2 → APP_ID: 6759954943 ✅ (2FA無し、セッションキャッシュから自動認証)
TestDeleteMe3 → APP_ID: 6759955027 ✅ (2FA無し、~/bin/asc で動作確認)
```

---

## 修正1: SKILL.md（mobileapp-factory）STEP 7a

ファイル: `/Users/anicca/.openclaw/skills/mobileapp-factory/SKILL.md`

### Before

```markdown
### 7a. ASC アプリ作成（US-005）

Slack に来る: `WAITING_FOR_HUMAN: ASC app creation`

Dais が ASC Web で作成 → Slack で APP_ID を返信。

Anicca がやること:
```bash
sed -i '' "s/^APP_ID=.*/APP_ID=<返信された値>/" "$APP_DIR/.env"
sed -i '' "s/^BUNDLE_ID=.*/BUNDLE_ID=<返信された値>/" "$APP_DIR/.env"
echo "ASC app created. APP_ID=<値> BUNDLE_ID=<値>" >> "$APP_DIR/progress.txt"
```

次の iteration で CC が .env を読んで続行。
```

### After

```markdown
### 7a. ASC アプリ作成（US-005）— 完全自動

```bash
# 1. Bundle ID 作成（API Key認証 — 常に自動）
~/bin/asc bundle-ids create \
  --identifier "$BUNDLE_ID" \
  --name "$APP_NAME" \
  --platform IOS --output json

# 2. アプリ作成（iris セッション — 通常は自動）
APP_RESULT=$(~/bin/asc apps create \
  --name "$APP_NAME" \
  --bundle-id "$BUNDLE_ID" \
  --sku "$SLUG" \
  --platform IOS \
  --output json 2>&1)

if echo "$APP_RESULT" | jq -e '.data.id' > /dev/null 2>&1; then
  APP_ID=$(echo "$APP_RESULT" | jq -r '.data.id')
  sed -i '' "s/^APP_ID=.*/APP_ID=$APP_ID/" "$APP_DIR/.env"
  echo "✅ ASC App created: $APP_ID" >> "$APP_DIR/progress.txt"
  # → 自動で次のステップへ続行
else
  # セッション切れの場合のみ WAITING_FOR_HUMAN
  echo "WAITING_FOR_HUMAN: 2FA code needed for ASC app creation"
  cat >> "$APP_DIR/progress.txt" << MSG
⏸️ ASC iris セッション切れ。2FAコードが必要です。
iPhone に届く 6 桁のコードを Slack で返信してください。
MSG
  # → Dais が Slack で 6桁コード返信
  # → エージェントが再実行:
  # ~/bin/asc apps create --apple-id keiodaisuke@gmail.com \
  #   --password "Chatgpt12345" --two-factor-code <CODE> \
  #   --name "$APP_NAME" --bundle-id "$BUNDLE_ID" --sku "$SLUG"
  exit 1
fi
```

通常はセッションキャッシュ（~/.asc/iris/）から自動認証される。
Dais は何もしなくてよい。APP_ID も自動取得。
セッション切れ時のみ Slack で 2FA コードを返すだけ。
```

---

## 修正2: us-005-infrastructure.md Step 5

ファイル: `/Users/anicca/anicca-project/.claude/skills/mobileapp-builder/references/us-005-infrastructure.md`

### Before

```markdown
## Step 5: ASC App Creation (asc web apps create)

### 5.1: セッション有効性チェック
```bash
source ~/.config/mobileapp-builder/.env
LAST_LOGIN="${ASC_WEB_LAST_LOGIN:-1970-01-01}"
DAYS_SINCE=$(( ( $(date +%s) - $(date -j -f "%Y-%m-%d" "$LAST_LOGIN" +%s) ) / 86400 ))

if [ "$DAYS_SINCE" -gt 28 ]; then
  # 28日超過 → 2FA 必要
  echo "WAITING_FOR_HUMAN: 2FA required (session expired)"
  cat >> progress.txt << 'MSG'
⏸️ 2FA コード入力が必要です（セッション期限切れ）
asc web auth login --apple-id keiodaisuke@gmail.com --password-stdin
→ パスワード入力後、iPhone に届く 6 桁のコードを Slack で返信
MSG
  exit 1
fi
```

### 5.2: アプリ作成（自動）
```bash
APP_RESULT=$(asc web apps create \
  --name "<app_name>" \
  --bundle-id "<bundle_id>" \
  --sku "<slug>" \
  --apple-id "$APPLE_ID" \
  --output json 2>&1)

if echo "$APP_RESULT" | grep -q '"id"'; then
  APP_ID=$(echo "$APP_RESULT" | jq -r '.data.id')
  echo "APP_ID=$APP_ID" >> .env
  echo "✅ ASC App created: $APP_ID"

  # Update last login date
  sed -i '' "s/ASC_WEB_LAST_LOGIN=.*/ASC_WEB_LAST_LOGIN=$(date +%Y-%m-%d)/" ~/.config/mobileapp-builder/.env
else
  echo "❌ ASC App creation failed: $APP_RESULT"
  exit 1
fi
```

Dais が APP_ID を返信 → Anicca が progress.txt に追記 + .env に書く。
次の iteration で CC が読む → 続行。
```

### After

```markdown
## Step 5: ASC App Creation（~/bin/asc apps create — iris セッション）

### 5.1: Bundle ID 作成（API Key認証 — 完全自動）
```bash
~/bin/asc bundle-ids create \
  --identifier "<bundle_id>" \
  --name "<app_name>" \
  --platform IOS --output json
```

### 5.2: アプリ作成（通常は完全自動）
```bash
APP_RESULT=$(~/bin/asc apps create \
  --name "<app_name>" \
  --bundle-id "<bundle_id>" \
  --sku "<slug>" \
  --platform IOS \
  --output json 2>&1)

if echo "$APP_RESULT" | jq -e '.data.id' > /dev/null 2>&1; then
  APP_ID=$(echo "$APP_RESULT" | jq -r '.data.id')
  echo "APP_ID=$APP_ID" >> .env
  echo "✅ ASC App created: $APP_ID"
else
  # iris セッション切れの場合のみ
  echo "WAITING_FOR_HUMAN: 2FA code needed"
  cat >> progress.txt << 'MSG'
⏸️ iris セッション切れ。
iPhone に届く 6 桁のコードを Slack で返信してください。
エージェントが --two-factor-code 付きで再実行します。
MSG
  exit 1
fi
```

### セッション管理
- セッションキャッシュ: `~/.asc/iris/`（ファイルベース）
- 通常運用: セッションが生きている限り **完全自動**（2FA不要）
- 有効期限: Apple サーバー側管理（定期使用で延長される）
- 期限切れ時: エージェントがコマンド実行 → Dais は Slack で 6桁コード返すだけ
- APP_ID は自動取得 → .env に自動書き込み → 次のステップへ自動続行
```

---

## 削除されたもの

| 削除項目 | 理由 |
|----------|------|
| `asc web apps create` | 非公式・Keychainハング問題 |
| `asc web auth login` | 不要（iris セッションを使う） |
| `ASC_WEB_LAST_LOGIN` 日付チェック | 不要（iris が自動判定） |
| `Dais が ASC Web で作成` | エージェントが自動実行 |
| `Dais が APP_ID を返信` | 自動取得 |
| `sed` での日付更新 | 不要 |
| `~/.config/mobileapp-builder/.env` の LAST_LOGIN | 不要 |

## バイナリ情報

- パス: `~/bin/asc`（永続的な場所）
- ソース: `~/app-store-connect-cli/`（GitHub clone）
- バージョン: 0.36.2-1-g7e6029e
- ビルド: `cd ~/app-store-connect-cli && make build && cp ./asc ~/bin/asc`

## 注意: /opt/homebrew/bin/asc はハングする

`/opt/homebrew/bin/asc` にコピーしたバイナリはハングする問題がある。
`/tmp/app-store-connect-cli/asc` または `~/bin/asc` を直接使うこと。
原因は不明だが、Homebrew のシムリンク経由だと Keychain アクセスで問題が起きる可能性がある。
