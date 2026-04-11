# Reelclaw + Superwall Fixes Spec — v1.8.3 → v1.8.4

**Status**: 📝 DRAFT（実装前）
**Created**: 2026-04-11
**Goal**: $1k MRR by 2026-04-30（$46 → $1k = 21倍）
**Scope**: reelclaw 全 cron / Larry / Honne + Anicca iOS Superwall SDK 統合 + Weekly $7.99 plan

## 開発環境

| 項目 | 値 |
|------|-----|
| 作業場所 | dev から worktree（`feature/reelclaw-superwall-fix`） |
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
| `~/.openclaw/cron/jobs.json` | 16 cron の message 書き換え（TikTok settings） |
| `aniccaios/aniccaios/Subscription/RCPurchaseController.swift` | 新規作成 |
| `aniccaios/aniccaios/AppDelegate.swift` or `aniccaiosApp.swift` | Superwall.configure 追加 |
| `aniccaios/aniccaios/Services/SubscriptionManager.swift` | purchaseController 統合 |
| `aniccaios/aniccaios/Onboarding/OnboardingFlowView.swift` L95-126 | paywall 呼出しを Superwall.shared.register に差し替え |
| `aniccaios/aniccaios.xcodeproj/project.pbxproj` | SPM Superwall-iOS 4.0.0+ 追加（Xcode 手動） |

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

## Problem 6: Draft 投稿 + ffmpeg 音楽 → DIRECT_POST + auto music

**現象**:
- 毎回 draft 保存 → ダイスが手動で投稿
- 音楽は ffmpeg で bgm-cta.mp3 を焼き込み

**原因**:
1. **16 個の cron message が SKILL.md を override** して `privacy_level: SELF_ONLY, content_posting_method: UPLOAD, autoAddMusic: "no"` を強制
2. SKILL.md Step 3e（L411-427）で ffmpeg 音楽焼き込み

**Source**: https://docs.postiz.com/public-api/providers/tiktok

| Field | Value | 出典 |
|-------|-------|------|
| `privacy_level` | `"PUBLIC_TO_EVERYONE"` | 「public post everyone can see」 |
| `content_posting_method` | `"DIRECT_POST"` | 「Post directly to TikTok」 |
| `autoAddMusic` | `"yes"` （**string**、not boolean） | 「`yes` → TikTok will auto-add music」 |
| `video_made_with_ai` | `false` | - |
| `duet/stitch/comment` | `true` | Public Video example に合わせる |

**注意**: Postiz 本番 TikTok 連携は既に direct post 承認済（ダイス確認済）。unaudited エラーは出ない前提。

### Patch A-6a: SKILL.md Step 3e 削除（L411-429）

**Before** (L411-429): ffmpeg amix/afade で bgm-cta.mp3 焼き込み + 「Set autoAddMusic: no」

**After**: 全削除。代わりに 1 行:
```
### 3e. Music

**DO NOT** add music via ffmpeg. TikTok 側で `autoAddMusic: "yes"` に任せる。Instagram/YouTube には音楽なしで送信（BGM なしの reel は OK）。

Input video for Step 4a upload: `reel-text.mp4` (step 3d output)。
```

**Why**: Postiz → TikTok direct post は auto music を TikTok 側で自動付与。手焼きは不要。

### Patch A-6b: SKILL.md Step 4b tiktok settings 修正（L488-500）

**Before** (L495):
```
"autoAddMusic": "no",
```

**After**:
```
"autoAddMusic": "yes",
```

既存の L491 `privacy_level: PUBLIC_TO_EVERYONE` / L499 `content_posting_method: DIRECT_POST` はそのまま（正しい）。

### Patch A-6c: 16 cron message の TikTok settings 書き換え

対象 cron（全て override 構文を正しい設定に変更）:

| Cron 名 | jobs.json 行 |
|---------|-------------|
| reelclaw-ja-1 | L4626 |
| reelclaw-ja-2 | L4664 |
| reelclaw-en-1 | L4887 |
| reelclaw-en-2 | L4925 |
| reelclaw-honne-ja-1 | L7178 |
| reelclaw-honne-ja-2 | L7213 |
| reelclaw-honne-ja-3 | L7248 |
| reelclaw-anicca-ja-widget-1 | L7036 |
| reelclaw-anicca-ja-widget-2 | L7072 |
| reelclaw-anicca-en-widget-1 | L7107 |
| reelclaw-anicca-en-widget-2 | L7142 |
| larry-morning-en | L1192 |
| larry-morning-ja | (同スロット) |
| larry-evening-en | (同スロット) |
| larry-evening-ja | (同スロット) |
| larry-daily-report-en | L1155（変更なし — report のみ） |

**Before** (現状の POSTING RULES 2):
```
2. TikTok: privacy_level: SELF_ONLY, content_posting_method: UPLOAD, video_made_with_ai: false, autoAddMusic: "no", duet: false, stitch: false, comment: false, brand_content_toggle: false, brand_organic_toggle: false.
```

**After**:
```
2. TikTok: privacy_level: PUBLIC_TO_EVERYONE, content_posting_method: DIRECT_POST, video_made_with_ai: false, autoAddMusic: "yes", duet: true, stitch: true, comment: true, brand_content_toggle: false, brand_organic_toggle: false.
```

**Larry slideshow（photo carousel）の注意**: Postiz docs は photo carousel mode を明記していない。Postiz ソース（`gitroomhq/postiz-app`）の `tiktok.provider.ts` を読んで photo carousel が direct post + autoAddMusic をサポートするか確認する必要あり。**未確認までは Larry だけ UPLOAD / autoAddMusic "no" に留める**。Reelclaw 動画は全員 direct post に切り替え。

### Patch A-6d: cron 書き換えスクリプト（実装時に実行）

```python
# 対象: reelclaw/honne 11 cron（larry は別対応）
import json, re
p = '/Users/anicca/.openclaw/cron/jobs.json'
d = json.load(open(p))
TARGETS = {
    'reelclaw-ja-1', 'reelclaw-ja-2', 'reelclaw-en-1', 'reelclaw-en-2',
    'reelclaw-honne-ja-1', 'reelclaw-honne-ja-2', 'reelclaw-honne-ja-3',
    'reelclaw-anicca-ja-widget-1', 'reelclaw-anicca-ja-widget-2',
    'reelclaw-anicca-en-widget-1', 'reelclaw-anicca-en-widget-2',
}
BEFORE = 'privacy_level: SELF_ONLY, content_posting_method: UPLOAD, video_made_with_ai: false, autoAddMusic: "no", duet: false, stitch: false, comment: false'
AFTER  = 'privacy_level: PUBLIC_TO_EVERYONE, content_posting_method: DIRECT_POST, video_made_with_ai: false, autoAddMusic: "yes", duet: true, stitch: true, comment: true'
count = 0
for job in d.get('jobs', []):
    if job.get('name') in TARGETS:
        msg = job.get('input', {}).get('message', '')
        if BEFORE in msg:
            job['input']['message'] = msg.replace(BEFORE, AFTER)
            count += 1
json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2)
print(f"updated {count} crons")
```

その後:
```bash
openclaw gateway restart
```

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

# PART B — Superwall SDK 統合 + Weekly $7.99

**目的**: Superwall dashboard で paywall A/B 切り替え自在。weekly $7.99 を追加して 2 x 2 = 4 variant テスト（weekly+annual vs monthly+annual × paywall A/B）。

**Source**: https://superwall.com/docs/ios/guides/using-revenuecat
**Quote**: 「call `purchaseController.syncSubscriptionStatus()` to keep Superwall's subscription status up to date with RevenueCat.」

## B-1: Weekly $7.99 を App Store Connect に登録

```bash
# Step 1: 既存 group ID 取得
asc subscriptions groups list --app "$APP_ID"

# Step 2: weekly subscription 作成
asc subscriptions setup \
  --app "$APP_ID" \
  --group-reference-name "Anicca Premium" \
  --reference-name "Anicca Weekly" \
  --product-id "ai.anicca.app.ios.weekly" \
  --subscription-period ONE_WEEK \
  --locale "en-US" \
  --display-name "Weekly Premium" \
  --price "7.99" \
  --price-territory "USA" \
  --territories "USA"

# Step 3: JA localization
asc subscriptions localizations create \
  --subscription-id "$SUB_ID" \
  --locale "ja" \
  --display-name "週額プレミアム" \
  --description "週ごとに自動更新"

# Step 4: availability 全領域
asc subscriptions pricing availability edit \
  --subscription-id "$SUB_ID" \
  --territories "WW"

# Step 5: review screenshot
asc subscriptions review screenshots create \
  --subscription-id "$SUB_ID" \
  --file "./weekly_review.png"

# Step 6: 提出
asc subscriptions review submit \
  --subscription-id "$SUB_ID" \
  --confirm
```

**Gotcha**: availability → pricing の順序（`.claude/rules/platform-gotchas.md`）。`setup` は一括で両方設定するので安全。

## B-2: RevenueCat に weekly product 追加（MCP）

```json
// Step 1: create-product
{
  "project_id": "<rc_project_id>",
  "app_id": "<rc_app_id>",
  "store_identifier": "ai.anicca.app.ios.weekly",
  "type": "subscription",
  "display_name": "Anicca Weekly",
  "title": "Weekly Premium"
}

// Step 2: attach-products-to-entitlement（既存 "premium"）
{
  "project_id": "<rc_project_id>",
  "entitlement_id": "premium",
  "product_ids": ["<rc_weekly_product_id>"]
}

// Step 3: create-packages on existing offering
{
  "project_id": "<rc_project_id>",
  "offering_id": "<rc_offering_id>",
  "lookup_key": "$rc_weekly",
  "display_name": "Weekly",
  "position": 1
}

// Step 4: attach-products-to-package
{
  "package_id": "<package_id>",
  "products": [{"product_id": "<rc_weekly_product_id>", "eligibility_criteria": "all"}]
}
```

## B-3: Xcode SPM に Superwall-iOS 追加（手動）

Xcode → File → Add Package Dependencies → `https://github.com/superwall/Superwall-iOS` → Up to Next Major 4.0.0

## B-4: RCPurchaseController.swift 新規作成

**新規ファイル**: `aniccaios/aniccaios/Subscription/RCPurchaseController.swift`

```swift
import SuperwallKit
import RevenueCat
import StoreKit

enum PurchasingError: LocalizedError {
  case sk2ProductNotFound
  var errorDescription: String? {
    switch self {
    case .sk2ProductNotFound:
      return "Superwall didn't pass a StoreKit 2 product. Check SuperwallOption is NOT StoreKit 1."
    }
  }
}

final class RCPurchaseController: PurchaseController {
  func syncSubscriptionStatus() {
    assert(Purchases.isConfigured, "Configure RevenueCat before calling.")
    Task {
      for await customerInfo in Purchases.shared.customerInfoStream {
        let ents = customerInfo.entitlements.activeInCurrentEnvironment.keys.map { Entitlement(id: $0) }
        await MainActor.run {
          Superwall.shared.subscriptionStatus = .active(Set(ents))
        }
      }
    }
  }

  func purchase(product: SuperwallKit.StoreProduct) async -> PurchaseResult {
    do {
      guard let sk2Product = product.sk2Product else {
        throw PurchasingError.sk2ProductNotFound
      }
      let storeProduct = RevenueCat.StoreProduct(sk2Product: sk2Product)
      let result = try await Purchases.shared.purchase(product: storeProduct)
      return result.userCancelled ? .cancelled : .purchased
    } catch let error as ErrorCode where error == .paymentPendingError {
      return .pending
    } catch {
      return .failed(error)
    }
  }

  func restorePurchases() async -> RestorationResult {
    do {
      _ = try await Purchases.shared.restorePurchases()
      return .restored
    } catch {
      return .failed(error)
    }
  }
}
```

## B-5: SubscriptionManager.swift に Superwall.configure 追加

**Before** (L28-36):
```swift
Purchases.configure(
    with: Configuration.Builder(withAPIKey: apiKey)
        .with(entitlementVerificationMode: .informational)
        .build()
)
Purchases.shared.delegate = self
```

**After**（同じ位置、直後に追記）:
```swift
Purchases.configure(
    with: Configuration.Builder(withAPIKey: apiKey)
        .with(entitlementVerificationMode: .informational)
        .build()
)
Purchases.shared.delegate = self

// Superwall: use RCPurchaseController so RevenueCat stays the purchase processor
let purchaseController = RCPurchaseController()
Superwall.configure(
    apiKey: AppConfig.superwallAPIKey,
    purchaseController: purchaseController
)
purchaseController.syncSubscriptionStatus()
```

`import SuperwallKit` を 先頭に追加。

## B-6: Config.swift に superwallAPIKey 追加

**Before** (L1-10):
```swift
private static let revenueCatAPIKeyKey = "REVENUECAT_API_KEY"
// ...
static var revenueCatAPIKey: String { infoValue(for: revenueCatAPIKeyKey) }
```

**After**（追加）:
```swift
private static let revenueCatAPIKeyKey = "REVENUECAT_API_KEY"
private static let superwallAPIKeyKey = "SUPERWALL_API_KEY"
// ...
static var revenueCatAPIKey: String { infoValue(for: revenueCatAPIKeyKey) }
static var superwallAPIKey: String { infoValue(for: superwallAPIKeyKey) }
```

Info.plist に `SUPERWALL_API_KEY` = `$(SUPERWALL_API_KEY)` を追加、xcconfig に実キー設定。

## B-7: OnboardingFlowView.swift paywall 呼出し差し替え

**Before** (L95-126):
```swift
case .planSelection:
    if !appState.featureFlagsReady {
        ProgressView()
    } else {
        let variant = PostHogSDK.shared.getFeatureFlag("paywall-ab-test") as? String ?? "test"
        if variant == "test" {
            PaywallVariantBView(...)
        } else {
            PlanSelectionStepView(...)
        }
    }
```

**After**:
```swift
case .planSelection:
    Color.clear
        .onAppear {
            Superwall.shared.register(placement: "campaign_trigger") {
                // 購入成功 or paywall dismiss 後
                handlePaywallSuccess(customerInfo: nil)
            }
        }
```

PostHog の `paywall-ab-test` は削除。A/B は Superwall campaign の variants で行う。

`PaywallVariantBView.swift` / `PlanSelectionStepView.swift` は削除せず残す（feature flag fallback 用）。

## B-8: Superwall MCP で Product / Entitlement / Paywall / Campaign 作成

```json
// 1. Products
create_product { identifier: "ai.anicca.app.ios.weekly", price: 799, period: "week" }
create_product { identifier: "ai.anicca.app.ios.monthly", price: 999, period: "month" }
create_product { identifier: "ai.anicca.app.ios.yearly", price: 4999, period: "year" }

// 2. Entitlement
create_entitlement { identifier: "premium", products: ["weekly","monthly","yearly"] }

// 3. Paywall A / B — Dashboard 必須
// ダイスがビジュアル作成 → paywall_A_id, paywall_B_id 取得

// 4. Campaign
create_campaign {
  application: "<app_id>",
  placements: [{event_name: "campaign_trigger"}],
  audiences: [{
    variants: [
      {type: "treatment", paywall: "<paywall_A_id>", percentage: 50},
      {type: "treatment", paywall: "<paywall_B_id>", percentage: 50}
    ]
  }]
}
```

**Manual (ダイス)**: Superwall Dashboard で 2 paywall の visual design だけ作る。その他全て MCP で自動化。

## B-9: Re-submit to App Store

```bash
cd aniccaios && fastlane <release-lane>
```

Version bump: 1.8.3 → 1.8.4（新機能: Superwall A/B）

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
(hardcoded in binary)
    ↓                    ↓
Purchases.shared.purchase(package)
    ↓
RevenueCat → App Store
```

**制約**: paywall ビジュアル変更 = app resubmit 必要。A/B も PostHog 側で管理。

### AFTER（Superwall remote + RC purchase）
```
Onboarding
    ↓
Superwall.shared.register("campaign_trigger")
    ↓
Superwall Dashboard の Campaign
    ├─ 50% → Paywall A (weekly $7.99 highlighted)
    └─ 50% → Paywall B (monthly $9.99 highlighted)
    ↓
Superwall 表示 (remote, no resubmit)
    ↓
User tap → RCPurchaseController.purchase()
    ↓
Purchases.shared.purchase(product: storeProduct)
    ↓
RevenueCat → App Store
    ↓
customerInfoStream → Superwall.subscriptionStatus
```

**利点**: paywall の見た目・コピー・価格 highlight を Superwall Dashboard から変更可能（再審査不要）。RevenueCat は購入処理の source of truth のまま。

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
| **D7: Superwall SDK（並行 or reelclaw 後）** | | | | |
| 38 | `asc subscriptions setup` weekly $7.99 作成 | CC | 3 | AUTO |
| 39 | `asc subscriptions review submit` | CC | 38 | AUTO |
| 40 | RC MCP: create-product weekly + entitlement + package | CC | 38 | AUTO |
| 41 | Xcode: SPM で Superwall-iOS 4.0.0+ 追加 | ダイス | - | **MANUAL** |
| 42 | Superwall Dashboard: Paywall A / B visual 作成 | ダイス | - | **MANUAL** |
| 43 | `RCPurchaseController.swift` 新規作成 | CC | 41 | AUTO |
| 44 | `SubscriptionManager.swift` Superwall.configure 追加 | CC | 41,43 | AUTO |
| 45 | `Config.swift` SUPERWALL_API_KEY 追加 + Info.plist / xcconfig | CC | 41 | AUTO |
| 46 | `OnboardingFlowView.swift` L95-126 差し替え（register placement） | CC | 41,42,44 | AUTO |
| 47 | Superwall MCP: create_product × 3 + create_entitlement + create_campaign | CC | 42 | AUTO |
| 48 | fastlane でビルド + archive | CC | 43-47 | AUTO |
| 49 | `asc` で TestFlight アップロード | CC | 48 | AUTO |
| 50 | ダイス実機で Paywall A / B 両方確認 | ダイス | 49 | MANUAL |
| 51 | App Store Connect submit v1.8.4 | CC | 50 | AUTO |
| 52 | Apple 審査通過 → phased release | - | 51 | MANUAL |

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
| Reelclaw direct post 化 | SELF_ONLY→公開 = ×100（誰も見てない→到達） | 1日 | P0 |
| Fix overlay / wrap / trim | 品質↑ → view through rate 1.5x | 1日 | P0 |
| Weekly $7.99 追加 | 価格抵抗↓ → CVR 1.5x（既存 Headspace 研究） | 2日 | P0 |
| Superwall A/B | copy/価格 最適化 → CVR 1.3x | 3日 | P1 |
| Honne AI EN 版 | 新市場、install +30% | 5日 | P2 |
| Larry direct post | 1日4投稿 追加チャネル | 1日 | P1 |
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
1. 今週: reelclaw fix 全部（P0）+ Superwall 下準備（asc weekly + RC MCP）
2. 来週: Superwall SDK 統合 + v1.8.4 提出 + Honne EN spec
3. 3週目: v1.8.4 リリース + Honne EN 実装
4. 4週目: A/B データ見て paywall 最適化、結果で判断

---

**最終更新**: 2026-04-11
