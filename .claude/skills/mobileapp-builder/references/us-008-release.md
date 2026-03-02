### PHASE 5: IAP PRICING ★最重要
```bash
# US 価格ポイント ID を取得してから scripts/add_prices.py を実行
python3 ~/.claude/skills/mobileapp-builder/scripts/add_prices.py \
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

> **⚠️ 絶対ルール（2026-02-24 実機検証済み）**
>
> | ルール | 理由 |
> |--------|------|
> | **リサイズ禁止** | `900×1956` 等の任意リサイズ → Apple「寸法が正しくありません」エラーで即拒否 |
> | **ネイティブ解像度をそのまま使う** | iPhone 16 Pro Max シミュレータ = **1320×2868**。これが Apple 標準サイズ |
> | **JPEG変換のみ** | `sips -s format jpeg`（`-z` フラグ使用禁止） |
> | **CLI が full upload** | `asc subscriptions review-screenshots create --file` = reserve+PUT+commit を内部で全実行 |
> | **width=0 は正常** | upload 直後は常に `imageAsset.width=0`。Apple 非同期処理中。再アップロード不要 |
> | **`asc subscriptions images create` は使わない** | プロモーショナル広告用。IAP review screenshot とは別物 |

**ステップ 1: Booted シミュレータの UDID を取得**
```bash
xcrun simctl list devices | grep Booted
# 例: iPhone 16 Pro Max (AF68C54D-D527-4A19-B4D1-5DEF182D8DE5) (Booted)
# UDID をメモする
```

**ステップ 2: Maestro MCP でアプリを起動しペイウォール画面まで遷移**

Maestro MCP（`mcp__maestro__launch_app` + `mcp__maestro__run_flow`）を使う。
CLI（`maestro test`）は禁止。MCP 経由のみ。

```
# 2-1. アプリ起動
mcp__maestro__launch_app(device_id="<UDID>", appId="<BUNDLE_ID>")

# 2-2. オンボーディング → ペイウォールまで遷移（順番通りに実行）
# Anicca の場合の実証済みフロー:
mcp__maestro__run_flow(device_id="<UDID>", flow_yaml="""
appId: <BUNDLE_ID>
---
- tapOn:
    id: "onboarding-welcome-cta"
""")

# 苦しみ選択画面: 何か1つ選んで「次へ」
mcp__maestro__run_flow(device_id="<UDID>", flow_yaml="""
appId: <BUNDLE_ID>
---
- tapOn: "夜更かし"
- waitForAnimationToEnd
- tapOn: "次へ"
""")

# ライブデモ画面: primary action をタップ
mcp__maestro__run_flow(device_id="<UDID>", flow_yaml="""
appId: <BUNDLE_ID>
---
- tapOn:
    id: "nudge-primary-action"
- waitForAnimationToEnd
""")

# 通知許可画面: 許可ボタンをタップ → ペイウォール表示
mcp__maestro__run_flow(device_id="<UDID>", flow_yaml="""
appId: <BUNDLE_ID>
---
- tapOn:
    id: "onboarding-notifications-allow"
- waitForAnimationToEnd
""")
```

別アプリで画面構成が異なる場合は `mcp__maestro__inspect_view_hierarchy` でペイウォール画面の要素を確認してから遷移する。

**ステップ 3: ペイウォール画面のスクリーンショットを撮影 → JPEG変換**
```bash
# PNG 撮影（ネイティブ解像度: iPhone 16 Pro Max = 1320×2868）
xcrun simctl io "<UDID>" screenshot /tmp/paywall-review.png

# JPEG変換のみ（-z リサイズフラグは絶対に使わない）
sips -s format jpeg /tmp/paywall-review.png --out /tmp/paywall-review.jpg

# サイズ確認（1320×2868 であることを確認）
identify /tmp/paywall-review.jpg 2>/dev/null || sips -g pixelWidth -g pixelHeight /tmp/paywall-review.jpg
```

**ステップ 4: Monthly と Annual 両方にアップロード**
```bash
# Monthly
asc subscriptions review-screenshots create \
  --subscription-id "<MONTHLY_SUB_ID>" \
  --file /tmp/paywall-review.jpg

# Annual
asc subscriptions review-screenshots create \
  --subscription-id "<ANNUAL_SUB_ID>" \
  --file /tmp/paywall-review.jpg

# 成功判定: JSON レスポンスに fileSize > 0 があれば OK
# width=0, height=0 は正常（Apple が非同期で処理中）
```

**エラーハンドリング**

| エラー | 原因 | 対処 |
|--------|------|------|
| `寸法が正しくありません` | リサイズした | 削除して正しいサイズで再アップロード |
| `Screenshot already exists` | 既に存在する | 既存を削除してから再アップロード |
| `Element not found` (Maestro) | 画面遷移が違う | `inspect_view_hierarchy` で現在の画面を確認 |

```bash
# 既存削除（"already exists" 時）
# まず既存 ID を取得
python3 -c "
import os, time, json, requests
import jwt as pyjwt
KEY_ID='<KEY_ID>'; ISSUER_ID='<ISSUER_ID>'
PRIVATE_KEY=open(os.path.expanduser('~/.asc/private_keys/AuthKey_<KEY_ID>.p8')).read()
payload={'iss':ISSUER_ID,'iat':int(time.time()),'exp':int(time.time())+1200,'aud':'appstoreconnect-v1'}
token=pyjwt.encode(payload,PRIVATE_KEY,algorithm='ES256',headers={'kid':KEY_ID})
h={'Authorization':f'Bearer {token}','Content-Type':'application/json'}
r=requests.get('https://api.appstoreconnect.apple.com/v1/subscriptions/<SUB_ID>/appStoreReviewScreenshot',headers=h)
print(r.json()['data']['id'])
"
# → ID を取得したら削除
asc subscriptions review-screenshots delete --id "<EXISTING_ID>" --confirm
# その後 ステップ 4 を再実行
```

### PHASE 8: IAP VALIDATE ★STOP GATE
```bash
asc validate subscriptions --app "<APP_ID>"
# blocking > 0 なら PHASE 5-7 に戻る
# warnings > 0 なら STOP（「Submit this subscription for review」が出たら提出禁止）
# blocking=0 かつ warnings=0 になって初めて次に進む
# 2026-03-01: warnings チェック追加（Thankful Guideline 2.1 の根本原因）

# READY_TO_SUBMIT 確認（両方必須）
asc subscriptions get --id "<MONTHLY_ID>"  # state = READY_TO_SUBMIT ?
asc subscriptions get --id "<ANNUAL_ID>"   # state = READY_TO_SUBMIT ?
# どちらかが MISSING_METADATA または warnings あり → STOP
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
magick "$ICON_SRC" -fuzz 5% -transparent white /tmp/icon-transparent.png

# 2. グラデーション背景を作成してアイコンと合成
magick -size 1024x1024 \
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

→ `.claude/skills/screenshot-creator/SKILL.md` を読んで Step 0〜7 を実行する
  （A/B テストではなく新規生成のため、screenshot-ab の PHASE 1/2 はスキップ）

**⚠️ Pencil 設計の絶対ルール（違反 = テキスト崩れ / 画像表示バグ）:**

| ルール | 理由 |
|--------|------|
| テキストノードに必ず `width: "fill_container"` | 未設定だとフレーム外にはみ出す |
| 日本語ヘッドラインは `fontSize: 22` 以下 | 28px × 14文字でオーバーフロー確認済み |
| 親フレームに `layout: "vertical"` を明記 | 省略すると CaptionArea/MockupArea が横並びになる |
| 画像差し替えは**必ず新しいファイル名** | 同じパスの上書きはPencilキャッシュで反映されない |
| `get_screenshot` = MCP base64のみ（ファイル保存されない） | ASC用ファイルはシミュレータ撮影で別途取得 |

```
[シミュレータ準備（Dynamic Island 除去）]
0. iPhone SE 3rd gen を使う（Dynamic Island/ノッチなし）
   UDID: xcrun simctl list devices | grep "SE (3rd"
   → CBA51D41-D404-4843-AA18-738C5068FFE4 等

   iPhone 14+ を使う場合、Dynamic Island 除去が必要:
   xcrun simctl io "<UDID>" screenshot /tmp/screen_raw.png
   python3 -c "
   from PIL import Image
   img = Image.open('/tmp/screen_raw.png')
   crop = img.crop((0, 185, img.width, img.height))
   crop.save('/tmp/screen_home_v2.png')  # ★新しいファイル名で保存
   "

[EN スクショ]
1. screenshot-creator Step 1: ヒアリング（アプリ名・機能・ターゲット・言語=英語）

2. screenshot-creator Step 2〜3: スタイルガイド取得 + 英語コピー作成
   出力: screen1/2/3 の英語キャプション（採点 8/10 以上で確定）

3. screenshot-creator Step 4: Pencil .pen ファイルにデザイン構築
   raw スクリーンショット確認: docs/screenshots/raw/screen1~3.png が存在するか
   なければ: make capture-only で XCUITest 撮影のみ実行

4. screenshot-creator Step 5〜6: spec-validator（10項目 PASS）→ quality-reviewer（7/10+）

5. screenshot-creator Step 7: PNG 書き出し

   **⚠️ ファイル保存パス絶対ルール（2026-02-24 確定）**

   | 禁止 | 正しいパス |
   |------|-----------|
   | `/tmp/screen1.png` など `/tmp/` 以下 | 禁止。再起動で消える |
   | Node.js スクリプト自作 | 禁止 |
   | HTTP API 直接叩く | 禁止 |

   **正しいパス（プロジェクト内に必ず保存）:**
   ```
   {output_dir}/docs/screenshots/raw/screen1~3.png       ← シミュレータ生PNG（iPhone SE推奨）
   {output_dir}/docs/screenshots/processed/screen1~3.png ← Pencil合成済み
   {output_dir}/docs/screenshots/resized/screen1~3.png   ← ASCアップロード用（1290×2796）
   ```

   **ASC アップロード用ファイルの確保手順（get_screenshot ではなく以下を使う）:**
   ```bash
   # 1. シミュレータから直接 PNG を取得
   xcrun simctl io "<SE_UDID>" screenshot docs/screenshots/raw/screen1.png

   # 2. PIL で DI クロップ（iPhone SE は不要）
   # python3 -c "from PIL import Image; img=Image.open('raw/screen1.png'); img.crop((0,185,img.width,img.height)).save('processed/screen1.png')"

   # 3. App Store 必須サイズにリサイズ
   sips -z 2796 1290 docs/screenshots/processed/screen1.png \
     --out docs/screenshots/resized/en-US/screen1.png
   ```

   出力確認: docs/screenshots/resized/en-US/screen1~3.png（プロジェクト内）

6. Slack 承認（slack-approval スキル）:
   → .claude/skills/slack-approval/SKILL.md を読んで requestApproval() を実行
   → title: "📸 App Store スクリーンショット確認 [EN]"
   → approved → Step 7 へ / denied → Step 1 から再実行

⚠️ ハードゲート（絶対ルール）:
   processed/ の画像を open コマンドで実際に開いて、ヘッドラインテキストが入っているか目視確認する。
   ヘッドラインなし → ASC アップロード禁止。Step 1 から再実行。

[JA スクショ]
7. screenshot-creator Step 1〜7 を日本語コピーで再実行
   出力: docs/screenshots/resized/ja/screen1~3.png（JA 版）

8. Slack 承認（slack-approval スキル）:
   → title: "📸 App Store スクリーンショット確認 [JA]"
   → approved → ASC アップロードへ / denied → Step 7 から再実行

⚠️ ハードゲート（JA も同じ）:
   resized/ja/ の画像を open コマンドで実際に開いて日本語ヘッドラインが入っているか確認。
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

#### Step 3b: iPad 13" スクショアップロード（Submit に必須 — 2026-02-28 実機確認）

**⚠️ iPad スクショなしでは `asc submit create` が失敗する。必ずアップロードする。**

```bash
# ⚠️ 正しいサイズ: 2048×2732（2064×2752 は IMAGE_INCORRECT_DIMENSIONS エラーで拒否される）
TOKEN=$(python3 -c "
import jwt,time,os,pathlib
key=pathlib.Path(os.path.expanduser(os.environ['ASC_KEY_PATH'])).read_text()
payload={'iss':os.environ['ASC_ISSUER_ID'],'iat':int(time.time()),'exp':int(time.time())+1200,'aud':'appstoreconnect-v1'}
print(jwt.encode(payload,key,algorithm='ES256',headers={'kid':os.environ['ASC_KEY_ID'],'typ':'JWT'}))
")

VERSION_ID=$(asc versions list --app "<APP_ID>" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

EN_LOC_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.appstoreconnect.apple.com/v1/appStoreVersions/$VERSION_ID/appStoreVersionLocalizations" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);[print(x['id']) for x in d['data'] if x['attributes']['locale']=='en-US']")

JA_LOC_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.appstoreconnect.apple.com/v1/appStoreVersions/$VERSION_ID/appStoreVersionLocalizations" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);[print(x['id']) for x in d['data'] if x['attributes']['locale']=='ja']")

# iPhone 6.7" スクショを iPad サイズ（2048×2732）にリサイズ
mkdir -p /tmp/ipad/en-US /tmp/ipad/ja

for i in 1 2 3; do
  sips -z 2732 2048 docs/screenshots/resized/en-US/screen${i}.png \
    --out /tmp/ipad/en-US/screen${i}.png
  sips -z 2732 2048 docs/screenshots/resized/ja/screen${i}.png \
    --out /tmp/ipad/ja/screen${i}.png
done

# EN iPad アップロード
asc screenshots upload \
  --version-localization "$EN_LOC_ID" \
  --display-type APP_IPAD_PRO_3GEN_129 \
  --files /tmp/ipad/en-US/screen1.png \
          /tmp/ipad/en-US/screen2.png \
          /tmp/ipad/en-US/screen3.png

# JA iPad アップロード
asc screenshots upload \
  --version-localization "$JA_LOC_ID" \
  --display-type APP_IPAD_PRO_3GEN_129 \
  --files /tmp/ipad/ja/screen1.png \
          /tmp/ipad/ja/screen2.png \
          /tmp/ipad/ja/screen3.png

# 確認（3件 APP_IPAD_PRO_3GEN_129 が出ればOK）
asc screenshots list --version-localization "$EN_LOC_ID" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);[print(x['attributes']['screenshotDisplayType']) for x in d['data']]"
```

#### Step 4: App Store メタデータ入力
```bash
# VERSION_ID を取得
VERSION_ID=$(asc versions list --app "<APP_ID>" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

# localizations ディレクトリに .strings ファイルを作成
mkdir -p /tmp/locs/en-US /tmp/locs/ja

# EN metadata
cat > /tmp/locs/en-US/description.txt << 'EOF'
<metadata.description_en>

Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
EOF

cat > /tmp/locs/en-US/keywords.txt << 'EOF'
<metadata.keywords_en>
EOF

cat > /tmp/locs/en-US/title.txt << 'EOF'
<metadata.title_en>
EOF

cat > /tmp/locs/en-US/subtitle.txt << 'EOF'
<metadata.subtitle_en>
EOF

# JA metadata（locale は "ja"。"ja-JP" は無効）
cat > /tmp/locs/ja/description.txt << 'EOF'
<metadata.description_ja>

利用規約: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
EOF

cat > /tmp/locs/ja/keywords.txt << 'EOF'
<metadata.keywords_ja>
EOF

cat > /tmp/locs/ja/title.txt << 'EOF'
<metadata.title_ja>
EOF

cat > /tmp/locs/ja/subtitle.txt << 'EOF'
<metadata.subtitle_ja>
EOF

# upload（App Description に Terms URL が含まれる — Guideline 3.1.2 対応）
asc localizations upload --version "$VERSION_ID" --path /tmp/locs
```

**⚠️ Guideline 3.1.2（2026-02-25 実機確認）:**
- App Description に Terms URL を必ず含める
- アプリ内（Settings 画面）に Terms + Privacy リンクがあれば Paywall には不要
- `asc localizations upload` で CLI から直接更新できる（手動不要）

#### Step 5: copyright + content rights + app pricing 設定（Submit に必須 — 2026-02-28 実機確認）

**⚠️ 3つ全て未設定だと `asc submit create` が `App is not eligible for submission` で失敗する。**

```bash
TOKEN=$(python3 -c "
import jwt,time,os,pathlib
key=pathlib.Path(os.path.expanduser(os.environ['ASC_KEY_PATH'])).read_text()
payload={'iss':os.environ['ASC_ISSUER_ID'],'iat':int(time.time()),'exp':int(time.time())+1200,'aud':'appstoreconnect-v1'}
print(jwt.encode(payload,key,algorithm='ES256',headers={'kid':os.environ['ASC_KEY_ID'],'typ':'JWT'}))
")

VERSION_ID=$(asc versions list --app "<APP_ID>" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

# 1. copyright（著作権）
asc versions update --version-id "$VERSION_ID" --copyright "2025 <Your Name>"
# 確認
asc versions get --version-id "$VERSION_ID" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data']['attributes'].get('copyright','NOT SET'))"

# 2. content rights（コンテンツ配信権 — サードパーティコンテンツなし）
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.appstoreconnect.apple.com/v1/appStoreVersions/$VERSION_ID" \
  -d "{\"data\":{\"type\":\"appStoreVersions\",\"id\":\"$VERSION_ID\",\"attributes\":{\"contentRightsDeclaration\":\"DOES_NOT_USE_THIRD_PARTY_CONTENT\"}}}" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('data',{}).get('attributes',{}).get('contentRightsDeclaration','ERROR'))"
# → DOES_NOT_USE_THIRD_PARTY_CONTENT ✅

# 3. app pricing（無料アプリの場合）
# まず既存の価格設定を確認
asc apps prices list --app "<APP_ID>" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print('設定済み:', len(d['data']), '件' if d['data'] else '未設定')"

# 未設定（0件）の場合のみ実行
FREE_PP_ID=$(curl -s \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.appstoreconnect.apple.com/v1/appPriceTiers/0/pricePoints?filter[territory]=USA" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.appstoreconnect.apple.com/v1/appPriceSchedules" \
  -d "{\"data\":{\"type\":\"appPriceSchedules\",\"attributes\":{},\"relationships\":{\"app\":{\"data\":{\"type\":\"apps\",\"id\":\"<APP_ID>\"}},\"baseTerritory\":{\"data\":{\"type\":\"territories\",\"id\":\"USA\"}},\"manualPrices\":{\"data\":[{\"type\":\"appPrices\",\"id\":\"freePrice\"}]}},\"included\":[{\"type\":\"appPrices\",\"id\":\"freePrice\",\"attributes\":{\"customerPrice\":\"0\",\"proceeds\":\"0\"},\"relationships\":{\"appPricePoint\":{\"data\":{\"type\":\"appPricePoints\",\"id\":\"$FREE_PP_ID\"}}}}]}}" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(json.dumps(d,ensure_ascii=False)[:200])"
```

#### Step 6: usesIdfa 設定（CRITICAL — 未設定で INVALID_BINARY — 2026-02-28 実機確認）

**⚠️ `usesIdfa: None`（未設定）のまま提出すると Apple の自動バイナリ検証で `INVALID_BINARY` になる。**
**必ず Step 5 の直後に実行する。**

```bash
TOKEN=$(python3 -c "
import jwt,time,os,pathlib
key=pathlib.Path(os.path.expanduser(os.environ['ASC_KEY_PATH'])).read_text()
payload={'iss':os.environ['ASC_ISSUER_ID'],'iat':int(time.time()),'exp':int(time.time())+1200,'aud':'appstoreconnect-v1'}
print(jwt.encode(payload,key,algorithm='ES256',headers={'kid':os.environ['ASC_KEY_ID'],'typ':'JWT'}))
")

VERSION_ID=$(asc versions list --app "<APP_ID>" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

# usesIdfa を false に設定（IDFA を使わないアプリは false 固定）
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.appstoreconnect.apple.com/v1/appStoreVersions/$VERSION_ID" \
  -d "{\"data\":{\"type\":\"appStoreVersions\",\"id\":\"$VERSION_ID\",\"attributes\":{\"usesIdfa\":false}}}" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print('usesIdfa:', d.get('data',{}).get('attributes',{}).get('usesIdfa','ERROR'))"
# → usesIdfa: False ✅

# 確認: appStoreState が READY_FOR_REVIEW になっていること
asc versions get --version-id "$VERSION_ID" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data']['attributes']['appStoreState'])"
# → READY_FOR_SUBMISSION または PREPARE_FOR_SUBMISSION ✅（INVALID_BINARY でなければOK）
```

**注意:**
- IDFA（IDentifier for Advertisers）を使うアプリは `usesIdfa: true` + 用途申告が必要
- 通常のアプリ（RevenueCat + Mixpanel のみ）は `false` で問題ない
- この設定は提出後に変更不可。変更が必要な場合は再ビルド・再提出が必要

### PHASE 10: BUILD & UPLOAD
```bash
cd <output_dir>/<app_name>ios

# Step 1: Fastlane gym でビルド + IPA 生成（gym = xcodebuild のラッパー。署名/export を自動処理）
FASTLANE_SKIP_UPDATE_CHECK=1 fastlane set_version version:<version>
FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 \
  fastlane gym --scheme "<app_name>" --export_method app-store --output_directory ./build
# → ./build/<app_name>.ipa が生成される

# Step 2: ASC CLI でアップロード + バージョン作成（fastlane deliver/pilot は使わない）
asc publish appstore \
  --app "$APP_ID" \
  --ipa "./build/<app_name>.ipa" \
  --version "<version>" \
  --wait \
  --poll-interval 30s
# → processingState = VALID になるまで自動待機

# Step 3: TestFlight ベータグループに配布
BUILD_ID=$(asc builds list --app "$APP_ID" --sort -uploadedDate --limit 1 --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

asc beta-groups list --app "$APP_ID" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);[print(g['id']) for g in d['data']]" | \
  xargs -I{} asc builds add-groups --build "$BUILD_ID" --group {}
# → "Successfully added 1 group(s)" が各グループ分出ればOK
```

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑 STOP 2 — TestFlight テスト（PHASE 10 完了）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TestFlight にビルドをプッシュ済み。テスターを招待してテストしてください:
  1. TestFlight アプリから {app_name} を入手
  2. 動作・Paywall・購入フローを確認
  3. 問題なければ「OK」と入力 → PHASE 11 に進む
     修正が必要な場合はフィードバックを入力 → PHASE 3 から再実行
slack-approval スキルで承認待ち:
  title: "🧪 TestFlight 確認 — {app_name} v{version}"
  → ✅ 承認 → PHASE 11 に進む
  → ❌ 拒否 → フィードバックを元に修正 → PHASE 3 から再実行
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### PHASE 11: PREFLIGHT GATE
```bash
# GATE 1: Greenlight
greenlight preflight <app_dir>  # CRITICAL = 0 でなければ STOP

# GATE 2: IAP（D6-D10）
# D6: prices 175件 / D7: screenshot 存在 / D8: en-US localization
# D9: READY_TO_SUBMIT / D10: validate blocking=0
asc validate subscriptions --app "$APP_ID"

# GATE 3: ASC Validate（メタデータ/ビルド/価格/スクショ/年齢レーティングの API レベル検証 — ASC CLI 0.34.0 新機能）
asc validate --app "$APP_ID" --version "<version>" --strict
# → blocking issues があれば STOP。メタデータ長/必須フィールド/カテゴリ/ビルド添付/価格/スクショ互換性を検証
asc validate iap --app "$APP_ID"
# → IAP のレビュー準備状況を検証

# GATE 4: コード品質チェック（自動）
grep -r "Lorem\|lorem\|placeholder\|TODO\|FIXME" <app_dir>/Sources/ && echo "FAIL" || echo "PASS"

# GATE 5: 外部リンク生死確認（自動）
curl -I "<urls.privacy_en>" -o /dev/null -s -w "%{http_code}" | grep -q "200\|301\|302" || echo "FAIL: privacy_en URL dead"
curl -I "<urls.privacy_ja>" -o /dev/null -s -w "%{http_code}" | grep -q "200\|301\|302" || echo "FAIL: privacy_ja URL dead"
curl -I "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" -o /dev/null -s -w "%{http_code}" | grep -q "200" || echo "FAIL: EULA URL dead"

# GATE 6: スクショ確認（iPhone 6.7" + iPad 13" 両方必須 — 2026-02-28 実機確認）
VERSION_ID_GATE=$(asc versions list --app "$APP_ID" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")
TOKEN_GATE=$(python3 -c "
import jwt,time,os,pathlib
key=pathlib.Path(os.path.expanduser(os.environ['ASC_KEY_PATH'])).read_text()
payload={'iss':os.environ['ASC_ISSUER_ID'],'iat':int(time.time()),'exp':int(time.time())+1200,'aud':'appstoreconnect-v1'}
print(jwt.encode(payload,key,algorithm='ES256',headers={'kid':os.environ['ASC_KEY_ID'],'typ':'JWT'}))
")
# iPhone 6.7" スクショ確認
asc screenshots list --app "$APP_ID" --locale en-US | python3 -c "import sys,json;d=json.load(sys.stdin);print('PASS' if len(d['data'])>=3 else 'FAIL: EN screenshots <3')"
asc screenshots list --app "$APP_ID" --locale ja | python3 -c "import sys,json;d=json.load(sys.stdin);print('PASS' if len(d['data'])>=3 else 'FAIL: JA screenshots <3')"
# iPad 13" スクショ確認（APP_IPAD_PRO_3GEN_129）
EN_LOC_ID_GATE=$(curl -s -H "Authorization: Bearer $TOKEN_GATE" \
  "https://api.appstoreconnect.apple.com/v1/appStoreVersions/$VERSION_ID_GATE/appStoreVersionLocalizations" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);[print(x['id']) for x in d['data'] if x['attributes']['locale']=='en-US']")
curl -s -H "Authorization: Bearer $TOKEN_GATE" \
  "https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations/$EN_LOC_ID_GATE/appScreenshotSets" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);types=[x['attributes']['screenshotDisplayType'] for x in d['data']];print('PASS: iPad set exists' if 'APP_IPAD_PRO_3GEN_129' in types else 'FAIL: iPad 13\" screenshots missing')"

# GATE 7: copyright 確認（2026-02-28 実機確認）
asc versions get --version-id "$VERSION_ID_GATE" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);v=d['data']['attributes'].get('copyright','');print('PASS: copyright set' if v else 'FAIL: copyright not set')"

# GATE 8: content rights 確認（2026-02-28 実機確認）
curl -s -H "Authorization: Bearer $TOKEN_GATE" \
  "https://api.appstoreconnect.apple.com/v1/appStoreVersions/$VERSION_ID_GATE" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);v=d['data']['attributes'].get('contentRightsDeclaration','');print('PASS: content rights set' if v else 'FAIL: contentRightsDeclaration not set')"

# GATE 9: app pricing 確認（2026-02-28 実機確認）
asc apps prices list --app "$APP_ID" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print('PASS: pricing set' if d['data'] else 'FAIL: app pricing not set')"

# GATE 10: primaryCategory 確認（2026-02-28 実機確認 — 未設定で INVALID_BINARY になる）
APP_INFO_ID_GATE=$(curl -s -H "Authorization: Bearer $TOKEN_GATE" \
  "https://api.appstoreconnect.apple.com/v1/apps/$APP_ID/appInfos" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'])")
curl -s -H "Authorization: Bearer $TOKEN_GATE" \
  "https://api.appstoreconnect.apple.com/v1/appInfos/$APP_INFO_ID_GATE/primaryCategory" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);cat=d.get('data',{}).get('id','');print('PASS: primaryCategory=' + cat if cat else 'FAIL: primaryCategory not set → INVALID_BINARY になる')"

# GATE 11: usesIdfa 確認（2026-02-28 実機確認 — 未設定で INVALID_BINARY になる）
curl -s -H "Authorization: Bearer $TOKEN_GATE" \
  "https://api.appstoreconnect.apple.com/v1/appStoreVersions/$VERSION_ID_GATE" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);v=d['data']['attributes'].get('usesIdfa');print('PASS: usesIdfa=' + str(v) if v is not None else 'FAIL: usesIdfa not set → INVALID_BINARY になる。PHASE 9 Step 6 を実行してから再確認')"

# GATE 1〜11 全て PASS でなければ STOP。1つでも FAIL → 修正して再実行
```

### PHASE 11.6: IAP 事前確認（Guideline 2.1）

**🚨 CRITICAL（2026-02-28 実機確認）: `asc subscriptions submit` は初回提出で絶対に使うな。STATE_ERROR になる。**

**IAP は READY_TO_SUBMIT のまま放置してよい。`asc submit create`（PHASE 12）を実行すると自動的に審査に含まれる。これが唯一の正解。**

ソース: Apple 公式ドキュメント「For the first version of an app that includes in-app purchases, you must submit the in-app purchase product at the same time as you submit the version.」

| コマンド | 結果 |
|---------|------|
| `asc subscriptions submit` | ❌ STATE_ERROR.FIRST_SUBSCRIPTION_MUST_BE_SUBMITTED_ON_VERSION |
| `asc submit create --confirm`（PHASE 12） | ✅ READY_TO_SUBMIT の IAP が自動で含まれ WAITING_FOR_REVIEW |

```bash
# READY_TO_SUBMIT であることを確認するだけ（submitコマンドは一切不要）
asc subscriptions get --id "<MONTHLY_ID>" --output json | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data']['attributes']['state'])"
# → READY_TO_SUBMIT ✅

asc subscriptions get --id "<ANNUAL_ID>" --output json | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data']['attributes']['state'])"
# → READY_TO_SUBMIT ✅

# READY_TO_SUBMIT であれば → 即 PHASE 11.5 へ。asc subscriptions submit は絶対に実行しない。
```

**READY_TO_SUBMIT でなければ STOP → PHASE 5-8 に戻る。**

---

