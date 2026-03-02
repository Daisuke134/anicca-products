# AGENTS.md — web-app-factory 学習記録

## App: ColdCraft — AI Cold Email Generator
- URL: https://20260302-150000-app.vercel.app
- Stripe: prod_U4YiuOW1XJP6HU / price_1T6PbLEeDsUAcaLSnbvW0kGD ($9.99/month)
- Stack: Next.js 16 + TypeScript + Tailwind + Stripe

## Critical Mistakes（繰り返したエラー）

| エラー | 回数 | 修正方法 |
|--------|------|---------|
| Stripe apiVersion mismatch | 1 | インストール済みパッケージのバージョンを確認してから設定 |
| create-next-app in non-empty dir | 1 | tmpディレクトリで作成→コピー |
| Port 3000 collision in E2E | 1 | 非標準ポート(3077)を使用 |
| Vercel --scope missing | 1 | choices配列からteam IDを取得して指定 |

## Evolution Log

| US | 所要時間 | ステータス |
|----|---------|-----------|
| US-001: Trend Research | ~5min | ✅ PASS |
| US-002: Stripe Setup | ~3min | ✅ PASS |
| US-003: Next.js Scaffold | ~3min | ✅ PASS |
| US-004: Feature Implementation | ~10min | ✅ PASS |
| US-005: Quality Check + E2E | ~8min | ✅ PASS |
| US-006: Vercel Deploy | ~5min | ✅ PASS |
| US-007: Final Report | ~3min | ✅ PASS |

## Correction Log

| 原則 | 学び |
|------|------|
| ポート管理 | E2Eテストは常に非標準ポートを使用する（他のdevサーバーとの衝突防止） |
| Stripe SDK | apiVersionはパッケージ内のTypeScript型定義から正確な値を取得する |
| Vercel CI/CD | non-interactiveモードでは--scopeが必須。エラーのchoices配列から取得 |
| プロジェクト初期化 | create-next-appは空ディレクトリ必須。既存ファイルがある場合はtmpで作成→コピー |
| 環境変数 | .envファイルのsource時はフルパスを使う（相対パスは信頼性が低い） |
