# sto-weekly-refresh

## 目的
STO（Schedule/Trigger/Observation）の週次リフレッシュ。UserStoModel 等を更新。投稿時間最適化の週次更新。

## 保存先（Anicca 内・フルパス）

| 種類 | フルパス |
|------|----------|
| 実行結果 | `/home/anicca/.openclaw/workspace/sto-weekly-refresh/run_YYYY-MM-DD.json` |

VPS 相対: `~/.openclaw/workspace/sto-weekly-refresh/run_YYYY-MM-DD.json`。

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
1. `POST {API_BASE_URL}/api/admin/jobs/sto-weekly-refresh` を呼ぶ。
2. **注意**: このエンドポイントは未実装の可能性あり。schedule_map / dayCycling 等のロジックを jobs に暴露する必要あり。

## 出力 / 監査ログ
- `{ success: true, result }`
- UserStoModel 更新数を記録。

## 失敗時処理
- 5xx: 次回 cron（翌週）で再実行。

## 禁止事項
- なし。

## Cron
`0 3 * * 0` (日曜 03:00 JST)
