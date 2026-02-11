# roundtable-standup

## 目的
Roundtable 定例スタンドアップ。次の打ち手・会話の seed を生成。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `INTERNAL_AUTH_SECRET` | admin 認証 |

## 必須 tools
- `web_fetch`（API 呼び出し）

## 入力
- なし（cron 起動）。

## 実行手順
1. `POST {API_BASE_URL}/api/admin/roundtable/standup` を呼ぶ。
2. API がスタンドアップ処理を実行。

## 出力 / 監査ログ
- `{ success: true, result }`

## 失敗時処理
- 5xx: 次回 cron で再実行。

## 禁止事項
- なし。

## Cron
`0 9 * * *` (09:00 JST)
