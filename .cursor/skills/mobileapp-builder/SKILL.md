---
name: mobileapp-builder
description: Builds and ships a Swift/SwiftUI iOS app to the App Store from a spec.md file. Handles all 12 phases autonomously: Xcode scaffold → SwiftUI implementation → ASC subscription setup (175-territory pricing, localizations, review screenshots) → app assets → preflight gate → submission. Use when given a spec.md and told to build and ship an app, or when triggered by app-factory cron.
---

# mobileapp-builder

Given a `spec.md`, autonomously build and ship a Swift/SwiftUI iOS app to the App Store.

**Full spec:** `.cursor/plans/ios/1.6.3/mobileapp-builder-spec.md`

---

## INPUT

```
spec.md path (required fields: app_name, bundle_id, version, price_monthly_usd,
price_annual_usd, output_dir, concept, screens, paywall, metadata)
```

See `references/spec-template.md` for the full spec.md format.

---

## OUTPUT

`asc review submissions-list` → state = `WAITING_FOR_REVIEW`

---

## CRITICAL RULES (違反 = リジェクト確定)

| # | ルール |
|---|--------|
| 1 | **提出前に全サブスクが READY_TO_SUBMIT**。MISSING_METADATA のまま提出 → Guideline 2.1 拒否 |
| 2 | **IAP pricing は全175カ国**。US のみは Guideline 2.1 拒否 |
| 3 | **Superwall 使用禁止**。RevenueCat のみ |
| 4 | **xcodebuild 直接実行禁止**。Fastlane のみ |
| 5 | **PHASE 8 が STOP ゲート**。blocking=0 + READY_TO_SUBMIT でなければ絶対に次に進まない |
| 6 | **availability set は pricing の前**。順序を逆にすると全pricing call が Apple 500エラーで失敗する |
| 7 | **Privacy Policy URL は en-US AND ja 両方必須**。片方だけでは submit 時にエラー |
| 8 | **RC Offerings は TestFlight 前に設定必須**。未設定だと「Apple IAP key is invalid」エラーで課金不可 |
| 9 | **locale は `ja`（`ja-JP` は無効）**。ASC API は `ja-JP` を拒否する |
| 10 | **IAP key は同一 Apple Developer アカウントで使い回し**。新規作成不要。`AuthKey_AY9BT5R8NU.p8` を流用 |
| 11 | **Paywall コピーは必ずコードから実機能を確認してから書く**。存在しない機能を訴求するのは罪（Apple レビュー違反 + ユーザー詐欺）。`FreePlanService.swift`, `SubscriptionManager.swift` を必ず読め |

---

## ⚠️ Paywall コピー作成ルール（必読）

**Paywall に書く機能は全てコードに実在すること。存在しない機能を訴求してはいけない。**

Paywall 作成・更新の前に以下を確認する（Anicca の場合）:

| ファイル | 確認する内容 |
|---------|------------|
| `FreePlanService.swift` | Free の制限（本数・時刻・ルールベース） |
| `LLMNudgeService.swift` | Pro の AI 機能 |
| `NudgeStatsManager.swift` | フィードバック学習の仕組み |
| `SubscriptionInfo.swift` | Free/Pro の差分定義 |

新規アプリの場合: `PaywallView` がある画面と `SubscriptionManager` 相当のファイルを読んで、
Free と Pro の実際の差分を確認してからコピーを書く。

**禁止パターン（実在しないのに書く）:**
- ❌ "30-day insight reports" — 分析機能がなければ書くな
- ❌ "Progress tracking" — 進捗画面がなければ書くな
- ❌ "Premium support" — サポートチームがなければ書くな
- ❌ "All features unlocked" — 意味がない。何が解禁されるか具体的に書け

---

## 14 PHASES

### PHASE 0: TREND RESEARCH
```
x-research + tiktok-research + apify-trend-analysis スキルを並列実行

[x-research]
  X (Twitter) でバズってるキーワード・トレンドトピックを調査
  → 「今週 JP/EN でバズってるメンタル・健康・生産性系のキーワード TOP5」

[tiktok-research]
  TikTok で伸びているショート動画のテーマ・フック・視聴者の悩みを調査
  → 「今週バズってる動画のテーマ TOP5 + 共通するペイン」

[apify-trend-analysis]
  App Store カテゴリ別ランキング + Google Trends を調査
  → 「今上位に入っているアプリジャンル + 検索ボリューム増加中のトピック」

3つの結果を統合して判断:
  - 共通して出てくるテーマ = 今作るべきアプリのジャンル
  - アプリアイデアを1つに絞る（選択肢提示禁止。1つに決める）

OUTPUT → .cursor/app-factory/{slug}/01-trend.md
  - 決定したアプリアイデア（タイトル仮 + 一言説明）
  - 根拠（どのトレンドデータから判断したか）
  - slug（例: sleep-tracker、breath-calm 等）
```

### PHASE 0.5: SPEC 生成（SDD）
```
01-trend.md を読んで spec.md を自動生成する
スラッシュコマンド不要。以下の手順をそのまま実行する。

Step 1: spec.md の全フィールドを埋める（PHASE 1 の必須フィールドを全部）
  - app_name, bundle_id, version, output_dir
  - price_monthly_usd: 9.99, price_annual_usd: 49.99（デフォルト）
  - paywall.cta_text_en / paywall.cta_text_ja
  - metadata: title_en/ja, subtitle_en/ja, description_en/ja, keywords_en/ja
  - urls.privacy_en: "https://aniccaai.com/{slug}/privacy/en"
  - urls.privacy_ja: "https://aniccaai.com/{slug}/privacy/ja"
  - urls.terms: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
  - urls.landing: "https://aniccaai.com/{slug}"
  - localization: "os_language"
  - supported_locales: ["en", "ja"]
  - concept: （1行説明。スクショヘッドライン生成に使う）
  - 画面構成（Onboarding / Main / Paywall / Settings）

Step 2: plan.md を生成（技術設計）
  - アーキテクチャ（SwiftUI MVC）
  - ファイル構成
  - API / RevenueCat 設計

Step 3: tasks.md を生成（実装タスクリスト）
  - 依存順に並んだチェックボックス形式
  - PHASE 2〜12 の各フェーズに対応するタスクを網羅

OUTPUT →
  .cursor/app-factory/{slug}/02-spec.md   ← PHASE 1 が読む
  .cursor/app-factory/{slug}/03-plan.md
  .cursor/app-factory/{slug}/04-tasks.md
```

### PHASE 1: VALIDATE INPUT
```
spec.md の必須フィールド確認（全項目 MUST — 1つでも欠ければ STOP）

■ 技術
  - app_name, bundle_id, version, output_dir

■ 課金
  - price_monthly_usd, price_annual_usd
  - paywall.cta_text_en, paywall.cta_text_ja

■ App Store メタデータ（EN + JA 両方必須）
  - metadata.title_en, metadata.title_ja
  - metadata.subtitle_en, metadata.subtitle_ja
  - metadata.description_en, metadata.description_ja
  - metadata.keywords_en, metadata.keywords_ja

■ URL（アプリ専用 URL 必須 — 全アプリ共通 URL 禁止）
  - urls.privacy_en   例: "https://aniccaai.com/thankful/privacy/en"
  - urls.privacy_ja   例: "https://aniccaai.com/thankful/privacy/ja"
  - urls.terms        固定値: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
  - urls.landing      例: "https://aniccaai.com/thankful"

■ ローカライズ方針
  - localization: "os_language"  （日本語OS→日本語、その他→英語）
  - supported_locales: ["en", "ja"]

■ コンセプト
  - concept  （1行説明。スクショヘッドライン生成に使う）

欠けていれば STOP + 不足フィールドを報告
```

### PHASE 2: SCAFFOLD
```bash
# 新規 Xcode プロジェクトを output_dir に作成
mkdir -p <output_dir>/<app_name>ios
# Bundle ID / バージョン / チーム ID を project.pbxproj に設定
# RevenueCat SDK を SPM で追加
# PrivacyInfo.xcprivacy を追加（必須）
```

### PHASE 3: BUILD
```
ralph-autonomous-dev で SwiftUI 実装

■ 必須実装（1つでも欠ければ PHASE 11 で STOP）

  コア機能:
  - spec の画面構成・コア機能を実装
  - 通知: UserNotifications で APNs 登録 + 通知カタログ
  - Paywall: RevenueCat SDK のみ（Superwall 禁止）
  - Paywall の accessibilityIdentifier（必須 5要素）:
      paywall_plan_monthly / paywall_plan_yearly
      paywall_cta / paywall_skip / paywall_restore

  ローカライズ（OS言語対応 — 必須）:
  - Localizable.strings を EN + JA 両方作成
  - 表示言語は OS 言語に自動追従（Locale.current で判定）
  - 日本語 OS → 日本語 UI、その他 OS → 英語 UI
  - Paywall コピーも EN/JA 両対応（spec.md の paywall.cta_text_en/ja を使う）
  - ハードコード日本語・英語テキスト禁止。全て Localizable.strings 経由

  Settings 画面（必須）:
  - Privacy Policy リンク → spec.md の urls.privacy_en / urls.privacy_ja（OS言語で切替）
  - Terms of Use リンク → spec.md の urls.terms（Apple 標準 EULA 固定）
    URL: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

  ■ PHASE 9 スクショパイプラインの前提セットアップ（必須 — これがないと PHASE 9 Step 2 が動かない）

  1. ScreenshotTests.swift を作成
     ファイル: <output_dir>/<slug>UITests/ScreenshotTests.swift
     内容: XCUITest でアプリを起動し、各画面をスクロール・遷移してスクショを撮影するテストケース
     テストケース:
       - testScreenshot_Main   : メイン画面
       - testScreenshot_Streak : カレンダー/ストリーク画面（存在する場合）
       - testScreenshot_Paywall: Paywall 画面（paywall_skip で到達可能にすること）
     accessibilityIdentifier を使って各画面に確実に到達すること

  2. Makefile に generate-store-screenshots ターゲットを追加
     場所: <output_dir>/Makefile
     コマンド:
       generate-store-screenshots:
         xcodebuild test -project <app_name>.xcodeproj -scheme <app_name>UITests \
           -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16 Pro Max' \
           -resultBundlePath docs/screenshots/output.xcresult
         python3 docs/screenshots/scripts/extract_screenshots.py
         python3 docs/screenshots/scripts/process_screenshots.py

  3. extract_screenshots.py + process_screenshots.py を docs/screenshots/scripts/ に配置
     - extract_screenshots.py: xcresulttool で output.xcresult から PNG を抽出 → docs/screenshots/raw/
     - process_screenshots.py: PIL で 1290×2796 に合成（ヘッドラインを screenshots.yaml から読む）
     - screenshots.yaml: 各画面のヘッドライン + カラー設定

  ⚠️ これらのセットアップが完了してから PHASE 9 Step 2 に進む。スキップ禁止。
```

### PHASE 3.5: PRIVACY POLICY & LANDING PAGE デプロイ
```
aniccaai.com/{slug}/ のページを作成して Netlify にデプロイする
PHASE 4 の前に必須（URL が死んでいると ASC Privacy URL 設定が通らない）

■ 作成するページ（apps/landing/ に追加）

  1. aniccaai.com/{slug}/                    ← ランディングページ
     - アプリ名・コンセプト・App Store リンク
     - EN のみでよい（LP は英語）

  2. aniccaai.com/{slug}/privacy/en          ← Privacy Policy（英語）
     - アプリ名・収集するデータ・用途を記載
     - 既存 aniccaai.com/privacy を テンプレートとして流用し app_name を置換

  3. aniccaai.com/{slug}/privacy/ja          ← Privacy Policy（日本語）
     - 同上の日本語版

  4. aniccaai.com/{slug}/terms               ← Terms of Use
     - Apple 標準 EULA へリダイレクト
     - URL: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

■ デプロイ手順

  # 1. apps/landing/ にページファイルを作成（HTML or Markdown）
  # 2. dev ブランチに push → Netlify が自動デプロイ
  git add -A && git commit -m "feat: add {slug} landing + privacy pages" && git push origin dev

  # 3. URL が生きているか確認（PHASE 11 GATE 4 と同じチェック）
  curl -I "https://aniccaai.com/{slug}/privacy/en" | grep "200\|301"
  curl -I "https://aniccaai.com/{slug}/privacy/ja" | grep "200\|301"
  # 200 or 301 でなければ STOP + Netlify のビルドログを確認
```

### PHASE 4: ASC APP SETUP
```bash
asc apps create --bundle-id "<bundle_id>" --name "<app_name>" \
  --primary-locale en-US --sku "<sku>"

# Privacy Policy URL を en-US AND ja 両方に設定（片方だけでは submit 時にエラー）
# locale は必ず "ja"（"ja-JP" は ASC で無効）
APP_INFO_ID=$(asc apps info list --app "<APP_ID>" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

TOKEN=$(python3 -c "
import jwt,time,pathlib
key=pathlib.Path.home().joinpath('Downloads/AuthKey_D637C7RGFN.p8').read_text()
payload={'iss':'f53272d9-c12d-4d9d-811c-4eb658284e74','iat':int(time.time()),'exp':int(time.time())+1200,'aud':'appstoreconnect-v1'}
print(jwt.encode(payload,key,algorithm='ES256',headers={'kid':'D637C7RGFN','typ':'JWT'}))
")

# en-US Privacy URL
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.appstoreconnect.apple.com/v1/appInfoLocalizations/<EN_LOC_ID>" \
  -d '{"data":{"type":"appInfoLocalizations","id":"<EN_LOC_ID>","attributes":{"privacyPolicyUrl":"https://aniccaai.com/privacy"}}}'

# ja Privacy URL（locale = "ja" 確認必須）
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.appstoreconnect.apple.com/v1/appInfoLocalizations/<JA_LOC_ID>" \
  -d '{"data":{"type":"appInfoLocalizations","id":"<JA_LOC_ID>","attributes":{"privacyPolicyUrl":"https://aniccaai.com/privacy"}}}'

asc subscriptions groups create --app "<APP_ID>" --reference-name "Premium"

asc subscriptions create --group "<GROUP_ID>" --name "Monthly" \
  --product-id "<bundle_id>.premium.monthly" --period ONE_MONTH --level 2

asc subscriptions create --group "<GROUP_ID>" --name "Annual" \
  --product-id "<bundle_id>.premium.yearly" --period ONE_YEAR --level 1

# ★ availability を pricing の前に必ず設定（これなしでpricingは全件Apple 500エラー）
asc subscriptions availability set --id "<MONTHLY_ID>" \
  --available-in-new-territories --territory USA,JPN

asc subscriptions availability set --id "<ANNUAL_ID>" \
  --available-in-new-territories --territory USA,JPN
```

### PHASE 4.5: RC OFFERINGS SETUP（TestFlight 前に必須）
```
RC Dashboard → Thankful プロジェクト
  → Offerings → New Offering → identifier: "default"
  → Packages を追加:
      $rc_annual  → Apple Product ID: <bundle_id>.premium.yearly
      $rc_monthly → Apple Product ID: <bundle_id>.premium.monthly
  → Offering を Current に設定

確認: Offerings が "current" に設定されていること
未設定 = TestFlight で「Apple IAP key is invalid」エラー

IAP Key: AY9BT5R8NU（同一 Apple Developer アカウントで全アプリ共通、新規作成不要）
p8 file: ~/Downloads/AuthKey_AY9BT5R8NU.p8 を RC にアップロード済みであること確認
```

### PHASE 5: IAP PRICING ★最重要
```bash
# US 価格ポイント ID を取得してから scripts/add_prices.py を実行
python3 .claude/skills/mobileapp-builder/scripts/add_prices.py \
  --annual-sub "<ANNUAL_ID>" \
  --annual-pp "<ANNUAL_US_PP_ID>" \
  --monthly-sub "<MONTHLY_ID>" \
  --monthly-pp "<MONTHLY_US_PP_ID>"

# 確認（175 でなければ STOP）
asc subscriptions prices list --id "<MONTHLY_ID>" --paginate | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d['data']))"
```

詳細手順 → `references/iap-bible.md` の「価格ポイント ID の取得方法」

### PHASE 6: IAP LOCALIZATION
```bash
asc subscriptions localizations create --subscription-id "<MONTHLY_ID>" \
  --locale "en-US" --name "<app_name> Monthly" \
  --description "Unlock all features with monthly subscription."

asc subscriptions localizations create --subscription-id "<MONTHLY_ID>" \
  --locale "ja" --name "<app_name> 月額プラン" \
  --description "月額プランで全機能を解放します。"

# Annual も同様（en-US + ja）
```

### PHASE 7: IAP REVIEW SCREENSHOT

> **⚠️ CLI 罠（2026-02-24 実測）**
> - `asc subscriptions review-screenshots create --file` → **reserve（POST）しか実行しない。S3 PUT + commit は自分でやる必要がある。**
> - `asc subscriptions images create` → プロモーショナル広告用。絶対に使うな。
> - `xcrun simctl io <UDID> screenshot` で PNG 取得 → **必ず sips でリサイズ（Apple 推奨: 900×1956 JPEG）**

**ステップ 1: シミュレータでペイウォール画面を撮影**
```bash
# シミュレータ起動（既に起動済みなら不要）
xcrun simctl boot "<UDID>" || true

# アプリ起動 → Maestro MCP でペイウォール画面まで遷移
# （accessibilityIdentifier: paywall_skip でスキップボタンを経由して Paywall を表示）

# ★ リサイズ必須（スキップ禁止）
# simctl screenshot は実機解像度 (例: 1320×2868) で出力する
# Apple 推奨サイズは 900×1956 JPEG
xcrun simctl io "<UDID>" screenshot /tmp/paywall-review.png
sips -s format jpeg -z 1956 900 /tmp/paywall-review.png --out /tmp/paywall-review.jpg
```

**ステップ 2: Apple API 直接（3ステップ）— asc CLI は reserve のみ**

```python
# docs/screenshots/scripts/upload_iap_review_screenshot.py として保存して使う
import os, time, json, hashlib, base64, requests

KEY_ID    = "646Y27MJ8C"
ISSUER_ID = "f53272d9-c12d-4d9d-811c-4eb658284e74"
PRIVATE_KEY = open(os.path.expanduser("~/.asc/private_keys/AuthKey_646Y27MJ8C.p8")).read()

import jwt as pyjwt
token = pyjwt.encode(
    {"iss": ISSUER_ID, "iat": int(time.time()), "exp": int(time.time())+1200, "aud": "appstoreconnect-v1"},
    PRIVATE_KEY, algorithm="ES256", headers={"kid": KEY_ID}
)
if not isinstance(token, str): token = token.decode()

BASE_URL = "https://api.appstoreconnect.apple.com/v1"
HDRS = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ★ 対象サブスクリプション ID（Annual / Monthly）
SUBS = {
    "Monthly": "<MONTHLY_SUB_ID>",
    "Annual":  "<ANNUAL_SUB_ID>",
}
FILE = "/tmp/paywall-review.jpg"

with open(FILE, "rb") as f: raw = f.read()
md5 = base64.b64encode(hashlib.md5(raw).digest()).decode()

for label, sub_id in SUBS.items():
    # 1. Reserve
    resp = requests.post(f"{BASE_URL}/subscriptionAppStoreReviewScreenshots", headers=HDRS, json={
        "data": {"type": "subscriptionAppStoreReviewScreenshots",
                 "attributes": {"fileSize": len(raw), "fileName": "paywall-review.jpg"},
                 "relationships": {"subscription": {"data": {"type": "subscriptions", "id": sub_id}}}}
    })
    assert resp.status_code in (200,201), f"Reserve failed: {resp.text[:300]}"
    d = resp.json()["data"]
    shot_id = d["id"]

    # 2. PUT to S3
    for op in d["attributes"]["uploadOperations"]:
        hdrs = {h["name"]: h["value"] for h in op.get("requestHeaders", [])}
        put = requests.request(op["method"], op["url"], headers=hdrs,
                               data=raw[op["offset"]:op["offset"]+op["length"]])
        assert put.status_code in (200,201,204), f"PUT failed: {put.status_code}"

    # 3. Commit
    commit = requests.patch(f"{BASE_URL}/subscriptionAppStoreReviewScreenshots/{shot_id}", headers=HDRS, json={
        "data": {"type": "subscriptionAppStoreReviewScreenshots", "id": shot_id,
                 "attributes": {"uploaded": True, "sourceFileChecksum": md5}}
    })
    assert commit.status_code in (200,201), f"Commit failed: {commit.text[:300]}"
    print(f"✅ {label} ({sub_id}) → {shot_id}")
```

```bash
python3 docs/screenshots/scripts/upload_iap_review_screenshot.py
# 既存画像エラー → 先に削除
# asc subscriptions review-screenshots delete --id "<ID>" --confirm
```

### PHASE 8: IAP VALIDATE ★STOP GATE
```bash
# blocking=0 確認
asc validate subscriptions --app "<APP_ID>"
# blocking > 0 なら PHASE 5-7 に戻る

# READY_TO_SUBMIT 確認（両方必須）
asc subscriptions get --id "<MONTHLY_ID>"  # state = READY_TO_SUBMIT ?
asc subscriptions get --id "<ANNUAL_ID>"   # state = READY_TO_SUBMIT ?
# どちらかが MISSING_METADATA なら絶対に次に進まない
```

### PHASE 9: APP ASSETS

#### Step 1: アイコン生成（`app-icon` スキルを使う）

**スキル:** `code-with-beto/skills@app-icon`（インストール: `npx skills add code-with-beto/skills@app-icon -g -y`）

```bash
# Step 1-A: SnapAI の設定確認（OpenAI key が必要）
npx snapai config --show
# → "Not configured" ならユーザーに OpenAI key を要求して設定:
#   npx snapai config --openai-api-key sk-xxxxxxxx

# Step 1-B: SnapAI で 1024×1024 PNG を生成（透過背景）
npx snapai icon \
  --prompt "<app_name> iOS app icon. Minimalist design. <concept_1_line>. Central symbol fills 70% of canvas. No text. Premium, App Store ready." \
  --background transparent \
  --output-format png \
  --style minimalism \
  --quality high
# → ./assets/icon-[timestamp].png に保存される
# ⚠️ 重要: SnapAI は --background transparent を指定しても白背景で出力する。
#   プロンプトで "gradient background" を指定しても無視される。
#   必ず Step 1-C で ImageMagick を使って背景を追加する。

# ⛔ SnapAI 未設定の場合はここで停止。フォールバックなし。
# → ユーザーに「OpenAI API key が必要です: npx snapai config --openai-api-key sk-xxxx」と伝える

# Step 1-C: ImageMagick でグラデーション背景を追加（必須 — App Store は透過NG）
# brew install imagemagick  # 未インストールの場合
ICON_SRC="./assets/icon-[timestamp].png"

# 1. 白背景をアルファ透過に変換
convert "$ICON_SRC" -fuzz 5% -transparent white /tmp/icon-transparent.png

# 2. グラデーション背景を作成してアイコンと合成
convert -size 1024x1024 \
  gradient:"#F5A623-#E8563A" \
  /tmp/icon-transparent.png \
  -compose over -composite \
  /tmp/icon-final.png

# 3. 結果をユーザーに見せて確認（必須 — OKが出るまで色変更して繰り返す）
open /tmp/icon-final.png

# Step 1-D: Xcode xcassets に配置（Swift/Xcode プロジェクト用）
cp /tmp/icon-final.png \
  <output_dir>/<app_name>ios/<app_name>/Assets.xcassets/AppIcon.appiconset/icon.png
# ※ Contents.json の "filename": "icon.png" と一致していること確認
```

**注意: app-icon スキルは本来 Expo 向け（Step 4 以降の iOS 26 .icon フォルダ / app.json は Swift/Xcode では不要）。PNG 生成（Step 3）だけを使う。**

#### Step 2: スクショ生成（screenshot-creator スキル）

→ `.claude/skills/screenshot-creator/SKILL.md` を読んで Step 1〜7 を実行する
  （A/B テストではなく新規生成のため、screenshot-ab の PHASE 1/2 はスキップ）

```
[EN スクショ]
1. screenshot-creator Step 1: ヒアリング（アプリ名・機能・ターゲット・言語=英語）

2. screenshot-creator Step 2〜3: スタイルガイド取得 + 英語コピー作成
   出力: screen1/2/3 の英語キャプション（採点 8/10 以上で確定）

3. screenshot-creator Step 4: Pencil .pen ファイルにデザイン構築
   raw スクリーンショット確認: docs/screenshots/raw/screen1~3.png が存在するか
   なければ: make capture-only で XCUITest 撮影のみ実行

4. screenshot-creator Step 5〜6: spec-validator（10項目 PASS）→ quality-reviewer（7/10+）

5. screenshot-creator Step 7: pencil_export.py 実行
   python3 docs/screenshots/scripts/pencil_export.py
   出力確認: docs/screenshots/processed/screen1~3.png

6. Slack 承認（slack-approval スキル）:
   → .claude/skills/slack-approval/SKILL.md を読んで requestApproval() を実行
   → title: "📸 App Store スクリーンショット確認 [EN]"
   → approved → Step 7 へ / denied → Step 1 から再実行

⚠️ ハードゲート（絶対ルール）:
   processed/ の画像を開いて、ヘッドラインテキストが入っているか目視確認する。
   ヘッドラインなし → ASC アップロード禁止。Step 1 から再実行。

[JA スクショ]
7. screenshot-creator Step 1〜7 を日本語コピーで再実行
   出力: docs/screenshots/processed/screen1~3.png（JA 版で上書き）

8. Slack 承認（slack-approval スキル）:
   → title: "📸 App Store スクリーンショット確認 [JA]"
   → approved → ASC アップロードへ / denied → Step 7 から再実行

⚠️ ハードゲート（JA も同じ）:
   processed/ の画像を開いて日本語ヘッドラインが入っているか確認。
   入っていない場合は ASC アップロード禁止。
```

#### Step 3: ASC アップロード（EN + JA）

**⚠️ リサイズ必須（スキップ禁止）**
`pencil_export.py` の出力は 780×1688。App Store は **1290×2796** を要求する。

```bash
# ★ リサイズ（必須 — これなしでアップロードすると "invalid screenshot dimensions" で却下）
mkdir -p docs/screenshots/resized/en-US docs/screenshots/resized/ja

for i in 1 2 3; do
  sips -z 2796 1290 docs/screenshots/processed/en/screen${i}.png \
    --out docs/screenshots/resized/en-US/screen${i}.png
  sips -z 2796 1290 docs/screenshots/processed/ja/screen${i}.png \
    --out docs/screenshots/resized/ja/screen${i}.png
done

# EN スクショ（locale: en-US）
asc screenshots upload --app-id "<APP_ID>" --locale en-US \
  --files docs/screenshots/resized/en-US/screen1.png \
          docs/screenshots/resized/en-US/screen2.png \
          docs/screenshots/resized/en-US/screen3.png

# JA スクショ（locale: ja）
asc screenshots upload --app-id "<APP_ID>" --locale ja \
  --files docs/screenshots/resized/ja/screen1.png \
          docs/screenshots/resized/ja/screen2.png \
          docs/screenshots/resized/ja/screen3.png
```

**注意:** `asc screenshots upload` は version localization（初回提出時）用。PPO Treatment localization に使う場合は `screenshot-ab` スキルの Step 7-3 を参照（Apple API 直接呼び出しが必要）。

#### Step 4: App Store メタデータ入力
```bash
# EN メタデータ
asc metadata update --app "<APP_ID>" --locale en-US \
  --title "<metadata.title_en>" \
  --subtitle "<metadata.subtitle_en>" \
  --description "<metadata.description_en>" \
  --keywords "<metadata.keywords_en>"

# JA メタデータ（locale は必ず "ja"。"ja-JP" は無効）
asc metadata update --app "<APP_ID>" --locale ja \
  --title "<metadata.title_ja>" \
  --subtitle "<metadata.subtitle_ja>" \
  --description "<metadata.description_ja>" \
  --keywords "<metadata.keywords_ja>"
```

### PHASE 10: BUILD & UPLOAD
```bash
cd <output_dir>/<app_name>ios
FASTLANE_SKIP_UPDATE_CHECK=1 fastlane set_version version:<version>
FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 fastlane release
# processingState = VALID になるまで待機

# ★ 必須: TestFlight ベータグループに配布（この手順を省くとテスターがビルドを見れない）
# ビルドIDを取得
BUILD_ID=$(asc builds list --app "<APP_ID>" --sort -uploadedDate --limit 1 | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

# 全ベータグループのIDを取得して追加
asc beta-groups list --app "<APP_ID>" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);[print(g['id']) for g in d['data']]" | \
  xargs -I{} asc builds add-groups --build "$BUILD_ID" --group {}
# → "Successfully added 1 group(s)" が各グループ分出ればOK
```

### PHASE 11: PREFLIGHT GATE
```bash
# GATE 1: Greenlight
greenlight preflight <app_dir>  # CRITICAL = 0 でなければ STOP

# GATE 2: IAP（D6-D10）
# D6: prices 175件 / D7: screenshot 存在 / D8: en-US localization
# D9: READY_TO_SUBMIT / D10: validate blocking=0
asc validate subscriptions --app "<APP_ID>"

# GATE 3: コード品質チェック（自動）
grep -r "Lorem\|lorem\|placeholder\|TODO\|FIXME" <app_dir>/Sources/ && echo "FAIL" || echo "PASS"

# GATE 4: 外部リンク生死確認（自動）
curl -I "<urls.privacy_en>" -o /dev/null -s -w "%{http_code}" | grep -q "200\|301\|302" || echo "FAIL: privacy_en URL dead"
curl -I "<urls.privacy_ja>" -o /dev/null -s -w "%{http_code}" | grep -q "200\|301\|302" || echo "FAIL: privacy_ja URL dead"
curl -I "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" -o /dev/null -s -w "%{http_code}" | grep -q "200" || echo "FAIL: EULA URL dead"

# GATE 5: スクショ確認（自動）
asc screenshots list --app "<APP_ID>" --locale en-US | python3 -c "import sys,json;d=json.load(sys.stdin);print('PASS' if len(d['data'])>=3 else 'FAIL: EN screenshots <3')"
asc screenshots list --app "<APP_ID>" --locale ja | python3 -c "import sys,json;d=json.load(sys.stdin);print('PASS' if len(d['data'])>=3 else 'FAIL: JA screenshots <3')"

# GATE 1〜5 全て PASS でなければ STOP。1つでも FAIL → 修正して再実行
```

### PHASE 12: SUBMIT
```bash
VERSION_ID=$(asc versions list --app "<APP_ID>" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

BUILD_ID=$(asc builds list --app "<APP_ID>" --sort -uploadedDate --limit 1 | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

asc submit create --app "<APP_ID>" \
  --version-id "$VERSION_ID" --build "$BUILD_ID" --confirm

# 確認: state = WAITING_FOR_REVIEW ✅
asc review submissions-list --app "<APP_ID>"
```

---

## 参照ファイル

| ファイル | いつ読む |
|---------|---------|
| `references/iap-bible.md` | PHASE 4-8 の詳細手順・価格ポイント取得方法 |
| `references/spec-template.md` | PHASE 1 の INPUT 確認 |
| `references/submission-checklist.md` | PHASE 11 のゲートチェック全項目 |
| `scripts/add_prices.py` | PHASE 5 の価格設定実行 |
