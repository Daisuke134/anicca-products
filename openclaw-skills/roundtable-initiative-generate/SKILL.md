# roundtable-initiative-generate

## 目的
Initiative を生成。次の打ち手として各 nudge（App/X/TikTok/Moltbook）に反映。

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
1. `POST {API_BASE_URL}/api/admin/roundtable/initiative-generate` を呼ぶ。
2. API が Initiative を生成・保存。

## 出力 / 監査ログ
- `{ success: true, result }`

## 失敗時処理
- 5xx: 次回 cron で再実行。

## 禁止事項
- なし。

## Cron
`5 9 * * *` (09:05 JST)
