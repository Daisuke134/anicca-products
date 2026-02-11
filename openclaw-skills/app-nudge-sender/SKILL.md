# app-nudge-sender

## 目的
iOS 向け nudge の Proposal を作成。steps: `draft_nudge -> send_nudge`。server-driven inbox に enqueue して送信。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `INTERNAL_AUTH_SECRET` | admin jobs 認証 |
| `NUDGE_ALPHA_USER_ID` | alpha ルーティング用（オプション） |

## 必須 tools
- `web_fetch`（API 呼び出し）

## 入力
- 通常: body なし。slot は cron のエントリで区別（morning/afternoon/evening）。
- `proactive-app-nudge` 互換: `{ slot: "morning"|"afternoon"|"evening" }` で上書き可能。

## 実行手順
1. `POST {API_BASE_URL}/api/admin/jobs/app-nudge-sender` を呼ぶ。
2. API が draft_nudge -> send_nudge 相当を実行し、`/api/mobile/nudge/pending` に enqueue。
3. iOS が pull -> ack で閉ループ。

## 出力 / 監査ログ
- `{ success: true, result }`
- runs/監査に slot と送信数を含める。

## 失敗時処理
- 5xx: 次回 cron で再実行。
- ユーザー未登録等: スキップして次へ。

## 禁止事項
- センサー依存にしない。固定スロット + server-driven のみ。

## Cron
- `app-nudge-morning`: `0 9 * * *`
- `app-nudge-afternoon`: `0 14 * * *`
- `app-nudge-evening`: `0 20 * * *`
