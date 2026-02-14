# roundtable-memory-extract

## 目的
会話から Memory を抽出。Structured Memory として保存。

## 保存先（Anicca 内・フルパス）

| 種類 | フルパス |
|------|----------|
| 実行結果 | `/home/anicca/.openclaw/workspace/roundtable-memory-extract/run_YYYY-MM-DD.json` |

VPS 相対: `~/.openclaw/workspace/roundtable-memory-extract/run_YYYY-MM-DD.json`。

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
1. `POST {API_BASE_URL}/api/admin/roundtable/memory-extract` を呼ぶ。
2. API が会話から Memory を抽出・保存。

## 出力 / 監査ログ
- `{ success: true, result }`

## 失敗時処理
- 5xx: 次回 cron で再実行。

## 禁止事項
- なし。

## Cron
`55 8 * * *` (08:55 JST)
