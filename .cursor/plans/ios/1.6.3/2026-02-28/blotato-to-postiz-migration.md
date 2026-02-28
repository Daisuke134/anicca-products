# Blotato → Postiz 移行スペック

**Date**: 2026-02-28
**Author**: Anicca
**Status**: ⬜ 未実行

---

## ソース

| # | ソース | URL | 核心の引用 |
|---|--------|-----|-----------|
| S1 | Postiz Public API Docs | https://docs.postiz.com/public-api/posts/create | 「POST api.postiz.com/public/v1/posts + Authorization header」 |
| S2 | Postiz API Overview | https://docs.postiz.com/public-api | 「30 requests per hour limit. The UI uses channel, the API uses integration.」 |
| S3 | Postiz Agent CLI | https://postiz.com/agent | 「postiz analytics:post <post-id> -d 7 — Returns metrics (Followers, Impressions, Likes, Comments)」 |
| S4 | Build In Public Roadmap | https://github.com/buildinginpublic/buildinpublic | 「Phase 5: Metrics, Reflection, and Adjustment」 |

---

## 背景

Blotato サブスク解約済み（2026-02-28）。5スキルがBlotato APIを使っている。全てPostiz APIに移行する。

---

## Postiz Integration IDs（確認済み）

```
GET api.postiz.com/public/v1/integrations で取得済み（2026-02-28）

X @aniccaxxx:       cmm6d7m5703rwpr0yr5vtme3w
TikTok @anicca.jp2: cmlrv8jq000hun60yy57eaptx
TikTok @aniccaen2:  cmlt171eq04d9r00yzzceb6bw
Slack:              cmlrv5o0t00hgn60y734e1q3c
```

env: POSTIZ_API_KEY と POSTIZ_TIKTOK_INTEGRATION_ID は設定済み。
追加必要: POSTIZ_X_INTEGRATION_ID=cmm6d7m5703rwpr0yr5vtme3w を ~/.openclaw/.env に追加。

---

## Postiz API リファレンス（S1引用）

### X投稿（即時）

```bash
curl -X POST "https://api.postiz.com/public/v1/posts" \
  -H "Authorization: ${POSTIZ_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "now",
    "shortLink": false,
    "tags": [],
    "posts": [{
      "integration": { "id": "${POSTIZ_X_INTEGRATION_ID}" },
      "value": [{ "content": "<ツイートテキスト>" }],
      "settings": { "__type": "x", "who_can_reply_post": "everyone" }
    }]
  }'
```

レスポンスから posts[0].id を取得 → メトリクス取得に使う。
レスポンスから posts[0].releaseURL で公開URLを取得。

### メトリクス取得（S3引用）

```bash
postiz analytics:post <post-id> -d 7
```

Returns: Impressions, Likes, Comments, percentage change。

---

## 実行ステップ

### Step 0: .env に POSTIZ_X_INTEGRATION_ID 追加

```bash
echo 'POSTIZ_X_INTEGRATION_ID=cmm6d7m5703rwpr0yr5vtme3w' >> ~/.openclaw/.env
```

| 状態 | ⬜ 未実行 |

---

### Step 1: x-poster SKILL.md 書き換え

ファイル: ~/.openclaw/skills/x-poster/SKILL.md

| セクション | Before（Blotato） | After（Postiz） |
|-----------|-------------------|-----------------|
| 必須env | BLOTATO_API_KEY, BLOTATO_ACCOUNT_ID_EN | POSTIZ_API_KEY, POSTIZ_X_INTEGRATION_ID |
| API Base URL | backend.blotato.com/v2 | api.postiz.com/public/v1 |
| 投稿Body | { "post": { "accountId": ..., "content": { "text": ..., "platform": "twitter" }, "target": { "targetType": "twitter" } } } | { "type": "now", "shortLink": false, "tags": [], "posts": [{ "integration": { "id": "${POSTIZ_X_INTEGRATION_ID}" }, "value": [{ "content": "<text>" }], "settings": { "__type": "x", "who_can_reply_post": "everyone" } }] } |
| ステータス取得 | GET backend.blotato.com/v2/posts/{postSubmissionId} → ポーリング → publicUrl | レスポンスの posts[0].releaseURL で即取得 |
| 認証ヘッダー | blotato-api-key: ${BLOTATO_API_KEY} | Authorization: ${POSTIZ_API_KEY} |
| 投稿先 | BLOTATO_ACCOUNT_ID_EN | cmm6d7m5703rwpr0yr5vtme3w (@aniccaxxx) |
| 禁止事項 | api.blotato.com 使用禁止 | 削除 |

| 状態 | ⬜ 未実行 |

---

### Step 2: build-in-public SKILL.md 書き換え

ファイル: ~/.openclaw/skills/build-in-public/SKILL.md

| セクション | Before | After |
|-----------|--------|-------|
| description | posts via Blotato API | posts via Postiz API |
| Step 6 タイトル | Blotato APIで投稿 | Postiz APIで投稿 |
| Step 6 curl | POST backend.blotato.com/v2/posts + blotato-api-key header + platforms: [{"platform": "twitter", "accountId": 29172}] | POST api.postiz.com/public/v1/posts + Authorization header + { "type": "now", "posts": [{ "integration": { "id": "cmm6d7m5703rwpr0yr5vtme3w" }, "value": [{ "content": "${TWEET_TEXT}" }], "settings": { "__type": "x", "who_can_reply_post": "everyone" } }] } |
| Step 7 Slack報告 | ACCOUNT_ID=29172 | integration: @aniccaxxx (cmm6d7m5703rwpr0yr5vtme3w) |
| エラーハンドリング | Blotato API失敗 / BLOTATO_API_KEY未設定 | Postiz API失敗 / POSTIZ_API_KEY未設定 |

投稿先変更: Blotato accountId 29172 → Postiz @aniccaxxx (cmm6d7m5703rwpr0yr5vtme3w)

| 状態 | ⬜ 未実行 |

---

### Step 3: trend-hunter SKILL.md 書き換え

ファイル: ~/.openclaw/skills/trend-hunter/SKILL.md

| セクション | Before | After |
|-----------|--------|-------|
| 必須env | BLOTATO_API_KEY（メトリクス用） | POSTIZ_API_KEY（メトリクス用） |
| メトリクス取得: X | GET backend.blotato.com/v2/posts/{postSubmissionId} でtweet ID取得 → X API v2で public_metrics | Postiz: GET api.postiz.com/public/v1/posts で投稿一覧 → releaseURL確認 → postiz analytics:post <id> -d 7 でメトリクス |
| メトリクス取得: TikTok | GET backend.blotato.com/v2/posts/{postSubmissionId} | Postiz analytics API で取得 |
| フロー説明 | 「Blotato への schedule は別 cron」 | 「Postiz への投稿は別 cron」 |
| 出力形式その2コメント | hooks/YYYY-MM-DD.json（Blotato に schedule する 1 本） | hooks/YYYY-MM-DD.json（Postiz で投稿する 1 本） |

| 状態 | ⬜ 未実行 |

---

### Step 4: article-writer SKILL.md 書き換え

ファイル: ~/.openclaw/skills/article-writer/SKILL.md

変更: エラーハンドリング表から以下の行を削除:
```
| Blotato API `api.blotato.com` が失敗 | 廃止済みエンドポイント | `backend.blotato.com` を使う |
```

理由: article-writerはBlotato/Postiz不使用。GitHub push → Zenn/dev.to。

| 状態 | ⬜ 未実行 |

---

### Step 5: tiktok-poster スキル削除

```bash
rm -rf ~/.openclaw/skills/tiktok-poster
```

理由: larryスキルがPostiz経由でTikTok投稿を代替済み。cronもない（動いてない）。

| 状態 | ⬜ 未実行 |

---

### Step 6: x-poster cron 2個停止

```bash
# cron IDは実行時に openclaw cron list で確認
openclaw cron rm <x-poster-morning-id>
openclaw cron rm <x-poster-evening-id>
```

理由: Dais指示。trend-hunter → x-poster のNudgeコンテンツパイプラインは一時停止。

| 状態 | ⬜ 未実行 |

---

### Step 7: build-in-public メトリクスフィードバックループ追加

build-in-public SKILL.md の Step 2（diary読む前）に以下を追加:

```markdown
### Step 1.5: 昨日の投稿メトリクス取得（S3, S4準拠）

source ~/.openclaw/.env

# Postiz APIで最新の投稿一覧を取得
POSTS=$(curl -s -H "Authorization: ${POSTIZ_API_KEY}" \
  "https://api.postiz.com/public/v1/posts")

# @aniccaxxx の最新投稿のメトリクスを取得
LATEST_POST_ID=$(echo "$POSTS" | python3 -c "
import json,sys
data = json.loads(sys.stdin.read())
posts = data.get('posts',[])
for p in posts:
    if p.get('integration',{}).get('id') == 'cmm6d7m5703rwpr0yr5vtme3w':
        print(p['id'])
        break
" 2>/dev/null)

if [ -n "$LATEST_POST_ID" ]; then
  METRICS=$(curl -s -H "Authorization: ${POSTIZ_API_KEY}" \
    "https://api.postiz.com/public/v1/analytics/post/${LATEST_POST_ID}?days=7")
  echo "昨日のメトリクス: $METRICS"
  mkdir -p ~/.openclaw/workspace/build-in-public
  echo "$METRICS" > ~/.openclaw/workspace/build-in-public/metrics-$(TZ=Asia/Tokyo date +%Y-%m-%d).json
fi
```

学習ルール（S4 Phase 5準拠）:
- インプレッション > 前回平均 → そのパターンを再利用
- エンゲージメント率 > 3% → そのフォーマットを継続
- 低パフォーマンス → パターン変更

| 状態 | ⬜ 未実行 |

---

### Step 8: TOOLS.md 更新

変更:
- 「X: Blotato API のみ」→「X: Postiz API のみ」
- 「TikTok: Blotato API のみ」→「TikTok: Postiz API のみ（larry経由）」
- 「BLOTATO_API_KEY: ✅ SET」→「BLOTATO_API_KEY: ❌ 解約済み（Postizに移行）」
- 「BLOTATO_ACCOUNT_ID_EN: ✅ SET」→ 削除
- 「BLOTATO_TIKTOK_ACCOUNT_ID: 28152」→ 削除
- 追加: 「POSTIZ_X_INTEGRATION_ID: cmm6d7m5703rwpr0yr5vtme3w (@aniccaxxx)」

| 状態 | ⬜ 未実行 |

---

### Step 9: AGENTS.md 更新

「運用・技術の正答」テーブル変更:
- 「X（Twitter）: Blotato API のみ」→「X（Twitter）: Postiz API のみ」
- 「TikTok: Blotato API のみ」→「TikTok: Postiz API のみ（larry経由）」

| 状態 | ⬜ 未実行 |

---

### Step 10: git commit & push

```bash
cd /Users/anicca/anicca-project
git add -A
git commit -m "refactor: migrate all skills from Blotato to Postiz API

- x-poster: Blotato → Postiz API (integration: @aniccaxxx)
- build-in-public: Blotato → Postiz API + target @aniccaxxx + metrics feedback loop
- trend-hunter: Blotato metrics → Postiz analytics API
- article-writer: remove Blotato error table remnant
- delete tiktok-poster skill (larry is replacement)
- stop x-poster cron (2 jobs)
- update TOOLS.md, AGENTS.md"
git push origin dev
```

| 状態 | ⬜ 未実行 |

---

## ハードウェア（別途・Xcode署名ブロッカー解決用）

| 買うもの | 場所 | 営業時間 |
|---------|------|---------|
| USB-A to USB-C 変換アダプタ | ドン・キホーテ 新宿東南口店（新宿区新宿3-36-10 ミラザ新宿） | 24時間営業 |
| マウス | 同上 | 同上 |

購入後: Xcode → Settings → Accounts → keiodaisuke@gmail.com 追加 → 証明書DL → 3アプリ提出可能。

---

## オリジナリティ: 0%

全判断はPostiz公式docs (S1, S2, S3) と Build In Public Roadmap (S4) に基づく。
