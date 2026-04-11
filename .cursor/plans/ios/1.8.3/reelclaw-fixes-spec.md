# Reelclaw + RevenueCat A/B Fixes Spec — v1.8.3 → v1.8.4

**Status**: 📝 DRAFT（実装前）
**Created**: 2026-04-11
**Updated**: 2026-04-12 r2（Option B: 2出力 ffmpeg / TT=autoAddMusic yes + UPLOAD public / IG,YT=BGM焼込 / Larry 再稼働 含む / RC paywall design は native SwiftUI 描画なので無関係）
**Goal**: $1k MRR by 2026-04-30（$46 → $1k = 21倍）
**Scope**: reelclaw 全 cron / Larry / Honne + Anicca iOS RevenueCat Experiments（Variant B: Weekly $12.99 + Annual $59.99）

## プラットフォーム配信マトリクス（ダイス確定 2026-04-11）

| スキル | TikTok | YouTube | Instagram | 言語 |
|--------|:------:|:-------:|:---------:|------|
| mau | ✅ EN | ✅ EN | — | EN only |
| larry | ✅ | — | ✅ | EN + JA |
| reelclaw card demo | ✅ | ✅ | ✅ | EN + JA |
| reelclaw widget | ✅ | ✅ | ✅ | EN + JA |
| reelclaw honne | ✅ | — | — | JA only |

**ルール**: 上4つ（mau/larry/reelclaw card/widget）= TT/YT/IG、最後（honne）= TT のみ。

**検証済現状（2026-04-12 実測）**:

| スキル | TT 現状 | IG 現状 | YT 現状 | 備考 |
|--------|---------|--------|---------|------|
| reelclaw card (ja/en) | ❌ SELF_ONLY (draft) | ✅ direct (post_type: reel) | ✅ direct (public) | POSTING RULES セクション書き換え必要 |
| reelclaw widget (ja/en) | ❌ DRAFT (自然言語) | ✅ direct (post_type: **post**) | ✅ direct (public) | 自然言語文字列置換必要 |
| reelclaw honne (ja) | ❌ draft / SELF_ONLY | — (対象外) | — (対象外) | TT only 維持、文字列置換必要 |
| larry | ❌ 全 disabled (2026-03-13 以降 error) | ❌ IG 実装なし | — | **本 spec 内で再稼働** |

**Larry 実測ステータス (2026-04-12 `jobs.json` 直接確認)**:

| Cron | enabled | lastRunStatus | 最終実行 |
|---|:---:|:---:|---|
| larry-post-morning/afternoon/evening | ❌ false | error | 2026-03-13 |
| larry-draft-mid-morning-{en,ja} | ❌ false | error | 2026-03-15〜21 |
| larry-draft-lunch-* | ❌ false | error | 2026-03-15〜21 |
| larry-draft-late-* | ❌ false | error | 2026-03-15〜21 |
| larry-daily-report-{en,ja} | ✅ true | success | 稼働中（**レポートのみ、投稿なし**） |
| larry-trend-hunter-{en,ja} | ✅ true | success | 稼働中（**トレンド調査のみ**） |
| larry-strategy-updater | ✅ true | success | 稼働中（**戦略更新のみ**） |

**結論**: Larry は 2026-03-13 以降 **1 本も投稿していない**。Post/Draft cron が全 disabled + error。スクリプト `~/.openclaw/workspace/skills/larry/scripts/post-to-tiktok.js` は TikTok 専用で IG 統合なし（プラットフォーム配信マトリクスの `larry IG ✅` は**未実装**）。

**IG post_type の違い**: card は `reel`、widget は `post` を既に使っている（確認済）。本 spec では変更しない（別途判断）。

## 開発環境

| 項目 | 値 |
|------|-----|
| 作業場所 | dev から worktree（`feature/reelclaw-rc-ab-fix`） |
| ブランチ | 未作成（実装開始時に `origin/dev` から切る） |
| 現ブランチ | release/1.8.2 |
| 状態 | Spec only、実装禁止（ダイス OK 待ち） |

## 触るファイル境界

| ファイル | 変更内容 |
|---------|---------|
| `~/.agents/skills/reelclaw/SKILL.md` | Step 3b 入力検証 / 3d textfile 強制+2段 / 3e 削除 / 3c で `-c:a copy` 修正 / 4b tiktok settings |
| `~/.agents/skills/reelclaw/references/ffmpeg-patterns.md` | wrap 指示追加 |
| `~/.agents/skills/reelclaw/references/green-zone.md` | hook only に削減 |
| `~/.openclaw/workspace/tiktok-marketing/reelclaw-widget-hooks-{ja,en}.json` | ダイス選別後に差し替え |
| `~/.openclaw/workspace/honne-ai/honne-hooks-ja.json` | ダイス選別後に差し替え |
| `~/.openclaw/workspace/tiktok-marketing/assets/demos/ja/` | loose mp4 を trimmed/ 外から削除 |
| `~/.openclaw/workspace/tiktok-marketing/assets/demos/demos-mapping.json` | rotation state reset |
| `~/.openclaw/cron/jobs.json` | reelclaw 11 cron の `payload.message` 書き換え（3 カテゴリ別の文字列置換、Patch A-6d 参照） |
| `~/.openclaw/cron/jobs.json` (Larry セクション) | larry-post-morning/afternoon/evening + larry-draft-* の `enabled: true` に戻す。原因調査後 |
| `~/.openclaw/workspace/skills/larry/scripts/post-to-tiktok.js` | エラー調査 (2026-03-13 以降 error) |
| `aniccaios/aniccaios/Services/SubscriptionManager.swift` L43/L148 | `result.offering(id:) ?? result.current` → `result.current ?? result.offering(id:)` に順序反転（RC Experiments が current を差し替えるため） |
| `aniccaios/aniccaios/Onboarding/PaywallVariantBView.swift` | weekly package 対応追加（現状 `.annual` / `.monthly` のみ）、display 名マッピング追加 |
| `aniccaios/aniccaios/Onboarding/OnboardingFlowView.swift` L95-125 | PostHog `paywall-ab-test` gating 削除 → PaywallVariantBView を常時表示（RC が Variant を返す） |
| `aniccaios/aniccaios/Services/SubscriptionManager.swift` L282-287 | weekly/annual B の display name マッピング追加 |

---

# PART A — Reelclaw Fixes

## Problem 1+2: リテラル `\n` / □ / 折り返しなし

**現象**: JSON に `\n` リテラル保存 → ffmpeg `text='...\n...'` は改行せず literal 描画。1行のままはみ出す。

**原因**: SKILL.md L397-407 に inline `drawtext=text='...'` 方式が併記されており、agent が選ぶと literal `\n` 描画。2段 drawtext を強制していない。

### Patch A-1: SKILL.md Step 3d 全面書き換え（L351-409）

**Before** (L383-407):
```bash
**For text WITH apostrophes** — use `textfile=` to avoid escaping issues:
printf "When nothing's wrong" > /tmp/hook_line1.txt

ffmpeg -y -hide_banner -loglevel error -i "reel-notext.mp4" \
  -vf "drawtext=textfile=/tmp/hook_line1.txt:\
    fontfile=$HOME/Library/Fonts/TikTokSansDisplayBold.ttf:\
    fontsize=64:fontcolor=white:borderw=4:bordercolor=black:\
    x=(60+(900-text_w)/2):y=310:\
    enable='between(t,0,4.5)'" \
  -c:v libx264 -preset fast -crf 18 -c:a copy -movflags +faststart \
  "reel-text.mp4"

**For text WITHOUT apostrophes** — use inline `text=`:
ffmpeg ... drawtext=text='All this worrying' ...
```

**After** (L383-409 完全置換):
```bash
### 3d. Add Hook Text (2-line centered, textfile method — MANDATORY)

**ALWAYS use textfile method. NEVER use inline `text='...'`.** Inline mode does not interpret `\n`.

Step 1: Split hook at `\n` into 2 lines (Python):
```python
import sys
hook = sys.argv[1]          # e.g. "Put affirmations\non your lockscreen"
parts = hook.split("\\n")   # JSON stores literal "\n" — split on 2 chars
line1 = parts[0].strip()
line2 = parts[1].strip() if len(parts) > 1 else ""
open("/tmp/hook_line1.txt", "w").write(line1)
open("/tmp/hook_line2.txt", "w").write(line2)
```

Step 2: ffmpeg 2段 drawtext chain（line2 が空でも安全。y=310/390、80px gap）:

**⚠️ 重要（2026-04-12 実測で発覚）**: x 座標は **必ず `(w-text_w)/2`** を使う。**旧式の `(60+(900-text_w)/2)` は使わない**。JA fontsize=64 で 14 文字以上だと `text_w > 900` → x が負値 → 左端が画面外に切れる。実測で widget-ja-20260411 と honne-ja-2 が両端切れで発生していた。

さらに JA は fontsize を **56 に統一**（全角文字は幅が広いため 64 だと 2 行目も切れるケースあり）。**1 行あたり最大 11-12 文字**を hook 選別時に目安にする。

```bash
FONT="$HOOK_FONT"   # from cron message Font: field
if [ -s /tmp/hook_line2.txt ]; then
  FILTER="drawtext=textfile=/tmp/hook_line1.txt:fontfile=${FONT}:fontsize=56:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=310:enable='between(t,0,4.5)',drawtext=textfile=/tmp/hook_line2.txt:fontfile=${FONT}:fontsize=56:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=390:enable='between(t,0,4.5)'"
else
  FILTER="drawtext=textfile=/tmp/hook_line1.txt:fontfile=${FONT}:fontsize=56:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=350:enable='between(t,0,4.5)'"
fi

ffmpeg -y -hide_banner -loglevel error -i "reel-notext.mp4" \
  -vf "$FILTER" \
  -c:v libx264 -preset fast -crf 18 -c:a copy -movflags +faststart \
  "reel-text.mp4"
```

**SKILL.md L402-412 の inline `text=` variant は物理的に削除する**。残っているとエージェントが選択肢として選べてしまい、literal `\n` 描画が再発する。実際に honne-ja-2 の出力動画で `\n` が `n` として描画されているのを 2026-04-12 に確認済。

Step 3: 出力検証（10% 失敗対策）:
```bash
SIZE=$(stat -f%z reel-text.mp4 2>/dev/null || stat -c%s reel-text.mp4)
if [ "$SIZE" -lt 200000 ]; then
  echo "ERROR: overlay failed (size=$SIZE)" >&2
  exit 1
fi
```
```

**Why**: textfile 強制 + Python で事前 split → `\n` を literal 描画する経路が消える。fontsize=56 で統一（medium）。line2 空のケースも分岐で吸収。サイズ検証で silent fail 早期検知。

---

## Problem 3: 違う動画混入（"Troy and Anicca..."）

**現象**: demo 以外の動画（CTA や onboarding mov）が混入

**原因**:
1. `demos/ja/` 直下に非 trimmed mp4 が残存（anger.mp4 / laziness.mp4 / self-hatred.mp4 / laziness_demo_reel.mp4 / notification-card-*.MP4 / onboarding-ja.MOV）
2. cron message は `assets/demos/ja/trimmed/{theme}.mp4` と指示済み、だが agent が folder scan で loose 拾う可能性

### Patch A-3: loose 削除 + demos-mapping rotation reset

```bash
# loose な非 trimmed を削除（trimmed/ は残す）
cd ~/.openclaw/workspace/tiktok-marketing/assets/demos/ja
rm -f anger.mp4 laziness.mp4 laziness_demo_reel.mp4 self-hatred.mp4 \
      notification-card-*.MP4 onboarding-ja.MOV

cd ~/.openclaw/workspace/tiktok-marketing/assets/demos/en
# EN も同様に loose 削除（trimmed/ 以外の mp4/mov を全て）
find . -maxdepth 1 -type f \( -name "*.mp4" -o -name "*.MP4" -o -name "*.mov" \) -delete

# rotation state reset
python3 <<'EOF'
import json
p = '/Users/anicca/.openclaw/workspace/tiktok-marketing/assets/demos/demos-mapping.json'
d = json.load(open(p))
for k, v in list(d.items()):
    if isinstance(v, dict) and 'lastUsed' in v:
        v['lastUsed'] = {}
json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2)
print("rotation reset")
EOF
```

**Why**: 誤って拾う物理経路を消す。rotation state cold start で全テーマ均等に。

---

## Problem 4: Hook clip トリム 10% 失敗

**現象**: DanSUGC クリップがたまに短くなる / 無音

**原因**: SKILL.md L320-325 の `ffmpeg -ss 1 -to 6` は元ソースが 6秒未満だと silent に短い出力。ffprobe 事前検証なし。

### Patch A-4: Step 3b 入力検証追加（L317-335 書き換え）

**Before** (L320-325):
```bash
ffmpeg -y -hide_banner -loglevel error \
  -i "hook.mp4" -ss 1 -to 6 \
  -vf "scale=1080:1920:..." \
  -an -c:v libx264 -preset fast -crf 18 -movflags +faststart \
  "hook-trimmed.mp4"
```

**After** (追加 + 変更):
```bash
# Input validation: source must be >= 6s
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "hook.mp4")
DUR_INT=$(python3 -c "import sys; print(int(float(sys.argv[1])))" "$DUR")
if [ "$DUR_INT" -lt 6 ]; then
  echo "ERROR: hook source too short ($DUR s), picking another" >&2
  exit 2   # caller should retry with next clip
fi

# Landscape source:
ffmpeg -y -hide_banner -loglevel error \
  -i "hook.mp4" -ss 1 -t 5 \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30" \
  -an -c:v libx264 -preset fast -crf 18 -movflags +faststart \
  "hook-trimmed.mp4"

# Output validation
OUT_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 hook-trimmed.mp4)
python3 -c "import sys; sys.exit(0 if float('$OUT_DUR') >= 4.8 else 1)" || { echo "trim failed"; exit 3; }
```

**Why**: `-to 6` → `-t 5` で duration 固定。ffprobe で入力・出力両方検証。short clip が生成される経路を物理的に遮断。exit code で呼び元が retry 可能。

---

## Problem 5: 文字サイズ不統一

**現象**: サイズが日によって 64/52/48 と変わる

**原因**: green-zone.md に hook=64 / CTA=52 / subtitle=48 が並列記載され、agent が CTA や subtitle の preset を hook に流用する

### Patch A-5a: SKILL.md Step 3d で `fontsize=56` ハードコード

Patch A-1 で既に `fontsize=56` 固定済（Patch A-1 参照）。

### Patch A-5b: green-zone.md L55-73 書き換え

**Before**:
```
**"Hook" — Upper green zone:** fontsize=64 y=310
**"Hook with Box":** fontsize=64 y=310
**"CTA" — Lower green zone:** fontsize=52 y=1380
**"Subtitle":** fontsize=48 y=1350
```

**After** (CTA と Subtitle を削除):
```
**Hook ONLY — reelclaw はフック文字だけ使う。CTA/Subtitle preset は削除済み。**

Style: fontfile=<from cron Font:>:fontsize=56:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=310 (line1) / y=390 (line2)

CTA は Postiz `settings.title` で TikTok ネイティブに付与。ffmpeg overlay しない。
```

**Why**: 選択肢を 1 つに。cron は title で CTA 出すので green-zone での CTA preset は不要。

---

## Problem 6: Draft 投稿 → DIRECT_POST（BGM 焼き込みは維持）

**現象**:
- TikTok 投稿が全部 draft 保存 → 誰にも見られない → install ゼロ
- IG/YT は direct で既に公開されている（が overlay が読めないので Problem 1/2 の影響で価値がない）

**原因（検証済 2026-04-12）**:
1. **Card (reelclaw-ja/en)**: cron message に `POSTING RULES` セクションあり、`privacy_level: SELF_ONLY, content_posting_method: UPLOAD` を強制
2. **Widget (reelclaw-anicca-{ja,en}-widget-*)**: cron message に自然言語で `Publish to TikTok {JA,EN} as DRAFT via Postiz` と書かれている（POSTING RULES セクションは無い）
3. **Honne (reelclaw-honne-ja-*)**: cron message に `Posting mode: draft, SELF_ONLY` と書かれている（TT only）

**⚠️ CRITICAL 訂正（2026-04-12、実測で発覚）**

**方針: Option B — 2 出力 ffmpeg 分岐（ダイス確定 2026-04-12）**

ダイスの要望:
- **TikTok**: TT 内蔵の trending music を使いたい（autoAddMusic=yes）
- **Instagram / YouTube**: autoAddMusic API が無いので無音になる → **BGM を ffmpeg で焼き込み**

ファクト:
- Instagram Postiz API は `autoAddMusic` 非対応。BGM 焼き込み削除 = IG 完全無音。
- TikTok `autoAddMusic: "yes"` は UPLOAD + trending music 自動付与を意味する。BGM 焼き込み済み動画を送るとユーザー選択された BGM と衝突する。
- よって **TT 用と IG/YT 用で 2 つの mp4 を render.sh で生成する**。

**Source**: https://docs.postiz.com/public-api/providers/tiktok, SKILL.md L418-434

### Patch A-6a: SKILL.md Step 3e を 2 分岐出力に書き換え

**Before** (L418-434 付近): Step 3e が `final.mp4` 1 本だけを生成

**After**: Step 3e を 2 本出力に変更

```bash
# Step 3e — IG/YT 用 (BGM 焼き込み)
ffmpeg -y -i "$work/base.mp4" -i "$HOME/.openclaw/workspace/skills/reelclaw/assets/bgm-cta.mp3" \
  -filter_complex "[1:a]volume=0.8,afade=t=in:st=0:d=0.5,afade=t=out:st=9:d=0.5[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -shortest \
  "$work/final-bgm.mp4"

# Step 3e-bis — TikTok 用 (音声なし、autoAddMusic=yes で TT trending music を自動付与)
cp "$work/base.mp4" "$work/final-nomusic.mp4"
```

render.sh も同じ 2 出力化を全 workspace に適用:
- `~/.openclaw/workspace/reelclaw-*/render.sh`
- `~/.openclaw/workspace/honne-ai/render.sh`（honne は TT only なので `final-nomusic.mp4` のみで OK）

### Patch A-6b: SKILL.md Step 4 payload 生成を 2 出力対応に

**Before** (L488-500 付近): 全 platform が同じ `final.mp4` を参照

**After**: platform ごとに別ファイル参照

```json
// TikTok payload
{
  "video_url": "<cdn_url>/final-nomusic.mp4",
  "privacy_level": "PUBLIC_TO_EVERYONE",
  "content_posting_method": "DIRECT_POST",
  "autoAddMusic": "yes",
  "video_made_with_ai": false,
  "duet": true,
  "stitch": true,
  "comment": true,
  "brand_content_toggle": false,
  "brand_organic_toggle": false
}

// Instagram payload (post_type: reel for card, post for widget)
{
  "video_url": "<cdn_url>/final-bgm.mp4",
  "__type": "instagram-standalone",
  "post_type": "reel"
}

// YouTube payload
{
  "video_url": "<cdn_url>/final-bgm.mp4",
  "__type": "youtube",
  "type": "public",
  "selfDeclaredMadeForKids": "no"
}
```

| Platform | 使うファイル | TT 設定 |
|----------|-------------|---------|
| TikTok | `final-nomusic.mp4` | `autoAddMusic: "yes"` + `content_posting_method: "DIRECT_POST"` + `privacy_level: "PUBLIC_TO_EVERYONE"` |
| Instagram | `final-bgm.mp4` | — |
| YouTube | `final-bgm.mp4` | — |

**Postiz docs 確認済** (https://docs.postiz.com/public-api/providers/tiktok):
- `DIRECT_POST` = TikTok に直接投稿（公開）
- `UPLOAD` = TikTok アプリを開いて手動で投稿（= draft と同じ）
- `autoAddMusic: "yes"` は TT 側で trending music を自動付与（DIRECT_POST と併用可）

→ 公開したいので **DIRECT_POST + autoAddMusic: "yes"** の組み合わせが正解。UPLOAD だと過去と同じく draft 扱いで誰にも見られない。

### Patch A-6c: 11 reelclaw cron 書き換え（3 カテゴリ別）

**カテゴリ 1: Card（reelclaw-ja-1/2, reelclaw-en-1/2）= 4 cron**

POSTING RULES セクションあり。文字列置換:

```
BEFORE: privacy_level: SELF_ONLY, content_posting_method: UPLOAD, video_made_with_ai: false, autoAddMusic: "no", duet: false, stitch: false, comment: false, brand_content_toggle: false, brand_organic_toggle: false.
AFTER:  privacy_level: PUBLIC_TO_EVERYONE, content_posting_method: DIRECT_POST, video_made_with_ai: false, autoAddMusic: "yes", duet: true, stitch: true, comment: true, brand_content_toggle: false, brand_organic_toggle: false.
```

**カテゴリ 2: Widget（reelclaw-anicca-{ja,en}-widget-1/2）= 4 cron**

自然言語で `Publish to TikTok {JA,EN} as DRAFT via Postiz. TikTok draft creation is REQUIRED, not optional.` と書かれている。これを削除して POSTING RULES セクションを追加する:

```
BEFORE: Publish to TikTok JA as DRAFT via Postiz. TikTok draft creation is REQUIRED, not optional. If TikTok draft creation fails or is skipped, treat the run as FAILURE even if Instagram or YouTube succeed. Publish to Instagram JA (direct) and YouTube JA (direct) only after TikTok draft is created.
AFTER:  Publish to TikTok, Instagram, YouTube via Postiz (3 separate direct posts). TikTok settings: privacy_level: PUBLIC_TO_EVERYONE, content_posting_method: DIRECT_POST, video_made_with_ai: false, autoAddMusic: "yes", duet: true, stitch: true, comment: true, brand_content_toggle: false, brand_organic_toggle: false. ALL 3 platforms must post successfully — if any one fails, treat the run as FAILURE.
```

widget-en 版も同じ（`JA` → `EN`）。

**カテゴリ 3: Honne（reelclaw-honne-ja-1/2/3）= 3 cron — TT ONLY**

自然言語で `Publish to TikTok ONLY via Postiz. ... Posting mode: draft, SELF_ONLY.` と書かれている:

```
BEFORE: Publish to TikTok ONLY via Postiz. TikTok integration: cmnit95mg015rrm0ye5vm8dhl. Posting mode: draft, SELF_ONLY.
AFTER:  Publish to TikTok ONLY via Postiz. TikTok integration: cmnit95mg015rrm0ye5vm8dhl. Posting mode: direct post, PUBLIC_TO_EVERYONE. TikTok settings: privacy_level: PUBLIC_TO_EVERYONE, content_posting_method: DIRECT_POST, video_made_with_ai: false, autoAddMusic: "yes", duet: true, stitch: true, comment: true, brand_content_toggle: false, brand_organic_toggle: false.
```

### Patch A-6d: cron 書き換えスクリプト（3 カテゴリ対応、実装時に実行）

```python
import json
p = '/Users/anicca/.openclaw/cron/jobs.json'
d = json.load(open(p))

# カテゴリ 1: Card
CARD_TARGETS = {'reelclaw-ja-1','reelclaw-ja-2','reelclaw-en-1','reelclaw-en-2'}
CARD_BEFORE = 'privacy_level: SELF_ONLY, content_posting_method: UPLOAD, video_made_with_ai: false, autoAddMusic: "no", duet: false, stitch: false, comment: false, brand_content_toggle: false, brand_organic_toggle: false.'
CARD_AFTER  = 'privacy_level: PUBLIC_TO_EVERYONE, content_posting_method: DIRECT_POST, video_made_with_ai: false, autoAddMusic: "yes", duet: true, stitch: true, comment: true, brand_content_toggle: false, brand_organic_toggle: false.'

# カテゴリ 2: Widget (JA + EN)
WIDGET_TARGETS = {'reelclaw-anicca-ja-widget-1','reelclaw-anicca-ja-widget-2','reelclaw-anicca-en-widget-1','reelclaw-anicca-en-widget-2'}
def widget_patch(msg):
    for lang in ('JA','EN'):
        before = f'Publish to TikTok {lang} as DRAFT via Postiz. TikTok draft creation is REQUIRED, not optional. If TikTok draft creation fails or is skipped, treat the run as FAILURE even if Instagram or YouTube succeed. Publish to Instagram {lang} (direct) and YouTube {lang} (direct) only after TikTok draft is created.'
        after  = f'Publish to TikTok, Instagram, YouTube via Postiz (3 separate direct posts). TikTok settings: privacy_level: PUBLIC_TO_EVERYONE, content_posting_method: DIRECT_POST, video_made_with_ai: false, autoAddMusic: "yes", duet: true, stitch: true, comment: true, brand_content_toggle: false, brand_organic_toggle: false. ALL 3 platforms must post successfully — if any one fails, treat the run as FAILURE.'
        if before in msg:
            return msg.replace(before, after)
    return None

# カテゴリ 3: Honne
HONNE_TARGETS = {'reelclaw-honne-ja-1','reelclaw-honne-ja-2','reelclaw-honne-ja-3'}
HONNE_BEFORE = 'Posting mode: draft, SELF_ONLY.'
HONNE_AFTER  = 'Posting mode: direct post, PUBLIC_TO_EVERYONE. TikTok settings: privacy_level: PUBLIC_TO_EVERYONE, content_posting_method: DIRECT_POST, video_made_with_ai: false, autoAddMusic: "yes", duet: true, stitch: true, comment: true, brand_content_toggle: false, brand_organic_toggle: false.'

count = 0
for job in d.get('jobs', []):
    name = job.get('name','')
    msg = job.get('payload', {}).get('message', '')
    new_msg = None
    if name in CARD_TARGETS and CARD_BEFORE in msg:
        new_msg = msg.replace(CARD_BEFORE, CARD_AFTER)
    elif name in WIDGET_TARGETS:
        new_msg = widget_patch(msg)
    elif name in HONNE_TARGETS and HONNE_BEFORE in msg:
        new_msg = msg.replace(HONNE_BEFORE, HONNE_AFTER)
    if new_msg:
        job['payload']['message'] = new_msg
        count += 1
json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2)
print(f"updated {count}/11 crons")
```

⚠️ 重要: **既存の spec にあった Patch A-6d は `job['input']['message']` を参照していたが、実際の jobs.json スキーマは `job['payload']['message']`。** 古いスクリプトは 0 件ヒットで silent success していた。修正済。

その後:
```bash
openclaw gateway restart
```

### Patch A-6e: Larry 再稼働（本 spec に含める — 2026-04-12 ダイス確定）

**現状（2026-04-12 検証済、jobs.json 直接ダンプ）**:
- 9 個の larry posting/draft cron が **全て `enabled: false`**（post-morning/afternoon/evening + draft-mid-morning-{en,ja} + draft-lunch-{en,ja} + draft-late-{en,ja}）
- 最終実行 2026-03-13〜21、`lastRunStatus: error`
- アクティブなのは報告系のみ: larry-daily-report-{en,ja} / larry-trend-hunter-{en,ja} / larry-strategy-updater（投稿はしない）
- `~/.openclaw/workspace/skills/larry/scripts/post-to-tiktok.js` は TikTok のみ（IG 呼び出しなし）

**対応手順**:

1. **原因調査**: `larry-post-morning` の `lastRunError` を読む（jobs.json 内）+ `~/.openclaw/logs/` で 2026-03-13 前後のスタックトレース確認
2. **スクリプト修正**: post-to-tiktok.js のエラー箇所を直す（API 変更 / 認証切れ / 依存関係 破損 のどれか）
3. **TikTok 設定を Option B に合わせる**: スクリプト内のハードコード `autoAddMusic: 'no'` / `privacy_level: 'SELF_ONLY'` / `content_posting_method: 'UPLOAD'` を `'yes'` / `'PUBLIC_TO_EVERYONE'` / `'DIRECT_POST'` に変更
4. **cron enabled を true に戻す**: jobs.json で 9 個全て `enabled: true`
5. **`openclaw gateway restart`**
6. **手動 dry-run**: larry-post-morning を 1 回手動トリガー → TT に投稿されるか確認
7. **Instagram 統合は後回し**（別 spec）: Larry は現状 TT のみでも OK。IG は Phase 2 で

**注**: プラットフォーム配信マトリクスの `larry IG ✅` は**未実装**なので、本 spec では TT のみ再稼働する。IG 統合は次回 spec で。

**Why**: cron message が SKILL.md を override している限り、SKILL.md だけ直しても効果なし。両方直す必要あり。

---

## Problem 7: フック文言の質

ダイスが下から選別 → 採用・不採用を指示 → 実装。

### Widget JA（12本） — 現状
| ID | Text | 判定 |
|----|------|------|
| W1 | ロック画面にアファメーション\n置けるの知らなかった | ？ |
| W2 | どうせずっと\nスマホ見てるんだから | ？ |
| W3 | え、ずっと\nアファメーション見れたってこと？ | ？ |
| W4 | ロック画面に\nアファメーションを設定する方法 | ？ |
| W5 | ポジティブなアファメーションを\nロック画面に追加する方法 | ？ |
| W6 | POV: ロック画面に\nアファメーション必要 | ？ |
| W7 | POV: 毎時間新しい\nアファメーションくれるアプリ | ？ |
| W8 | ロック画面に\nアファメーションを設定する方法 🥺 | ？ |
| W9 | POV: スマホが感謝を\n思い出させてくれた | ？ |
| W10 | 毎朝、最初に\n目に入る言葉 | ？ |
| W11 | なんで誰も\n教えてくれなかったの... | ？ |
| W12 | 4年間不安と戦ってて\n今これ見つけたんだけど！？ | ？ |

### Widget EN（12本） — 現状
| ID | Text |
|----|------|
| W1 | Put affirmations\non your lockscreen? |
| W2 | Since you're always\non your phone |
| W3 | Watch affirmations\nall day long? |
| W4 | Put affirmations\non your lockscreen |
| W5 | Add positive affirmations\nto your lockscreen |
| W6 | POV: affirmations\non your lockscreen |
| W7 | New affirmations\nevery hour |
| W8 | Put affirmations\non your lock screen 🥺 |
| W9 | Your phone reminds you\nto be grateful |
| W10 | The first thing I see\nevery morning |
| W11 | Why did nobody tell me\nabout this... |
| W12 | 4 years of anxiety\nand I just found this!? |

### Honne JA（24本、HJA-001〜HJA-024） — 現状
ダイスに一括 list 送信予定。

### Reelclaw Cards JA/EN（7本ずつ、SKILL.md L365-381 ハードコード） — 現状
EN:
1. why did nobody tell me about this
2. when nothing's wrong but something is wrong
3. POV: your anxiety hits at 3am for no reason
4. i downloaded a silly little self care app not expecting it to work
5. you're not lazy. your brain is exhausted.
6. nobody talks about the version of you before healing
7. when you hate yourself for no reason

JA:
1. なんで誰も教えてくれなかったの
2. 別に何も悪くないのに、なんかおかしい
3. POV: 夜中3時に急に不安が襲ってくる
4. なんとなくセルフケアアプリ入れてみたら意外と効いた
5. 怠けてるんじゃない。脳が限界なだけ。
6. 回復する前の自分のこと、誰も話さないよね
7. 理由もないのに自分が嫌いになる時

---

# PART B — RevenueCat Experiments A/B（Variant B: Weekly $12.99 + Annual $59.99）

**方針**: Superwall 導入やめ。**RevenueCat Experiments（無料・ローカライズ対応）** で offering 切り替え A/B を実施。iOS コード変更は最小限。

## ⚠️ RC Dashboard の古い Paywall Design について（2026-04-12 調査結果）

**ダイスの懸念**: "anicca-Default" offering に 3 年前の古い Paywall Design が紐付いている。削除 / deactivate / 新 offering 作成のどれか必要か？

**調査結果**: **何もしなくて OK。古い Paywall Design はアプリに 1 ミリも表示されない。**

**ファクト**:

| 項目 | 状態 |
|------|------|
| RC Dashboard 内 `anicca-Default` offering の Paywall Design | 存在するが未使用 |
| iOS アプリ `PaywallVariantBView.swift` L1-5 | `import SwiftUI` + `import RevenueCat` + `import PostHog` のみ。`import RevenueCatUI` **なし** |
| 描画方法 | `offering?.availablePackages ?? []` を読んで **SwiftUI 自前描画** |
| RC `PaywallView()` / `presentPaywallIfNeeded` | 一切使ってない |

**Source**: https://www.revenuecat.com/docs/tools/paywalls/displaying-paywalls
**Quote**: RC 公式の全 iOS コード例は `import RevenueCatUI` + `PaywallView()` または `.presentPaywallIfNeeded` を使用。これが唯一の RC Hosted Paywall 描画方法。

**結論**: RC Hosted Paywall Design は `RevenueCatUI` SDK を経由しないと描画されない。Anicca は native SwiftUI で `offering.availablePackages` から price / period を読んで描画しているので、**RC 側の paywall design は完全に cosmetic/未使用**。

**やるべきこと**:
- ❌ `anicca-Default` の paywall design を削除する必要なし
- ❌ 新しい offering を作り直す必要なし
- ❌ deactivate も不要
- ✅ Experiment 作成時に Control=`anicca` / Treatment=`anicca_variant_b` を指定するだけ
- ✅ iOS 側は `PaywallVariantBView.swift` に weekly package サポート追加（B-4b 参照）

**Variant 設計**:

| Variant | Weekly | Monthly | Annual | 月換算 MRR 最大 | 目的 |
|---------|:------:|:-------:|:------:|:---------------:|------|
| A（現状 offering `anicca`） | — | $7.99 | $39.99 | $7.99 | 既存、ベースライン |
| B（新 offering `anicca_variant_b`） | $12.99 | — | $59.99 | ≈$56 | Weekly 価格抵抗↓ + Annual 高価格テスト |

**Source**: https://www.revenuecat.com/docs/tools/experiments
**Quote**: 「Experiments allow you to test changes to your paywall and see the impact on your business metrics... `offerings.current` will return the offering assigned by the experiment for that user.」

## B-0.1: Variant B 作成済み ID（2026-04-11 実行済）

| 項目 | ID / 値 |
|------|---------|
| ASC group B | `22027036` "Anicca Premium B" |
| ASC Weekly B | `6762049888` `ai.anicca.app.ios.weekly.b` $12.99 USA |
| ASC Annual B | `6762049696` `ai.anicca.app.ios.yearly.b` $59.99 USA |
| RC Weekly product | `prod8f94216c67` |
| RC Annual product | `prodecbf22e88d` |
| RC Offering | `ofrngb357e8cdb3` "anicca_variant_b" |
| RC Weekly package | `pkgee0fa83d4a1` `$rc_weekly` |
| RC Annual package | `pkge597d6c6c97` `$rc_annual` |
| RC entitlement (既存) | `entlb820c43ab7` "anicca Pro" — 両 product attach 済 |

**残り手動作業**:
- ASC review submit（スクショ追加 + `asc subscriptions review submit`）
- RC Dashboard で Experiment `paywall_ab_v1` 作成（MCP 未対応）
- WW 展開（現状 USA のみ — 必要なら `asc subscriptions pricing availability edit --territories "USA,CAN,GBR,..."`）

## B-0: App Store Connect 現状（2026-04-11 調査済）

| 項目 | 値 |
|------|-----|
| app | `6755129214` |
| subscription group（現行） | `21833082` "Anicca Premium" |
| Monthly A | `6755320627` `ai.anicca.app.ios.monthly` $7.99 |
| Annual A | `6755320744` `ai.anicca.app.ios.yearly` $39.99 |
| Introductory offer | 両方ゼロ（trial なし） |

**重要制約**: 同一 subscription group に同じ duration の product を複数作ると「ユーザーに見せる価格がどちらか分からない」ため、Apple は推奨しない。**Variant B の product は新 subscription group "Anicca Premium B" を作成して分離する。**

## B-1: Weekly $12.99 + Annual $59.99 を App Store Connect に登録（新 group）

```bash
APP_ID=6755129214

# Step 1: 新 subscription group 作成
asc subscriptions groups create \
  --app "$APP_ID" \
  --reference-name "Anicca Premium B"
# → 返る group ID を $GROUP_B に保存

# Step 2: Weekly $12.99 作成
asc subscriptions setup \
  --app "$APP_ID" \
  --group-id "$GROUP_B" \
  --reference-name "Anicca Weekly B" \
  --product-id "ai.anicca.app.ios.weekly.b" \
  --subscription-period ONE_WEEK \
  --locale "en-US" \
  --display-name "Weekly Premium" \
  --price "12.99" \
  --price-territory "USA" \
  --territories "WW"

# Step 3: Annual $59.99 作成
asc subscriptions setup \
  --app "$APP_ID" \
  --group-id "$GROUP_B" \
  --reference-name "Anicca Annual B" \
  --product-id "ai.anicca.app.ios.yearly.b" \
  --subscription-period ONE_YEAR \
  --locale "en-US" \
  --display-name "Annual Premium" \
  --price "59.99" \
  --price-territory "USA" \
  --territories "WW"

# Step 4: JA localization（両方）
asc subscriptions localizations create --subscription-id "$WEEKLY_B_ID" --locale "ja" --display-name "週額プレミアム" --description "週ごとに自動更新"
asc subscriptions localizations create --subscription-id "$ANNUAL_B_ID" --locale "ja" --display-name "年額プレミアム" --description "年ごとに自動更新"

# Step 5: introductory offer なし確認（trial 禁止 — ダイス指示）
asc offers introductory list --subscription-id "$WEEKLY_B_ID"
asc offers introductory list --subscription-id "$ANNUAL_B_ID"
# あれば delete

# Step 6: review screenshot + 提出
asc subscriptions review screenshots create --subscription-id "$WEEKLY_B_ID" --file "./weekly_b_review.png"
asc subscriptions review screenshots create --subscription-id "$ANNUAL_B_ID" --file "./annual_b_review.png"
asc subscriptions review submit --subscription-id "$WEEKLY_B_ID" --confirm
asc subscriptions review submit --subscription-id "$ANNUAL_B_ID" --confirm
```

**Gotcha**: availability → pricing の順序（`.claude/rules/platform-gotchas.md`）。`setup` は一括で両方設定するので安全。

## B-2: RevenueCat に Variant B offering / products / packages 作成（MCP）

**RC 現状**（2026-04-11 調査済）:
- project: `projbb7b9d1b`
- iOS app: `app511ef26659`
- 既存 offering: `ofrng78a01eb506` "anicca"（current）
- entitlement: `entlb820c43ab7` "premium"

```json
// Step 1: Variant B の products 作成（MCP）
mcp__revenuecat__create-product {
  "project_id": "projbb7b9d1b",
  "app_id": "app511ef26659",
  "store_identifier": "ai.anicca.app.ios.weekly.b",
  "type": "subscription",
  "display_name": "Anicca Weekly B"
}
mcp__revenuecat__create-product {
  "project_id": "projbb7b9d1b",
  "app_id": "app511ef26659",
  "store_identifier": "ai.anicca.app.ios.yearly.b",
  "type": "subscription",
  "display_name": "Anicca Annual B"
}

// Step 2: Variant B offering 作成（current にしない）
mcp__revenuecat__create-offering {
  "project_id": "projbb7b9d1b",
  "lookup_key": "anicca_variant_b",
  "display_name": "Anicca Variant B",
  "is_current": false
}

// Step 3: packages を新 offering に追加
mcp__revenuecat__create-packages {
  "project_id": "projbb7b9d1b",
  "offering_id": "<new_offering_id>",
  "packages": [
    {"lookup_key": "$rc_weekly", "display_name": "Weekly", "position": 1},
    {"lookup_key": "$rc_annual", "display_name": "Annual", "position": 2}
  ]
}

// Step 4: products を package に attach
mcp__revenuecat__attach-products-to-package {
  "package_id": "<weekly_pkg_id>",
  "products": [{"product_id": "<rc_weekly_b_product_id>", "eligibility_criteria": "all"}]
}
mcp__revenuecat__attach-products-to-package {
  "package_id": "<annual_pkg_id>",
  "products": [{"product_id": "<rc_annual_b_product_id>", "eligibility_criteria": "all"}]
}

// Step 5: products を既存 entitlement "premium" に attach
mcp__revenuecat__attach-products-to-entitlement {
  "project_id": "projbb7b9d1b",
  "entitlement_id": "entlb820c43ab7",
  "product_ids": ["<rc_weekly_b_product_id>", "<rc_annual_b_product_id>"]
}
```

## B-3: RevenueCat Dashboard で Experiment 作成（手動 — MCP 未対応）

**RC MCP には create-experiment が無い** → Dashboard で手動作成:

1. RC Dashboard → Experiments → New Experiment
2. Name: `paywall_ab_v1`
3. Control: offering `anicca`（既存、Variant A = monthly $7.99 + annual $39.99）
4. Treatment: offering `anicca_variant_b`（Variant B = weekly $12.99 + annual $59.99）
5. Traffic split: 50/50
6. Audience: `Platform = iOS` のみ
7. Start date: 即日
8. Duration: 14日

**結果**: 新規ユーザーに `Purchases.shared.getOfferings()` すると、RC が自動で 50% ずつ `result.current` に Variant A/B の offering を入れて返す。iOS 側のコードは `result.current` を読むだけで OK。

## B-4: iOS Swift パッチ（最小限）

### B-4a: SubscriptionManager.swift L43 + L148 — fallback の順序反転

**Why**: 現行は `result.offering(identifier: "anicca") ?? result.current` になっていて、RC Experiments が差し替える `current` を**無視**してしまう。順序を反転して `current` を優先させる。

**Before** (L43-47):
```swift
if let cached = Purchases.shared.cachedOfferings,
   let preloaded = cached.offering(identifier: AppConfig.revenueCatPaywallId) ?? cached.current {
```

**After**:
```swift
if let cached = Purchases.shared.cachedOfferings,
   let preloaded = cached.current ?? cached.offering(identifier: AppConfig.revenueCatPaywallId) {
```

**Before** (L148):
```swift
if let offering = result.offering(identifier: AppConfig.revenueCatPaywallId) ?? result.current {
```

**After**:
```swift
if let offering = result.current ?? result.offering(identifier: AppConfig.revenueCatPaywallId) {
```

### B-4b: PaywallVariantBView.swift — weekly package 対応

**Before** (L164-196 付近):
```swift
private var yearlyPackage: Package? { packages.first { $0.packageType == .annual } }
private var monthlyPackage: Package? { packages.first { $0.packageType == .monthly } }
```

**After**（weekly を追加）:
```swift
private var weeklyPackage: Package? { packages.first { $0.packageType == .weekly } }
private var yearlyPackage: Package? { packages.first { $0.packageType == .annual } }
private var monthlyPackage: Package? { packages.first { $0.packageType == .monthly } }
```

`planCards` の描画を、offering に含まれる package 種別で動的に構築するよう変更:

```swift
// Variant A: monthly + annual
// Variant B: weekly + annual
var availableCards: [PackageCard] {
    var cards: [PackageCard] = []
    if let w = weeklyPackage { cards.append(.init(pkg: w, label: "Weekly")) }
    if let m = monthlyPackage { cards.append(.init(pkg: m, label: "Monthly")) }
    if let y = yearlyPackage { cards.append(.init(pkg: y, label: "Annual")) }
    return cards
}
```

### B-4c: PaywallVariantBView.swift — PostHog hard paywall flag 削除

**Before** (L72-75):
```swift
let payload = PostHogSDK.shared.getFeatureFlagPayload("paywall-ab-test") as? [String: Any]
isHardPaywall = payload?["hard"] as? Bool ?? true
```

**After**:
```swift
isHardPaywall = true  // ダイス指示: 常に hard paywall、trial なし
```

### B-4d: OnboardingFlowView.swift L95-125 — PostHog gating 削除

**Before** (L95-125):
```swift
case .planSelection:
    if !appState.featureFlagsReady {
        ProgressView()
    } else {
        let variant: String = {
            if let forced = ProcessInfo.processInfo.environment["PAYWALL_VARIANT"] { return forced }
            return PostHogSDK.shared.getFeatureFlag("paywall-ab-test") as? String ?? "test"
        }()
        if variant == "test" {
            PaywallVariantBView(variant: variant, ...)
        } else {
            PlanSelectionStepView(...)
        }
    }
```

**After**:
```swift
case .planSelection:
    PaywallVariantBView(
        variant: "rc_experiment",  // RC 側で制御
        ...
    )
```

`PlanSelectionStepView.swift` は **削除禁止**（fallback 用に残す）。PostHog の `paywall-ab-test` flag / payload 参照は全削除。

### B-4e: SubscriptionManager.swift L282-287 — display name マッピング追加

**Before**:
```swift
// hardcoded for "ai.anicca.app.ios.monthly" のみ
```

**After**（weekly.b / yearly.b 追加）:
```swift
private func displayName(for productId: String) -> String {
    switch productId {
    case "ai.anicca.app.ios.monthly": return "Monthly Premium"
    case "ai.anicca.app.ios.yearly":  return "Annual Premium"
    case "ai.anicca.app.ios.weekly.b": return "Weekly Premium"
    case "ai.anicca.app.ios.yearly.b": return "Annual Premium"
    default: return "Premium"
    }
}
```

## B-5: Re-submit to App Store

```bash
cd aniccaios && fastlane release
```

Version bump: 1.8.3 → 1.8.4（変更: RC Experiments 対応 + Weekly package 対応 + PostHog paywall flag 削除）

---

# PART C — ビジュアル Before/After

## C-1: Reelclaw TikTok 投稿

### BEFORE（現状）
```
┌──────────────────────┐
│  [DanSUGC hook]      │ ← 5s、時々短い
│                      │
│  Put affirmations\n  │ ← literal \n 描画、□あり
│  on your lockscreen  │    1行ではみ出し
│                      │
│  [demo video]        │ ← loose mp4 混入（Troy/...）
│                      │
│  🎵 bgm-cta.mp3      │ ← ffmpeg 焼き込み
└──────────────────────┘
        ↓
   Postiz UPLOAD
        ↓
   TikTok Drafts 📝
        ↓
   ダイスが手動投稿
```

### AFTER（パッチ後）
```
┌──────────────────────┐
│  [DanSUGC hook 5s]   │ ← ffprobe 検証済
│                      │
│  Put affirmations    │ ← Line1 y=310
│  on your lockscreen  │ ← Line2 y=390（auto wrap）
│                      │
│  [demo trimmed/]     │ ← trimmed/ のみ
│                      │
│  🎵 TikTok auto     │ ← TikTok 側でトレンド音
└──────────────────────┘
        ↓
  Postiz DIRECT_POST
        ↓
   TikTok 公開 ✅
   PUBLIC_TO_EVERYONE
   duet/stitch/comment: ON
```

## C-2: Anicca Paywall flow

### BEFORE（PostHog A/B）
```
Onboarding
    ↓
PostHog flag "paywall-ab-test"
    ↓
┌────────┬────────────┐
│ "test" │ other      │
↓        ↓
PaywallVariantBView  PlanSelectionStepView
    ↓                    ↓
固定 offering "anicca"（monthly+annual）
    ↓
Purchases.shared.purchase(package)
    ↓
RevenueCat → App Store
```

**制約**: A/B は PostHog（UI だけ）、価格はハードコード。weekly 非対応。

### AFTER（RevenueCat Experiments offering swap）
```
Onboarding
    ↓
PaywallVariantBView（常時、PostHog 参照なし）
    ↓
Purchases.shared.getOfferings()
    ↓
RevenueCat サーバー
    ↓
Experiment "paywall_ab_v1"
    ├─ 50% → result.current = "anicca"            （Variant A: monthly $7.99 + annual $39.99）
    └─ 50% → result.current = "anicca_variant_b"  （Variant B: weekly $12.99 + annual $59.99）
    ↓
result.current.availablePackages
    ↓
PaywallVariantBView が packageType で動的描画
    ├─ .weekly → Weekly card
    ├─ .monthly → Monthly card
    └─ .annual → Annual card
    ↓
User tap → Purchases.shared.purchase(package)
    ↓
RevenueCat → App Store
    ↓
Experiment の attribution が自動で RC に記録
    ↓
RC Dashboard で revenue / conversion / trial 比較
```

**利点**:
- **無料**（Superwall と違って課金なし）
- ローカライズは RC が既存の product メタデータを自動で拾う
- iOS コード変更最小（offering 取得順序反転 + weekly 対応 + PostHog 削除のみ）
- A/B データは RC dashboard で直接見れる（Mixpanel 不要）

**制約**:
- paywall ビジュアル変更は **app resubmit 必要**（Superwall との差分）
- RC Experiment の作成は Dashboard 手動（MCP 未対応）

---

# PART D — TODO リスト（順序厳守）

| # | タスク | 担当 | 依存 | 自動/手動 |
|---|-------|------|------|----------|
| **D0: 準備** | | | | |
| 1 | TikTok Postiz direct post の approved 状態（ダイス確認済 — skip） | - | - | ✅ done |
| 2 | Spec を codex-review で ok:true まで反復 | CC | - | AUTO |
| 3 | `git worktree add ../anicca-fix -b feature/reelclaw-superwall-fix origin/dev` | CC | 2 | AUTO |
| **D1: Reelclaw Skill** | | | | |
| 4 | SKILL.md Step 3b（ffprobe 入力検証 + `-t 5`）| CC | 3 | AUTO |
| 5 | SKILL.md Step 3d（textfile + 2段 drawtext + fontsize=56 + サイズ検証） | CC | 3 | AUTO |
| 6 | SKILL.md Step 3e 削除（ffmpeg 音楽） | CC | 3 | AUTO |
| 7 | SKILL.md Step 4b autoAddMusic "no" → "yes" | CC | 3 | AUTO |
| 8 | ffmpeg-patterns.md multiline をデフォルト化 | CC | 3 | AUTO |
| 9 | green-zone.md hook only に削減 | CC | 3 | AUTO |
| **D2: Assets** | | | | |
| 10 | demos/ja/ loose mp4 削除 | CC | 3 | AUTO |
| 11 | demos/en/ loose mp4 削除 | CC | 3 | AUTO |
| 12 | demos-mapping.json rotation reset | CC | 3 | AUTO |
| **D3: Hook 文言（ダイス選別待ち）** | | | | |
| 13 | Widget JA 12本 判定（ダイス） | ダイス | - | MANUAL |
| 14 | Widget EN 12本 判定（ダイス） | ダイス | - | MANUAL |
| 15 | Honne JA 24本 判定（ダイス）| ダイス | - | MANUAL |
| 16 | Reelclaw card JA/EN 各7本 判定（ダイス） | ダイス | - | MANUAL |
| 17 | 各 JSON / SKILL.md L365-381 差し替え | CC | 13-16 | AUTO |
| **D4: Cron messages** | | | | |
| 18 | reelclaw 11 cron message 書き換え（DIRECT_POST + autoAddMusic yes） | CC | 3 | AUTO |
| 19 | Postiz ソースで photo carousel direct post サポート確認 | CC | 3 | AUTO |
| 20 | Larry 4 cron message（19 の結果次第で UPLOAD or DIRECT_POST） | CC | 19 | AUTO |
| 21 | `openclaw gateway restart` | CC | 18-20 | AUTO |
| **D5: Reelclaw Review & Merge** | | | | |
| 22 | codex-review（GATE 3） | CC | 4-21 | AUTO |
| 23 | commit + push + dev マージ | CC | 22 | AUTO |
| **D6: 今日テスト cron（reelclaw 動作確認）** | | | | |
| 24 | 今日テスト cron — larry-en | CC | 23 | AUTO |
| 25 | 今日テスト cron — larry-ja | CC | 23 | AUTO |
| 26 | 今日テスト cron — reelclaw-honne-ja-1 | CC | 23 | AUTO |
| 27 | 今日テスト cron — reelclaw-honne-ja-2 | CC | 23 | AUTO |
| 28 | 今日テスト cron — reelclaw-honne-ja-3 | CC | 23 | AUTO |
| 29 | 今日テスト cron — reelclaw-ja-1 | CC | 23 | AUTO |
| 30 | 今日テスト cron — reelclaw-ja-2 | CC | 23 | AUTO |
| 31 | 今日テスト cron — reelclaw-en-1 | CC | 23 | AUTO |
| 32 | 今日テスト cron — reelclaw-en-2 | CC | 23 | AUTO |
| 33 | 今日テスト cron — reelclaw-anicca-ja-widget-1 | CC | 23 | AUTO |
| 34 | 今日テスト cron — reelclaw-anicca-ja-widget-2 | CC | 23 | AUTO |
| 35 | 今日テスト cron — reelclaw-anicca-en-widget-1 | CC | 23 | AUTO |
| 36 | 今日テスト cron — reelclaw-anicca-en-widget-2 | CC | 23 | AUTO |
| 37 | ダイス実機で各投稿確認 → ログ共有 | ダイス | 24-36 | MANUAL |
| **D7: RevenueCat Experiments（並行 or reelclaw 後）** | | | | |
| 38 | ASC: 新 subscription group "Anicca Premium B" 作成 | CC | - | AUTO |
| 39 | ASC: Weekly $12.99 B product 作成（ONE_WEEK） | CC | 38 | AUTO |
| 40 | ASC: Annual $59.99 B product 作成（ONE_YEAR） | CC | 38 | AUTO |
| 41 | ASC: 両 product JA localization | CC | 39,40 | AUTO |
| 42 | ASC: introductory offer がゼロか確認（trial 禁止） | CC | 39,40 | AUTO |
| 43 | ASC: review screenshot 追加 + submit | CC | 41 | AUTO |
| 44 | RC MCP: create-product × 2（weekly_b, annual_b） | CC | 39,40 | AUTO |
| 45 | RC MCP: create-offering "anicca_variant_b" | CC | 44 | AUTO |
| 46 | RC MCP: create-packages（$rc_weekly, $rc_annual） | CC | 45 | AUTO |
| 47 | RC MCP: attach-products-to-package × 2 | CC | 46 | AUTO |
| 48 | RC MCP: attach-products-to-entitlement（entlb820c43ab7） | CC | 44 | AUTO |
| 49 | **RC Dashboard: Experiment "paywall_ab_v1" 作成（手動）** | ダイス | 45-48 | **MANUAL** |
| 50 | Swift: SubscriptionManager L43/L148 fallback 順序反転 | CC | 3 | AUTO |
| 51 | Swift: PaywallVariantBView weekly package 対応 | CC | 3 | AUTO |
| 52 | Swift: PaywallVariantBView PostHog hard flag 削除（isHardPaywall = true 固定） | CC | 3 | AUTO |
| 53 | Swift: OnboardingFlowView L95-125 PostHog gating 削除 | CC | 3 | AUTO |
| 54 | Swift: SubscriptionManager L282-287 display name マッピング追加 | CC | 3 | AUTO |
| 55 | Swift: PostHog `paywall-ab-test` flag 参照を全削除（grep 確認） | CC | 52,53 | AUTO |
| 56 | fastlane release — ビルド + archive + export + TestFlight upload | CC | 50-55 | AUTO |
| 57 | ダイス実機で Variant A / B 両方確認（`PAYWALL_VARIANT` 環境変数 or Sandbox） | ダイス | 56 | MANUAL |
| 58 | App Store Connect submit v1.8.4 | CC | 57 | AUTO |
| 59 | Apple 審査通過 → phased release | - | 58 | MANUAL |
| 60 | RC Dashboard で Experiment 結果モニタリング（14日） | ダイス | 59 | MANUAL |

---

# PART E — $1k MRR 戦略（19日）

**現状**: $46 MRR, 19日で $1k = 21倍

**数学**:
- $1k MRR ÷ $9.99 = 100 paid/月新規
- 想定 CVR 2-5% → 2000-5000 install/月
- TikTok install/day 必要: 70-170

**現実的到達パス**:

| レバー | 期待効果 | 実装コスト | 優先度 |
|--------|---------|-----------|-------|
| Reelclaw TT direct post 化 | SELF_ONLY→公開 = ×100 (TT は現状全部 draft で誰も見てない) | 1日 | P0 |
| Fix overlay 両端切れ / literal \n / inline text= 削除 | 現状 IG/YT は公開されてるが overlay が読めず無効投稿 → まず読める状態に | 1日 | P0 |
| Weekly $12.99 + Annual $59.99（Variant B） | 価格抵抗↓（週額）+ ARPU↑（年額 +50%）→ 期待 MRR 1.5-2x | 2日 | P0 |
| RC Experiments A/B | 無料で offering 切替、データ収集 → 最適化 | 1日 | P0 |
| Honne AI EN 版 | 新市場、install +30% | 5日 | P2 |
| Larry 再稼働 (別 spec) | 1日4投稿 追加チャネル TT+IG | 1日 | P1 |
| Reelclaw cron 2→4/day | 投稿量 2x | 1日 | P1 |

**複合効果試算**:
- 現 install/day = 5-10（想定）
- direct post 化で 100x 到達 = 500-1000/day 可能
- CVR 2% × avg $9.99 = $10-20 MRR/day 増
- 19日累積 ≈ $190-380 追加 MRR
- Weekly + Superwall 乗せて CVR 1.5x × 1.3x = 2x → $400-760
- Honne EN で install +30% → **$500-1000 追加 MRR → 総 $550-1050 MRR**

**結論**: $1k MRR は reelclaw direct post 化 + weekly + Honne EN が全部ハマれば 達成圏内。$10k はバイラルヒット必須（計算では届かない）。

**優先順**:
1. 今週: reelclaw fix 全部（P0）+ ASC Variant B products 作成 + RC Variant B offering/packages 作成
2. 来週: Swift パッチ（fallback 反転 + weekly 対応 + PostHog 削除） + RC Experiment 作成 + v1.8.4 TestFlight
3. 3週目: v1.8.4 リリース + Honne EN spec 実装
4. 4週目: RC Experiment データ見て勝者 offering を `current` 昇格、敗者 archive

---

**最終更新**: 2026-04-12（実測ベース訂正ラウンド 2: x 座標式 / inline text= 削除 / Step 3e 維持 / cron 3 カテゴリ別 payload.message 置換 / Larry 除外 / A-6d スキーマ修正）
