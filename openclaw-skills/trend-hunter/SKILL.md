# trend-hunter

## 目的
バズっている話題を複数ソースから収集し、13 ProblemType に関連付けて hook 候補を作成。`run_trend_scan` step 経由で proposal 起票。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `ANICCA_AGENT_TOKEN` | ops 認証トークン |
| `APIFY_API_TOKEN` | Apify（TikTok/Reddit 等）用 |
| `REDDAPI_API_KEY` | Reddit API（オプション） |

## 必須 tools
- `web_fetch`（API）
- Apify / Reddit 等のデータ取得（API 内 trend-hunter orchestrator で実行）

## 入力
- cron 起動時: trigger 経由で proposal が自動作成される。
- 手動: `POST /api/ops/proposal` で `skillName: "trend-hunter"`, `steps: [{ kind: "run_trend_scan" }]`。

## 実行手順
1. proposal 作成（trigger または手動）。
2. mission-worker が `run_trend_scan` step を claim。
3. trend-hunter orchestrator が TikTok/Reddit/X 等から話題を収集。
4. hook_candidate を保存し、`hook_saved`, `scan_completed` イベントを emit。

## 出力 / 監査ログ
- `output: { hooksSaved, events }`
- DLQ に失敗分を退避。

## 失敗時処理
- 429/5xx: リトライ（最大3回）または DLQ。
- クレジット枯渇: ops event + Slack（24h 重複抑止）。

## 禁止事項
- 送信（投稿）しない。収集と保存のみ。

## Cron
`0 */4 * * *` (4時間ごと)
