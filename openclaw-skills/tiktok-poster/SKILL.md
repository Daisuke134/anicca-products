# tiktok-poster

## 目的
TikTok 投稿の Proposal を作成。steps: `draft_content -> verify_content -> post_tiktok`。TikTok は**投稿のみ**。朝は **slot 9am**、夜は **slot 9pm** の 1 本だけを使う。

## 保存先（Anicca 内・読むだけ）

| データ | フルパス |
|--------|----------|
| キャプション・画像 URL（読む） | `/home/anicca/.openclaw/workspace/hooks/YYYY-MM-DD.json` の **slot "9am"** または **"9pm"** の `entries` のうち `platform: "tiktok"` の `caption` と `imageUrl` |

VPS 相対: `~/.openclaw/workspace/hooks/YYYY-MM-DD.json`。trend-hunter がここに書いた 1 本をそのまま TikTok に投稿する。

## 必須 env
| キー | 説明 |
|------|------|
| `API_BASE_URL` | Anicca API ベースURL |
| `ANICCA_AGENT_TOKEN` | ops 認証 |
| `BLOTATO_API_KEY` | Blotato API キー（TikTok 投稿に必須） |
| `BLOTATO_TIKTOK_ACCOUNT_ID` | Blotato 上の TikTok アカウント ID（無い場合は `BLOTATO_ACCOUNT_ID_EN`） |

## 必須 tools
- `web_fetch`（API）
- TikTok 投稿は **Blotato API のみ**（post_tiktok step で `BLOTATO_*` 使用）。

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
