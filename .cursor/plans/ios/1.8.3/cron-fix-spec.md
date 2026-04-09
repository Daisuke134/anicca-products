# Cron Fix Spec — v1.8.3 Post-Submission Patches

> **Date**: 2026-04-09
> **Status**: ✅ EXECUTED (2026-04-09) — P1-P6全完了、全cron openai-codex/gpt-5.4-mini（subscription）に統一
> **Branch**: release/1.8.2（spec only、実装はdev worktreeから）
> **前提**: v1.8.3 build 10 + PPO A/B test は WAITING_FOR_REVIEW で提出済み。これらのパッチは再提出不要。

---

## 問題一覧

| # | 問題 | 重要度 | 影響範囲 |
|---|------|--------|---------|
| P1 | モデル不安定 — Anthropic fallback → credits切れ | HIGH | 9 crons |
| P2 | card-slideshow-ja — hook→テーマのマッピングなし | MED | 1 cron |
| P3 | card-slideshow-en — theme mappingに不正テーマ名 | MED | 1 cron |
| P4 | Postiz payload schema — card-slideshow EN/JA | MED | 2 crons |
| P5 | 旧Honne runtime cron 3つが重複 | HIGH | 3 crons |
| P6 | Source-managed 7 cron がruntimeに未登録 | HIGH | 7 crons |

---

## P1: モデル不安定 — Anthropic fallback → credits切れ

### 証拠

```
# reelclaw-en-1 直近3回のrun（全てclaude-sonnet-4-6でエラー）
openclaw cron runs --id a0a1d2fe --limit 3
→ error | model: claude-sonnet-4-6 / anthropic | "You're out of extra usage"
→ error | model: claude-sonnet-4-6 / anthropic | "You're out of extra usage"
→ error | model: claude-sonnet-4-6 / anthropic | "You're out of extra usage"

# reelclaw-ja-1 直近3回（今日だけgpt-5.4-miniで成功、昨日まで同じエラー）
openclaw cron runs --id 174f01dd --limit 3
→ ok    | model: gpt-5.4-mini / openai
→ error | model: claude-sonnet-4-6 / anthropic
→ error | model: claude-sonnet-4-6 / anthropic

# 全対象cronのmodel設定: NOT SET（~/.openclaw/cron/jobs.json で確認）
# agent default: openai/gpt-5.4（~/.openclaw/openclaw.json → agents.defaults.model.primary）
# cron list表示: openai/gpt-5.4-mini（ランタイム表示）
# 実際のrun: claude-sonnet-4-6 にフォールバックすることがある
```

### 根本原因

`model: NOT SET` のcronはランタイムのモデル解決に依存。agent default `openai/gpt-5.4` が一部の状況で `anthropic/claude-sonnet-4-6` にフォールバックし、Anthropic credits切れでエラー。

### パッチ

```bash
# 9 crons に明示的にmodel設定（honne-ja-morning/afternoon/evening は P5 で全3つ削除するので除外）
openclaw cron edit e5f13ac4-65ca-43ff-aa22-316d5b847b84 --model "openai-codex/gpt-5.4-mini"  # slideshow-ja-1
openclaw cron edit a31620a2-0465-4e66-a517-7b1e603a6ccd --model "openai-codex/gpt-5.4-mini"  # slideshow-en-1
openclaw cron edit a0a1d2fe-4087-4ee4-bc7b-526b6f8d8e65 --model "openai-codex/gpt-5.4-mini"  # reelclaw-en-1
openclaw cron edit d332ca34-2781-4484-b5d5-162fe7fced0f --model "openai-codex/gpt-5.4-mini"  # demo-reel-ja
openclaw cron edit 330bbaf7-3ea2-41f6-8479-f1c6f8ef1f45 --model "openai-codex/gpt-5.4-mini"  # reelclaw-en-2
openclaw cron edit 174f01dd-b2ae-413f-85f7-3b03236e3944 --model "openai-codex/gpt-5.4-mini"  # reelclaw-ja-1
openclaw cron edit a6ccfc01-42c8-4b5c-8c43-5713e90ee10d --model "openai-codex/gpt-5.4-mini"  # reelclaw-ja-2
openclaw cron edit dccfe539-2854-4fa2-927f-678a361d693a --model "openai-codex/gpt-5.4-mini"  # card-slideshow-en
openclaw cron edit 91b0bea8-ff00-43c4-898e-2902e333d2c9 --model "openai-codex/gpt-5.4-mini"  # card-slideshow-ja
# + 全残りcron（slideshow-2/3, daily-memory, build-in-public等24個）も同様に変更済み
```

### なぜ直る

`openclaw cron help edit` → `--model <model> Model override for agent jobs`。`openai-codex/gpt-5.4-mini` = ChatGPT subscription経由（API従量課金ではない）。明示設定すればAnthropicへのフォールバック防止。agent default も `openai-codex/gpt-5.4` に変更済み。fallback: `openai-codex/gpt-5.4-mini` → `openai-codex/gpt-5.3-codex-spark`。

---

## P2: card-slideshow-ja — hook→テーマのマッピングなし

### 証拠

```
# 最新runログ
openclaw cron runs --id 91b0bea8 --limit 1
→ ok | "card-slideshow-ja failed: missing card screenshot at
   /Users/anicca/anicca-project/assets/card-screenshots/ja/nature_1.png"

# JA cronメッセージ step 2（theme mappingなし）:
#   "2. テーマ→card-screenshot: .../ja/{theme}_{N}.png"
# EN cronメッセージ step 2（theme mappingあり）:
#   "theme mapping: self-hatred→self_hatred, overthinking→overthinking, ..."

# 存在するテーマ（ls | sed | sort -u）:
#   alcohol_dependency, anger, anxiety, bad_mouthing, cant_wake_up,
#   loneliness, lying, obsessive, porn_addiction, procrastination,
#   rumination, self_loathing, staying_up_late
# → "nature" は存在しない
```

### 根本原因

JAのcronメッセージにhook→テーマの明示的マッピングがない。エージェントが「疲れ果てたあなたに伝えたいこと」→ `nature` と自由推測し、存在しないファイルを参照。

### パッチ

```bash
openclaw cron edit 91b0bea8-ff00-43c4-898e-2902e333d2c9 --message "$(cat <<'CRONEOF'
Card slideshow投稿（JA DRAFT）。

1. フック10個からローテーション:
   hooks: ["自分を嫌いになってしまう人へ", "考えすぎが止まらない時に読んで", "怒りに支配される日々を終わらせたい", "もう頑張れないと思った時", "不安の正体を誰も教えてくれなかった", "理由もなく自分を責めてしまう人へ", "疲れ果てたあなたに伝えたいこと", "孤独が本当にあなたに与えている影響", "あなたは怠けてるんじゃない。心が限界なだけ。", "先延ばしの本当の原因は恐怖だった"]
2. テーマ→card-screenshot: /Users/anicca/anicca-project/assets/card-screenshots/ja/{theme}_{N}.png
   theme mapping: 自分を嫌い→self_loathing, 考えすぎ→rumination, 怒り→anger, 頑張れない→anxiety, 不安→anxiety, 自分を責め→self_loathing, 疲れ果て→staying_up_late, 孤独→loneliness, 怠け→procrastination, 先延ばし→procrastination
   Nはランダム(0-13)
3. mkdir -p /tmp/card-slideshow-ja
4. cp ~/.openclaw/workspace/tiktok-marketing/assets/6-slide-images/nature/slide1.png /tmp/card-slideshow-ja/slide1_raw.png
5. cp card-screenshot /tmp/card-slideshow-ja/slide2_raw.png
6. ffmpeg drawtext でフックをslide1にオーバーレイ:
   ffmpeg -y -i /tmp/card-slideshow-ja/slide1_raw.png -vf "drawtext=text='HOOK_TEXT':fontfile=/System/Library/Fonts/ヒラギノ角ゴシック W7.ttc:fontsize=72:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/3" /tmp/card-slideshow-ja/slide1.png
7. Postiz upload: curl -X POST https://app.postiz.com/api/media/upload-url -H "Authorization: Bearer $POSTIZ_TOKEN" -F "file=@/tmp/card-slideshow-ja/slide1.png" → get upload URL
8. Postiz POST /posts with exact payload:
   {
     "type": "now",
     "shortLink": false,
     "tags": [],
     "posts": [{
       "integration": {"id": "cmneo6zdj01mspa0yn322ay97"},
       "value": [{"content": "#メンタルヘルス #自己肯定感 #自己嫌悪 #癒し #共感 #仏教 #fyp", "image": [{"id": "slide1", "path": "UPLOAD_URL_FROM_STEP_7"}]}],
       "settings": {"__type": "tiktok", "title": "こんな言葉が欲しい人は、アニッチャ試してみて", "privacy_level": "SELF_ONLY", "content_posting_method": "UPLOAD", "video_made_with_ai": false, "duet": true, "stitch": true, "comment": true, "brand_content_toggle": false, "brand_organic_toggle": false}
     }]
   }
   ⚠️ DO NOT put hook text in content or title. Hook is ONLY on the slide overlay.

Do NOT report to Slack yourself — cron delivery handles it. Do NOT call the message tool.
CRONEOF
)"
```

### なぜ直る

1. theme mapping追加 → エージェントが実在テーマのみ参照
2. Postiz payload構造を明示 → `~/.openclaw/workspace/ugc-library/postiz_payload.json` の正確な構造（`image: [{id, path}]`）に準拠
3. Integration ID `cmneo6zdj01mspa0yn322ay97` = JA card-slideshow用（現行cronメッセージから取得）。`autoAddMusic` は reference payload に存在しないため削除

---

## P3: card-slideshow-en — theme mappingに不正テーマ名

### 証拠

```
# 現在のEN mapping:
#   self-hatred→self_hatred, overthinking→overthinking, burned-out→burnout, giving-up→laziness, lazy→laziness
# 実在テーマ:
#   self_loathing (not self_hatred), rumination (not overthinking),
#   staying_up_late (not burnout), procrastination (not laziness)

# 今日は anger にヒットして成功（anger は実在する）
openclaw cron runs --id dccfe539 --limit 1
→ ok | "selected hook 'when anger controls your whole day' with anger_0.png"
# → たまたま実在テーマに当たっただけ
```

### 根本原因

ENのtheme mappingの右辺に存在しないテーマ名が含まれている。

### パッチ

```bash
openclaw cron edit dccfe539-2854-4fa2-927f-678a361d693a --message "$(cat <<'CRONEOF'
Card slideshow投稿（EN DRAFT）。

1. フック10個からローテーション（過去7日と被らない）:
   hooks: ["message to those with self-hatred", "if you can't stop overthinking, read this", "when anger controls your whole day", "for anyone who feels like giving up", "the truth about your anxiety nobody tells you", "when you hate yourself for no reason", "if you're burned out, this is for you", "what loneliness actually does to your brain", "you're not lazy. your mind is exhausted.", "when procrastination isn't laziness but fear"]
2. テーマ→card-screenshot: /Users/anicca/anicca-project/assets/card-screenshots/en/{theme}_{N}.png
   theme mapping: self-hatred→self_loathing, overthinking→rumination, anger→anger, giving-up→anxiety, anxiety→anxiety, hate-yourself→self_loathing, burned-out→staying_up_late, loneliness→loneliness, lazy→procrastination, procrastination→procrastination
   Nはランダム(0-13)
3. mkdir -p /tmp/card-slideshow-en
4. cp ~/.openclaw/workspace/tiktok-marketing/assets/6-slide-images/nature/slide1.png /tmp/card-slideshow-en/slide1_raw.png
5. cp card-screenshot /tmp/card-slideshow-en/slide2_raw.png
6. ffmpeg drawtext でフックをslide1にオーバーレイ:
   ffmpeg -y -i /tmp/card-slideshow-en/slide1_raw.png -vf "drawtext=text='HOOK_TEXT':fontfile=$HOME/Library/Fonts/TikTokSansDisplayBold.ttf:fontsize=72:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/3" /tmp/card-slideshow-en/slide1.png
7. Postiz upload: curl -X POST https://app.postiz.com/api/media/upload-url -H "Authorization: Bearer $POSTIZ_TOKEN" -F "file=@/tmp/card-slideshow-en/slide1.png" → get upload URL
8. Postiz POST /posts with exact payload:
   {
     "type": "now",
     "shortLink": false,
     "tags": [],
     "posts": [{
       "integration": {"id": "cmnenjkff01j1pa0ysufmzhfr"},
       "value": [{"content": "#mentalhealth #selfcare #healing #selflove #anxiety #fyp", "image": [{"id": "slide1", "path": "UPLOAD_URL_FROM_STEP_7"}]}],
       "settings": {"__type": "tiktok", "title": "words you needed to hear today", "privacy_level": "SELF_ONLY", "content_posting_method": "UPLOAD", "video_made_with_ai": false, "duet": true, "stitch": true, "comment": true, "brand_content_toggle": false, "brand_organic_toggle": false}
     }]
   }
   ⚠️ DO NOT put hook text in content or title. Hook is ONLY on the slide overlay.

Do NOT report to Slack yourself — cron delivery handles it. Do NOT call the message tool.
CRONEOF
)"
```

### なぜ直る

全テーマ名が `ls assets/card-screenshots/en/ | sed 's/_[0-9]*\.png//' | sort -u` の出力と一致。Postiz payload は `postiz_payload.json` の構造と一致。Integration ID `cmnenjkff01j1pa0ysufmzhfr` = EN card-slideshow用（現行cronメッセージから取得、JA用 `cmneo6zdj01mspa0yn322ay97` とは別アカウント）。`autoAddMusic` は reference payload に存在しないため削除。

---

## P4: Postiz payload schema（P2・P3に統合済み）

P2/P3のメッセージ修正にPostiz正確なpayload構造を含めた。別パッチ不要。

---

## P5: 旧Honne runtime cron 3つ削除

### 証拠

```
# runtime cron list:
honne-ja-morning    09:00 JST  # ID: 5fb396fa
honne-ja-afternoon  15:00 JST  # ID: 109fc8dd
honne-ja-evening    20:00 JST  # ID: da38c28e

# source-managed（P6で登録予定）:
reelclaw-honne-ja-1  09:00 JST
reelclaw-honne-ja-2  15:00 JST
reelclaw-honne-ja-3  20:00 JST

# → 同時刻で重複
```

### 根本原因

旧形式のhonne cronがruntimeに残っている。新形式（reelclaw pipeline）に置き換えるために削除が必要。

### パッチ

```bash
openclaw cron rm 5fb396fa-ae68-4f9c-8ae0-122a858cc5ed   # honne-ja-morning
openclaw cron rm 109fc8dd-ff88-418b-9a79-09fa06ff8dcf   # honne-ja-afternoon
openclaw cron rm da38c28e-902c-4f7b-aa80-28af9801bc17   # honne-ja-evening
```

### なぜ直る

重複排除。新形式のreelclaw-honne cronが唯一のhonne投稿cronになる。

---

## P6: Source-managed 7 cron 登録

### 証拠

```
# openclaw cron list | grep -i "widget\|reelclaw-anicca\|reelclaw-honne" → 結果なし
# /Users/anicca/anicca-project/openclaw-skills/jobs.json には7つ定義済み
# openclaw gateway restart はsource-managed jobs.jsonを自動登録しない
```

### 根本原因

`openclaw gateway restart` はruntimeのcronスケジューラを再起動するが、source-managed jobs.jsonからの自動登録はしない。`openclaw cron add` で手動登録が必要。

### パッチ

```bash
# jobs.jsonからmessageを読み出してaddするスクリプト
python3 << 'PYEOF'
import json, subprocess

with open("/Users/anicca/anicca-project/openclaw-skills/jobs.json") as f:
    data = json.load(f)

targets = [
    "reelclaw-anicca-ja-widget-1",
    "reelclaw-anicca-ja-widget-2",
    "reelclaw-anicca-en-widget-1",
    "reelclaw-anicca-en-widget-2",
    "reelclaw-honne-ja-1",
    "reelclaw-honne-ja-2",
    "reelclaw-honne-ja-3",
]

for job in data["jobs"]:
    if job["id"] in targets:
        jid = job["id"]
        expr = job["schedule"]["expr"]
        tz = job["schedule"]["tz"]
        msg = job["payload"]["message"]
        cmd = [
            "openclaw", "cron", "add",
            "--name", jid,
            "--cron", expr,
            "--tz", tz,
            "--model", "openai-codex/gpt-5.4-mini",
            "--agent", "anicca",
            "--session", "isolated",
            "--announce",
            "--channel", "C091G3PKHL2",
            "--message", msg,
        ]
        print(f"Adding: {jid} ({expr} {tz})")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  OK")
        else:
            print(f"  ERROR: {result.stderr.strip()[-200:]}")

found = [job["id"] for job in data["jobs"] if job["id"] in targets]
missing = set(targets) - set(found)
if missing:
    print(f"\n⚠️ MISSING from jobs.json: {missing}")
else:
    print(f"\nAll {len(targets)} targets found and processed.")
PYEOF
```

### なぜ直る

`openclaw cron add` はruntimeのjobs.jsonに直接cronを登録する。`--model "openai-codex/gpt-5.4-mini"` を明示指定してP1と同じフォールバック問題を予防。`--agent anicca` でagent context設定、`--announce --channel C091G3PKHL2` でSlack配信設定。スクリプト末尾で全7つが見つかったか検証。

---

## 実行順序

| 順 | パッチ | コマンド数 | 理由 |
|----|--------|-----------|------|
| 1 | P5 | 3 | 重複防止のため旧cron先に削除 |
| 2 | P1 | 9 | モデル明示設定 |
| 3 | P2+P3 | 2 | card-slideshow message修正（theme mapping + Postiz） |
| 4 | P6 | 7 | 新cron登録 |
| 5 | `openclaw gateway restart` | 1 | 全変更反映（1回だけ） |

---

## Before/After タイムテーブル

| 時刻 JST | BEFORE | AFTER |
|----------|--------|-------|
| 07:00 | slideshow-ja-1 ❌ Anthropic fallback | slideshow-ja-1 ✅ gpt-5.4-mini明示 |
| 07:30 | slideshow-en-1 ❌ Anthropic fallback | slideshow-en-1 ✅ gpt-5.4-mini明示 |
| 08:00 | — | **reelclaw-anicca-ja-widget-1** ✅ NEW |
| 09:00 | honne-ja-morning ❌ 旧形式+credits切れ | **reelclaw-honne-ja-1** ✅ 新reelclaw形式 |
| 09:30 | — | **reelclaw-anicca-en-widget-1** ✅ NEW |
| 10:00 | card-slideshow-en ⚠️ 不正theme+Postiz schema | card-slideshow-en ✅ 正しいmapping+Postiz |
| 10:30 | card-slideshow-ja ⚠️ mappingなし+Postiz | card-slideshow-ja ✅ mapping追加+Postiz |
| 12:00 | reelclaw-ja-1 ⚠️ model不安定 | reelclaw-ja-1 ✅ gpt-5.4-mini明示 |
| 12:30 | reelclaw-en-1 ❌ Anthropic fallback | reelclaw-en-1 ✅ gpt-5.4-mini明示 |
| 14:00 | demo-reel-ja ❌ Anthropic fallback | demo-reel-ja ✅ gpt-5.4-mini明示 |
| 15:00 | honne-ja-afternoon ❌ 旧+credits切れ | **reelclaw-honne-ja-2** ✅ 新reelclaw形式 |
| 18:00 | — | **reelclaw-anicca-ja-widget-2** ✅ NEW |
| 19:00 | — | **reelclaw-anicca-en-widget-2** ✅ NEW |
| 20:00 | honne-ja-evening ⚠️ 旧形式 | **reelclaw-honne-ja-3** ✅ 新reelclaw形式 |
| 21:00 | reelclaw-ja-2 ⚠️ model不安定 | reelclaw-ja-2 ✅ gpt-5.4-mini明示 |
| 21:30 | reelclaw-en-2 ❌ Anthropic fallback | reelclaw-en-2 ✅ gpt-5.4-mini明示 |

---

## Postiz Integration ID マッピング

| cron | Postiz Integration ID | 用途 | ソース |
|------|----------------------|------|--------|
| card-slideshow-ja | `cmneo6zdj01mspa0yn322ay97` | JA TikTokアカウント | 現行cronメッセージから取得 |
| card-slideshow-en | `cmnenjkff01j1pa0ysufmzhfr` | EN TikTokアカウント | 現行cronメッセージから取得 |
| reelclaw-ja-1/2 | `cmnhlk3ju058lpn0ytilqdpo0` (TikTok) + 2つ (IG/YT) | Anicca JA 3プラットフォーム | 現行cronメッセージ |
| reelclaw-en-1/2 | `cmn8y47do02mmo70yckb46dyu` (TikTok) + 2つ (IG/YT) | Anicca EN 3プラットフォーム | 現行cronメッセージ |
| honne-ja-* | `cmnit95mg015rrm0ye5vm8dhl` | Honne JA TikTok | 現行cronメッセージ |
| reference (postiz_payload.json) | `cmlrv8jq000hun60yy57eaptx` | 旧テスト用（使用しない） | ugc-library/ |

---

## 検証ステップ（実行後）

```bash
# 1. P1: model設定確認
openclaw cron list 2>&1 | grep -E "slideshow|reelclaw|demo-reel" | grep -v TEST

# 2. P5: 旧honne削除確認
openclaw cron list 2>&1 | grep "honne-ja-morning\|honne-ja-afternoon\|honne-ja-evening"
# → 結果なし = OK

# 3. P6: 新cron登録確認
openclaw cron list 2>&1 | grep -E "widget|reelclaw-honne"
# → 7つ表示 = OK

# 4. P2/P3: 次回run後にログ確認
openclaw cron runs --id 91b0bea8 --limit 1  # card-slideshow-ja
openclaw cron runs --id dccfe539 --limit 1  # card-slideshow-en
# → "missing card screenshot" エラーなし = OK
```

---

## E2E判定

E2E不要。理由: cron configの変更のみ（runtime CLI操作）。iOSアプリコード変更なし。再提出不要。
