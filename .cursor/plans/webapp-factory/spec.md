# Web App Factory — 仕様書

**バージョン:** 1.0.0
**作成日:** 2026-03-01
**ステータス:** Draft

---

## 開発環境

| 項目 | 値 |
|------|-----|
| **実行環境** | Mac Mini（anicca-mac-mini-1 / Tailscale: 100.99.82.95） |
| **ブランチ** | `dev` |
| **リポジトリ** | `Daisuke134/anicca-products`（Public） |
| **スペックパス** | `.cursor/plans/webapp-factory/spec.md` |

---

## 1. 概要（What & Why）

### What
24時間365日自律稼働する Web App Factory。
人間の入力ゼロで、毎日1本のWebアプリを自動でトレンド調査→アイデア選定→ビルド→デプロイまで完結させるシステム。

### Why
- Webアプリの固定費が月$20（Vercel Pro）まで下がった
- Claude Code の `--dangerously-skip-permissions` モードで完全自律ビルドが可能
- AppFactory website-pipeline v2.3.0（OSS）が8フェーズの品質ゲートを持つ
- Anicca（OpenClaw）が Mac Mini で24/7稼働中であり、cron 追加だけで工場化できる

### アーキテクチャ
```
Anicca cron 09:00 JST
  → CC 自律実行（--dangerously-skip-permissions）
    → LAYER 1: トレンド収集 + アイデア選定 → idea.md 生成
    → LAYER 2: AppFactory website-pipeline（idea.md を INPUT）
    → LAYER 3: Vercel デプロイ
  → Slack #metrics 報告
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

---

## 3. As-Is / To-Be

### As-Is（現状）
```
Anicca（Mac Mini）
├── mobileapp-factory cron（07:00 JST）← iOSアプリ量産
└── trend-hunter cron（05:00, 17:00 JST）← トレンド収集

Web App Factory: 存在しない
```

### To-Be（完成後）
```
Anicca（Mac Mini）
├── mobileapp-factory cron（07:00 JST）← 既存・変更なし
├── trend-hunter cron（05:00, 17:00 JST）← 既存・変更なし
└── webapp-factory cron（09:00 JST）← NEW

webapp-factory フロー:

LAYER 1: INTELLIGENCE（09:00〜10:00）
  使用スキル:
  ├── apify-ultimate-scraper     Webトレンド収集
  ├── content-trend-researcher   SNS 10プラットフォーム分析
  ├── google-trends              検索ボリューム確認
  ├── reddit-insights            pain points 発見
  ├── startup-idea-validation    市場規模・競合スコアリング
  └── niche-opportunity-finder   ニッチ選定
  出力: idea.md（Problem/Market/Target/Monetization/Competitors）

LAYER 2: BUILD（10:00〜14:00）
  使用スキル: appfactory-builder（website-pipeline v2.3.0）
  INPUT: idea.md
  Phase 0: Intent Normalization（idea.md → 完全仕様に自動展開）
  Phase 1: Dream Spec（12セクション自動生成）
  Phase 2: Research & Positioning
  Phase 3: Information Architecture
  Phase 4: Design System（Axiom: #0a0a0a / Inter + JetBrains Mono）
  Phase 5: Build（Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui + Framer Motion）
           使用スキル: app-builder @nextjs-saas, senior-frontend, nextjs-expert
  Phase 6: GATE — Skills Audit（react-best-practices ≥95%, web-design-guidelines ≥90%）
  Phase 7: GATE — SEO Review（Technical / On-Page / Performance / Social）
  Phase 8: GATE — Ralph Polish Loop（20パス / 97%以上必須）
  LOCAL_RUN_PROOF_GATE（RUN_CERTIFICATE.json status:PASS 必須）

LAYER 3: DEPLOY（14:00〜14:30）
  auto-deploy.mjs → Vercel Pro push → URL 発行
  Stripe 商品・サブスク自動設定
  PostHog + Sentry 自動設定

LAYER 4: REPORT（14:30）
  Anicca → Slack #metrics 自動投稿
  「✅ 完成: https://xxx.vercel.app / ニッチ: xxx / 所要時間: xxh」
```

### 新規作成ファイル

| ファイル | 役割 |
|---------|------|
| `.cursor/plans/webapp-factory/spec.md` | 本スペック |
| `.openclaw/skills/webapp-factory-orchestrator/SKILL.md` | 全レイヤーを束ねるオーケストレーター（唯一のオリジナル） |
| `.openclaw/cron/jobs.json`（エントリ追加） | webapp-factory cron エントリ |

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

---

## 5. 境界

### やること
- LAYER 1〜4 の実装（スキルインストール + オーケストレーター + cron）
- Mac Mini 上での全動作確認

### やらないこと
- mobileapp-factory への変更（禁止）
- trend-hunter cron への変更（禁止）
- 並列実行（1日1本から。スケールは別スペック）
- 生成アプリのマーケティング（別スペック）

### 触らないファイル
- `.openclaw/skills/mobileapp-factory/` 以下全て
- `.openclaw/cron/jobs.json` の既存エントリ

---

## 6. 実行手順

```bash
# STEP 1: 残りスキルインストール（Mac Mini で実行）
npx skills install apify/agent-skills@apify-ultimate-scraper --yes
npx skills install nicepkg/ai-workflow@content-trend-researcher --yes
npx skills install vasilyu1983/ai-agents-public@startup-idea-validation --yes
npx skills install zanecole10/software-tailor-skills@niche-opportunity-finder --yes
clawhub install reddit-insights
clawhub install google-trends
clawhub install market-research-agent

# STEP 2: オーケストレーター SKILL.md 作成
# .openclaw/skills/webapp-factory-orchestrator/SKILL.md

# STEP 3: cron 追加
# jobs.json に webapp-factory エントリ追加

# STEP 4: 手動テスト実行
openclaw agent --message "Run webapp-factory skill now as a test." --deliver

# STEP 5: Slack #metrics で完成報告を確認
```

---

## 7. E2E判定

| 項目 | 値 |
|------|-----|
| UI変更 | なし（Mac Mini バックエンドのみ） |
| 新画面 | なし |
| 結論 | Maestro E2E: 不要。cron ログ + idea.md + Slack 投稿で検証 |

---

## 8. 月額コスト

| サービス | プラン | 費用 |
|---------|--------|------|
| Vercel Pro | 商用 | 支払済み ✅ |
| Apify | Starter | $49/月 |
| その他 | 無料枠 | $0 |
| **追加合計** | | **$49/月** |

---

## 9. ユーザー作業（実装前に必要）

| # | タスク | 手順 |
|---|--------|------|
| 1 | Apify API キー取得 | `console.apify.com` → Settings → API & Integrations |
| 2 | Mac Mini `.env` に追記 | `APIFY_API_TOKEN=apify_api_xxxxx` を `/Users/anicca/.openclaw/.env` に追加 |
