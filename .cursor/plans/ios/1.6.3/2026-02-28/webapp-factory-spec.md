# Web App Factory — 仕様書

**バージョン:** 1.1.0
**作成日:** 2026-03-01
**ステータス:** Ready to Implement

---

## 開発環境

| 項目 | 値 |
|------|-----|
| **実行環境** | Mac Mini（anicca-mac-mini-1 / Tailscale: 100.99.82.95） |
| **ブランチ** | `dev` |
| **リポジトリ** | `Daisuke134/anicca-products`（Public） |
| **スペックパス** | `.cursor/plans/ios/1.6.3/2026-02-28/webapp-factory-spec.md` |

---

## 1. 概要（What & Why）

### What
24時間365日自律稼働する Web App Factory。
人間の入力ゼロで、毎日1本のWebアプリを自動でトレンド調査→アイデア選定→ビルド→デプロイ→マーケティングまで完結させるシステム。

### Why
- Webアプリの固定費が月$20（Vercel Pro）まで下がった
- Claude Code の `--dangerously-skip-permissions` モードで完全自律ビルドが可能
- AppFactory website-pipeline v2.3.0（OSS）が8フェーズの品質ゲートを持つ
- Anicca（OpenClaw）が Mac Mini で24/7稼働中であり、cron 追加だけで工場化できる
- `vercel/nextjs-subscription-payments` ボイラープレートで決済・認証・分析が即日立ち上がる

ソース: [0xAxiom/AppFactory](https://github.com/0xAxiom/AppFactory) / 核心の引用: 「AppFactory is an automated web application factory that builds production-ready SaaS apps」
ソース: [vercel/nextjs-subscription-payments](https://github.com/vercel/nextjs-subscription-payments) / 核心の引用: 「Clone, deploy, and fully customize a SaaS subscription application with Next.js」
ソース: [Claude Code statusline](https://code.claude.com/docs/en/statusline) / 核心の引用: 「Claude Code can call a shell script hook at each step to report progress」

### アーキテクチャ
```
Anicca cron 09:00 JST
  → CC 自律実行（--dangerously-skip-permissions）
    → [横断] statusline hook → Slack #metrics（全ステップをリアルタイム報告）
    → LAYER 1: トレンド収集 + アイデア選定 → idea.md 生成
    → LAYER 2: ボイラープレート clone + AppFactory website-pipeline（idea.md を INPUT）
    → LAYER 3: Vercel デプロイ
    → LAYER 4: Slack 完成報告 + Postiz X 投稿
```

---

## 2. 受け入れ条件

| # | 条件 | 検証方法 |
|---|------|---------|
| AC-1 | 毎日 09:00 JST に人間の入力なしで自動起動する | cron ログ確認 |
| AC-2 | LAYER 1 がトレンドデータを収集し `idea.md` を生成する | `idea.md` の存在と内容確認 |
| AC-3 | `idea.md` が Problem / Market / Target / Monetization / Competitors の5セクションを含む | ファイル内容確認 |
| AC-4 | AppFactory website-pipeline が `idea.md` を INPUT として受け取り仕様を自動展開する | Phase 0 ログ確認 |
| AC-5 | Phase 6 Skills Audit が react-best-practices ≥95% を達成する | ゲートログ確認 |
| AC-6 | Phase 7 SEO Review が PASS する | ゲートログ確認 |
| AC-7 | Phase 8 Ralph Polish Loop が 97%以上で PASS する | ゲートログ確認 |
| AC-8 | LOCAL_RUN_PROOF_GATE が `RUN_CERTIFICATE.json status:PASS` を発行する | ファイル確認 |
| AC-9 | Vercel に自動デプロイされ有効な URL が発行される | URL アクセス確認 |
| AC-10 | Slack #metrics に完成報告が自動投稿される | Slack 確認 |
| AC-11 | 全工程が人間の介入なしに完結する | ログに human_input なし |
| AC-12 | Postiz CLI 経由で X（Twitter）に完成投稿が自動公開される | X タイムライン確認 |

---

## 3. As-Is / To-Be

### As-Is（現状）
```
Anicca（Mac Mini）
├── trend-hunter cron（05:00, 17:00 JST）← トレンド収集
Web App Factory: 存在しない
```

### To-Be（完成後）
```
Anicca（Mac Mini）
├── trend-hunter cron（05:00, 17:00 JST）← 既存・変更なし
└── webapp-factory cron（09:00 JST）← NEW

webapp-factory フロー:

[横断] statusline hook（全フェーズ常時稼働）
  ~/.claude/statusline.sh → Slack #metrics にリアルタイム進捗投稿
  CC が各ステップ完了ごとに JSON を stdin で hook に渡す
  ソース: https://code.claude.com/docs/en/statusline

LAYER 1: INTELLIGENCE（09:00〜10:00）
  使用スキル:
  ├── apify-ultimate-scraper     Webトレンド収集（Apify $49/月）
  ├── content-trend-researcher   SNS 10プラットフォーム分析
  ├── google-trends              検索ボリューム確認
  ├── reddit-insights            pain points 発見
  ├── startup-idea-validation    市場規模・競合スコアリング
  └── niche-opportunity-finder   ニッチ選定
  出力: idea.md（Problem/Market/Target/Monetization/Competitors）

LAYER 2: BUILD（10:00〜14:00）
  Step 0: ボイラープレート取得
    git clone vercel/nextjs-subscription-payments → {slug}/
    （Next.js + Supabase + Stripe + shadcn/ui — 無料OSS）
    ソース: https://github.com/vercel/nextjs-subscription-payments

  Step 1: AppFactory website-pipeline v2.3.0 実行（idea.md を INPUT）
    使用スキル: appfactory-builder
    Phase 0: Intent Normalization（idea.md → 完全仕様に自動展開）
    Phase 1: Dream Spec（12セクション自動生成）
    Phase 2: Research & Positioning
    Phase 3: Information Architecture
    Phase 4: Design System（Axiom: #0a0a0a / Inter + JetBrains Mono）
    Phase 5: Build（Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui + Framer Motion）
             使用スキル: app-builder, senior-frontend, nextjs-expert
    Phase 6: GATE — Skills Audit（react-best-practices ≥95%, web-design-guidelines ≥90%）
    Phase 7: GATE — SEO Review（Technical / On-Page / Performance / Social）
    Phase 8: GATE — Ralph Polish Loop（20パス / 97%以上必須）
    LOCAL_RUN_PROOF_GATE（RUN_CERTIFICATE.json status:PASS 必須）

LAYER 3: DEPLOY（14:00〜14:30）
  auto-deploy.mjs → Vercel Pro push → URL 発行
  Stripe 商品・サブスク自動設定（ボイラープレート活用）
  PostHog + Sentry 自動設定

LAYER 4: REPORT & MARKET（14:30）
  [Slack] Anicca → Slack #metrics 最終報告
    「✅ 完成: https://xxx.vercel.app / ニッチ: xxx / 所要時間: xxh」
  [X] Postiz CLI → X（Twitter）自動投稿
    「Just shipped: {app_name} — {one_line_pitch} 🚀 {url} #BuildInPublic #indiehacker」
    npm install -g postiz && postiz posts:create
    ソース: https://docs.postiz.com/usage/cli
    レート制限: 30 req/hour。1日1回の投稿で問題なし。
```

### 新規作成ファイル

| ファイル | 役割 |
|---------|------|
| `.openclaw/skills/webapp-factory-orchestrator/SKILL.md` | 全レイヤーを束ねるオーケストレーター（唯一のオリジナル） |
| `.openclaw/cron/jobs.json`（エントリ追加） | webapp-factory cron エントリ（09:00 JST） |
| `~/.claude/statusline.sh` | CC 進捗 → Slack Webhook リアルタイム投稿 |

### インストールするスキル

| スキル | 出所 | 状態 |
|--------|------|------|
| appfactory-builder | 0xAxiom/AppFactory | ✅ 済み |
| app-builder | davila7 | ✅ 済み |
| senior-frontend | alirezarezvani | ✅ 済み |
| nextjs-expert | clawhub | ✅ 済み |
| apify-ultimate-scraper | apify/agent-skills | 要インストール |
| content-trend-researcher | nicepkg/ai-workflow | 要インストール |
| startup-idea-validation | vasilyu1983 | 要インストール |
| niche-opportunity-finder | zanecole10 | 要インストール |
| reddit-insights | clawhub | 要インストール |
| google-trends | clawhub | 要インストール |
| market-research-agent | clawhub | 要インストール |

---

## 4. テストマトリックス

| # | To-Be | テスト名 | AC |
|---|-------|---------|-----|
| 1 | cron 09:00 JST 起動 | `test_cron_triggers_at_0900_jst` | AC-1 |
| 2 | idea.md 生成 | `test_layer1_generates_idea_md` | AC-2 |
| 3 | idea.md の5セクション存在 | `test_idea_md_has_required_sections` | AC-3 |
| 4 | Phase 0 が idea.md を消費 | `test_phase0_consumes_idea_md` | AC-4 |
| 5 | Skills Audit ≥95% | `test_phase6_skills_audit_passes` | AC-5 |
| 6 | SEO Review PASS | `test_phase7_seo_passes` | AC-6 |
| 7 | Ralph 97%+ PASS | `test_phase8_ralph_passes` | AC-7 |
| 8 | RUN_CERTIFICATE 存在 | `test_run_certificate_status_pass` | AC-8 |
| 9 | Vercel URL 有効 | `test_vercel_url_accessible` | AC-9 |
| 10 | Slack 投稿確認 | `test_slack_metrics_posted` | AC-10 |
| 11 | human_input ログなし | `test_no_human_input_in_logs` | AC-11 |
| 12 | X 投稿が Postiz 経由で公開 | `test_x_post_published_via_postiz` | AC-12 |

---

## 5. 境界

### やること
- LAYER 1〜4 の実装（スキルインストール + オーケストレーター + cron）
- Mac Mini 上での全動作確認
- Postiz 経由 X 自動投稿（LAYER 4 に含む）
- GitHub オープンソース化（Section 10 参照）

### やらないこと
- 並列実行（1日1本から。スケールは別スペック）

### 触らないファイル
- `.openclaw/cron/jobs.json` の既存エントリ

---

## 6. 実行手順

```bash
# STEP 1: statusline hook セットアップ（Mac Mini で実行）
ssh anicca@100.99.82.95 'mkdir -p ~/.claude && cat > ~/.claude/statusline.sh << '"'"'HOOKEOF'"'"'
#!/bin/bash
INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get(\"message\",\"\"))" 2>/dev/null || echo "progress update")
WEBHOOK=$(grep SLACK_WEBHOOK_URL ~/.openclaw/.env | cut -d= -f2)
curl -s -X POST "$WEBHOOK" -H "Content-Type: application/json" \
  -d "{\"text\":\"🏭 webapp-factory: $MESSAGE\"}" > /dev/null
HOOKEOF
chmod +x ~/.claude/statusline.sh'
# ソース: https://code.claude.com/docs/en/statusline

# STEP 2: Postiz CLI インストール（Mac Mini で実行）
ssh anicca@100.99.82.95 "export PATH=/opt/homebrew/bin:/opt/homebrew/sbin:\$PATH && npm install -g postiz"
# ソース: https://docs.postiz.com/usage/cli

# STEP 3: 残りスキルインストール（Mac Mini で実行）
ssh anicca@100.99.82.95 "export PATH=/opt/homebrew/bin:/opt/homebrew/sbin:\$PATH && \
  npx skills install apify/agent-skills@apify-ultimate-scraper --yes && \
  npx skills install nicepkg/ai-workflow@content-trend-researcher --yes && \
  npx skills install vasilyu1983/ai-agents-public@startup-idea-validation --yes && \
  npx skills install zanecole10/software-tailor-skills@niche-opportunity-finder --yes && \
  clawhub install reddit-insights && \
  clawhub install google-trends && \
  clawhub install market-research-agent"

# STEP 4: オーケストレーター SKILL.md 作成
# .openclaw/skills/webapp-factory-orchestrator/SKILL.md（次のセクション参照）

# STEP 5: cron 追加
# jobs.json に webapp-factory エントリ追加（09:00 JST = 00:00 UTC）

# STEP 6: 手動テスト実行
ssh anicca@100.99.82.95 "export PATH=/opt/homebrew/bin:/opt/homebrew/sbin:\$PATH && \
  openclaw agent --message 'Run webapp-factory skill now as a test.' --deliver"

# STEP 7: Slack #metrics で完成報告を確認
# STEP 8: X タイムラインで投稿を確認
```

---

## 7. E2E判定

| 項目 | 値 |
|------|-----|
| UI変更 | なし（Mac Mini バックエンドのみ） |
| 新画面 | なし |
| 結論 | Maestro E2E: 不要。cron ログ + idea.md + Slack 投稿 + X 投稿で検証 |

---

## 8. 月額コスト

| サービス | プラン | 費用 |
|---------|--------|------|
| Vercel Pro | 商用 | 支払済み ✅ |
| Apify | Starter | $49/月 |
| Supabase / Clerk / PostHog / Sentry / Reddit / X Dev | 無料枠 | $0 |
| **追加合計** | | **$49/月** |

---

## 9. アカウントセットアップ（全8件 — 実装前に必須）

全て Mac Mini `/Users/anicca/.openclaw/.env` に追記する。

| # | サービス | 用途 | 取得するもの | URL |
|---|---------|------|------------|-----|
| 1 | **Apify** | トレンドスクレイピング（$49/月） | `APIFY_API_TOKEN` | https://console.apify.com → Settings → API & Integrations |
| 2 | **Vercel** | デプロイ先（Pro 支払済み） | `VERCEL_TOKEN`, `VERCEL_ORG_ID` | https://vercel.com/account/tokens |
| 3 | **Supabase** | DB + Auth（ボイラープレート必須） | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | https://supabase.com → New Project |
| 4 | **Stripe** | 決済（ボイラープレート必須） | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | https://dashboard.stripe.com/apikeys |
| 5 | **PostHog** | 分析（無料） | `POSTHOG_API_KEY` | https://us.posthog.com/project/settings |
| 6 | **Sentry** | エラー監視（無料） | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | https://sentry.io/settings/auth-tokens |
| 7 | **X Developer** | Postiz 経由投稿（無料） | `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET` | https://developer.x.com/en/portal/dashboard |
| 8 | **Slack Webhook** | 進捗報告（既存） | `SLACK_WEBHOOK_URL`（#metrics の既存 webhook を流用） | `.env` 確認 |

---

## 10. オープンソース化計画

ソース: [anthropics/skills](https://github.com/anthropics/skills) / 核心の引用: 「Skills are markdown files that teach Claude how to use tools」
ソース: [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) / 核心の引用: 「A curated list of skills for Claude Code」

| ステップ | 内容 | 提出先 |
|---------|------|-------|
| 1 | `webapp-factory-orchestrator/SKILL.md` を整備・動作確認 | — |
| 2 | PR 提出 | https://github.com/anthropics/skills |
| 3 | PR 提出 | https://github.com/travisvn/awesome-claude-skills |
