# suffering-detector

## 目的
web_search 等で「苦しみ/危機」を検知し、`detections[]` を作成。severity>=0.9 は SAFE-T として `crisis:detected` を emit、Slack 通知で interrupt。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `INTERNAL_AUTH_SECRET` | admin jobs 認証（requireInternalAuth） |

## 必須 tools
- `web_fetch`（API 呼び出し）
- 検知ロジックは API 内 `sufferingDetectorJob` で実行

## 入力
- 通常: body なし。
- E2E 検証: `{ feed: [{ platform, externalPostId, context, severityScore }] }` で合成フィード渡し。

## 実行手順
1. `POST {API_BASE_URL}/api/admin/jobs/suffering-detector` を呼ぶ。
2. API が feed を処理し、detections を作成。
3. severity>=0.9 は `crisis:detected` emit + Slack 通知。

## 出力 / 監査ログ
- `{ success: true, result }`
- crisis 時は Slack #agents に通知。

## 失敗時処理
- 5xx: 次回 cron で再実行（冪等）。
- 合成フィード不正: 400 で終了。

## 禁止事項
- なし（検知のみ、送信しない）。

## Cron
`*/5 * * * *` (5分ごと)
