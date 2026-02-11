# tiktok-poster

## 目的
TikTok 投稿の Proposal を作成。steps: `draft_content -> verify_content -> post_tiktok`。TikTok は**投稿のみ**。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `ANICCA_AGENT_TOKEN` | ops 認証 |
| TikTok API 認証 | post_tiktok step で使用 |

## 必須 tools
- `web_fetch`（API）
- TikTok 投稿用 API（executePostTiktok 内）

## 入力
- cron slot 起動時: trigger で proposal 作成。
- `skillName: "tiktok-poster"`, `steps: [draft_content, verify_content, post_tiktok]`。

## 実行手順
1. ops-heartbeat の trigger または cron で proposal 作成。
2. mission-worker が draft_content -> verify_content -> post_tiktok を順実行。
3. 文字数上限 2000、429/5xx のみリトライ、DLQ に非リトライを退避。

## 出力 / 監査ログ
- `post_tiktok` 完了時: 投稿 ID を output に含める。
- 失敗時: DLQ + ops event。

## 失敗時処理
- 429/5xx: リトライ（最大3回）。
- その他: DLQ + ops event。

## 禁止事項
- 返信禁止。投稿のみ。
- 文字数 2000 超禁止。

## Cron
- `tiktok-poster-morning`: `0 9 * * *`
- `tiktok-poster-evening`: `0 21 * * *`
