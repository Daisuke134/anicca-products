
---
# FINAL MONK-EARN ARCHITECTURE (2026-06-28) — TALKING monk, multi-language, daily

★ Dais 決定: static ではなく「喋る僧侶」。既存の HeyGen base 動画(A13等)を、毎回フレッシュ台本の TTS 音声で LatentSync 再同期 → 喋る。品質は完璧でないが talking > static。 ★

## lip-sync = HF LatentSync (無料GPU, $0, 検証済88秒/本)
全lip-syncを自分で検証した結論: ローカル不可(RAM)、MuseTalk=緑枠+大差なし、再同期は base が既に喋ってる為やや劣化。だが **LatentSync HF が唯一 $0で動く talking 解** → これを採用。render-free.sh に lip-sync step を追加。
- 呼び出し: gradio_client `Client("fffiloni/LatentSync", token=HF_TOKEN).predict(input_video_path, input_audio_path, api_name="/generate_lip_sync_video")`。
- 品質改善: base 動画は口の動きが控えめな区間を選ぶと再同期が綺麗(motion衝突減)。

## パイプライン（1本 / 言語ごと）
1. gen-script.sh (DeepSeek フレッシュ台本, 言語別, dedup ledger)
2. TTS: EN=edge-tts / JP=VOICEVOX 青山龍星 / 他=locale voice
3. **LatentSync (HF無料GPU): base 僧侶動画 + 新音声 → 喋る僧侶**  ← render-free に追加
4. burn-captions.sh (whisper→ASS, 言語別)
5. gen-caption.sh (DeepSeek desc+hook+ebookリンク)
6. post: TikTok + IG (言語別アカウント)
7. ledger 記録 → 翌runは別角度

## 多言語ロールアウト（EN→JP→他）
- 同一パイプライン、差し替えるのは: 台本言語 + TTS音声 + base動画 + 投稿アカウント。
- 各言語 = 専用アカウント(ig-account-create パターンで自律作成、CloakBrowser daily-driver)。EN(monk_anicca/anicca_en) → JP(青山龍星) → 他locale。
- watercolor-monk-factory = JP arm。音声VOICEVOX化済(task#5)。同じく LatentSync 視覚に統一 or JP monk-earn として吸収。

## ★ QUOTA 制約（重要）★
HF無料 = 5 GPU分/日/アカウント ≈ LatentSync 3本/日(88秒×3≒4.4分)。
→ EN 3×/日 でほぼ使い切る。多言語×3×/日 には: ① 言語ごとに別HFアカウント/token ② Modal $30/月無料枠で LatentSync self-host(overflow) ③ stagger。
spec化: まずEN 3×/日(HF無料1token)で立ち上げ → JPは別token → 規模化でModal。

## 残課題
- render-free に LatentSync step 配線 + base動画の口控えめ区間選定。
- 実投稿(POST_ID) → cron 3×/日。
- ebook 出品(集金)。
- 多言語: JP token + base + account、その後 locale 横展開。
