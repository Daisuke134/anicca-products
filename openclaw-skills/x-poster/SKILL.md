# x-poster

## 目的
X 投稿の Proposal を作成。steps: `draft_content -> verify_content -> post_x`。X は**投稿のみ**（返信禁止）。朝は **slot 9am**、夜は **slot 9pm** の 1 本だけを使う。

## 保存先（Anicca 内・読むだけ）

| データ | フルパス |
|--------|----------|
| 投稿文（読む） | `/home/anicca/.openclaw/workspace/hooks/YYYY-MM-DD.json` の **slot "9am"** または **"9pm"** の `entries` のうち `platform: "x"` の `postText` |

VPS 相対: `~/.openclaw/workspace/hooks/YYYY-MM-DD.json`。trend-hunter がここに書いた 1 本をそのまま X に投稿する。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `ANICCA_AGENT_TOKEN` | ops 認証 |
| `BLOTATO_API_KEY` | Blotato API キー（X 投稿に必須） |
| `BLOTATO_ACCOUNT_ID_EN` | Blotato 上の X アカウント ID |

## 必須 tools
- `web_fetch`（API）
- X 投稿は **Blotato API のみ**（post_x step で `BLOTATO_*` 使用）。Twitter API 直接は使わない。

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
