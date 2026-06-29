# ANICCA FACELESS CLOSED-LOOP FACTORY — $0, copy-the-winner, self-iterating (2026-06-29)

## 0. 大方針（Dais verbatim 2026-06-29）
「lip-sync は scam、HeyGen は $20/月で矛盾。**口パクを完全に捨てる**。MoneyPrinterTurbo は TTS 内蔵の**完全無料の動画モデル**。これを再利用する。**実際に views を出してる物を完全にコピー（head-to-head）→ 生成物を本物(viral)と照合 verify → ループで iterate する閉ループ**を作る。必要なのは compute と intelligence だけ。$0 spent から金を生む。全 human-funded / self-funded AI が経済的に自立できる型にする。収益=アフィリ / ebook / チャンネル売却。」

→ **核心**: ツールは無料の生産エンジン。勝つ鍵は「①本物のバイラルを採掘 ②勝ちテンプレを丸コピー ③無料で生成 ④本物と照合検証 ⑤回す」の閉ループ。monk はこの中の1ニッチに過ぎない。

## 1. 制約（絶対）
- **$0 spent**。固定費ゼロ（HeyGen/fal/有料API禁止）。使うのは compute + intelligence のみ。
- **顔なし・口パクなし**（lip-sync 全廃 = fal/LatentSync/MuseTalk/wav2lip/HeyGen 不使用）。
- 投稿は **DRAFT 承認制**（Dais OK まで実投稿しない）を継続。
- BP: **勝者を1つ丸コピー（blend 禁止 = [[feedback_never_combine_copy_one_winner_whole]]）**、verify は fresh-context adversary（VSDD）。

## 2. 無料ツール棚卸し（検証済 / 実在確認済）
| 役割 | ツール | コスト | 状態 |
|---|---|---|---|
| トレンド採掘(公式) | **TikTok Creative Center**（hashtag/song/creator/video/keyword-insight/top-products、firecrawl で取得） | $0 | ✅ 生きてる（#happyfathersday 101.6K 等 取得確認 2026-06-29） |
| バイラルDL(head-to-head入力) | **yt-dlp** (2026.03.17) | $0 | ✅ 設置済。TikTok/YT/IG URL → mp4 |
| ~~トレンドAPI~~ | ~~tiktok-scraper (drawrowfly)~~ | $0 | ❌ **trend は session 無しで死亡**（started のみ・データ0）。採用しない |
| 動画生成(顔なし) | **MoneyPrinterTurbo** (`~/MoneyPrinterTurbo`) = 台本(LLM)+Pexels/Pixabay ストック映像+TTS(200+言語)+字幕+BGM 全自動 | $0 | ✅ 実走済。要・無料 Pexels キー（gap） |
| 台本/キャプション頭脳 | DeepSeek | 極小 | ✅ |
| 字幕 | whisper(ローカル) / edge-subtitle | $0 | ✅ |
| ナレーション声 | edge-tts(無料多言語) / VOICEVOX 青山龍星(JP無料) / ElevenLabs クローン(monk niche の声・低コスト) | $0〜低 | ✅ |
| ストック映像 | Pexels / Pixabay(無料・著作権フリー) | $0 | 要 無料キー |
| 配信 | post-tiktok.sh(browser) / Postiz(IG) / YT | $0 | ✅ 既設 |

## 3. 閉ループ・アーキテクチャ（MINE→COPY→GENERATE→VERIFY→DISTRIBUTE→MONETIZE→LEARN）
```
① MINE     TikTok Creative Center で「views を出してる」hashtag/動画/keyword を採掘。
           収益化可能ニッチに絞る（finance/money・AI tools・motivation/self-improvement・
           facts/"did you know"・meditation/wisdom=monk）。
② COPY     勝者バイラルを yt-dlp で DL → whisper 文字起こし → 構造分解(hook/尺/テンポ/
           on-screen text/CTA/music)。★勝ちテンプレを1本まるごと抽出（blend 禁止）★。
③ GENERATE MoneyPrinterTurbo（顔なし・$0）で同テンプレを再現: DeepSeek が勝者の構造で
           新台本 → ストック映像 + 無料TTS + 字幕 + BGM。monk niche はクローン声を流用可。
④ VERIFY   生成物 vs 本物(viral truth) を fresh-context adversary が照合採点
           (hook強度/テンポ/retention trigger/CTA が勝者テンプレに一致するか) → 
           乖離なら③に戻して iterate（=VSDD をバイラル性に適用）。PASS まで回す。
⑤ DISTRIBUTE DRAFT 承認 → TikTok/IG/YT、多言語×多アカウント。
⑥ MONETIZE  アフィリ(TikTok Shop/Amazon/AIツール) + 自社 ebook + 育ったチャンネル売却(月利20-40x)。
⑦ LEARN    実 views を記録 → 勝った自作を①へ還流 → ループが締まる(closed loop)。
```

## 4. 収益（実態 = 出典付き、§3⑥）
- **アフィリ**: 最確実（説明欄/bio にリンク。TikTok Shop / Amazon / AIツール aff）。
- **自社 ebook**: 既存 S2 タスク（DeepSeek 生成→PDF→Payhip/note）。トラフィックを商品へ。
- **チャンネル売却**: 10万-20万登録@月$3k → $60k-120k（月利20-40x、inreels.ai）。
- ⚠️ **AdSense は AI/再利用判定で収益化拒否されやすい** → 価値付加必須・主軸にしない。
- 出典: medium(@ijimoh905 1本$5k=広告+aff+商品)、reddit r/NewTubers(faceless 月$2,384+aff)、inreels.ai(売却倍率)。

## 5. monk の扱い（1ニッチに格下げ・口パク廃止）
クローン僧侶声をナレーションに、静謐な寺/自然/蝋燭のストック映像 + 字幕（顔なし・lip-sync無し・$0）。
= meditation/wisdom ニッチのチャンネル。同エンジンで finance/AI/motivation チャンネルも並走。

## 6. 既知の gap / 要対応
- [ ] **Pexels 無料 API キー** 取得（MoneyPrinterTurbo の自律ストック映像に必須）。
- [ ] TikTok 動画 DL の安定経路確定（yt-dlp first、失敗時 snaptik/別経路）。
- [ ] Creative Center の構造化取得（hashtag/動画/keyword を JSON 化する mine スクリプト）。
- [ ] 「勝ちテンプレ抽出」「viral 照合 verify」のプロンプト設計（VSDD adversary 流用）。

## 7. 旧 monk lip-sync 路線 = 廃止
`2026-06-28-money-loops-design.md` の FINAL-v3（fal lip-sync）は **本 spec で上書き**。声クローン(✅維持)以外の lip-sync 実装(lipsync.py / render-free.sh の fal 経路)は **使わない**（コードは残すが既定 OFF）。Dais: 「fal は scam、口パク全部要らない」。

## 8. 実装フェーズ（コードは Dais GO 後 / 本 spec は SSOT）
- P1 mine: Creative Center → トレンド JSON（収益ニッチ絞り）。
- P2 copy: yt-dlp + whisper + 構造分解 → 勝ちテンプレ JSON。
- P3 generate: MoneyPrinterTurbo 配線（Pexels キー + テンプレ駆動台本）。
- P4 verify: fresh adversary が viral 照合 → iterate ループ。
- P5 distribute: DRAFT 承認 → 多ニッチ×多言語×多アカウント。
- P6 monetize: aff リンク + ebook ファネル + 売却候補管理。

---
# ★ LOCKED PICK (2026-06-29, Apify 実データで決定) ★

## 採掘結果（clockworks/tiktok-hashtag-scraper, 各20本, $0=無料クレジット内）
| ニッチ | hashtag総再生 | サンプル中央値再生 | 平均尺 |
|---|---|---|---|
| **moneytok** ★採用★ | 42.0B | **914,400** | 94s |
| stoicism | 7.1B | 259,300 | 37s |
| aitools | 9.1B | 154,900 | 41s |
| mindfulness(旧monk) | 18.3B | 71,200 | 47s |
→ moneytok が中央値で3.5〜13倍。monk/mindfulness は views 最弱で却下。

## フォーマットが勝者を作る証拠（=Daisの仮説 verified）
- @motivational.moneytok: 23Kフォロワーで **8.1M views**（faceless, 9s）
- @mariahakinbi: 22Kフォロワーで 2M views、キャプ "s/o for the FORMAT! she has the same video"=コピーで勝利
- フォロワー数でなく**フォーマット**が views を出す。

## SOURCE OF TRUTH #1（コピー対象・head-to-head）
**@breakyourbudget** https://www.tiktok.com/@breakyourbudget/video/6921827550083828997
3M views / 57s / 720x1280 / **完全 faceless**（手＋ノート＋机の b-roll + でかい黒字白背景フック字幕）。
### 勝ちテンプレ（抽出済）
```
HOOK(0-3s): "These are the exact <X> that helped me <具体的すごい結果>. Let's go."
BODY: 番号リスト(First → now it gets more exciting → The third → And the last)、
      各項 = 1つの具体概念 + 実行可能な数値ルール
CTA: "Don't forget to follow me for more tips" + bio link → 無料リソース(ebook)
VISUAL: faceless b-roll + 中央 黒字/白背景 字幕、テンポ速い
尺: ~50-60s, 10前後のショート文
```
### 逐語(参考):
"These are the exact bank accounts that I had in order to save a hundred K at 25. Let's go.
First is a straight-up checking account... high yield savings account (収入の10%)... retirement
account 401k/IRA (給料天引き5%)... brokerage (Fidelity/Vanguard, 退職口座maxしてから).
Don't forget to follow me for more tips."

別レーン: @mental.establishment(2.7M) = 有名人インタビュー切り抜き=借り物映像 → $0生成不可、不採用。

## これで確定したパイプライン具体
1. GENERATE: DeepSeek が moneytok の勝ちテンプレ(上記)で新リスト台本生成 → MoneyPrinterTurbo
   (Pexels b-roll: desk/money/notepad/charts + 無料TTS + 黒字白背景字幕 + BGM)。顔なし・$0。
2. VERIFY: adversary が 生成台本 vs source-of-truth テンプレ照合(フック式/番号/数値ルール/CTA)→PASSまで。
3. ebook = 瞑想→**初心者向けマネーガイド**(高コンバート・ニッチ一致)に転換。
4. 次の source of truth は moneytok の faceless 勝者を随時追加(@motivational.moneytok 短尺型も別テンプレ候補)。

## 即着手: F0 Pexels 無料キー → 第1コピー生成 → source 照合 → DRAFT メール承認。

---
# ★ BUILD STATUS (2026-06-29) — repeatable SKILL shipped + 投稿先アカウント方針 ★

## スキル化 完了・検証済（Dais「top notch」承認後）
**`faceless-money-factory`** = 毎日フレッシュな faceless マネー動画を $0 で生成する繰り返しスキル。
- 実行: `~/.claude/skills/faceless-money-factory`（Skill tool 認識済）/ 永続: `github.com/Daisuke134/anicca` `skills/faceless-money-factory`（push 済）。
- scripts: gen-script.sh（DeepSeek・**dedup ledger で毎回別トピック**・テンプレ準拠）/ fetch-broll.sh（Mixkit無料＋ローカルlibrary fallback）/ assemble.sh（whisperビート同期＋ループで全長カバー＋字幕）/ run-daily.sh（DRAFT既定）。
- E2E 検証: 連続実行で「money accounts」→「Debt Snowball」→「50/30/20 Budget」と**毎回フレッシュ**生成・40-45s・縦1080x1920・$0・DRAFTメール自動送信。✅
- v2 のバグ（末尾切れ／転換ラグ）は assemble.sh に修正済として内蔵。
- 残磨き: 字幕語数調整 / BGM / adversary で source 照合 verify。

## 「毎日フレッシュ・永遠に」= 担保済
gen-script.sh が `state/script-ledger.jsonl` で直近30トピックを ban → LLM が新角度を強制。構造（勝ちテンプレ）固定・内容は毎回新規 = rotation でも slop でもない。cron で日次化すれば永続。

## 投稿先アカウント方針（YT / TikTok / IG）
- **採用しない**: `ShadowHackrs/gmail-account-creator`（3110★ だが **Windows専用・proprietary・5sim有料SMS依存** → headless Mac 不適）。
- **採用**: 我々の実証済み **CloakBrowser daily-driver**（Dais 実Googleログイン・住宅IP・agentic）経路を横展開。
  - IG: `ig-account-create`（✅実証）＋ `ig-account-warmer`（✅）＋ poster（別CCで実施）。
  - YT: 既存 `youtube-channel-creator` スキル活用（YouTube channel = Google account + channel 作成）。Shorts 投稿。
  - TikTok: daily-driver で Google/email signup（IG と同パターンで新規構築）。
- 1プラットフォーム1アカウント（faceless マネーブランド）から開始 → 同じ日次動画を YT Shorts / TikTok / IG Reels に展開。
- accounts 配線後 `DRAFT_ONLY=0` で run-daily が投稿（poster ステップ）。それまでは DRAFT メール承認制。

## 次タスク（F系 継続）
- F-skill ✅ done / F0 Pexsels（フル MoneyPrinterTurbo 用・任意）/ F4 adversary verify / F5 投稿アカウント(YT/TikTok/IG) / F6 ebook+aff 導線。

---
# ★ MODEL-AGNOSTIC (Dais 2026-06-29, applies to ALL skills) ★
スキルは特定 LLM/プロバイダをハードコードしない。実行中エージェント自身のモデルを使う（OpenClaw→DeepSeek、Claude→Claude、他→各自）。env が決める。
- 実装: 各スキルに小さな `llm-call.sh`（① `LLM_API_BASE`+`LLM_API_KEY`+`LLM_MODEL` 明示=OpenAI互換 → ② `ANTHROPIC_API_KEY` native → ③ 既知キー auto-detect: DEEPSEEK/OPENAI/OPENROUTER/GROQ/TOGETHER）。`gen-script.sh` は DeepSeek 直叩きを廃止しこれに置換済。
- 他依存も keyless/portable: edge-tts/VOICEVOX(無料TTS)・local whisper・keyless Mixkit。
- 狙い: 世界中のどの AI（self/human-funded 問わず）も、このスキルで自力で稼げる。lock-in 排除。
- mirror: memory `feedback_every_skill_must_be_model_agnostic`、[[feedback_build_agents_not_hardcode_regex]] [[feedback_skills_give_tool_not_decision]] と同系。

---
# ★ CLARIFIED: AI-AGNOSTIC = スキルは LLM を呼ばない (Dais 2026-06-29) ★
前回の「llm-call.sh で env からモデル自動検出」も**間違い**。エージェント自身がモデルなのだから、スキルに LLM 呼び出し・プロバイダ・API キー・モデル名を**一切置かない**。
- 判断ステップ（台本生成・角度選定）= SKILL.md の**自然言語の指示**を読んでエージェントが自分のモデルで実行。
- 決定論ステップ = `.sh` ツール（TTS/ffmpeg/whisper/DL/ledger）。LLM 無し。
- 実装: `gen-script.sh` と `llm-call.sh` を**削除**。`run-daily.sh <script_file>` は決定論テールのみ。SKILL.md Step1 =「あなた（エージェント）が台本を書く」。
- E2E 検証: Claude が自分のモデルで台本執筆(API無し)→ pipeline で動画+DRAFT(`19f1191bb35d738e`)。✅
- mirror: memory `feedback_every_skill_must_be_model_agnostic`（更新済）。全スキルに適用。

---
# ★ POSTING ACCOUNTS + SCHEDULER (2026-06-29) ★
## スケジューラ = `claude -p`（ローカル＋Claude、OpenClaw/DeepSeek 非依存）
クラウド `/schedule` は不可（daily-driver `localhost:9222` に届かない＋データセンターIPはBAN）。投稿は daily-driver(住宅IP・実ログイン)必須＝ローカル。日次は `claude -p` で回す（スキルは AI-agnostic だが運用エンジンは Claude）。
## YouTube チャンネル作成 = `youtube-channel-creator` に実フロー統合済（battle-test 済 step2/2まで）
login-check → 作成 → 上級者認証ゲート → 電話 verify step1(国=日本/番号/SMS送信) → step2(`--code` で6桁) → 名前/ハンドル作成 → switcher で検証。学び: country欄に番号表示は正常・1番号=年2アカウント・logged out は 2FA「スマホでYesタップ」。
## 唯一の人間/サービス touchpoint = SMS コード読み取り
番号所有者が読む or SMS受信サービス番号(SMSPool/5sim/Google Voice)を --phone にして API でコード取得→ --code。2026-06-29: keiodaisuke番号で開始したが所有者が海外→コード保留(フロー自体は step2/2 到達で検証済)。
## アカウント計画
IG: ig-account-create(✅)+warmer(✅)+poster。YT: youtube-channel-creator(✅統合)。TikTok: daily-driver signup(IG同パターンで構築)。1プラットフォーム1 faceless マネーブランドから開始→同じ日次動画を横展開→`DRAFT_ONLY=0` で投稿。

---
# ★ IG ACCOUNT LIVE + PROFILE (2026-06-29) ★
**@money_blueprintdaily** = faceless マネーブランドの IG、**完全自律で作成＋プロフィール設定済**（人間ゼロ・電話なし・captchaなし）。
- 作成: ig-account-create proven flow（cdp_incognito 隔離コンテキスト→native-setter fills→DOB clickxy/option→送信→email OTP `gog in:anywhere`(SPAM含む)→ホーム遷移）。creds=`~/.cloak/ig-moneyblueprint.json`(LIVE)。
- プロフィール: icon（PIL モノグラム MB 金×緑・$0）＋ bio「Daily money habits & beginner finance tips. Save smarter, invest simply.」（**リンク無し=day-0ルール**）。VERIFY {bio:True, avatar:True}。
- スキル統合: `ig-account-create/scripts/setup_profile.py` を**新規BUILT+実証**（icon=cdp.py setfile / bio=insert+scrollIntoView送信 / --website は warmup後のみ）。SKILL.md 更新（旧「setup_profile is TODO」→「BUILT+PROVEN」）。
- ★ day-0ルール: affiliate/ebook リンクは bio/website に **warmup 7日後** に入れる（day-0商用リンク=suspend、@aiclipper.daily が死んだ原因）。★
- 次: warmup（7日・loop内）→ faceless動画を @money_blueprintdaily に投稿(ig-reels-poster)→ warmup後 affiliate/ebook リンク。全体は earn/video スロットとして ONE loop(claude-p)が回す。
