---
name: screenshot-creator
description: >
  App Store / Google Play 用のプロモーションスクリーンショットを Pencil (.pen) で生成する
  シングルエージェントスキル。creative-director → copy-writer → screenshot-designer →
  spec-validator → quality-reviewer の役割を1エージェントが順番に担当し、
  Pencil MCP でデザインを構築する。エージェントチーム不使用（低コスト）。
  Use when: App Store スクリーンショットを作りたい、プロモーション画像を作成したい、
  スクショのデザインをしたい。
  Triggers: "スクリーンショット作成", "App Store 画像", "プロモーションスクショ",
  "screenshot creator", "スクショ作って", "App Store 素材"
---

# screenshot-creator スキル（シングルエージェント版）

**エージェントチームは使わない。** 以下の役割を1エージェントが順番に担当する:
`creative-director` → `copy-writer` → `screenshot-designer` → `spec-validator` → `quality-reviewer`

---

## Step 1: ヒアリング

以下を確認する:

| 項目 | デフォルト |
|------|----------|
| アプリ名 | - |
| カテゴリ | ライフスタイル / 生産性 / ヘルス等 |
| 主要機能 | 3〜5個 |
| ターゲットユーザー | - |
| ブランドカラー | Step 2 のスタイルガイドから決定 |
| トーン | エモーショナル / プロフェッショナル等 |
| スクリーンショット枚数 | 3〜6枚（推奨） |
| 実スクリーンショット | アプリキャプチャの絶対パス（任意） |
| .pen ファイルパス | 新規作成なら省略 |
| デバイスサイズ | iPhone 6.9"（390×844pt） |

---

## Step 2: スタイルガイド取得（Asian / Japanese テーマ）

`mcp__pencil__get_style_guide` を呼び出す。タグは **必ず以下を指定**:

```
tags: ["japanese", "zen", "wellness", "minimal", "calm"]
```

- `japanese` — 日本的な美意識、余白、繊細さ
- `zen` — 禅の静けさ、ミニマルな空間
- `wellness` — ウェルネス系アプリに合う温かみ
- `minimal` / `calm` — 余計な装飾を排除した清潔感

スタイルガイドが返ってきたら、カラーパレット・フォント・背景色をメモする。
指定がない場合は CaptionArea ライトパターン（`#F2F7F5` / `#1A1A1A` / `#6B7B75`）を使う。

---

## Step 3: コピー作成（copy-writer 役割）

各スクリーンのヘッドライン + サブテキスト2行を決定する。

### コピー原則

| ルール | 内容 |
|--------|------|
| ヘッドライン | 機能説明ではなく「ユーザーが得られるベネフィット」 |
| 文字数 | ヘッドライン 10〜20文字、サブテキスト 1行 12文字以内 |
| 句読点 | ヘッドラインに「、」「。」は使わない |
| 行数 | ヘッドライン1行 + サブテキスト2行 = 計3行 |
| 言語 | 日本語優先（必要なら英語）

### ヘッドラインパターン（参考）

| パターン | 例 |
|---------|-----|
| ベネフィット型 | 「悩みを書くだけ」 |
| 疑問型 | 「もっと早く使えばよかった」 |
| 数字型 | 「3,000人が変わった」 |
| 感情型 | 「もう迷わない」 |

---

## Step 4: .pen ファイル作成とデザイン構築（screenshot-designer 役割）

### 4-1. ドキュメント準備

```javascript
// 新規ファイルが必要な場合
mcp__pencil__open_document("new")
// または既存パスを開く
mcp__pencil__open_document("/path/to/file.pen")
```

### 4-2. フレーム作成（iPhone 6.9" = 390×844pt）

```javascript
// 1枚目
frame1=I("document", {type: "frame", name: "SS01_Hero", width: 390, height: 844, fill: "#F2F7F5"})
// 2枚目（右に配置）
frame2=I("document", {type: "frame", name: "SS02_Feature1", x: 430, width: 390, height: 844, fill: "#F2F7F5"})
// 3枚目
frame3=I("document", {type: "frame", name: "SS03_Feature2", x: 860, width: 390, height: 844, fill: "#F2F7F5"})
```

### 4-3. 各フレームにコンテンツを構築

**構造（必須）:**

```
フレーム（390×844）
├── CaptionArea（height: 160, layout: vertical, alignItems: center, justifyContent: center）
│   ├── headline（fontSize: 32, fontWeight: 700, textAlign: center, fill: #1A1A1A）
│   ├── sub1（fontSize: 18, textAlign: center, fill: #6B7B75）
│   └── sub2（fontSize: 18, textAlign: center, fill: #6B7B75）
└── MockupArea（height: 684, padding: [0, 20, 0, 20]）
    └── PhoneMockup（width: 320, height: 640, cornerRadius: 44）
        └── image fill（実スクリーンショット or AI生成）
```

**CaptionArea ライトパターン（デフォルト）:**

```javascript
captionArea=I(frame1, {type: "frame", layout: "vertical", alignItems: "center",
  justifyContent: "center", gap: 6, height: 160, padding: [40, 24, 12, 24], fill: "#F2F7F5"})
headline=I(captionArea, {type: "text", content: "ヘッドライン",
  fontSize: 32, fontWeight: "700", textAlign: "center", fill: "#1A1A1A"})
sub1=I(captionArea, {type: "text", content: "サブテキスト1行目",
  fontSize: 18, textAlign: "center", fill: "#6B7B75"})
sub2=I(captionArea, {type: "text", content: "サブテキスト2行目",
  fontSize: 18, textAlign: "center", fill: "#6B7B75"})
```

**MockupArea + PhoneMockup:**

```javascript
mockupArea=I(frame1, {type: "frame", width: "fill_container", height: 684, padding: [0, 20, 0, 20]})

// 実スクリーンショットがある場合（絶対パス必須）
phoneMockup=I(mockupArea, {type: "frame", width: 320, height: 640,
  fill: {type: "image", url: "/absolute/path/to/screenshot.png", mode: "fill"},
  cornerRadius: [44, 44, 44, 44]})

// 実スクリーンショットがない場合（AI生成）
phoneMockup=I(mockupArea, {type: "frame", width: 320, height: 640, fill: "#FFFFFF",
  cornerRadius: [44, 44, 44, 44]})
G(phoneMockup, "ai", "minimal Japanese wellness app UI screenshot, clean interface")
```

### 4-4. 画像確認

各フレーム構築後に `mcp__pencil__get_screenshot` で目視確認する。

### 4-5. 禁止事項

| 禁止 | 理由 |
|------|------|
| CaptionArea に装飾フレーム（アクセントバー等） | モックアップ上端に線が出る |
| `\n` 改行 | 縦長になる。テキストノードを分割すること |
| テキストノード4つ以上 | 読まれない |
| PhoneMockupのはみ出し | MockupArea 内に完全に収めること |

---

## Step 5: 技術仕様バリデーション（spec-validator 役割）

`mcp__pencil__batch_get` と `mcp__pencil__snapshot_layout` で以下を数値検証:

| # | 検証項目 | 基準 | 判定 |
|---|---------|------|------|
| 1 | フレームサイズ | width=390, height=844 | 完全一致のみ PASS |
| 2 | PhoneMockup 面積比 | ≥ 50%（320×640=204800 / 329160 = 62.2%） | PASS |
| 3 | 画像 fill | fill.type="image", url 有効 | PASS |
| 4 | セーフエリア | 最上部コンテンツ y ≥ 59, 最下部 y+h ≤ 810 | PASS |
| 5 | テキストサイズ | headline ≥ 24pt, sub ≥ 14pt | PASS |
| 6 | コントラスト比 | ≥ 4.5:1（通常テキスト） | PASS |
| 7 | テキストノード数 | CaptionArea に ≤ 3 | PASS |
| 8 | 中央揃え | alignItems: center, textAlign: center | PASS |
| 9 | アクセントバー不在 | CaptionArea に非テキストノードなし | PASS |
| 10 | サブテキスト | fontSize ≥ 18, 1行12文字以内 | PASS |

FAIL 項目は `U("{nodeId}", {property: value})` で即修正する。

---

## Step 6: 品質レビュー（quality-reviewer 役割）

`mcp__pencil__get_screenshot` で全フレームを確認し、10点満点でスコアリング:

| カテゴリ | 基準 |
|---------|------|
| ビジュアル品質 | コントラスト、余白、フォント |
| コピー品質 | ベネフィット訴求、20文字以内 |
| 構成 | 最初の3枚が重要機能を強調 |
| 統一感 | 全スクリーンでスタイル統一 |

**合格基準: 7/10 以上。** 7未満なら問題箇所を特定して修正する。

---

## Step 7: PNG エクスポートとファイルパス報告

デザイン完了後:
1. `mcp__pencil__get_editor_state` で `.pen` ファイルのパスを確認
2. 各フレームの `get_screenshot` で最終目視確認
3. `pencil_export.py` を実行して PNG を生成:

```bash
python3 docs/screenshots/scripts/pencil_export.py
```

出力先: `docs/screenshots/processed/screen1~3.png`（`screenshot-ab` が直接参照）

4. 報告フォーマット:

```
## スクリーンショット完成

.pen ファイル: {filePath}

| スクリーン | フレーム名 | フレームID | PNG |
|-----------|----------|---------|-----|
| SS01 | SS01_Hero | {id} | processed/screen1.png |
| SS02 | SS02_Feature1 | {id} | processed/screen2.png |
| SS03 | SS03_Feature2 | {id} | processed/screen3.png |

spec-validator: 全10項目 PASS
quality-reviewer: {X}/10
pencil_export.py: 実行済み ✅
```

---

## 出力成果物

- Pencil `.pen` ファイル（全スクリーンショット）
- 各フレームのノードID一覧
- コピーテキスト一覧（日本語）
- 技術仕様バリデーション結果（10項目 PASS/FAIL）
- 品質スコア（10点満点）

---

## App Store スクリーンショット仕様

詳細は [references/app-store-screenshot-specs.md](references/app-store-screenshot-specs.md) を参照。

---

## PhoneMockup レイアウトガイドライン

### アスペクト比の一致（重要）

PhoneMockup のアスペクト比は **実際のスクリーンショット画像の比率と一致** させること。

| 項目 | 値 |
|------|-----|
| 推奨 PhoneMockup サイズ | **320 × 640**（比率 0.50） |
| iPhone 標準比率 | 約 0.46（390/844） |
| シミュレータスクショ比率 | 約 0.50（864/1723） |

### CaptionArea とのバランス

| エリア | 推奨高さ |
|--------|---------|
| CaptionArea | 160pt |
| MockupArea | 684pt |

> CaptionArea を小さく、PhoneMockup を大きくして、アプリ画面をできるだけ多く見せる。
