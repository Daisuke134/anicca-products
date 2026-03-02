# AGENTS.md — web-app-factory 学習記録

## Project: SignatureCraft
- URL: https://20260302-084616-app.vercel.app
- Stack: Next.js 15 + TypeScript + Tailwind CSS + Stripe
- Time: Single session (US-001 through US-007)

## Critical Mistakes（繰り返したエラー）

| # | エラー | 原因 | 修正 |
|---|--------|------|------|
| 1 | Stripe apiVersion mismatch | ハードコード "2025-12-18.acacia" → 実際は "2026-02-25.clover" | npm package の型定義から正しいバージョンを取得する |
| 2 | Playwright ポート衝突 | port 3000 が他アプリで使用中 | ユニークポート (3847) を使用 |
| 3 | `source .env` で変数が空 | bash source の挙動 | `export $(grep VAR .env | xargs)` パターンを使用 |

## Evolution Log

| バージョン | 変更 | 理由 |
|-----------|------|------|
| v1 | Stripe API version を npm package 型定義から自動検出 | ハードコードはバージョン不一致を起こす |
| v1 | Vercel deploy に --scope フラグ追加 | チームアカウントで non-interactive mode が失敗する |
| v1 | Playwright テストで .first() を明示使用 | strict mode で複数要素マッチ時にエラー |

## Correction Log

| 日時 | 修正内容 |
|------|---------|
| 2026-03-02 | .gitignore に .next/ 追加（初回コミットで .next/ がトラッキングされた） |
| 2026-03-02 | create-next-app 実行前に既存ファイルを退避するワークフロー確立 |
| 2026-03-02 | Playwright テストの getByLabel → getByPlaceholder に変更（label-input 紐付けなし） |

## Best Practices Discovered

| カテゴリ | ベストプラクティス | ソース |
|---------|-------------------|--------|
| Stripe | Server Actions で Checkout Session を作成 | [DEV Community](https://dev.to/sameer_saleem/the-ultimate-guide-to-stripe-nextjs-2026-edition-2f33) |
| Stripe | Webhook は STRIPE_WEBHOOK_SECRET 未設定時に 503 返却（クラッシュしない） | [Stripe Docs](https://docs.stripe.com/webhooks/quickstart) |
| Next.js | Tailwind v4 は `@import "tailwindcss"` で設定不要 | [Next.js Docs](https://nextjs.org/docs/getting-started/installation) |
| E2E | Playwright で Next.js テストする際はユニークポートを使用 | 実体験 |
| Deploy | Vercel env vars は deploy 前に設定 → redeploy で反映 | [Vercel Docs](https://vercel.com/docs/environment-variables) |
