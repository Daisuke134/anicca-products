# ops-heartbeat

## 目的
閉ループ制御プレーン。trigger/reaction/recovery を進め、次の Proposal/Mission/Step を生成・回復・監査する。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `ANICCA_AGENT_TOKEN` | ops 認証トークン |

## 必須 tools
- `web_fetch` または同等（API 呼び出し用）

## 入力
なし（cron 起動）。

## 実行手順
1. `Authorization: Bearer ${ANICCA_AGENT_TOKEN}` を付けて `POST {API_BASE_URL}/api/ops/heartbeat` を呼ぶ。
2. レスポンスの `triggers`, `reactions`, `insights`, `stale` を監査ログに記録する。

### API 呼び出し例（curl）
```bash
curl -sfS -X POST \
  -H "Authorization: Bearer $ANICCA_AGENT_TOKEN" \
  "$API_BASE_URL/api/ops/heartbeat"
```

## 出力 / 監査ログ
- `{ ok: true, elapsed, triggers, reactions, insights, stale }`
- 失敗時は `{ ok: false, error }`

## 失敗時処理
- 5xx: リトライは heartbeat 側で次回 cron に任せる（冪等）。
- ネットワークエラー: 次回 cron で再実行。

## 禁止事項
- なし（読み取り・制御のみ、送信しない）。

## Cron
`*/5 * * * *` (5分ごと)
