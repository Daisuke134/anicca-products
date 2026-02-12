# mission-worker

## 目的
閉ループ実行エンジン。queued step を取得し、step_kind に応じた executor を実行し、結果を `complete` に報告する。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `ANICCA_AGENT_TOKEN` | ops 認証トークン（Bearer） |

## 必須 tools
- `web_fetch`（API 呼び出し）
- step_kind ごとの executor が要求する tools（例: web_search, twitter, tiktok 等）

## 入力
なし（cron 起動）。

## 実行手順（実装）
1. `Authorization: Bearer ${ANICCA_AGENT_TOKEN}` を必ず付けて `GET {API_BASE_URL}/api/ops/step/next` を呼ぶ。
2. `step` が `null` なら `{ ok: true, reason: "queue_empty" }` として終了。
3. `step.stepKind` ごとの executor を実行（最低限: `noop` でも可）。失敗時は `status=failed`。
4. 必ず `PATCH {API_BASE_URL}/api/ops/step/{id}/complete` に `status/output/error/events` を送信して終了。

### 最低限の API 呼び出し例（curl）
```bash
curl -sfS -H "Authorization: Bearer $ANICCA_AGENT_TOKEN" \
  "$API_BASE_URL/api/ops/step/next"
```

```bash
curl -sfS -X PATCH -H "Authorization: Bearer $ANICCA_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"succeeded","output":{"ok":true},"events":[]}' \
  "$API_BASE_URL/api/ops/step/<STEP_ID>/complete"
```

## 出力 / 監査ログ
- step 取得・実行・complete の結果を runs に記録。
- events は ops_events に emit。

## 失敗時処理
- executor 失敗: `status: failed`, `error` を付けて complete。
- ネットワークエラー: 次回 cron で再 claim 可能（running のまま stale になる場合は staleRecovery で処理）。

## 禁止事項
- X 返信禁止（post_x は投稿のみ）。
- TikTok 返信禁止。

## Cron
`* * * * *` (毎分)
