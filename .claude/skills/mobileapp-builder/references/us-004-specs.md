### PHASE 0.5: SPEC 生成（SDD）
```
01-trend.md を読んで spec.md を自動生成する
スラッシュコマンド不要。以下の手順をそのまま実行する。

Step 1: spec.md の全フィールドを埋める（PHASE 1 の必須フィールドを全部）
  - app_name, bundle_id, version, output_dir
  - price_monthly_usd: 9.99, price_annual_usd: 49.99（デフォルト）
  - paywall.cta_text_en / paywall.cta_text_ja
  - metadata: title_en/ja, subtitle_en/ja, description_en/ja, keywords_en/ja
  - urls.privacy_en: "https://$PRIVACY_POLICY_DOMAIN/{slug}/privacy/en"
  - urls.privacy_ja: "https://$PRIVACY_POLICY_DOMAIN/{slug}/privacy/ja"
  - urls.terms: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
  - urls.landing: "https://$PRIVACY_POLICY_DOMAIN/{slug}"
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

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 PHASE 0.5 完了 — Slack 報告して即 PHASE 1 へ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ 承認を待つな。Slack に投稿したら返信を待たずに即 PHASE 1 を開始する。

Slack (#metrics / SLACK_CHANNEL_ID) に以下を投稿:

🏭 {app_name} のビルドを開始します

💊 なぜこれが人間の苦しみを解決するか:
  [01-trend.md の「コアペイン」セクションから3点引用 — 実データ・ソースURL付き]
  例: "不安障害は世界2.8億人（WHO）。薬なし6分で解決できる呼吸法は科学的証拠あり"

📈 なぜバイラルになるか（実測データ）:
  [x-research・tiktok-research・apify-trend-analysis の実測数値を3点引用]
  例: "TikTok: 9D Breathwork が2026年明示的にバイラル（Apify実測）"
  例: "日本式ウォーキング 2,986% YoY増（Google Trends実測）"
  例: "日本市場 CAGR 16.31% → $822M by 2035（GlobeNewswire）"

💰 {price_monthly_usd}/月 | {price_annual_usd}/年 | EN+JA

📁 SDD ファイル（フルパス）:
  .cursor/app-factory/{slug}/01-trend.md
  .cursor/app-factory/{slug}/02-spec.md
  .cursor/app-factory/{slug}/03-plan.md
  .cursor/app-factory/{slug}/04-tasks.md

Phase 1→12 を自律実行します。完了時に報告します。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

