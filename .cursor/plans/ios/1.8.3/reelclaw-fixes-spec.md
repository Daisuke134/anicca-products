# Reelclaw Fixes Spec — v1.8.3

**Status**: 📝 DRAFT (未実装、記録のみ)
**Created**: 2026-04-11
**Scope**: reelclaw (aniccaios JA/EN cards + widget JA/EN), honne-ja, Larry EN/JA 全体

## 開発環境

| 項目 | 値 |
|------|-----|
| 作業場所 | dev worktree（未作成） |
| ブランチ | 未切り |
| 状態 | Spec only、実装禁止（ダイスOK待ち） |

## 触るファイル境界

| ファイル | 変更内容 |
|---------|---------|
| `~/.agents/skills/reelclaw/SKILL.md` | Step 3b/3d/3e/4b 全面改訂 |
| `~/.agents/skills/reelclaw/references/ffmpeg-patterns.md` | drawtext 2段チェーン強制 |
| `~/.agents/skills/reelclaw/references/green-zone.md` | hook preset のみ残す |
| `~/.openclaw/workspace/tiktok-marketing/reelclaw-widget-hooks-{ja,en}.json` | 文言差し替え |
| `~/.openclaw/workspace/honne-ai/honne-hooks-ja.json` | 文言差し替え |
| `~/.openclaw/workspace/tiktok-marketing/assets/demos/ja/` | loose mp4 削除 |
| `~/.openclaw/workspace/tiktok-marketing/assets/demos/demos-mapping.json` | rotation reset |
| `~/.openclaw/cron/jobs.json` | message を DIRECT_POST + autoAddMusic に書き換え |

---

## Problem 1: リテラル `\n` / □ 表示

**現象**: フック文字に literal `\n` が描画される。ヒラギノ未収録字が□

**原因**: JSON 保存時の `\n` を `drawtext=text='...'` の inline モードはエスケープせず literal 描画。font path 誤りで glyph 欠落

**パッチ**:
```bash
# SKILL.md Step 3d: textfile 方式に統一
python3 -c "
import json, sys
hook = sys.argv[1].replace('\\\\n', '\n')
open('/tmp/hook_line1.txt', 'w').write(hook.split('\n')[0])
open('/tmp/hook_line2.txt', 'w').write(hook.split('\n')[1] if '\n' in hook else '')
" "$HOOK_TEXT"

ffmpeg -i in.mp4 -vf "
drawtext=fontfile=/System/Library/Fonts/ヒラギノ角ゴシック\\ W6.ttc:textfile=/tmp/hook_line1.txt:fontsize=56:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=310,
drawtext=fontfile=/System/Library/Fonts/ヒラギノ角ゴシック\\ W6.ttc:textfile=/tmp/hook_line2.txt:fontsize=56:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=390
" out.mp4
```

**なぜ効く**: textfile は OS ネイティブ改行を正しく処理。font path 強制で glyph 欠落ゼロ

---

## Problem 2: 折り返しなし

**現象**: 長いフックが1行ではみ出す

**原因**: SKILL.md に wrap ロジックなし

**パッチ**: Problem 1 の2段 drawtext チェーンで自動対応（JSON 側で `\n` を必ず入れる）

**なぜ効く**: 事前に2行に split されるため wrap 計算不要

---

## Problem 3: 違う動画混入（"Troy and Anicca..."）

**現象**: 想定外の demo が出る

**原因**: (a) `demos/ja/` 直下に loose mp4 (b) `demos-mapping.json` rotation tracker 古い

**パッチ**:
```bash
# 1. loose mp4 を trimmed/ 外から削除
find ~/.openclaw/workspace/tiktok-marketing/assets/demos/ja -maxdepth 1 -type f -name "*.mp4" -delete

# 2. demos-mapping.json の rotation を reset
python3 -c "
import json
p = '~/.openclaw/workspace/tiktok-marketing/assets/demos/demos-mapping.json'
d = json.load(open(p))
for k in d.get('rotation', {}): d['rotation'][k] = []
json.dump(d, open(p,'w'), ensure_ascii=False, indent=2)
"

# 3. SKILL.md に「demos/ja/trimmed/ と demos/en/trimmed/ のみ使用」を明記
```

**なぜ効く**: agent が loose file を拾えなくなる + rotation state がクリーンに

---

## Problem 4: overlay 失敗 10%

**現象**: 稀にフック字幕なしで投稿

**原因**: drawtext silent fail。font path 間違いで透明化

**パッチ**:
```bash
# SKILL.md Step 3d 末尾に検証ステップ追加
SIZE=$(ffprobe -v error -show_entries format=size -of csv=p=0 out.mp4)
[ "$SIZE" -lt 100000 ] && { echo "overlay failed"; exit 1; }
# retry logic: font fallback
```

**なぜ効く**: silent fail を早期検知、自動 retry

---

## Problem 5: hook clip トリム 10% 失敗

**現象**: DanSUGC クリップが短くなる

**原因**: `ffmpeg -ss 1 -to 6` — 元が 6秒未満だと黙って短い出力

**パッチ**:
```bash
# SKILL.md Step 3b 改訂
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 source.mp4)
python3 -c "import sys; sys.exit(0 if float('$DUR') >= 6 else 1)" || { echo "too short, pick another"; exit 1; }
ffmpeg -ss 1 -t 5 -i source.mp4 -c copy hook.mp4
```

**なぜ効く**: 入力検証 + `-t 5` で固定 duration 保証

---

## Problem 6: 文字サイズ不統一

**現象**: medium/small が混在

**原因**: green-zone.md に hook=64/CTA=52/subtitle=48 並列記載

**パッチ**: SKILL.md で `fontsize=56` にハードコード、green-zone.md を hook only に

**なぜ効く**: 選択肢ゼロ

---

## Problem 7: Draft 投稿 + ffmpeg music → Direct Post + auto music

**現象**: 毎回 draft、music を ffmpeg で焼く

**原因**: cron message が SELF_ONLY + UPLOAD、SKILL.md Step 3e で bgm-cta.mp3 焼き込み

**パッチ**:
```json
// cron message 全書き換え
{
  "privacy_level": "PUBLIC_TO_EVERYONE",
  "content_posting_method": "DIRECT_POST",
  "autoAddMusic": "yes"
}
```
SKILL.md Step 3e（L418-427 ffmpeg music）を削除

**なぜ効く**: Postiz docs (https://docs.postiz.com/public-api/providers/tiktok) 準拠。TikTok 側の公式 auto music になる

**前提**: TikTok Dev Portal で Content Posting API → Direct Post が approved 必須。未 audit なら `unaudited_client_can_only_post_to_private_accounts` で失敗

---

## Problem 8: フック文言選別

ダイスが OK/NG 選択後、差し替え。現状文言は `reelclaw-widget-hooks-{ja,en}.json`, `honne-hooks-ja.json` 参照

---

## TODO リスト

| # | タスク | 担当 | 依存 |
|---|-------|------|------|
| 1 | TikTok Dev Portal で Direct Post API 有効確認 | ダイス | - |
| 2 | Superpower codex-review で本 spec を ok:true まで反復 | CC | - |
| 3 | dev worktree 作成 `git worktree add ../anicca-reelclaw-fix -b feature/reelclaw-fix origin/dev` | CC | 2 |
| 4 | SKILL.md Step 3b 改訂（ffprobe duration + `-t 5`） | CC | 3 |
| 5 | SKILL.md Step 3d 改訂（textfile + 2段 drawtext + fontsize=56 + validate） | CC | 3 |
| 6 | SKILL.md Step 3e 削除（ffmpeg music） | CC | 3 |
| 7 | SKILL.md Step 4b 改訂（DIRECT_POST + PUBLIC） | CC | 3 |
| 8 | ffmpeg-patterns.md 2段チェーンを default に | CC | 3 |
| 9 | green-zone.md を hook only に削減 | CC | 3 |
| 10 | demos/ja/ loose mp4 削除 | CC | 3 |
| 11 | demos-mapping.json rotation reset | CC | 3 |
| 12 | honne-hooks-ja.json 文言差し替え（ダイス選別後） | CC | ダイス |
| 13 | reelclaw-widget-hooks-ja.json 文言差し替え | CC | ダイス |
| 14 | reelclaw-widget-hooks-en.json 文言差し替え | CC | ダイス |
| 15 | SKILL.md L365-381 カード hook list 差し替え | CC | ダイス |
| 16 | cron message 全書き換え（DIRECT_POST + autoAddMusic） | CC | 1,7 |
| 17 | `openclaw gateway restart` | CC | 16 |
| 18 | codex-review（GATE 3） | CC | 4-17 |
| 19 | commit + push `feature/reelclaw-fix` → dev マージ | CC | 18 |
| **20** | **今日テスト用 cron セット — larry-en** | CC | 19 |
| **21** | **今日テスト用 cron セット — larry-ja** | CC | 19 |
| **22** | **今日テスト用 cron セット — reelclaw-honne-ja-1** | CC | 19 |
| **23** | **今日テスト用 cron セット — reelclaw-honne-ja-2** | CC | 19 |
| **24** | **今日テスト用 cron セット — reelclaw-honne-ja-3** | CC | 19 |
| **25** | **今日テスト用 cron セット — reelclaw-ja-1 (card)** | CC | 19 |
| **26** | **今日テスト用 cron セット — reelclaw-ja-2 (card)** | CC | 19 |
| **27** | **今日テスト用 cron セット — reelclaw-en-1 (card)** | CC | 19 |
| **28** | **今日テスト用 cron セット — reelclaw-en-2 (card)** | CC | 19 |
| **29** | **今日テスト用 cron セット — reelclaw-anicca-ja-widget-1** | CC | 19 |
| **30** | **今日テスト用 cron セット — reelclaw-anicca-ja-widget-2** | CC | 19 |
| **31** | **今日テスト用 cron セット — reelclaw-anicca-en-widget-1** | CC | 19 |
| **32** | **今日テスト用 cron セット — reelclaw-anicca-en-widget-2** | CC | 19 |
| 33 | 翌日 ダイス実機で TikTok 確認 → 各 cron の成否記録 | ダイス | 20-32 |

---

## 戦略メモ: $1k MRR（19日）

| 案 | 判定 | 理由 |
|----|------|------|
| Rork デイリー出荷 | ❌ | App Store 審査 1-3 日で無理 |
| Lovable web app デイリー | ❌ | TikTok→web 離脱率高い |
| **Anicca + Reelclaw 集中** | ✅ | 既存資産の ROI 最大、Superwall で pricing A/B |
| Honne AI EN 版 | ✅ | Anicca 枠内で完結、追加コスト小 |

**現実目標**: $200 MRR（$46 → $200 = 4.3倍、19日で到達可能）
