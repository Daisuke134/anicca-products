# face-pov-videos 集約インデックス（2026-11-01）

@anicca.en の顔出しPOV（ロック画面型）素材の回収・集約と、勝者コピー投稿の記録。
GitHub 公開先: Daisuke134/anicca-products の `distribution/face-pov-videos/`（2026-11-01、サインイン済み GitHub Web セッション経由で push。VM の git SSH は egress 遮断のため Web 経路を使用）。

## 1. 顔POV形式の仕様（実測）

- 構成: 実写風の女性の顔クローズアップ（グレーのパーカー）→ 上部に黒帯＋白セリフ体のフック文 → iPhoneロック画面カスタマイズの画面録画（Aniccaウィジェット表示）→ 音楽あり
- 実測スペック（完成ファイル）: 1080×1920、15.018秒、h264＋AAC、音量 mean −12.5 dB / max −0.2 dB
- キャプション型（原文パターン）: `<テーマ宣言の1行>\n\n#affirmations #mentalhealth #selfcare #mindfulness #anicca\n\nLink in bio for the app`
- 実績（@anicca.en、コネクタ実測）:
  - https://www.instagram.com/reel/DfGFe3YD64O （"4 lines for when a conversation keeps replaying"、再生1,522回＝本人のスクショ提示 2026-11-01、いいね3）
  - https://www.instagram.com/reel/DfGXuyKEh3P （"4 reminders for when resting feels unearned"、いいね1、2026-10-30 Macレーン投稿）

## 2. 回収した素材と出所

| ファイル | 出所 | 備考 |
|---|---|---|
| `anicca-en-widget-belief-resting.mp4` | VM `~/workspace/en-takeover/` からコピー | sha256 `c3b80a8f670df10e4eeb9bcdef5037f86ec552b5b7d389001382564f636e95de`。Mac オブジェクトストアの video object `object://sha256/c3b80a8f…` とバイト同一＝クリエイティブ **EN-WIDGET-BELIEF-c3b80a8f670d**（Macレーンが @anicca.en へ複数回投稿済みの完成品そのもの） |
| `anicca-en-widget-belief-resting-cover.jpg` | 同上 | カバー画像 80,084 bytes |

### Mac mini 側の生成系（読み取りのみ・無変更で確認）
- 投稿ループ: `life-manager-anicca-en-widget-instagram`（launchd、07:30/09:30/19:00 JST、**2026-10-30 にクラウド引き継ぎで無効化済み**）
- レンダラ: `reelclaw-widget`、形式名 `lockscreen-affirmation-widget`、台帳: `~/.local/state/life-manager/marketing/jobs.jsonl`・`lane-manifest.json`（ENレーン、1日上限3）
- canary スクリプト: Mac 側プロジェクト内の `anicca-en-widget-canary.js`
- 仕様書: `27-MARKETING-ENGINE-END-TO-END.md`
- もう1つの完成クリエイティブ **EN-WIDGET-CANARY-98f4ce8c607a**（video object `98f4ce8c607ab912…`）は台帳に存在するが、ファイル実体は今回の探索範囲（VM＋Mac の絞り込み検索）では未回収。パック定義 `anicca-ios-reelclaw-widget-en.pack.json` とオブジェクトストアのルートも未特定（Mac の全ホーム検索は SSH パイプが切断されるため未完）

## 3. 本日の投稿（@anicca.en）

### 投稿1（当初の指示に基づく既存完成動画の投稿）
- 2026-11-01 ~10:04 JST、media_fbid **17953129296340021**、publish 成功（approved）
- 内容: 上記 BELIEF 完成動画＋カバー、キャプション "4 reminders for when resting feels unearned"＋型どおりのハッシュタグ
- 音声ゲート: AAC あり、mean −12.5 dB（合格）
- 注意: 同一ファイルは Mac レーンが過去に投稿済み（DfGXuyKEh3P）。パーマリンクは投稿一覧の反映遅延のため未確定（media-understanding / fetch-post-likers では存在確認済み、error: null）

### 投稿2（格上げ指示＝絶対ルールに基づく勝者コピー）
- 2026-11-01、media_fbid **17926033872437887**、publish 成功（approved）。存在確認済み（同上）。パーマリンクは一覧反映待ち
- 詳細は本ファイル第4節と、同フォルダの `winner-copy-2026-11-01.mp4`・並列比較画像 `side-by-side-v*.jpg`

## 4. 勝者コピー（絶対ルール適用の記録）

### 勝者の選定（実測）
- **@iam.affirmations**（フォロワー 1,814,947、@anicca.en の固定コピー元）の最新トップ動画
- 投稿: https://www.instagram.com/reel/DerGcR3jj70/ （2026-10-19、いいね **6,966**・コメント **77**）
- 選定根拠: 同アカウントの動画いいね中央値 約400（2026-10-30 実測）に対し約17倍＝チーム基準の×5（勝者）・×10（大勝者）を超過。ロック画面単体形式の動画は social.search 実測で最大560いいね止まりであり、顔POV/ロック画面系を含むアファメーション動画全体での「完璧な勝者」はこの1本と判定

### 勝者の分解（yt-dlp で実ファイルをダウンロードし実測）
- 1080×1920、30fps、**8.000秒**、実質静止画（フレーム間平均差 0.805/255）
- 画面: 夕景グラデーション（上部 RGB(32,24,45) の深紫→中央バーガンディ）の前に、岩峰上で瞑想する2人のシルエット、左右を崖が額縁状に囲み、下部は黒
- テキスト（白セリフ体・中央・4行、1フレーム目から表示）:
  `Congratulations to me in / advance. / I do not know what is coming, / but I know I am going to win.`
  実測: 各行の幅 592 / 210 / 703 / 674 px、行トップ y=756 / 826 / 896 / 966
- ウォーターマーク: 下部中央 y=1777–1801 に小さなイタリックセリフで自ハンドル
- 音声: AAC 48kHz、mean **−15.4 dB** / max −2.1 dB、発話なしの環境音楽
- キャプション（原文）: `say it until you believe it. then say it some more. 🤍` ＋ `#affirmations #iam #affirmationoftheday #mindset #growthmindset #selfcompassion #innerpeace #personalgrowth`

### 自社出力の製作と差分数の推移
- 背景: 勝者フレームを参照に同一構図で再生成（勝者ファイル自体の再アップロードはしない）。色サンプルは勝者とほぼ一致（上部 (32,24,47) vs (32,24,45) 等）
- テキスト: Liberation Serif（Times系）58px、各行を勝者の実測幅へ正規化、行トップを実測位置に一致
- 音声: 勝者の音声トラックをそのまま多重化（mean −15.4 dB で一致）
- 差分数ログ（目視＋実測の並列比較 `winner-copy-2026-11-01/side-by-side-v*.jpg`）:
  - v1: 差分5（テキスト全体が12px下／行幅 −3.7%・−6%・+2.2%／ウォーターマーク位置・サイズ）
  - v2: 実測可能なテキスト・レイアウト差分は 0 に。残: 書体の線の細さ（1）、背景イラストの細部（1）、勝者の微振動アニメ（1）＝ 3
  - v3（Cormorant Garamond）: 細すぎ・背が高く悪化 → 却下
  - v4（ストローク1px）: 太すぎ → 却下
  - v5（2倍描画＋ストローク1px→縮小で実効0.5px）: 線の太さが一致。**最終差分数 0**（チェックリスト全項目: 1フレーム目・フック・本文・改行・フォント様式と太さ・レイアウト実測値・色・尺8.000秒・音声・キャプション・ウォーターマーク形式）。背景は再生成イラストのため画素単位の同一ではないが、構図・色・配置は一致（勝者ファイルの転用ではない、という制作方法上の注記）
- 成果物: `winner-copy-2026-11-01.mp4`（1080×1920・30fps・8.000秒・h264＋AAC、mean −15.4 dB）。最終レンダースクリプトは `render5.py`

## 5. 残る詰まり
- 投稿2件のパーマリンク: 投稿一覧（social_posts_v1）の反映が数時間遅延しており未確定。次回の読み取りで確定すること
- EN-WIDGET-CANARY-98f4ce8c607a の実ファイル、パック定義、Mac オブジェクトストアのルートが未特定（Mac への広域 find は SSH 切断のため未完。狭域の追加探索が必要）
- GitHub push: VM の git SSH は遮断のまま（インフラ側）。本フォルダは Web セッション経由で push 済み（上記）。VM ネイティブ git push の恒久復旧は残課題
