# moltbook-monitor

## 目的
Moltbook を監視し、返信/介入の候補を検出。shadow モードでもイベントを emit。実送信は moltbook-poster が担当。Moltbook の API/インターフェースを使用する。

## 保存先（Anicca 内・フルパス）

| 種類 | フルパス |
|------|----------|
| 監視結果 | `/home/anicca/.openclaw/workspace/moltbook-monitor/run_YYYY-MM-DD.json` |

VPS 相対: `~/.openclaw/workspace/moltbook-monitor/run_YYYY-MM-DD.json`。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `INTERNAL_AUTH_SECRET` | admin jobs 認証 |
| `MOLTBOOK_BASE_URL` | Moltbook API ベース |
| `MOLTBOOK_ACCESS_TOKEN` | Moltbook 認証 |

## 必須 tools
- `web_fetch`（API 呼び出し）

## 入力
- なし（cron 起動）。

## 実行手順
1. `POST {API_BASE_URL}/api/admin/jobs/moltbook-shadow-monitor` を呼ぶ。
2. API が Moltbook をポーリングし、返信候補を検出。
3. shadow: 生成 + 監査ログのみ。実送信は moltbook-poster へ委譲。

## 出力 / 監査ログ
- `{ success: true, result }`
- 検出した候補を監査ログに記録。

## 失敗時処理
- Moltbook API エラー: 次回 cron で再試行。
- 認証エラー: Slack 通知。

## 禁止事項
- 実送信しない（monitor は検出のみ）。送信は moltbook-poster。

## Cron
`*/5 * * * *` (5分ごと)
