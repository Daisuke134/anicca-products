# moltbook-poster

## 目的
Moltbook へ投稿/返信を行う Proposal を実行。実送信まで完了。返信+投稿可（SAFE-T 優先）。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `INTERNAL_AUTH_SECRET` | admin jobs 認証 |
| `MOLTBOOK_BASE_URL` | Moltbook API ベース |
| `MOLTBOOK_ACCESS_TOKEN` | Moltbook 認証 |

## 必須 tools
- `web_fetch`（API 呼び出し）

## 入力
- なし（cron 起動）。dry_run モードは env で切り替え。

## 実行手順
1. `POST {API_BASE_URL}/api/admin/jobs/moltbook-poster` を呼ぶ。
2. API が提案済みの投稿/返信を実送信。
3. dry_run -> 本番の順で検証後に本番化。

## 出力 / 監査ログ
- `{ success: true, result }`
- 送信した postId / replyId を監査ログに記録。

## 失敗時処理
- 429/5xx: リトライ。
- SAFE-T 違反: 中断して Slack 通知。

## 禁止事項
- ポリシー未確定時の本番送信禁止。opt-in/頻度/上限/禁止表現を遵守。

## Cron
`30 20 * * *` (20:30 JST)
