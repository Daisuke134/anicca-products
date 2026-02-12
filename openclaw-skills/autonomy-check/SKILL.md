# autonomy-check

## 目的
規約違反（X 返信ゼロ等）、DLQ 滞留、失敗率等を合否判定し通知。長期運用で劣化しないよう自己点検。

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
1. `POST {API_BASE_URL}/api/admin/jobs/autonomy-check` を呼ぶ。
2. API が runAutonomyCheck を実行。
3. 違反検出時は Slack 通知。

## 出力 / 監査ログ
- `{ success: true, result }`
- 合否判定結果を監査ログに記録。

## 失敗時処理
- 5xx: 次回 cron で再実行。
- 違反検出: Slack 通知後も次回実行は継続。

## 禁止事項
- なし。

## Cron
`0 3 * * *` (03:00 JST 毎日)
