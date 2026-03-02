### PHASE 11.5: APP PRIVACY 手動設定（PHASE 12 の前に必須 — API で設定不可）

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑 STOP 3 — App Privacy 手動設定（PHASE 11.5）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASC API は App Privacy 設定に対応していない（404を返す）。
ユーザーが ASC Web で手動設定する必要がある。
下記の【ユーザー作業】を案内し、「完了」と言われたら PHASE 12 を即実行。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **⚠️ 重要（2026-02-24 実機検証）: App Privacy は ASC API で設定できない**
> `/v1/apps/{id}/appDataUsages` は 404 を返す。ユーザーが ASC Web で手動設定するまで先に進まない。

ユーザーに以下を伝えてから待機する:

```
【ユーザー作業】App Privacy の設定（App Store Connect Web — 所要2分）

1. https://appstoreconnect.apple.com → My Apps → <app_name> を開く
2. 左メニュー「App Privacy」をクリック
3.「データの使用方法を編集」ボタンをクリック
4. 収集するデータカテゴリを選択:
   □ Identifiers（Device ID → Third-Party Advertising, Analytics, App Functionality）
   □ Usage Data（Product Interaction → Analytics）
   ※ 日記エントリー・アファメーションは収集しない（ローカル保存のみ）
5. 各カテゴリで「このデータをユーザーのアカウントやデバイスにリンクしているか？」→「いいえ」
6.「完了」→「保存」
7. 完了したらエージェントに「App Privacy 設定完了」と伝える

設定できるカテゴリの例（アプリによって異なる）:
  - 分析（Identifiers, Usage Data）
  - RevenueCat（Purchase History）
  - 収集しない（Health/Fitness, Sensitive Info など）
```

ユーザーが「完了」と言ったら PHASE 12 に進む。

### PHASE 12: SUBMIT

**⚠️ サブスク（IAP）が存在する場合: 先に GUI 作業が必須**
ASC GUI → version ページ → In-App Purchases and Subscriptions → Select で全サブスクを選択してから以下を実行する。CLI でサブスクを review に含める手段はない（2026-03-01 確認）。

```bash
# Step 1: submission 作成
SUBMISSION_ID=$(asc review submissions-create --app "$APP_ID" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data']['id'])")
echo "Submission ID: $SUBMISSION_ID"

# Step 2: version を submission に追加
asc review items-add \
  --submission "$SUBMISSION_ID" \
  --item-type appStoreVersions \
  --item-id "$VERSION_ID"

# Step 3: 審査提出
asc review submissions-submit --id "$SUBMISSION_ID" --confirm

# Step 4: 確認
asc review submissions-list --app "$APP_ID"
# → state: WAITING_FOR_REVIEW ✅
```

### PHASE 13: REJECTION LOOP（ASC CLI 0.34.0 新機能 — EXPERIMENTAL）
```bash
# リジェクトされた場合の自動対応ループ
# ⚠️ EXPERIMENTAL: Apple 非公式 API（/iris endpoints）を使用。壊れる可能性あり。

# Step 1: リジェクション理由を取得
asc review details-get --app "$APP_ID"
# → 審査詳細（理由・ガイドライン番号）を取得（v0.35.3 確認済み — 2026-02-28）

asc web review list --app "$APP_ID"
# → submission ID を取得（EXPERIMENTAL）

asc web review show --app "$APP_ID" --id "<SUBMISSION_ID>"
# → リジェクション理由 + スレッド + メッセージ + スクショが自動DLされる（EXPERIMENTAL）

# Step 2: 理由に基づいてコード/メタデータを修正
# （修正内容はリジェクション理由による — ガイドライン番号で判断）

# Step 3: 再ビルド → 再提出
FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 \
  fastlane gym --scheme "<app_name>" --export_method app-store --output_directory ./build

asc publish appstore \
  --app "$APP_ID" \
  --ipa "./build/<app_name>.ipa" \
  --version "<version>" \
  --wait --submit --confirm

# Step 4: このSKILL.mdにリジェクション原因と修正方法を記録 → git push
# （SELF-IMPROVEMENT RULE に従う）
```

---

## asc workflow（PHASE 9〜12 の一括実行 — オプション）

リポジトリに `.asc/workflow.json` を配置すると、後半フェーズを1コマンドで実行できる:

```bash
# 提出前トリプルチェック
APP_ID=<APP_ID> VERSION=<version> asc workflow run validate-only

# メタデータ + スクショ + validate + publish を一括実行
APP_ID=<APP_ID> VERSION=<version> IPA_PATH=./build/<app_name>.ipa asc workflow run ship
```

workflow.json テンプレート → `references/workflow-template.json`

## 参照ファイル

| ファイル | いつ読む |
|---------|---------|
| `references/iap-bible.md` | PHASE 4-8 の詳細手順・価格ポイント取得方法 |
| `references/spec-template.md` | PHASE 1 の INPUT 確認 |
| `references/submission-checklist.md` | PHASE 11 のゲートチェック全項目 |
| `references/workflow-template.json` | asc workflow の定義テンプレート |
| `scripts/add_prices.py` | PHASE 5 の価格設定実行 |
