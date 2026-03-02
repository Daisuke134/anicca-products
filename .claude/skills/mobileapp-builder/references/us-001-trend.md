### PHASE 0: PRE-FLIGHT（セットアップウィザード）

PRE-FLIGHT はサイレントチェックではなくガイド付きウィザードとして実行する。
問題が1つでも見つかれば、ユーザーに解決手順を提示し、確認を取ってから次の項目へ進む。
全 STEP が PASS になるまで PHASE 0 TREND RESEARCH に進まない。

---

#### STEP 0: Git Worktree セットアップ（必須 — devを汚さない）

**全作業は git worktree で dev から隔離する。dev に直接コミット禁止。**

理由: 複数のファクトリーエージェントが同時に dev で作業すると競合が起きる。TestFlight テスト前のコードが dev に混入するとデプロイが汚れる。

```bash
# slug を spec.md から取得（例: breath-calm）
SLUG=$(python3 -c "import re; s=open('.cursor/app-factory/<SLUG>/02-spec.md').read(); print(re.search(r'output_dir.*?([a-z-]+)-app', s).group(1))" 2>/dev/null || echo "<SLUG>")

# worktree 作成（~/Downloads/ 直下）
WORKTREE_PATH="$HOME/Downloads/anicca-${SLUG}"
git worktree add "$WORKTREE_PATH" -b "app-factory/${SLUG}"
echo "✅ Worktree 作成: $WORKTREE_PATH (branch: app-factory/${SLUG})"

# 以降の全作業はこの worktree 内で行う
cd "$WORKTREE_PATH"
```

**TestFlight 承認後のマージ手順（PHASE 10 完了後）:**

```bash
# 1. worktree から dev にマージ
cd /Users/cbns03/Downloads/anicca-project  # メインリポジトリ
git checkout dev
git merge app-factory/${SLUG} --no-ff -m "feat(app-factory): merge ${SLUG} → dev (TestFlight approved)"
git push origin dev

# 2. worktree クリーンアップ
git worktree remove "$HOME/Downloads/anicca-${SLUG}"
git branch -d app-factory/${SLUG}
```

---

#### STEP 1: Sub-skills（自動インストール）

```bash
# まずすべてのスキルをチェックし、足りなければ自動インストール
required_skills=(x-research tiktok-research apify-trend-analysis ralph-autonomous-dev screenshot-creator slack-approval)
for skill in "${required_skills[@]}"; do
  if ! npx skills list 2>/dev/null | grep -q "$skill"; then
    echo "⏳ Installing: $skill"
    npx skills add Daisuke134/anicca-products@$skill -g -y
  fi
done
if ! npx skills list 2>/dev/null | grep -q "app-icon"; then
  npx skills add code-with-beto/skills@app-icon -g -y
fi
echo "✅ All sub-skills ready."
```

---

#### STEP 2: CLI Tools

```bash
check_tool() {
  local name="$1"; local cmd="$2"; local install="$3"
  if eval "$cmd" &>/dev/null 2>&1; then echo "✅ $name"
  else echo "❌ $name → $install"; return 1; fi
}

TOOL_FAIL=0
check_tool "asc"         "asc --version"            "brew install nickvdyck/tap/asc"      || TOOL_FAIL=1
check_tool "fastlane"    "fastlane --version"        "brew install fastlane"               || TOOL_FAIL=1
check_tool "greenlight"  "greenlight --version"      "cd /tmp && git clone https://github.com/RevylAI/greenlight.git && cd greenlight && make build && sudo cp build/greenlight /usr/local/bin/" || TOOL_FAIL=1
check_tool "imagemagick" "magick --version"           "brew install imagemagick"            || TOOL_FAIL=1
check_tool "snapai"      "npx snapai --version"      "npm install -g snapai"               || TOOL_FAIL=1
check_tool "ios-deploy"  "ios-deploy --version"      "brew install ios-deploy"             || TOOL_FAIL=1
check_tool "Pillow"      "python3 -c 'import PIL'"   "pip3 install Pillow"                 || TOOL_FAIL=1
check_tool "PyJWT"       "python3 -c 'import jwt'"   "pip3 install PyJWT"                  || TOOL_FAIL=1
check_tool "requests"    "python3 -c 'import requests'" "pip3 install requests"            || TOOL_FAIL=1

if [ "$TOOL_FAIL" -ne 0 ]; then
  echo ""
  echo "⚠️  上記の CLI ツールが不足しています。インストール後「完了」と入力してください。"
  # ← ユーザー入力待ち。「完了」を受けたら STEP 2 を再実行し PASS になったら STEP 3 へ
fi
```

---

#### STEP 3: 環境変数

```bash
ENV_FILE="$HOME/.config/mobileapp-builder/.env"
[ -f "$ENV_FILE" ] && source "$ENV_FILE"

ENV_FAIL=0
check_env() {
  local name="$1"; local link="$2"; local hint="$3"
  if [ -n "${!name:-}" ]; then echo "✅ $name"
  else echo "❌ $name → $link ($hint)"; ENV_FAIL=1; fi
}

check_env ASC_KEY_ID              "https://appstoreconnect.apple.com → Users and Access → Integrations → Keys" "キーID（例: ABC123DEFG）"
check_env ASC_ISSUER_ID           "同上"                                                                        "Issuer ID（UUID形式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）"
check_env ASC_KEY_PATH            "上記ページで .p8 ダウンロード → ~/Downloads/ に保存（1度しかダウンロードできない）" "例: ~/Downloads/AuthKey_XXXXXX.p8"
check_env REVENUECAT_API_KEY      "https://app.revenuecat.com → Project Settings → API Keys"                   "sk_ で始まるキー"
check_env MIXPANEL_TOKEN          "https://mixpanel.com → Project Settings → Project Token"                    "英数字トークン"
check_env X_BEARER_TOKEN          "https://developer.twitter.com → App → Bearer Token"                        "AAAA... で始まる"
check_env APIFY_TOKEN             "https://console.apify.com → Settings → Integrations"                       "apify_api_ で始まる"
check_env GEMINI_API_KEY          "https://console.cloud.google.com → APIs & Services → Credentials"           "AIza... で始まる"
check_env OPENAI_API_KEY          "https://platform.openai.com → API keys"                                    "sk- で始まる"
check_env SLACK_BOT_TOKEN         "https://api.slack.com/apps → OAuth & Permissions"                          "xoxb- で始まる"
check_env SLACK_APP_TOKEN         "https://api.slack.com/apps → Basic Information → App-Level Tokens"         "xapp- で始まる"
check_env SLACK_CHANNEL_ID        "Slack でチャンネル右クリック → リンクをコピー → 末尾 C... 部分"             "例: C0123456789"
check_env PRIVACY_POLICY_DOMAIN   "自分が所有するドメイン（Privacy Policy と Landing Page をホストする）"       "例: example.com（https://は含めない）"
check_env NETLIFY_AUTH_TOKEN      "https://app.netlify.com → User Settings → Applications → Personal access tokens → New access token" "tok_ で始まるトークン（PHASE 3.5 で必須）"
check_env NETLIFY_SITE_ID         "https://app.netlify.com → サイト選択 → Site settings → General → Site ID" "UUID形式（PHASE 3.5 で必須）"
check_env APPLE_ID_PASSWORD       "keiodaisuke@gmail.com の Apple ID パスワード"                             "PHASE 4 の asc apps create で必須"

if [ "$ENV_FAIL" -ne 0 ]; then
  echo ""
  echo "⚠️  環境変数が不足しています。設定方法:"
  echo "   1. mkdir -p ~/.config/mobileapp-builder"
  echo "   2. 上のリンクから各キーを取得"
  echo "   3. ~/.config/mobileapp-builder/.env に: export 変数名=値"
  echo "   4. source ~/.config/mobileapp-builder/.env"
  echo "   設定が完了したら「完了」と入力してください。"
  # ← ユーザー入力待ち。「完了」を受けたら STEP 3 を再実行し PASS になったら STEP 4 へ
fi
```

---

#### STEP 4: ASC API Key (.p8)

```bash
if ls ~/Downloads/AuthKey_*.p8 &>/dev/null 2>&1; then
  echo "✅ ASC API Key (.p8) 確認済み"
else
  echo "❌ .p8 ファイルが ~/Downloads に見つかりません"
  echo ""
  echo "   取得手順:"
  echo "   1. https://appstoreconnect.apple.com を開く"
  echo "   2. Users and Access → Integrations → Keys → + ボタン"
  echo "   3. 名前: mobileapp-builder / アクセス: App Manager"
  echo "   4. ダウンロード → ~/Downloads/ に保存"
  echo "   5. ASC_KEY_ID と ASC_KEY_PATH を .env に追記"
  echo "   完了したら「完了」と入力してください。"
  # ← ユーザー入力待ち
fi
```

---

#### STEP 5: snapai 設定

```bash
[ -n "${OPENAI_API_KEY:-}" ] && npx snapai config --openai-api-key "$OPENAI_API_KEY" && echo "✅ snapai 設定済み"
```

---

#### PRE-FLIGHT 完了

```bash
echo "✅ PRE-FLIGHT 完了。全チェック通過。PHASE 0 TREND RESEARCH を開始します。"
```

---

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
  - 【必須】なぜこれが人間の苦しみを解決するか: 実データ + ソースURL 付き3点
    例: "不安障害は世界2.8億人（WHO: https://who.int/news-room/fact-sheets/detail/anxiety-disorders）"
  - 【必須】なぜバイラルになるか（実測数値）: 各ツールの実測データを引用
    例: "Apify実測: 9D Breathwork TikTok 動画 平均2.3M再生 / 月"
    例: "Google Trends実測: 日本式ウォーキング 2,986% YoY増"
    ※ LLM の推測 = 禁止。実ツール（Apify/X/Google Trends）の実数値のみ
```

