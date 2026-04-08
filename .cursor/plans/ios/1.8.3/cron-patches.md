# 1.8.3 Cron Patches — 完全実装パッチ（修正版）

> Date: 2026-04-09
> Reviewer: Anicca
> Status: REVIEWED / NEEDS MANUAL IMPLEMENTATION

---

## PATCH 1: Widget cron — ID変更 + 時間修正 + フックテキスト元修正 + EN動画リスト確定

**ファイル:** `/Users/anicca/anicca-project/openclaw-skills/jobs.json`

### 目的
Anicca Widget demo 用の source-managed cron 4本を、runtime 既存 cron と混同しない名前に変更し、JST ベースの時刻・Widget hooks W1-W12・固定 demo video list を明示する。

### 注意
- この patch は **jobs.json の source 管理定義** を更新するものであり、runtime 既存 cron（`reelclaw-ja-1`, `reelclaw-ja-2`, `reelclaw-en-1`, `reelclaw-en-2`）を直接変更するものではない。
- Hook text の daily rotation state は `jobs.json` では保持できない。したがってこの patch では **rotation rule を payload に明記するのみ** とし、実際の state 保存先は別 spec で管理する。
- EN widget video source に `.mov` が含まれる。ReelClaw 側が `.mov` を安全に処理できることを事前確認すること。未確認なら `.mp4` に統一してから適用すること。

### jobs.json の対象4件を以下で置換

```json
    {
      "id": "reelclaw-anicca-ja-widget-1",
      "agentId": "anicca",
      "jobId": "reelclaw-anicca-ja-widget-1",
      "name": "reelclaw-anicca-ja-widget-1",
      "schedule": {
        "kind": "cron",
        "expr": "0 8 * * *",
        "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
        "message": "Execute reelclaw skill. Language: ja. App: Anicca (Widget demo). Font: /System/Library/Fonts/ヒラギノ角ゴシック W7.ttc. DEMO_MODE: NO_TRIM. Do NOT run Step 2 (Gemini analysis/trimming). Use the widget demo video AS-IS without cutting. The full video IS the demo. Video source: widget demo videos from /Users/anicca/anicca-project/assets/reelclaw/ja-widget-videos/ (rotate in this exact order: anger.MP4, choosewisely.MP4, compulsivethinjing.MP4, self-hatred-affirmatino.MP4, sleepinglate.MP4, stopiingrumination.MP4). UGC hook video source: ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_ja_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Hook text source: Widget hooks W1-W12 JA from spec. Daily rule: rotate without reusing the same hook on the same day across widget JA crons. Title: ロック画面にアファメーションを設定する方法. Caption: ロック画面にアファメーションを設定する方法\n\n#アファメーション #ロック画面 #セルフケア #メンタルヘルス #自己肯定感 #fyp. Publish to TikTok JA (draft), Instagram JA (direct), YouTube JA (direct) via Postiz. TikTok: cmnhlk3ju058lpn0ytilqdpo0. Instagram: cmnipef7g00oerm0y3dz4lamx. YouTube: cmn1oukj9012nnq0yqhouc3ib. DEMO OVERLAY RULE: DO NOT overlay text on demo section. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2)."
      },
      "delivery": {
        "mode": "announce",
        "channel": "slack",
        "to": "channel:C091G3PKHL2"
      },
      "enabled": true
    },
    {
      "id": "reelclaw-anicca-ja-widget-2",
      "agentId": "anicca",
      "jobId": "reelclaw-anicca-ja-widget-2",
      "name": "reelclaw-anicca-ja-widget-2",
      "schedule": {
        "kind": "cron",
        "expr": "0 18 * * *",
        "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
        "message": "Execute reelclaw skill. Language: ja. App: Anicca (Widget demo). Font: /System/Library/Fonts/ヒラギノ角ゴシック W7.ttc. DEMO_MODE: NO_TRIM. Do NOT run Step 2 (Gemini analysis/trimming). Use the widget demo video AS-IS without cutting. The full video IS the demo. Video source: widget demo videos from /Users/anicca/anicca-project/assets/reelclaw/ja-widget-videos/ (rotate in this exact order: anger.MP4, choosewisely.MP4, compulsivethinjing.MP4, self-hatred-affirmatino.MP4, sleepinglate.MP4, stopiingrumination.MP4). UGC hook video source: ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_ja_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Hook text source: Widget hooks W1-W12 JA from spec. Daily rule: rotate without reusing the same hook on the same day across widget JA crons. Title: ロック画面にアファメーションを設定する方法. Caption: ロック画面にアファメーションを設定する方法\n\n#アファメーション #ロック画面 #セルフケア #メンタルヘルス #自己肯定感 #fyp. Publish to TikTok JA (draft), Instagram JA (direct), YouTube JA (direct) via Postiz. TikTok: cmnhlk3ju058lpn0ytilqdpo0. Instagram: cmnipef7g00oerm0y3dz4lamx. YouTube: cmn1oukj9012nnq0yqhouc3ib. DEMO OVERLAY RULE: DO NOT overlay text on demo section. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2)."
      },
      "delivery": {
        "mode": "announce",
        "channel": "slack",
        "to": "channel:C091G3PKHL2"
      },
      "enabled": true
    },
    {
      "id": "reelclaw-anicca-en-widget-1",
      "agentId": "anicca",
      "jobId": "reelclaw-anicca-en-widget-1",
      "name": "reelclaw-anicca-en-widget-1",
      "schedule": {
        "kind": "cron",
        "expr": "30 9 * * *",
        "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
        "message": "Execute reelclaw skill. Language: en. App: Anicca (Widget demo). Font: ~/Library/Fonts/TikTokSansDisplayBold.ttf. DEMO_MODE: NO_TRIM. Do NOT run Step 2 (Gemini analysis/trimming). Use the widget demo video AS-IS without cutting. The full video IS the demo. Video source: widget demo videos from /Users/anicca/anicca-project/assets/reelclaw/en-widget-videos/ (rotate in this exact order: anger.MP4, anxietty.MP4, obseeive-thinking.MP4, rumnation.mov, slef-hatred.MP4, styaling-up-late.MP4). UGC hook video source: ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_en_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Hook text source: Widget hooks W1-W12 EN from spec. Daily rule: rotate without reusing the same hook on the same day across widget EN crons. Title: how to put affirmations on your lockscreen. Caption: how to put affirmations on your lockscreen\n\n#affirmations #lockscreen #selfcare #mentalhealth #selflove #fyp. Publish to TikTok EN (draft), Instagram EN (direct), YouTube EN (direct) via Postiz. TikTok: cmn8y47do02mmo70yckb46dyu. Instagram: cmn8y95rg02d2qx0y09bbk5pb. YouTube: cmmzukbkw04ulp30yfvijrwio. DEMO OVERLAY RULE: DO NOT overlay text on demo section. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2)."
      },
      "delivery": {
        "mode": "announce",
        "channel": "slack",
        "to": "channel:C091G3PKHL2"
      },
      "enabled": true
    },
    {
      "id": "reelclaw-anicca-en-widget-2",
      "agentId": "anicca",
      "jobId": "reelclaw-anicca-en-widget-2",
      "name": "reelclaw-anicca-en-widget-2",
      "schedule": {
        "kind": "cron",
        "expr": "0 19 * * *",
        "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
        "message": "Execute reelclaw skill. Language: en. App: Anicca (Widget demo). Font: ~/Library/Fonts/TikTokSansDisplayBold.ttf. DEMO_MODE: NO_TRIM. Do NOT run Step 2 (Gemini analysis/trimming). Use the widget demo video AS-IS without cutting. The full video IS the demo. Video source: widget demo videos from /Users/anicca/anicca-project/assets/reelclaw/en-widget-videos/ (rotate in this exact order: anger.MP4, anxietty.MP4, obseeive-thinking.MP4, rumnation.mov, slef-hatred.MP4, styaling-up-late.MP4). UGC hook video source: ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_en_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Hook text source: Widget hooks W1-W12 EN from spec. Daily rule: rotate without reusing the same hook on the same day across widget EN crons. Title: how to put affirmations on your lockscreen. Caption: how to put affirmations on your lockscreen\n\n#affirmations #lockscreen #selfcare #mentalhealth #selflove #fyp. Publish to TikTok EN (draft), Instagram EN (direct), YouTube EN (direct) via Postiz. TikTok: cmn8y47do02mmo70yckb46dyu. Instagram: cmn8y95rg02d2qx0y09bbk5pb. YouTube: cmmzukbkw04ulp30yfvijrwio. DEMO OVERLAY RULE: DO NOT overlay text on demo section. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2)."
      },
      "delivery": {
        "mode": "announce",
        "channel": "slack",
        "to": "channel:C091G3PKHL2"
      },
      "enabled": true
    }
```

---

## PATCH 2: Honne JA 3つ — reelclaw形式追加（修正版）

**ファイル:** `/Users/anicca/anicca-project/openclaw-skills/jobs.json`

### 目的
Honne JA を ReelClaw 化する。ただし **現行 `honne-mapping.json` の実データ構造と整合させる**。

### 注意
- 現行 `~/.openclaw/workspace/honne-ai/honne-mapping.json` の rotation key は
  - `honne-ja-morning`
  - `honne-ja-afternoon`
  - `honne-ja-evening`
  である。
- この patch の cron 名は source-managed 側では `reelclaw-honne-ja-1/2/3` とするが、**payload は既存 rotation key を明示参照**する。
- H1-H10 JA を独立 hook pool として使う設計は、現行 `honne-mapping.json` の `videos[].hooks[]` と衝突する。したがってこの patch では **hook text source は現行 `honne-mapping.json` を正本** とする。
- つまりこの patch は「ReelClaw 化」であり、「H1-H10 へのデータモデル移行」は含めない。

### 追加する3件

```json
    ,
    {
      "id": "reelclaw-honne-ja-1",
      "agentId": "anicca",
      "jobId": "reelclaw-honne-ja-1",
      "name": "reelclaw-honne-ja-1",
      "schedule": {
        "kind": "cron",
        "expr": "0 9 * * *",
        "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
        "message": "Execute reelclaw skill. Language: ja. App: Honne AI. Font: /System/Library/Fonts/ヒラギノ角ゴシック W7.ttc. DEMO_MODE: NO_TRIM. Do NOT run Step 2 (Gemini analysis/trimming). Use the demo video AS-IS without cutting. The full video IS the demo. Video source: ~/.openclaw/workspace/honne-ai/demos/ (rotate existing files in order defined by ~/.openclaw/workspace/honne-ai/honne-mapping.json). Rotation state source: ~/.openclaw/workspace/honne-ai/honne-mapping.json rotation.lastUsed.honne-ja-morning. Hook text source: ~/.openclaw/workspace/honne-ai/honne-mapping.json videos[].hooks[] (do not use spec H1-H10 in this patch). UGC hook video source: ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_ja_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Title rotation: ①LINEの本音をAIが翻訳する ②もう返信で悩まない ③あの人の本音、AIが教えてくれた. Caption: use selected title, then hashtags. Publish to TikTok ONLY via Postiz. TikTok integration: cmnit95mg015rrm0ye5vm8dhl. Posting mode: draft, SELF_ONLY. DEMO OVERLAY RULE: DO NOT overlay text on demo section. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2)."
      },
      "delivery": {
        "mode": "announce",
        "channel": "slack",
        "to": "channel:C091G3PKHL2"
      },
      "enabled": true
    },
    {
      "id": "reelclaw-honne-ja-2",
      "agentId": "anicca",
      "jobId": "reelclaw-honne-ja-2",
      "name": "reelclaw-honne-ja-2",
      "schedule": {
        "kind": "cron",
        "expr": "0 15 * * *",
        "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
        "message": "Execute reelclaw skill. Language: ja. App: Honne AI. Font: /System/Library/Fonts/ヒラギノ角ゴシック W7.ttc. DEMO_MODE: NO_TRIM. Do NOT run Step 2 (Gemini analysis/trimming). Use the demo video AS-IS without cutting. The full video IS the demo. Video source: ~/.openclaw/workspace/honne-ai/demos/ (rotate existing files in order defined by ~/.openclaw/workspace/honne-ai/honne-mapping.json). Rotation state source: ~/.openclaw/workspace/honne-ai/honne-mapping.json rotation.lastUsed.honne-ja-afternoon. Hook text source: ~/.openclaw/workspace/honne-ai/honne-mapping.json videos[].hooks[] (do not use spec H1-H10 in this patch). UGC hook video source: ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_ja_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Title rotation: ①LINEの本音をAIが翻訳する ②もう返信で悩まない ③あの人の本音、AIが教えてくれた. Caption: use selected title, then hashtags. Publish to TikTok ONLY via Postiz. TikTok integration: cmnit95mg015rrm0ye5vm8dhl. Posting mode: draft, SELF_ONLY. DEMO OVERLAY RULE: DO NOT overlay text on demo section. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2)."
      },
      "delivery": {
        "mode": "announce",
        "channel": "slack",
        "to": "channel:C091G3PKHL2"
      },
      "enabled": true
    },
    {
      "id": "reelclaw-honne-ja-3",
      "agentId": "anicca",
      "jobId": "reelclaw-honne-ja-3",
      "name": "reelclaw-honne-ja-3",
      "schedule": {
        "kind": "cron",
        "expr": "0 20 * * *",
        "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
        "message": "Execute reelclaw skill. Language: ja. App: Honne AI. Font: /System/Library/Fonts/ヒラギノ角ゴシック W7.ttc. DEMO_MODE: NO_TRIM. Do NOT run Step 2 (Gemini analysis/trimming). Use the demo video AS-IS without cutting. The full video IS the demo. Video source: ~/.openclaw/workspace/honne-ai/demos/ (rotate existing files in order defined by ~/.openclaw/workspace/honne-ai/honne-mapping.json). Rotation state source: ~/.openclaw/workspace/honne-ai/honne-mapping.json rotation.lastUsed.honne-ja-evening. Hook text source: ~/.openclaw/workspace/honne-ai/honne-mapping.json videos[].hooks[] (do not use spec H1-H10 in this patch). UGC hook video source: ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_ja_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Title rotation: ①LINEの本音をAIが翻訳する ②もう返信で悩まない ③あの人の本音、AIが教えてくれた. Caption: use selected title, then hashtags. Publish to TikTok ONLY via Postiz. TikTok integration: cmnit95mg015rrm0ye5vm8dhl. Posting mode: draft, SELF_ONLY. DEMO OVERLAY RULE: DO NOT overlay text on demo section. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2)."
      },
      "delivery": {
        "mode": "announce",
        "channel": "slack",
        "to": "channel:C091G3PKHL2"
      },
      "enabled": true
    }
```

---

## PATCH 3: Spec更新 — T1c削除

**ファイル:** `/Users/anicca/anicca-project/.cursor/plans/ios/1.8.3/10k-mrr-growth-spec.md`

```diff
- | T1c | visual-qa 採点（40/50+必須） | CC | — | `screenshot-ab` PHASE 5 | 🔜 |
+ | ~~T1c~~ | ~~visual-qa 採点（40/50+必須）~~ | — | — | — | SKIP（不要） |
```

---

## PATCH 4: ASO metadata更新（ASC CLI 12コマンド）

**ファイル:** `/Users/anicca/anicca-project/.cursor/plans/ios/1.8.3/cron-patches.md`

この節は現状のままでよい。実行前に次だけ確認すること:
- APP_ID: `6755129214`
- VERSION_ID: `42ab36d0-73d4-4e49-a3fb-bd94761a9285`
- locale: `en-US`, `ja`, `es-ES`

---

## PATCH 5: openclaw gateway restart（Dais承認後のみ）

**ファイル:** `/Users/anicca/anicca-project/.cursor/plans/ios/1.8.3/cron-patches.md`

```md
## PATCH 5: openclaw gateway restart（Dais承認後のみ）

**実行条件:** Dais の明示的な許可を得た後のみ実行

```bash
openclaw gateway restart
```

**注意:** MEMORY.md の運用ルールにより、Dais の許可なし restart は禁止。
```

---

## PATCH 6: App Store ビルド+提出（修正版）

**ファイル:** `/Users/anicca/anicca-project/.cursor/plans/ios/1.8.3/cron-patches.md`

```md
## PATCH 6: App Store ビルド+提出（修正版）

```bash
# 1. keychain unlock
cd /Users/anicca/anicca-10k-mrr/aniccaios
source ~/.config/mobileapp-builder/.env
security unlock-keychain -p "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db

# 2. archive
fastlane build_app skip_package_ipa:true

# 3. archive path を明示確認
ARCHIVE_PATH="$(ls -td ~/Library/Developer/Xcode/Archives/*/aniccaios*.xcarchive | head -1)"
test -d "$ARCHIVE_PATH" || { echo "Archive not found"; exit 1; }
echo "Archive: $ARCHIVE_PATH"

# 4. export path は永続パスを使う
EXPORT_PATH="/Users/anicca/anicca-10k-mrr/build/export"
mkdir -p "$EXPORT_PATH"

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist fastlane/build/export/ExportOptions.plist \
  -exportPath "$EXPORT_PATH"

# 5. deliver
fastlane deliver \
  --ipa "$EXPORT_PATH/aniccaios.ipa" \
  --skip_metadata true \
  --skip_screenshots true
```

**注意:**
- `/tmp` は使わない
- archivePath にワイルドカード直指定しない
- 実行前に branch と working tree を確認すること
```

---

## PATCH 7: PPO スクショA/Bテスト（READY_FOR_SALE 後に実行）

**ファイル:** `/Users/anicca/anicca-project/.cursor/plans/ios/1.8.3/cron-patches.md`

```md
## PATCH 7: PPO スクショA/Bテスト（READY_FOR_SALE 後に実行）

**前提条件:**
- ビルドが Apple Review を通過し READY_FOR_SALE になっている
- App Store Connect 上で対象バージョンが正常に認識されている
- treatment screenshots が反映済み

```bash
EXP_ID=$(asc product-pages experiments create \
  --v2 --app 6755129214 --platform IOS \
  --name "screenshot-ab-v$(date +%Y%m%d)" \
  --traffic-proportion 50 \
  --output json | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")

echo "Experiment ID: $EXP_ID"
```
```

---

## PATCH 8: Postiz "#Postiz" caption fix（まず調査）

**ファイル:** `/Users/anicca/anicca-project/.cursor/plans/ios/1.8.3/cron-patches.md`

```md
## PATCH 8: Postiz "#Postiz" caption fix（まず調査）

**これは実装修正パッチではなく、調査パッチ。**

```bash
docker exec postiz grep -rn "#Postiz" /app/ 2>/dev/null
```

### 調査後に別途必要なもの
- 該当ファイルの完全パス
- 問題箇所の完全なコード断片
- どう直すかの exact patch
- 変更後にコンテナ再起動が必要かどうか
```

---

## 実行順序（修正版）

1. PATCH 1
2. PATCH 2
3. PATCH 3
4. PATCH 4
5. PATCH 6
6. PATCH 7
7. PATCH 8（調査）
8. PATCH 5（restart が必要だと判明し、かつ Dais が許可した場合のみ）
