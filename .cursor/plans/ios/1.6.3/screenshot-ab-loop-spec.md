# App Store スクショ A/B テスト 自動クローズドループ仕様

**作成**: 2026-02-23
**ステータス**: 設計中

---

## 概要（What & Why）

App Store のスクリーンショットを毎日自動でメトリクス確認 → 勝者判定 → 新スクショ生成 → A/Bテスト開始するクローズドループ。
人間がメトリクスを見てスクショを手動で作る必要をゼロにする。
ベストプラクティス（`app-store-screenshots` スキル）に照合して合格したスクショだけが実験に出る。

---

## 使用スキル・ツール

| 役割 | ツール |
|------|-------|
| **Cronトリガー** | Anicca（Mac Mini）OpenClaw cronジョブ |
| **メトリクス取得** | ASC CLI（`asc experiments list`） |
| **実験ログ管理** | `experiments.json`（ローカルJSON） |
| **ヘッドライン生成・採点** | `recursive-improver`（プリセット: aso-description） |
| **スクショ撮影** | `asc-shots-pipeline`（simctl + AXe） |
| **ヘッドライン合成** | Python Pillow（PIL）スクリプト |
| **ベストプラクティス採点** | `visual-qa` + `app-store-screenshots` BPを注入 |
| **ASCアップロード** | `asc screenshots upload` |
| **Slack通知** | OpenClaw slack ツール |

---

## 受け入れ条件

| # | 条件 |
|---|------|
| 1 | 毎日 09:00 JST に自動起動し、メトリクスを確認する |
| 2 | 実験が3日以上かつ統計的有意差あり → 勝者を `experiments.json` に記録する |
| 3 | 新ヘッドラインは `recursive-improver` で採点し、ASOスコア閾値（8/10）以上のみ採用する |
| 4 | 生成したスクショは `visual-qa` でベストプラクティス採点し、8/10 以上のみ ASC にアップロードする |
| 5 | 採点 FAIL が3回続いたら Slack に警告を出して停止する（無限ループ防止） |
| 6 | 全実験履歴（ヘッドライン・CVR・勝敗）を `experiments.json` に蓄積する |
| 7 | 勝ちパターン・負けパターンを次回のヘッドライン生成に引き渡す |

---

## フロー（As-Is → To-Be）

### As-Is（現状）

手動：ダイスが週1でASCを確認 → 勝者を判断 → Figmaでスクショ作成 → 手動アップロード

### To-Be（自動化後）

```
【Anicca cronジョブ: 毎日 09:00 JST】

PHASE 1: メトリクス確認
  asc experiments list → 現在の実験データ取得
  │
  ├─ 実験 < 3日 → EXIT（今日はスキップ）
  ├─ 実験 >= 3日 かつ 有意差あり → WINNER確定 → PHASE 2へ
  └─ 実験 >= 7日 かつ 有意差なし → 実験終了・リセット → PHASE 2へ

PHASE 2: 実験ログ更新
  experiments.json に勝敗・CVR・ヘッドラインを記録
  勝ちパターン（例: 問いかけ型）/ 負けパターン（例: 数字型）を抽出

PHASE 3: 新ヘッドライン生成
  recursive-improver（aso-descriptionプリセット）
  入力: 過去の勝ちパターン + 負けパターン
  ループ: 生成→採点→改善（最大5回）→ 8/10以上で確定

PHASE 4: スクショ撮影（RAW PNG）
  asc-shots-pipeline:
    simctl でシミュレータ起動
    AXe で各画面に移動
    RAW PNG 撮影（3枚: 画面1・画面2・画面3）

PHASE 5: ヘッドライン合成
  PIL（Pillow）スクリプト:
    RAW PNG + 確定ヘッドライン → candidate_v{N}.png

PHASE 6: ベストプラクティス採点（visual-qa）
  プロンプト（app-store-screenshots BPを注入）:
    - 1枚目はコア価値を伝えているか？
    - キャプションは2行以内でベネフィット型か？
    - フォントは読みやすいか（30pt以上相当）？
    - First 3 Ruleを満たしているか？
  │
  ├─ 8/10以上 → PASS → PHASE 7へ
  └─ 7/10以下 → FAIL → PHASE 3に戻る（最大3回）
       3回失敗 → Slack警告 → EXIT

PHASE 7: 人間レビュー（最終承認ゲート）← asc-shots-pipeline の review を使う
  asc screenshots review-generate（フレーム付きPNGからHTMLプレビュー生成）
  asc screenshots review-open（ブラウザで開く）
  → ダイスがブラウザで目視確認
  → OK: asc screenshots review-approve --all-ready
  → NG: PHASE 3に戻る（ヘッドライン・デザイン修正）

PHASE 8: ASCアップロード・実験開始
  asc screenshots upload → App Store Connect
  experiments.json に新実験を追記
  Slack通知: 「新実験開始: v{N} vs v{N-1}（前回勝者）」
```

---

## experiments.json フォーマット

```json
{
  "current_experiment": {
    "id": "v3",
    "status": "RUNNING",
    "started_at": "2026-02-23",
    "headline": "また続けられなかった？",
    "screenshot_paths": [
      "screenshots/running/v3_shot1.png",
      "screenshots/running/v3_shot2.png",
      "screenshots/running/v3_shot3.png"
    ]
  },
  "control": {
    "id": "v2",
    "headline": "また挫折した？",
    "cvr": 3.8
  },
  "history": [
    {
      "id": "v1",
      "headline": "6年間変われなかった",
      "cvr": 2.1,
      "result": "LOSER",
      "pattern": "数字型",
      "ended_at": "2026-02-20"
    },
    {
      "id": "v2",
      "headline": "また挫折した？",
      "cvr": 3.8,
      "result": "WINNER",
      "pattern": "問いかけ型",
      "ended_at": "2026-02-23"
    }
  ],
  "winning_patterns": ["問いかけ型"],
  "losing_patterns": ["数字型", "断言型"]
}
```

---

## スクリーンショット格納ディレクトリ

```
screenshots/
├── raw/          ← asc-shots-pipelineが出力したRAW PNG
├── candidate/    ← PIL合成後（ヘッドライン入り）
├── running/      ← 現在実験中のスクショ
└── archive/      ← 過去の実験スクショ（実験ID別）
    ├── v1/
    ├── v2/
    └── v3/
```

---

## compose.py 実装ルール（PIL合成スクリプト）

```
キャンバス設計（絶対固定）:
  サイズ: 1320 × 2868 px
  ─ 固定ゾーン禁止。動的レイアウトを使う ─

動的レイアウト（v4以降）:
  MARGIN_TOP: 80px（ヘッドライン上余白）
  HEADLINE_PHONE_GAP: 60px（ヘッドライン下端 → Phone上端）
  PHONE_CAPTION_GAP: 60px（Phone下端 → キャプション上端）
  MARGIN_BOTTOM: 80px（キャプション下余白）

  手順:
    1. ヘッドラインを wrap_width=1000px で描画、実際の高さ headline_h を計算
    2. iPhoneフレームを最大高さ max_phone_h に収まるようスケール
       max_phone_h = 2868 - MARGIN_TOP - headline_h - HEADLINE_PHONE_GAP
                         - PHONE_CAPTION_GAP - caption_h - MARGIN_BOTTOM
    3. headline_y = MARGIN_TOP（中央揃えはx軸のみ）
    4. phone_y = MARGIN_TOP + headline_h + HEADLINE_PHONE_GAP
    5. caption_y = phone_y + phone_scaled_h + PHONE_CAPTION_GAP

フォント:
  ヘッドライン: 固定 110px Bold（fit_textは禁止、全枚同じサイズ）
    └─ 使用フォント候補: /System/Library/Fonts/Helvetica.ttc weight=Bold (index=1)
    └─ 代替: /Library/Fonts/Arial Bold.ttf
    └─ wrap_width: 1000px（窮屈にならない幅）
  キャプション: 固定 55px Regular

iPhoneフレーム処理:
  Koubouが出力するフレームPNGはoffwhite背景込み
  → 背景(#F5F2EE付近, tolerance=30)をnumpyでアルファマスク透過化してから貼る
  → canvas背景はAniccaブランドカラーグラデーション

背景グラデーション:
  #0D1117（上）→ #1a1f35（下）の縦グラデ

3枚の統一ルール:
  - フォントサイズ: 全枚 110px（絶対に変えない）
  - フォントウェイト: 全枚 Bold
  - テキストカラー: 全枚 白 #FFFFFF
  - 背景: 全枚 同じグラデーション
  - キャプション: 全枚あり
  - wrap_width: 全枚 1000px
```

## 各スクショのコンテンツ定義

| Shot | 役割 | ヘッドライン | キャプション | 使うPNG |
|------|------|------------|------------|--------|
| 1 | Attention（pain） | "6 Years.\n10 Apps.\nStill Nothing Changed." | "Finally, an app that fights back." | 01-nudge-card-morning.png |
| 2 | Interest（social） | "3,000+ People\nFinally Broke\nThe Loop." | "Join them. Start free today." | 02-struggle-selection.png |
| 3 | Action（core flow） | "This Is What\nChange Actually\nLooks Like." | "AI that nudges you before you quit." | 04-nudge-card-bedtime.png |

## visual-qa に注入するプロンプト（App Store BP版 v2）

```
このApp Store用スクリーンショットをベストプラクティスで採点してください。

【Critical checks（1項目でもFAILなら即FAIL）】
- 全3枚のフォントサイズが同一か（±10px以内）
- iPhoneフレームの背景が浮いていないか（白いboxが見えてはいけない）
- ヘッドラインとキャプションの両方が存在するか

【採点基準（各10点）】
1. ヘッドラインがペルソナのペインを直撃しているか（「6年間変われなかった」層に刺さるか）
2. キャプションがベネフィット型で2行以内か
3. フォント110px Bold・全枚統一・コントラスト十分か
4. iPhoneフレームが背景と自然に溶け込んでいるか（白い箱が浮いていない）
5. 3枚見たときに統一感があるか（色・フォント・レイアウト一貫）

【参考: 業界標準（この水準を基準に採点）】
- Headspace: 暖色グラデ背景 + SF Pro Display Black 100px + Phone下にキャプション
- Calm: ブランドカラー背景 + Bold headline + 感情訴求キャプション
- Fabulous: グラデーション + Phone中央配置 + 上ヘッドライン + 下サポートテキスト

【判定】
- Critical check FAIL → 即FAIL（点数不問）
- 合計 40/50 以上 → PASS
- 39/50 以下 → FAIL（Critical Issueと改善点を出力）

出力形式:
Critical: PASS / FAIL（理由）
スコア: X/50
判定: PASS / FAIL
Critical Issues: [リスト]
改善点: [リスト]
```

---

## ファイル配置

```
apps/api/scripts/screenshot-loop/
├── main.py              ← ループ全体のオーケストレーター
├── metrics.py           ← ASC CLIでメトリクス取得・判定
├── headline_gen.py      ← recursive-improverへの橋渡し
├── capture.py           ← asc-shots-pipeline呼び出し
├── compose.py           ← PIL ヘッドライン合成
├── visual_check.py      ← visual-qa + BP採点
├── upload.py            ← ASCアップロード
└── experiments.json     ← 実験ログ（SSOT）
```

---

## Anicca cronジョブ設定（OpenClaw）

```json
{
  "id": "screenshot-ab-loop",
  "schedule": "0 0 * * *",
  "timezone": "Asia/Tokyo",
  "description": "毎日09:00 JSTにApp Storeスクショ A/Bテストループを実行",
  "kind": "agentTurn",
  "message": "screenshot-ab-loopを実行してください。apps/api/scripts/screenshot-loop/main.pyを起動して、メトリクス確認→新実験判断→スクショ生成→ASCアップロードまで完了させてください。",
  "delivery": { "mode": "none" }
}
```

---

## 境界（やらないこと）

| 対象 | 理由 |
|------|------|
| ASA（Apple Search Ads）の自動入札 | このループはオーガニック改善のみ。ASAは別スコープ |
| アプリ内UIの変更 | スクショのヘッドラインとレイアウトのみ |
| 全ロケール同時実験 | まず ja-JP と en-US の2ロケールのみ |
| デバイスフレームのデザイン変更 | A/Bテストはヘッドラインのみ。フレームは固定 |

---

## E2E判定

| 項目 | 値 |
|------|-----|
| UI変更 | なし（スクリプト・設定ファイルのみ） |
| 新画面 | なし |
| 結論 | Maestro E2E不要。実際のスクショがvisual-qaのテスト代わり |

---

## 実行コマンド

```bash
# 手動テスト実行
cd apps/api/scripts/screenshot-loop && python main.py --dry-run

# 本番実行（Aniccaから）
python main.py

# ログ確認
tail -f /Users/anicca/logs/screenshot-loop.log
```

---

## 未実装（別エージェントが作る部分）

| # | 未実装 | 優先度 |
|---|--------|--------|
| 1 | `main.py` + 各モジュール（Pythonスクリプト群） | 最高 |
| 2 | PIL合成スクリプト（ヘッドライン + フォント設定） | 最高 |
| 3 | ASC experiments API の調査（CLIコマンド確認） | 高 |
| 4 | OpenClaw cronジョブ登録 | 高 |
| 5 | Slack通知フォーマット決定 | 中 |

---

## 設計上の重要な決定事項（ADR）

### ADR-1: asc-shots-pipeline の `review` ステップは PHASE 7 で使う（スキップしない）

`asc-shots-pipeline` の review コマンド群は**人間が最終目視するためのステップ**として残す。
AI採点（PHASE 6）が PASS した後、ダイスが最終承認する。

| コマンド | 実際の動作 | 使うか |
|---------|-----------|--------|
| `review-generate` | フレーム付きPNGからHTMLプレビューを生成 | **YES** |
| `review-open` | ブラウザで開く（ダイスが目視） | **YES** |
| `review-approve` | OK を押したらアップロード許可 | **YES** |

**運用イメージ:** ブラウザがポンと開く → TikTok見ながら確認 → OK押すだけ。
将来的に出力が安定したら PHASE 7 を削除して完全自動化する。

### ADR-2: Ralph（ralph-autonomous-dev / Ralph Wiggum）は使わない

| ツール | 本来の用途 | このループで使うか |
|--------|-----------|-----------------|
| `ralph-autonomous-dev` | コード実装 → テスト → 失敗 → 修正 → 繰り返す（開発ループ） | **NO** |
| `Ralph Wiggum（公式）` | 同じ。コーディングタスクを完成まで走り切る | **NO** |
| `main.py`（Pythonスクリプト） | メトリクス確認 → スクショ生成 → 採点 → アップロード | **YES（本体）** |

Ralphはコードを書くときの自律ループ。スクショのマーケティングループとは別用途。
このループはAniccaのcronが `main.py` を実行することで回す。

### ADR-3: なぜ勝敗分析（WHY分析）が必要か

CVR の数字だけ次に渡しても意味がない。

```
× BAD: 「v2がCVR 3.8%で勝った。次のヘッドラインを作れ」
○ GOOD: 「v2（問いかけ型: "また挫折した？"）がv1（数字型: "6年間変われなかった"）に勝った。
         ペルソナが自分ごととして感じる問いかけ型が有効。
         次も問いかけ型を基本にしつつ、より共感度の高い言葉を探せ」
```

WHY分析の結果を `experiments.json` の `winning_patterns` / `losing_patterns` に蓄積し、
`recursive-improver` に毎回引き渡すことでループが賢くなっていく。

---

## オープンソーススキルとしての設計方針

このループは**Anicca専用ではなく、任意のiOSアプリで使える汎用スキル**として設計する。

| ユースケース | 動き方 |
|-------------|--------|
| **新規アプリ** | `experiments.json` が空 → A/Bのベースラインをゼロから生成してテスト開始 |
| **既存アプリ（継続）** | 勝ちパターンが蓄積済み → それを使って次のヘッドライン生成 |
| **他の開発者が使う場合** | `bundle_id` と ASC認証情報を設定ファイルに書くだけで動く |

**スキル名（候補）**: `aso-screenshot-loop`
**公開先**: skills.sh（`npx skills add` で誰でもインストール可能）

### 他の開発者が設定するもの（最小構成）

```json
{
  "app": {
    "bundle_id": "com.example.myapp",
    "scheme": "MyApp",
    "simulator_udid": "booted"
  },
  "asc": {
    "version_localization_id": "LOC_ID"
  },
  "experiment": {
    "min_days": 3,
    "max_days": 7,
    "pass_threshold": 8
  }
}
```

この設定ファイルを置いて Anicca cron に登録するだけで、どんなアプリでも毎日自動A/Bテストが回る。
