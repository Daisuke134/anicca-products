# 1.8.3 Cron Patches — 完全実装パッチ

> Date: 2026-04-09
> Reviewer: Anicca (ボス)
> Status: PENDING REVIEW

---

## PATCH 1: Widget cron 衝突回避 + EN動画リスト確定

**ファイル:** `/Users/anicca/anicca-project/openclaw-skills/jobs.json`

### 1a. reelclaw-ja-morning 時間変更 (09:00 → 08:00)

```diff
      "id": "reelclaw-ja-morning",
      "agentId": "anicca",
      "jobId": "reelclaw-ja-morning",
      "name": "reelclaw-ja-morning",
      "schedule": {
        "kind": "cron",
-       "expr": "0 9 * * *",
+       "expr": "0 8 * * *",
        "tz": "Asia/Tokyo"
      },
```

理由: 09:00にhonne-ja-morningが稼働中。衝突回避。

### 1b. reelclaw-ja-evening 時間変更 (21:00 → 18:00)

```diff
      "id": "reelclaw-ja-evening",
      "agentId": "anicca",
      "jobId": "reelclaw-ja-evening",
      "name": "reelclaw-ja-evening",
      "schedule": {
        "kind": "cron",
-       "expr": "0 21 * * *",
+       "expr": "0 18 * * *",
        "tz": "Asia/Tokyo"
      },
```

理由: 21:00にreelclaw-ja-2(card) + Larry slideshow JA-3が稼働中。衝突回避。

### 1c. reelclaw-en-morning 時間+TZ変更 + 動画リスト確定

```diff
      "id": "reelclaw-en-morning",
      "agentId": "anicca",
      "jobId": "reelclaw-en-morning",
      "name": "reelclaw-en-morning",
      "schedule": {
        "kind": "cron",
-       "expr": "0 9 * * *",
-       "tz": "America/Los_Angeles"
+       "expr": "30 9 * * *",
+       "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
-       "message": "Execute reelclaw skill. Language: en. Font: ~/Library/Fonts/TikTokSansDisplayBold.ttf. DEMO_MODE: NO_TRIM — Do NOT run Step 2 (Gemini analysis/trimming). Use the widget demo video AS-IS without cutting. The full video IS the demo. Video source: widget demo videos from /Users/anicca/anicca-project/assets/reelclaw/en-widget-videos/ (rotate all .MP4 files in directory). UGC hooks from ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_en_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Hook text from ~/.openclaw/workspace/tiktok-marketing/hooks-en.json. Publish to TikTok EN (draft), Instagram EN (direct), YouTube EN (direct) via Postiz. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2). This Slack report is MANDATORY."
+       "message": "Execute reelclaw skill. Language: en. Font: ~/Library/Fonts/TikTokSansDisplayBold.ttf. DEMO_MODE: NO_TRIM — Do NOT run Step 2 (Gemini analysis/trimming). Use the widget demo video AS-IS without cutting. The full video IS the demo. Video source: widget demo videos from /Users/anicca/anicca-project/assets/reelclaw/en-widget-videos/ (rotate: anger.MP4, anxietty.MP4, obseeive-thinking.MP4, rumnation.mov, slef-hatred.MP4, styaling-up-late.MP4). UGC hooks from ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_en_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Hook text from ~/.openclaw/workspace/tiktok-marketing/hooks-en.json. Publish to TikTok EN (draft), Instagram EN (direct), YouTube EN (direct) via Postiz. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2). This Slack report is MANDATORY."
      },
```

### 1d. reelclaw-en-evening 時間+TZ変更 + 動画リスト確定

```diff
      "id": "reelclaw-en-evening",
      "agentId": "anicca",
      "jobId": "reelclaw-en-evening",
      "name": "reelclaw-en-evening",
      "schedule": {
        "kind": "cron",
-       "expr": "0 21 * * *",
-       "tz": "America/Los_Angeles"
+       "expr": "0 19 * * *",
+       "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
-       "message": "Execute reelclaw skill. Language: en. Font: ~/Library/Fonts/TikTokSansDisplayBold.ttf. DEMO_MODE: NO_TRIM — Do NOT run Step 2 (Gemini analysis/trimming). Use the widget demo video AS-IS without cutting. The full video IS the demo. Video source: widget demo videos from /Users/anicca/anicca-project/assets/reelclaw/en-widget-videos/ (rotate all .MP4 files in directory). UGC hooks from ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_en_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Hook text from ~/.openclaw/workspace/tiktok-marketing/hooks-en.json. Publish to TikTok EN (draft), Instagram EN (direct), YouTube EN (direct) via Postiz. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2). This Slack report is MANDATORY."
+       "message": "Execute reelclaw skill. Language: en. Font: ~/Library/Fonts/TikTokSansDisplayBold.ttf. DEMO_MODE: NO_TRIM — Do NOT run Step 2 (Gemini analysis/trimming). Use the widget demo video AS-IS without cutting. The full video IS the demo. Video source: widget demo videos from /Users/anicca/anicca-project/assets/reelclaw/en-widget-videos/ (rotate: anger.MP4, anxietty.MP4, obseeive-thinking.MP4, rumnation.mov, slef-hatred.MP4, styaling-up-late.MP4). UGC hooks from ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_en_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Hook text from ~/.openclaw/workspace/tiktok-marketing/hooks-en.json. Publish to TikTok EN (draft), Instagram EN (direct), YouTube EN (direct) via Postiz. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2). This Slack report is MANDATORY."
      },
```

---

## PATCH 2: Honne JA 3つ — reelclaw形式追加

**ファイル:** `/Users/anicca/anicca-project/openclaw-skills/jobs.json`

L601（最後のcron `reelclaw-en-evening` の閉じ `}` の後、`]` の前）に以下3つを追加:

```json
    ,
    {
      "id": "honne-ja-morning",
      "agentId": "anicca",
      "jobId": "honne-ja-morning",
      "name": "honne-ja-morning",
      "schedule": {
        "kind": "cron",
        "expr": "0 9 * * *",
        "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
        "message": "Execute reelclaw skill. Language: ja. App: Honne AI. Font: /System/Library/Fonts/ヒラギノ角ゴシック W7.ttc. DEMO_MODE: NO_TRIM — Do NOT run Step 2 (Gemini analysis/trimming). Use the demo video AS-IS without cutting. The full video IS the demo. Video source: Honne demo videos from ~/.openclaw/workspace/honne-ai/demos/ (rotate: boss-imnotmad.MP4, boss-sukinisureba.MP4, boss-yarikatamakaseru.MP4, huuhu-imnotmad.MP4, mom-sukinisureba.MP4, parent-imnotmad.MP4, sukinisureba-girlfriend.MP4, sukiniyare-boss.MP4). Use rotation from ~/.openclaw/workspace/honne-ai/honne-mapping.json rotation.lastUsed.honne-ja-morning. Hook text: use hooks array from honne-mapping.json for the selected video (3 hooks per video, rotate). UGC hooks from ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_ja_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Title: あの人の本音が知りたい人は、本音翻訳を試してみて. Caption: あの人の本音が知りたい人は、本音翻訳を試してみて\n\n#本音 #人間関係 #職場関係 #恋愛関係 #親子関係 #言いづらい #fyp. Publish to TikTok (cmnit95mg015rrm0ye5vm8dhl) ONLY via Postiz (draft, SELF_ONLY). ## DEMO OVERLAY RULE: DO NOT overlay text on demo section. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2). This Slack report is MANDATORY."
      },
      "delivery": {
        "mode": "announce",
        "channel": "slack",
        "to": "channel:C091G3PKHL2"
      },
      "enabled": true
    },
    {
      "id": "honne-ja-afternoon",
      "agentId": "anicca",
      "jobId": "honne-ja-afternoon",
      "name": "honne-ja-afternoon",
      "schedule": {
        "kind": "cron",
        "expr": "0 15 * * *",
        "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
        "message": "Execute reelclaw skill. Language: ja. App: Honne AI. Font: /System/Library/Fonts/ヒラギノ角ゴシック W7.ttc. DEMO_MODE: NO_TRIM — Do NOT run Step 2 (Gemini analysis/trimming). Use the demo video AS-IS without cutting. The full video IS the demo. Video source: Honne demo videos from ~/.openclaw/workspace/honne-ai/demos/ (rotate: boss-imnotmad.MP4, boss-sukinisureba.MP4, boss-yarikatamakaseru.MP4, huuhu-imnotmad.MP4, mom-sukinisureba.MP4, parent-imnotmad.MP4, sukinisureba-girlfriend.MP4, sukiniyare-boss.MP4). Use rotation from ~/.openclaw/workspace/honne-ai/honne-mapping.json rotation.lastUsed.honne-ja-afternoon. Hook text: use hooks array from honne-mapping.json for the selected video (3 hooks per video, rotate). UGC hooks from ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_ja_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Title: あの人の本音が知りたい人は、本音翻訳を試してみて. Caption: あの人の本音が知りたい人は、本音翻訳を試してみて\n\n#本音 #人間関係 #職場関係 #恋愛関係 #親子関係 #言いづらい #fyp. Publish to TikTok (cmnit95mg015rrm0ye5vm8dhl) ONLY via Postiz (draft, SELF_ONLY). ## DEMO OVERLAY RULE: DO NOT overlay text on demo section. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2). This Slack report is MANDATORY."
      },
      "delivery": {
        "mode": "announce",
        "channel": "slack",
        "to": "channel:C091G3PKHL2"
      },
      "enabled": true
    },
    {
      "id": "honne-ja-evening",
      "agentId": "anicca",
      "jobId": "honne-ja-evening",
      "name": "honne-ja-evening",
      "schedule": {
        "kind": "cron",
        "expr": "0 20 * * *",
        "tz": "Asia/Tokyo"
      },
      "sessionTarget": "isolated",
      "wakeMode": "now",
      "payload": {
        "kind": "agentTurn",
        "message": "Execute reelclaw skill. Language: ja. App: Honne AI. Font: /System/Library/Fonts/ヒラギノ角ゴシック W7.ttc. DEMO_MODE: NO_TRIM — Do NOT run Step 2 (Gemini analysis/trimming). Use the demo video AS-IS without cutting. The full video IS the demo. Video source: Honne demo videos from ~/.openclaw/workspace/honne-ai/demos/ (rotate: boss-imnotmad.MP4, boss-sukinisureba.MP4, boss-yarikatamakaseru.MP4, huuhu-imnotmad.MP4, mom-sukinisureba.MP4, parent-imnotmad.MP4, sukinisureba-girlfriend.MP4, sukiniyare-boss.MP4). Use rotation from ~/.openclaw/workspace/honne-ai/honne-mapping.json rotation.lastUsed.honne-ja-evening. Hook text: use hooks array from honne-mapping.json for the selected video (3 hooks per video, rotate). UGC hooks from ~/.openclaw/workspace/tiktok-marketing/ugc-library/hooks/. CTA: ~/.openclaw/workspace/mau-tiktok/cta_ja_final.mp4. BGM: ~/.openclaw/workspace/tiktok-marketing/music/bgm-cta.mp3. Title: あの人の本音が知りたい人は、本音翻訳を試してみて. Caption: あの人の本音が知りたい人は、本音翻訳を試してみて\n\n#本音 #人間関係 #職場関係 #恋愛関係 #親子関係 #言いづらい #fyp. Publish to TikTok (cmnit95mg015rrm0ye5vm8dhl) ONLY via Postiz (draft, SELF_ONLY). ## DEMO OVERLAY RULE: DO NOT overlay text on demo section. CRITICAL: After you finish, you MUST post a summary to Slack #metrics channel (channel ID: C091G3PKHL2). This Slack report is MANDATORY."
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
+ | ~~T1c~~ | ~~visual-qa 採点~~ | — | — | — | SKIP（不要） |
```

---

## PATCH 4: ASO metadata更新（ASC CLI 12コマンド）

```bash
# EN Title
asc localizations update --app 6755129214 --type app-info --locale "en-US" --name "Daily Affirmations - Anicca"

# EN Subtitle
asc localizations update --app 6755129214 --type app-info --locale "en-US" --subtitle "Self Care & Positive Mindset"

# EN Keywords
asc localizations update --version "42ab36d0-73d4-4e49-a3fb-bd94761a9285" --locale "en-US" --keywords "self love,mental health,anxiety,stress,wellness,mindfulness,mood,calm,quote,meditation,habit,healing"

# EN Promo
asc localizations update --version "42ab36d0-73d4-4e49-a3fb-bd94761a9285" --locale "en-US" --promotional-text "Gentle words when you need them most. Choose your struggles. Get daily nudges. Cancel anytime."

# JA Title
asc localizations update --app 6755129214 --type app-info --locale "ja" --name "毎日のアファメーション - アニッチャ"

# JA Subtitle
asc localizations update --app 6755129214 --type app-info --locale "ja" --subtitle "セルフケア・ポジティブ思考・心の安らぎ"

# JA Keywords
asc localizations update --version "42ab36d0-73d4-4e49-a3fb-bd94761a9285" --locale "ja" --keywords "自己肯定感,不安,先延ばし,考えすぎ,ストレス,瞑想,自分を好きになる,習慣,名言,心の平和,マインドフルネス,セルフヘルプ,気分,癒し"

# JA Promo
asc localizations update --version "42ab36d0-73d4-4e49-a3fb-bd94761a9285" --locale "ja" --promotional-text "あなたが一番つらいとき、そっと届く言葉。13の課題に寄り添う。いつでもキャンセル可能。"

# ES Title
asc localizations update --app 6755129214 --type app-info --locale "es-ES" --name "Afirmaciones Diarias - Anicca"

# ES Subtitle
asc localizations update --app 6755129214 --type app-info --locale "es-ES" --subtitle "Autocuidado y Bienestar Mental"

# ES Keywords
asc localizations update --version "42ab36d0-73d4-4e49-a3fb-bd94761a9285" --locale "es-ES" --keywords "autoestima,ansiedad,estrés,meditación,frases positiva,motivación,calma,hábito,bienestar,salud,pensamiento,amor propio"

# ES Promo
asc localizations update --version "42ab36d0-73d4-4e49-a3fb-bd94761a9285" --locale "es-ES" --promotional-text "Palabras suaves cuando más las necesitas. Elige tus luchas. Recibe nudges diarios. Cancela cuando quieras."
```

---

## PATCH 5: openclaw gateway restart

```bash
openclaw gateway restart
```

---

## PATCH 6: App Store ビルド+提出

```bash
# 1. keychain unlock
cd /Users/anicca/anicca-10k-mrr/aniccaios
source ~/.config/mobileapp-builder/.env
security unlock-keychain -p "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db

# 2. archive (fastlane)
fastlane build_app skip_package_ipa:true

# 3. export (xcodebuild — widget extension automatic signing 回避)
xcodebuild -exportArchive \
  -archivePath ~/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/aniccaios*.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath /tmp/anicca-export

# 4. deliver
fastlane deliver \
  --ipa /tmp/anicca-export/aniccaios.ipa \
  --skip_metadata true \
  --skip_screenshots true
```

---

## PATCH 7: PPO スクショA/Bテスト（提出と同時）

```bash
# 実験作成（50/50 traffic split）
EXP_ID=$(asc product-pages experiments create \
  --v2 --app 6755129214 --platform IOS \
  --name "screenshot-ab-v$(date +%Y%m%d)" \
  --traffic-proportion 50 \
  --output json | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")

echo "Experiment ID: $EXP_ID"

# Treatment作成 + スクショアップロード + 実験開始
# → 詳細は screenshot-ab スキル PHASE 7 参照
```

---

## PATCH 8: Postiz "#Postiz" caption fix

```bash
# Postiz セルフホスト Docker コンテナのソースを確認
docker exec postiz grep -rn "#Postiz" /app/ 2>/dev/null

# 該当箇所を特定してキャプション追加ロジックを削除/修正
# → 具体的なファイルパスはDocker内調査後に確定
```

---

## 実行順序

1. PATCH 1 (widget cron時間修正)
2. PATCH 2 (honne reelclaw追加)
3. PATCH 3 (spec T1c削除)
4. PATCH 5 (gateway restart)
5. PATCH 4 (ASO metadata)
6. PATCH 6 (ビルド+提出)
7. PATCH 7 (PPO A/B)
8. PATCH 8 (Postiz fix)
