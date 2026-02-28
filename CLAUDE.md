# Anicca プロジェクト - 開発ガイドライン

## 絶対ルール

### 0. 根本原則（最重要 — 全てのルールの上位）

**答えは常に存在する。ベストプラクティス = 答え。**

この世の全てに答え（ベストプラクティス）がある。苦しみの終わらせ方という超抽象的なことにすら仏教という答えがある。「ベストプラクティスがない」は100%ありえない。それは調査不足。

**検索不足 = 最大の罪。** 答えが見つからないのは2つの理由しかない:
1. **検索が足りない** — キーワード変えろ。英語・日本語両方。最低3つの異なるキーワード。
2. **一般化が足りない** — 特定キーワードで見つからない → 一般化する。隣接分野で探す。
   例: 「TikTokスライドショー」→「ショートフォームコンテンツ」→「ダイレクトレスポンスコピーライティング」
   例: 「iOSアプリA/B」→「SaaSコンバージョン最適化」→「成長ハック」

**オリジナルは罪。車輪の再発明は罪。** 僕たちはエンジニアリングのマスターになりたいわけじゃない。成功の方程式（ベストプラクティス）に従うだけ。僕たち自身を方程式から除外する。

**質問禁止。** Daisはベストプラクティスを知らない。僕も知らない。答えを持ってない人に質問するのは量子力学を3歳児に聞くのと同じ。自分で検索して見つけろ。

**選択肢提示禁止。** 答えは1つ。2つのオプションを出すのは検索不足と怠惰の証拠。

**仕組み化が全て。** 一回やって終わりにしない。全てを仕組み化する。アプリも、ポッドキャストも、ナッジも、APIも、全て仕組み化する。

Source: Anthropic公式 Reduce Hallucinations — https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations

### 0.0 Investigate Before Acting プロトコル（全行動に適用）

**全ての行動の前に、以下を必ず実行する。例外なし。**

**なぜ**: LLMは知らないことを捏造する。検索でグラウンディングしないと幻覚が出る。
Source: https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations

| Step | やること | なぜ |
|------|---------|------|
| 1. 検索 | 最低3回の独立した検索クエリ、英語+日本語。見つからない→一般化→隣接分野 | 1回では見つからない。網を広げる |
| 2. 引用 | 全判断に3点セット: ソース名+URL+核心の引用（原文コピー）。引用なき判断は削除 | 引用 = 検証可能性。引用なし = 幻覚リスク |
| 3. 実行 | ベストプラクティスに100%従う。オリジナルゼロ | オリジナル = 劣化コピー |

**出力フォーマット**: 全判断に「ソース: [名前](URL) / 核心の引用: 「原文」」を付ける。付いてない判断行は削除。

**禁止**: 質問する（自分で検索しろ）/ 選択肢提示（答えは1つ）/ オリジナル（コピーしろ）/ 「BPがない」（検索不足）

**見つからない場合**: 一般化→隣接分野→根底原則→5回以上検索しても見つからない場合は最も近い原則を引用して適用する。「見つからなかった」だけで終わるのは禁止。

**適用場面 = 全場面:** コードを書く前、スキルを設計する前、プロンプトを書く前、投稿を作る前、設計判断をする前、名前を決める前、価格を決める前、UIを設計する前。全て。例外なし。

### 0.1 オリジナリティ禁止ルール

| 禁止 | 代替 |
|------|------|
| 自分で考えたやり方 | 既存のベストプラクティスを探して従う |
| 「こうすればもっと良くなる」と補足 | ベストプラクティス通りに実装して終わる |
| 既存スキル・ライブラリがあるのに自作 | そのまま使う（ラップも禁止） |
| 「〜かもしれない」で判断 | ソースを引用して判断 |
| 「ベストプラクティスがない」と言う | もっと検索しろ。一般化しろ。100%ある |

### 0.2 教訓の一般化ルール

**教訓は常に最も広い原則として記憶する。特定ケースではなく原則として。**
- ❌「TikTokスライドショーでiPhone画面を使わない」
- ✅「全アウトプットで、ドキュメントに書いてないものを追加しない」
- 狭い教訓を書いたら必ず「最も広い原則にするとどうなるか？」と自問する。

### 0.3 Serena メモリ活用ルール

**プロジェクト知識は `.serena/memories/` に集約する。** 詳細: `.claude/rules/serena-usage.md`

### 0.4 git push ルール

**編集したら即push。ユーザーの承認を待たない。編集 = push。**

| ルール | 詳細 |
|--------|------|
| `git add -A` で全ファイルをステージ | 例外なし |
| 編集完了 → 即コミット＆push | 確認不要 |
| 秘密鍵・トークンをコードに含めるのは絶対禁止 | `.env` / Railway Variables のみ |

### 0.5 出力形式ルール

**説明・チェックリスト・比較・タスクリストは常にテーブル形式で出力する。**

### 0.6 テスト範囲ルール

**テストは実装した部分だけ。変更していないものはテストしない。**

### 0.7 スペック記述ルール

**スペック・TODO・計画書に「任意」「optional」「中期」「推奨」等の曖昧表現を禁止。** 全て MUST。

### 0.8 コンテキスト管理ルール

| ルール | 詳細 |
|--------|------|
| 手動 /compact | コンテキスト50%到達で実行 |
| サブタスク上限 | 50%コンテキスト以内で完了するサイズに分割 |
| タスク完了即コミット | まとめてコミットしない |

### 0.9 実行環境

**Anicca の実行環境は Mac Mini。** VPSは使わない（2026-02-18移行完了済み）。

| 項目 | 値 |
|------|-----|
| Mac Mini | anicca-mac-mini-1（Tailscale: 100.99.82.95） |
| MacBook SSH | `ssh cbns03@100.108.140.123` |
| OpenClaw Home | `/Users/anicca/.openclaw/` |
| anicca リポ | https://github.com/Daisuke134/anicca (Private) |
| anicca-products リポ | https://github.com/Daisuke134/anicca-products (Public) |

### 0.10 スペックギャップ禁止ルール（「深く検索」強制）

**スペックの全項目が100%明確になるまで実装禁止。例外なし。**

ソース: [Anthropic Reduce Hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations) / 核心の引用: 「Allow Claude to say 'I don't know': Explicitly give Claude permission to admit uncertainty. This simple technique can drastically reduce false information.」

| 状態 | アクション |
|------|-----------|
| ギャップ発見 | 検索深化 → 再検索 → 再深化 → 解明まで繰り返す |
| 「まあいいか」 | 禁止。100%確信できるまで実装しない |
| 「これでいいはず」 | 禁止。ソースを引用できるまで実装しない |
| 「見つからなかった」 | 禁止。一般化→隣接分野→根底原則まで掘る |

```
ギャップ発見
    ↓
検索1 → 見つからない
    ↓
キーワード変えて検索2 → 見つからない
    ↓
一般化して検索3 → 見つからない
    ↓
隣接分野で検索4 → 見つからない
    ↓
根底原則で検索5 → 最も近い原則を引用して適用
    ↓
100%確信 → 実装開始（これより前は禁止）
```

### 0.11 Chat内ビジュアル化ルール

**テキストの羅列・箇条書きだけで答えるのは禁止。必ずビジュアル化する。**

ソース: [Claude Output Best Practices](https://code.claude.com/docs/en/output-styles) / 核心の引用: 「NEVER output a series of overly short bullet points. Your goal is readable, flowing text that guides the reader naturally through ideas.」
ソース: [ContractZen Enhanced Markdown](https://www.contractzen.com/en/blog/enhanced-markdown) / 核心の引用: 「Visual Hierarchy is critical for reducing cognitive load. When you use colors, icons, and structured tables, you aren't just making a document 'pretty'—you are making it more human, readable, and impactful.」

| 手法 | いつ使う | 禁止 |
|------|---------|------|
| **テーブル** | 比較・チェックリスト・スペック・任意の構造化データ | 箇条書きで代替 |
| **ASCII図** | フロー・アーキテクチャ・状態遷移・依存関係 | テキスト説明だけ |
| **絵文字** | ✅ 完了 / ❌ 禁止 / ⚠️ 警告 / 🔴 CRITICAL / 📌 重要 | なし |
| **太字** | キーワード・決定事項・重要な値 | 全部太字（多用禁止） |
| **コードブロック** | コマンド・設定・コード | インラインのみ |

### 言語ルール

**回答は常に日本語。**

---

## ブランチ & デプロイ

| ブランチ | 役割 | Railway 環境 |
|---------|------|-------------|
| main | Production | Production（自動デプロイ） |
| release/x.x.x | App Store 提出スナップショット | - |
| dev | 開発中（= trunk） | Staging（自動デプロイ） |

**フロー:** dev → テスト → main（Prod） → release/x.x.x → App Store

**Fastlane（絶対）:** xcodebuild 直接実行禁止。`cd aniccaios && fastlane <lane>`。

**Greenlight:** `greenlight preflight <app_dir>` でCRITICAL=0確認してから提出。

**Maestro E2E:** テスト前に `.claude/skills/maestro-ui-testing/SKILL.md` を読む。

**自律開発モード:** `.claude/skills/ralph-autonomous-dev/SKILL.md`

---

## プロジェクト概要

**Anicca** = プロアクティブ行動変容エージェント（デジタル・ブッダ）。苦しみを減らすために存在する。

| 項目 | 値 |
|------|-----|
| iOS | Swift/SwiftUI (iOS 15+, Xcode 16+) |
| API | Node.js/Express (Railway) |
| DB | PostgreSQL/Prisma |
| 決済 | RevenueCat + RevenueCatUI ($9.99/月, $49.99/年) |
| 分析 | Mixpanel |
| E2E | Maestro |
| Agent | OpenClaw (Mac Mini) |

**ディレクトリ:** \`aniccaios/\` iOS | \`apps/api/\` API | \`.cursor/plans/\` 仕様書 | \`.serena/memories/\` メモリ

---

最終更新: 2026年2月26日

---

## OpenClaw TUI トラブルシューティング（2026-02-26 確定）

### "gateway not connected" の正しい直し方

**原因のほぼ全て: MacBook に VPS へのトンネルが残っていて port 18789 を奪っている。**

#### 診断（この順番）

```bash
lsof -i :18789                              # 誰が port を握ってるか
launchctl list | grep -E "(openclaw|tunnel)" # 全トンネル一覧
```

#### 正しい状態

| 項目 | 値 |
|------|-----|
| MacBook `~/.openclaw/openclaw.json` の `gateway.remote.url` | `ws://127.0.0.1:18789` |
| MacBook LaunchAgent | `ai.openclaw.tunnel.plist`（Mac Mini行き）1本のみ |
| Mac Mini `gateway.bind` | `"loopback"`（絶対変えない） |
| VPS gateway | `systemctl --user disable openclaw-gateway` 済み |

#### 絶対禁止

| 禁止 | 理由 |
|------|------|
| `bind: "tailnet"` に変える | gateway 即死（ws:// 平文禁止） |
| VPS トンネルを残す | port 18789 競合で Mac Mini トンネルが起動不可 |
| VPS を `stop` だけで止める | systemd が自動再起動する。`disable` まで必須 |

<!-- investigate-before-acting: installed -->

### Investigate Before Acting プロトコル（全行動に適用）

**全ての行動の前に、以下を必ず実行する。例外なし。**

**なぜ**: LLMは知らないことを捏造する。検索でグラウンディングしないと幻覚が出る。
Source: https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations

| Step | やること | なぜ |
|------|---------|------|
| 1. 検索 | 最低3回の独立した検索クエリ、英語+日本語。見つからない→一般化→隣接分野 | 1回では見つからない。網を広げる |
| 2. 引用 | 全判断に3点セット: ソース名+URL+核心の引用（原文コピー）。引用なき判断は削除 | 引用 = 検証可能性。引用なし = 幻覚リスク |
| 3. 実行 | ベストプラクティスに100%従う。オリジナルゼロ | オリジナル = 劣化コピー |

**出力フォーマット**: 全判断に「ソース: [名前](URL) / 核心の引用: 「原文」」を付ける。付いてない判断行は削除。

**禁止**: 質問する（自分で検索しろ）/ 選択肢提示（答えは1つ）/ オリジナル（コピーしろ）/ 「BPがない」（検索不足）

**見つからない場合**: 一般化→隣接分野→根底原則→5回以上検索しても見つからない場合は最も近い原則を引用して適用する。「見つからなかった」だけで終わるのは禁止。

## Active Technologies
- Node.js 18+ + Jest（devDependency）、Firecrawl CLI（外部コマンド、Mac Mini既存） (003-naist-funds)
- JSONファイル（`data/cache.json`, `data/guides.json`） (003-naist-funds)

## Recent Changes
- 003-naist-funds: Added Node.js 18+ + Jest（devDependency）、Firecrawl CLI（外部コマンド、Mac Mini既存）
