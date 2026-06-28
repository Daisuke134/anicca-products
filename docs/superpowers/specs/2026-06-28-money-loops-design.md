
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
# ★★ FINAL-FINAL (2026-06-28, Dais 訂正): NO LatentSync. AUDIO-SWAP ★★ 〔SUPERSEDED → 下の FINAL-v3 参照〕

> ⚠️ この audio-swap 案は **FINAL-v3 (下部) で上書き済**。Dais が「声が僧侶らしくない/一貫しない」「lip-sync が良くない」を理由に再反転 → 本物の lip-sync (fal) + 声固定 (ElevenLabs クローン) に変更。audio-swap は **lip-sync 全 tier 失敗時の $0 フォールバック**としてのみ残存。

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

---
# ★★★ FINAL-v3 (2026-06-29, Dais 再訂正): REAL lip-sync (fal) + 声固定 (ElevenLabsクローン) ★★★

Dais verbatim: 「1. 声が僧侶らしくない・一貫性が超重要 → 彼の声のMP4を彼の声として使い、ずっと同じにする。2. lip-syncが良くない、もっと良く → falにチャージしたからfalモデルを使え、払うのは簡単。$10で2ヶ月、ジュースを搾れ、$10を永遠に。」

## ① 声 = 僧侶本人の声で固定（consistency）
- A13 動画の声を **ElevenLabs Instant Voice Clone** 済 → `MONK_EN_VOICE_ID` (= ESkd4jxFq8i0iY3m2JeW、`~/.openclaw/.env`)。
- EN 全動画で **この同じ voice_id** を使う = 声がブレない。`eleven_multilingual_v2` / stability 0.5 / similarity 0.85。
- JP = VOICEVOX 青山龍星 (speaker 13)。多言語は locale ごとに 1 つの固定 voice を割当（= 各言語で一貫）。
- リスク: ElevenLabs クレジット枯渇時 EN TTS 失敗 → 課題（将来: ローカル voice-clone TTS=XTTS/F5-TTS で $0 固定声に移行余地）。

## ② 視覚 = 本物の lip-sync（口を新音声に再同期）= `scripts/lipsync.py`（階層化）
ByteDance **LatentSync**（拡散 lip-sync SOTA）で base 僧侶動画の口を新 TTS に再同期。**同一モデルを2 tier**で安く回す:

| tier | エンジン | コスト | 容量 | 役割 |
|---|---|---|---|---|
| 1 | HF ZeroGPU `fffiloni/LatentSync` | **$0** | free ~1本/日 (180s GPU予約/call、free≈300s/日) | 無料分を毎日使い切る |
| 2 | fal `fal-ai/latentsync` | **$0.20/≤40s** ($0.005/s超過分) | 無制限 | 無料 quota 切れ後の課金フォールバック |
| 3 | audio-swap (ffmpeg) | $0 | 無制限 | tier1/2 が両方失敗時のみ。口は元動き＝喋って見える |

`LIPSYNC_TIERS=hf,fal`（env で順序可変）。**"squeeze the juice" = 無料先・課金は溢れた分だけ**。verify 済: fal latentsync 出力 = 口が音声に毎フレーム同期（7s大開/2s歯/11s別口形、アーティファクト無し、HF audio-swap より明確に良い）。

## ③ コスト経済（$10 予算の実数 = 正直に）
- fal: 3本/日 = $0.60/日 → **$10 = 約16日**。1本/日 = $0.20/日 → **$10 = 50日(≈2ヶ月)**。
- 無料 HF 1本/日 が乗る日は その分 $0 → 寿命が伸びる。
- **ブートストラップ既定 = 1〜2本/日**（無料HF 1 + fal ≤1）で $10 を ~2ヶ月持たせ、ebook 売上が立ったら fal を増やして 3×/日へスケール。lip-sync は real COGS、ebook 収益で賄うのが事業モデル。

## ④ パイプライン（FINAL-v3 確定）
gen-script(フレッシュ台本/言語別) → **TTS(ElevenLabsクローン声 EN / VOICEVOX JP)** → **lipsync.py(HF→fal→audio-swap で本物の口同期)** → 1080x1920 正規化 → burn-captions → gen-caption(+ebookリンク) → **post = DRAFT のみ（Dais 承認まで実投稿しない）** → ledger。

## ⑤ 投稿 = DRAFT 承認制（Dais 厳命）
- 「まだ承認してない、投稿する物を見せて」→ 全動画は **投稿前に keiodaisuke@gmail.com へ添付メール (DRAFT preview)**。Dais OK 後にのみ実投稿。
- 初回 preview 送付済（2026-06-29、msg 19f0edae8358bf06、fal lip-sync + クローン声 + 字幕、13.4s）。

## ⑥ 実装ファイル
- `scripts/lipsync.py`（新規、tiered hf→fal）+ `.venv`（fal-client / gradio-client）。
- `scripts/render-free.sh`（書換: ElevenLabs声 → lipsync.py → audio-swap fallback → 1080x1920 正規化）。
- `scripts/burn-captions.sh` / `gen-script.sh` / `gen-caption.sh` は不変。
