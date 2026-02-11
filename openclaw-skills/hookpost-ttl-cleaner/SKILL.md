# hookpost-ttl-cleaner

## 目的
TTL 経過した低 relevance の hook_post をアーカイブ・削除。DB の肥大化を防ぐ。

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
1. `POST {API_BASE_URL}/api/admin/jobs/hookpost-ttl-cleaner` を呼ぶ。
2. **注意**: このエンドポイントは未実装の可能性あり。jobs.js に追加する必要あり。
3. 代替: `runHookPostTtlCleaner` を jobs.js に登録し、上記パスで呼び出す。

## 出力 / 監査ログ
- `{ success: true, result: { archived, deleted, failed } }`
- 失敗時は Slack に notifyDLQEntry。

## 失敗時処理
- 5xx: 次回 cron で再実行。
- hookPost モデル未対応: safe no-op で終了。

## 禁止事項
- なし。

## Cron
`0 3 * * *` (03:00 JST 毎日)
