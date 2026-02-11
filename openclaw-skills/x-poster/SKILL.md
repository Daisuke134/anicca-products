# x-poster

## 目的
X 投稿の Proposal を作成。steps: `draft_content -> verify_content -> post_x`。X は**投稿のみ**（返信禁止）。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `ANICCA_AGENT_TOKEN` | ops 認証 |
| `TWITTERAPI_KEY` 等 | X API（post_x step で使用） |

## 必須 tools
- `web_fetch`（API）
- X 投稿用 OAuth/API（executePostX 内）

## 入力
- cron slot 起動時: trigger で proposal 作成。
- `skillName: "x-poster"`, `steps: [draft_content, verify_content, post_x]`。

## 実行手順
1. ops-heartbeat の trigger または cron で proposal 作成。
2. mission-worker が draft_content -> verify_content -> post_x を順実行。
3. 文字数上限 260、429/5xx のみリトライ（最大3回）、DLQ に非リトライを退避。

## 出力 / 監査ログ
- `post_x` 完了時: `tweet_posted` イベント、postId を output に含める。
- 失敗時: DLQ + ops event。

## 失敗時処理
- 429: 60/300/1800s でリトライ。
- 5xx: 同様リトライ。
- その他: DLQ + ops event。

## 禁止事項
- **X 返信は絶対禁止**。投稿のみ。
- 文字数 260 超禁止。

## Cron
- `x-poster-morning`: `0 9 * * *`
- `x-poster-evening`: `0 21 * * *`
