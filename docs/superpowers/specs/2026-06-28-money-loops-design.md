
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

---
# ★★ FINAL-FINAL (2026-06-28, Dais 訂正): NO LatentSync. AUDIO-SWAP ★★

Dais: 「LatentSync要らない。既存のHeyGen動画はもう口が動いてる。そこに新台本のElevenLabs/edge-tts音声を載せ替えるだけ。完璧同期じゃないがtweakしながらやる。」

## 視覚step = audio-swap（再lip-syncしない）
既存 HeyGen base動画(口が動いてる, base-videos/*.mp4)を音声尺にloop/trim → 元音声を捨て → 新TTS音声をmux → 1080x1920。口は元の動き＋新しい声＝喋ってるように見える。$0・即時(~7秒)・GPU/quota不要。
- 実装: render-free.sh L43 `ffmpeg -stream_loop -1 -i base -i voice -t DUR -map 0:v -map 1:a ...`。検証済(/tmp/talkmonk.mp4)。
- tweak余地: base動画は口がよく動く区間を選ぶ/台本尺をbase尺に寄せる。
- ★LatentSync/MuseTalk/wav2lip 全廃 — 再lip-syncは劣化&quota&遅い。audio-swapが正解。★

## パイプライン（確定）
gen-script(フレッシュ台本/言語別) → TTS(edge-tts EN/VOICEVOX JP) → **render-free(base動画に音声載せ替え=喋る僧侶)** → burn-captions → gen-caption(+ebookリンク) → post(TikTok+IG) → ledger

## 多言語(EN→JP→他) + 大量アカウント
- 言語別: 台本言語 + TTS音声 + base動画 + 投稿アカウントを差替。
- アカウント大量作成: ig-account-create パターン(CloakBrowser daily-driver)で自律。EN→JP→locale。
- base動画が言語非依存(口の動きだけ)なので同じbaseを全言語で使い回せる(音声だけ変える)=スケール容易。

## watercolor-monk-factory(JP)
JP音声VOICEVOX化済(#5)。これも同audio-swap方式に統一(HeyGen依存を除去) or JP monk-earnとして吸収。

## QUOTA問題は消滅
audio-swapはローカルffmpegのみ=HF GPU不要 → 5分/日制限なし → 3×/日×多言語×多アカウントが全部$0で無制限に回せる。★これが大きい★
