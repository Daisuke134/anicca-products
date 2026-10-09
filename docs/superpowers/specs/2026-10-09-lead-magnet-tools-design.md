# SPEC: aniccaai.com 無料リードマグネット2本（静的・クライアントのみ）

作成：2026-10-09 JST ／ 対象：`apps/landing` ／ 状態：実装中

出典：ユーザー添付 SPEC（`SPEC_c70f.md`）を identical follow。

## 対象URL

| ツール | URL |
|---|---|
| アファメーション壁紙メーカー | `/affirmation-app/ja/wallpaper` |
| 出発時刻計算機 | `/lm/ja/departure-calculator` |

## MUST

- 完全静的。サーバー処理・ログイン・外部API・Cookie・入力送信なし。プライバシー文言「入力内容は送信されません」。
- 既存フレームワーク（Next.js static export）のクライアントページ。追加トラッカー禁止。
- 日本語UI、`<html lang="ja">`（ページ `lang="ja"`）、title / description / canonical / OGP 1200×630 / hreflang ja。
- 構造化データ：`WebApplication`（price 0, inLanguage ja）＋ `FAQPage`（3問）。
- Anicca壁紙ページのみ Safari スマートバナー `apple-itunes-app` app-id=6755129214。
- App Store `pt=` は空（定数 `APP_STORE_PT = ''`）。
- sitemap に2 URL 追加。`/blog` は触らない。
- 出発計算機：計算関数＋ICS生成の単体テスト必須。

## 受け入れ（要約）

- 壁紙 PNG 1179×2556、時計領域回避、オフライン書き出し可。
- 出発例：09:30 / 移動40 / 余裕10 → 08:40。00:20 / 30 / 10 → 前日 23:40。
- .ics は RFC 5545 エスケープ・75オクテット折り返し・UTC。
