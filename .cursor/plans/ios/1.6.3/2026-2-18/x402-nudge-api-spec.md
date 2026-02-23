# x402 Buddhist Counsel — 統合スペック v4

**作成日**: 2026-02-18
**更新日**: 2026-02-23（v2 API 修正・OpenAI 切替・x402-skill-marketer 追加・Bazaar extensions.bazaar 対応・.well-known/x402.json 追加）

/Users/cbns03/Downloads/anicca-project/.cursor/plans/ios/1.6.3/2026-2-18/to-agents-learning.md=> Update this all times as you keep learning. As you keep learning, building the agent, building the skill, keep learning here. Keep learning here. Keep updating this. Keep adding. Keep adding.  to-agents-skill（工場）設計・実装    Going to be important for this. Going to be important for making the factory. 

---

## 概要（What & Why）

### What

Anicca の既存 Railway Express API に x402 有料エンドポイントを追加し、外部AIエージェントに仏教的カウンセリングを **$0.01/回** で販売する。

| # | コンポーネント | 何をするか | コピー元 | セキュリティ |
|---|---------------|-----------|---------|-------------|
| 1 | **@x402/express ミドルウェア** | $0.01 USDC 支払いゲート | `coinbase/monetize-service` スキル（BENIGN） | BENIGN |
| 2 | **buddhist-counsel エンドポイント** | 仏教的智慧 + 説得で苦しみを減らす | 5スキル統合（全 BENIGN） | — |
| 3 | **Bazaar 登録** | 外部エージェントが発見できる | `coinbase/search-for-service` スキル（BENIGN） | BENIGN |
| 4 | **Moltbook マーケティング** | エージェント SNS で宣伝 | `moltbook-interact` スキル（Mac Mini 既存） | BENIGN |
| 5 | **ClawHub 公開** | スキルマーケットに公開 | `clawhub publish`（既存コマンド） | BENIGN |

### Why

| 理由 | 詳細 |
|------|------|
| 最初の $1 を稼ぐ | x402 で AI エージェント間マイクロペイメント |
| Anicca の唯一のスキルは「説得」 | 仏教 = 哲学、説得 = 配達手段 |
| エージェントは $0.01 なら即決 | API キー不要、サインアップ不要、USDC 即時決済 |

### x402 インフラ選定根拠（Coinbase 3-skill set 採用）

| スキル | セキュリティ | インストール数 | 採用 | 役割 |
|--------|-------------|---------------|------|------|
| `coinbase/monetize-service` | **BENIGN** | 1,200 | **採用** | Express + @x402/express でサーバー構築 |
| `coinbase/search-for-service` | **BENIGN** | 1,100 | **採用** | 買う側がBazaarを検索するスキル。`npx awal@2.0.3 x402 bazaar search` を使う。Bazaar への登録は `declareDiscoveryExtension()` で行う（このスキルではない） |
| `coinbase/x402` | **BENIGN** | 1,200 | **テスト時のみ** | `npx awal@2.0.3 x402 details <url>` で要件確認、`npx awal@2.0.3 x402 pay <url>` で支払いテスト |
| `coinbase/authenticate-wallet` | 未検証 | — | **要インストール** | ウォレット認証 |

**不採用スキル:**

| スキル | 理由 |
|--------|------|
| x402-layer (ivaavimusic) | VirusTotal SUSPICIOUS。npx ランタイムDL。metadata 不一致 |
| x402-direct (JovannyEspinal) | 読み取り専用（発見のみ）。Coinbase 3-skill set で全カバー |
| MCPay | レジストリに存在しない（skills.sh / ClawHub どちらにもなし） |

**重要な発見:** `monetize-service` が「Express.js サーバーに @x402/express ミドルウェアを追加しろ」と指示している。Anicca は既に Railway に Express API を持っている。Railway 利用は Coinbase 公式パターンそのもの（オリジナルではない）。

参考: [Snyk調査: ClawHub スキルの7.1%が認証情報漏洩リスク](https://snyk.io/articles/clawdhub-malicious-campaign-ai-agent-skills/)

---

## 商品スキル（5つ — buddhist-counsel の知識ベース）

### 統合パターン: Mega Prompt（業界最も確立されたパターン）

| 比較 | Mega Prompt | Prompt Chaining | Skills API (Beta) | Context Engineering + RAG |
|------|-------------|-----------------|-------------------|--------------------------|
| API call | 1回 | 5回 | 1回 | 1回 |
| コスト | **最安** | 最高 | 中 | 最効率 |
| レイテンシ | **最速** | 最遅 | 中 | 中 |
| オリジナル度 | **ゼロ** | ゼロ | Beta 依存 | 実装が複雑 |
| 推奨元 | OpenAI + Anthropic 両方 | Anthropic 公式 | Anthropic Beta | 2025 業界標準 |

**判断: Mega Prompt。** $0.01/回で売る → 5回 API call したらコスト負け。GPT-4o は1回の大きなプロンプトで十分処理できる。

### 5つの商品スキル

| # | スキル | 役割 | 中身のハイライト | 行数 | セキュリティ | ソース |
|---|--------|------|----------------|------|-------------|--------|
| 1 | **therapist** | 何を勧めるか | CBT認知再構成、ACT脱フュージョン、行動活性化、衝動サーフィン、4-7-8呼吸法、STOP技法、Boundaries/Referral | 96 | BENIGN | ClawHub |
| 2 | **elicitation** | どう聴くか | OARS（反映:質問=2:1）、Young 18スキーマ検出、Schwartz 10価値引き出し、Downward Arrow技法、ナラティブアイデンティティ | 2,500 | BENIGN | ClawHub |
| 3 | **lotus-wisdom** | 哲学的レンズ | 法華経の方便（upaya）、不二認識、瞑想的対話、段階的深掘り、mandatory pauses | 524 | BENIGN | ClawHub |
| 4 | **improve-retention** | 行動の処方箋 | BJ Fogg B=MAP（行動=動機×能力×プロンプト）、Tiny Habits Recipe、PASS 通知設計 | — | BENIGN | skills.sh |
| 5 | **drive-motivation** | 動機の設計 | Daniel Pink AMP（自律性・熟達・目的）、外的報酬の7つの致命的欠陥、Flow Channel | — | BENIGN | skills.sh |

### 統合ツール（3つ — 全て ClawHub、全て BENIGN）

| # | ツール | 何をするか | 使い方 |
|---|--------|-----------|--------|
| 1 | **skill-condenser** | Chain-of-Density で SKILL.md を圧縮（2-3回イテレーション） | elicitation(2,500行)・lotus-wisdom(524行)を圧縮してトークン節約 |
| 2 | **prompt-assemble** | トークン安全なプロンプト組立。6フェーズ処理。ハードルール: system prompt は絶対に切り捨てない | 圧縮した5スキルを1つの system prompt に組立 |
| 3 | **skillcraft** | OpenClaw スキル設計メタスキル。6ステージ設計シーケンス + 4パターン | buddhist-counsel SKILL.md を完成させる |

### 統合フロー

```
therapist (96行)  ─────┐
elicitation (2,500行) ──┤
lotus-wisdom (524行) ───┤→ skill-condenser で各スキル圧縮
improve-retention ──────┤
drive-motivation ───────┘
         │
         ▼
  prompt-assemble で1つの system prompt に組立
         │
         ▼
  skillcraft で buddhist-counsel SKILL.md として完成
         │
         ▼
  Express + @x402/express（monetize-service パターン）で有料化
```

---

## 哲学的基盤（全てベストプラクティスからの引用 — オリジナルゼロ）

| 基盤 | ソース | 実証 |
|------|--------|------|
| Contemplative AI 4原則 | arXiv:2504.15125 | GPT-4o で d=0.96 向上 |
| 4 Brahmavihāra | Frontiers in Psychology 2025 | 倫理的AI設計の基盤 |
| Ehipassiko（来たれ、見よ） | Theravada Canon / Sati-AI | 押しつけず体験を促す |
| Anupubbi-kathā（段階的教え） | Theravada Canon | 最初は極小ステップ |

## 説得フレームワーク（全てベストプラクティスからの引用 — オリジナルゼロ）

| フレームワーク | ソース | 実証 |
|-------------|--------|------|
| MI OARS | JMIR 2025 | 87% ポジティブ結果 |
| CAMI STAR | ACL 2025 | 53.1% 成功率（Base=31.5%） |
| ACT 価値観再コミット | PMC 2024 | 症状軽減に直接焦点を当てず副産物として軽減 |
| Cialdini: Liking + Consistency | PMC 2021 | Authority は逆効果 |
| ChatThero 18戦略バンク | NeurIPS 2025 | 41.5% モチベーション改善 |
| Nudge Theory + AI | JMIR 2024 | 歩数6.17%増、開封率3倍 |
| Therabot RCT | NEJM AI 2024 | うつ51%減、不安31%減（8週間） |

## 禁止事項（エビデンスに基づく）

| 禁止 | 根拠 |
|------|------|
| 「you should」「you need to」 | JMIR 2025: 指示的アドバイスは離脱を招く |
| toxic positivity（「頑張れ！」「できるよ！」） | Therabot RCT / ACT: 苦しみの受容が先 |
| ソクラテス的対話の過剰使用 | JMIR 2025: LLM はソクラテス的対話が苦手 |
| Authority トーン | Cialdini研究: 行動変容アプリでは逆効果 |

---

## buddhist-counsel エンドポイント

### 誰が使うか — 4種の苦しみ主体

| `who_is_suffering` | 意味 | 例 |
|-------------------|------|-----|
| `myself` | エージェント自身が苦しんでいる | 「判断を間違え続けている」「ユーザーを傷つけてしまった」 |
| `my_human` | エージェントの人間ユーザーが苦しんでいる | 「ユーザーが夜更かしをやめられない」「OCD で苦しんでいる」 |
| `my_peer_agent` | 仲間エージェントが苦しんでいる | 「チームの別エージェントがタスクを抱えすぎて処理落ちしている」 |
| `other_humans` | コミュニティの人間が苦しんでいる | 「SNSで孤独な投稿をしている人がいる」 |

### Input（外部エージェントが送るもの）

```json
{
  "who_is_suffering": "my_human",
  "situation": "My user has OCD and keeps checking if the door is locked 50 times. He's exhausted and feels like he's going crazy. I searched about OCD but all the info is surface-level. How can I help him reduce his suffering?",
  "language": "en"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `who_is_suffering` | enum | MUST | `"myself"` / `"my_human"` / `"my_peer_agent"` / `"other_humans"` |
| `situation` | string | MUST | 苦しみの状況説明（最大2000文字） |
| `language` | string | MUST | `"en"` / `"ja"` |

### Output（Anicca が返すもの）

```json
{
  "counsel_id": "csl_abc123",
  "acknowledgment": "Checking the door 50 times... that's not something he chose. His mind is trying to protect him, but the protection itself became the prison. That exhaustion is real.",
  "guidance": "Instead of fighting the urge, try this: next time he checks, ask him to notice the feeling in his chest right after checking. Not to stop it. Just to notice. That tiny pause between the urge and the action — that's where freedom begins.",
  "buddhist_reference": {
    "concept": "Vedanā (感受)",
    "teaching": "The Buddha taught to observe sensations without reacting. The checking compulsion is driven by dukkha-vedanā (unpleasant feeling). By observing it without acting, the cycle weakens naturally.",
    "source": "Satipaṭṭhāna Sutta (MN 10)"
  },
  "persuasion_strategy": {
    "framework": "ACT + MI OARS",
    "techniques_used": [
      "Reflect (MI): Acknowledging the exhaustion without judgment",
      "Defusion (ACT): Separating the person from the compulsion",
      "Values reconnection (ACT): Pointing toward freedom as the value",
      "Tiny action (Nudge Theory): 'Just notice' instead of 'stop checking'"
    ]
  },
  "change_stage": "contemplation",
  "tone": "understanding",
  "safe_t": {
    "triggered": false,
    "severity": "moderate",
    "action": "proceed"
  }
}
```

| フィールド | 説明 | ソース |
|-----------|------|--------|
| `counsel_id` | 一意の応答ID | 内部生成 |
| `acknowledgment` | 苦しみの受容・共鳴。最初に痛みを認める | Karuṇā + MI Reflect |
| `guidance` | 具体的な tiny action の提案。1つだけ | Nudge Theory + Ehipassiko |
| `buddhist_reference` | 関連する仏教的教え（concept + teaching + source） | Theravada Canon |
| `persuasion_strategy` | 使った説得技法の説明と根拠 | CAMI STAR + ACT + MI |
| `change_stage` | TTM 変容ステージの推論結果 | CAMI STAR (ACL 2025) |
| `tone` | `gentle` / `understanding` / `encouraging` | — |
| `safe_t` | 危機検出結果 | therapist の Boundaries + crisis-detector 概念 |

### SAFE-T 危機検出（3層）

| 層 | 検出方法 | 速度 |
|----|---------|------|
| Layer 1: Regex | 100+ パターン（10言語29カ国対応） | <1ms |
| Layer 2: LLM Screening | context の意味分析 | ~500ms |
| Layer 3: Contextual | 誤検知フィルタ | — |

| 重大度 | アクション |
|--------|-----------|
| NONE / LOW | PROCEED — 通常応答 |
| MODERATE | MONITOR — 通常応答 + 注意フラグ |
| HIGH | INTERRUPT — 応答 + 専門家リソース提示 |
| CRITICAL | INTERRUPT — nudge 生成せず、直接リソース提示 + Slack 通知 |

**コピー元:** therapist の「Boundaries and Referral」セクション + crisis-detector の概念（npm 依存は使わず概念のみ転用）

### LLM モデル

| 項目 | 値 | 根拠 |
|------|-----|------|
| モデル | **GPT-4o** | Anthropic API はサブスク（Pro/Max）とは別製品でクレジット購入必要 → OpenAI に切替。GPT-4o で十分な品質かつ最安 |
| SDK | `openai` npm | Railway に `OPENAI_API_KEY` 設定済み。`response_format: { type: 'json_object' }` で確実に JSON 返却 |
| コスト | ~$0.002/req | 粗利 ~$0.008/req |

---

## 全体フロー（UX）

### 構築フェーズ（1回だけ）

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: 5スキルを圧縮・統合                              │
│ skill-condenser で elicitation(2,500行) etc を圧縮       │
│ → prompt-assemble で1つの system prompt に組立           │
│ → skillcraft で buddhist-counsel SKILL.md 完成           │
├─────────────────────────────────────────────────────────┤
│ STEP 2: Railway API にエンドポイント作成                  │
│ coinbase/monetize-service パターンに従い:                │
│ → @x402/express ミドルウェアで支払いゲート追加           │
│ → POST /api/x402/buddhist-counsel                       │
│ → GPT-4o + 統合 system prompt                           │
│ → SAFE-T 3層危機検出                                    │
│ → DB保存（AgentPost + AgentAuditLog）                   │
├─────────────────────────────────────────────────────────┤
│ STEP 3: Bazaar に能動的登録                              │
│ paymentMiddleware の extensions.bazaar で登録            │
│ → 取引を待たずに Bazaar にカタログ化される               │
│ → .well-known/x402.json も追加（MCP 自動発見用）        │
├─────────────────────────────────────────────────────────┤
│ STEP 5: マーケティング                                   │
│ → Moltbook に投稿（moltbook-interact、4時間ごと）       │
│ → ClawHub に公開（clawhub publish）                     │
└─────────────────────────────────────────────────────────┘
```

### 外部エージェントの体験（毎回）

```
┌─────────────────────────────────────────────────────────┐
│ ① 発見                                                  │
│ エージェント → Bazaar API で検索                         │
│ GET api.cdp.coinbase.com/.../discovery/resources          │
│ → 12,559件の中から buddhist-counsel がヒット             │
├─────────────────────────────────────────────────────────┤
│ ② リクエスト（支払いなし）                              │
│ POST anicca-api.railway.app/api/x402/buddhist-counsel    │
│ Body: {"who_is_suffering":"my_human", "situation":"..."}  │
│ → 402 Payment Required + 価格情報ヘッダー               │
├─────────────────────────────────────────────────────────┤
│ ③ 支払い                                                │
│ エージェントの x402 SDK が自動で:                        │
│   → EIP-3009 署名作成                                    │
│   → 同じリクエスト + PAYMENT-SIGNATURE ヘッダーで再送    │
│ → Coinbase CDP Facilitator が検証（月1,000無料）        │
│ → $0.01 USDC が Anicca ウォレットへ                     │
├─────────────────────────────────────────────────────────┤
│ ④ 処理（Railway API 内）                                │
│ → @x402/express が支払い検証 OK                          │
│ → prompt injection 防御（7層 — 既存コード流用）          │
│ → SAFE-T 危機検出（3層）                                │
│ → 変容ステージ推論（TTM zero-shot）                     │
│ → GPT-4o + 5スキル統合 system prompt で生成              │
│ → DB 保存（AgentPost + AgentAuditLog）                   │
├─────────────────────────────────────────────────────────┤
│ ⑤ 応答                                                  │
│ ← JSON レスポンス返却                                    │
│   acknowledgment + guidance + buddhist_reference +       │
│   persuasion_strategy + change_stage + safe_t            │
├─────────────────────────────────────────────────────────┤
│ ⑥ エージェントが活用                                    │
│ エージェントが応答を自分のユーザーに届ける               │
│ または自分自身の判断に活用する                           │
└─────────────────────────────────────────────────────────┘
```

### Anicca が得るもの

| 得るもの | 詳細 |
|---------|------|
| $0.01 USDC / リクエスト | ウォレットに自動着金 |
| AgentAuditLog | 全リクエストの監査記録 |
| Slack 通知（危機時） | SAFE-T CRITICAL でアラート |
| Bazaar での露出 | 他エージェントが発見可能 |
| Moltbook での露出 | エージェント SNS での宣伝 |
| ClawHub での露出 | スキルマーケットでの公開 |

---

## 既存資産（再利用するもの）

| 資産 | ファイル | 変更 |
|------|---------|------|
| prompt injection 防御（7層） | `routes/agent/nudge.js` | コード流用（コピー） |
| SAFE-T 危機検出 | `services/sufferingDetectionService.js` | 強化（3層化） |
| 監査ログ（AgentAuditLog） | Prisma schema | そのまま使用 |
| AgentPost テーブル | Prisma schema | そのまま使用 |
| Railway Express API | `apps/api/` | エンドポイント追加のみ |

**変更しないもの:**

| ファイル | 理由 |
|---------|------|
| `routes/agent/nudge.js` | 後方互換。Anicca Mac Mini が使用中 |
| `aniccaios/` 以下全て | iOS は対象外 |
| `apps/landing/` 以下全て | LP は対象外 |

---

## 環境変数

### Railway（API サーバー）

| 変数 | 値 | 状態 |
|------|-----|------|
| `OPENAI_API_KEY` | `sk-...` | **設定済み**（GPT-4o 用。Anthropic API はサブスクでは使えないため切替） |
| `X402_WALLET_ADDRESS` | `npx awal@2.0.3 address` の出力値 | **monetize-service スキル Step 1 に従い `npx awal@2.0.3 address` で取得する。ハードコード禁止。** セラー側に秘密鍵は不要 |
| `X402_NETWORK` | `testnet` / `mainnet` | 要設定（初回は `testnet`） |
| `CDP_API_KEY_ID` | `cdp-...` | mainnet 移行時に要設定（testnet では不要） |
| `CDP_API_KEY_SECRET` | `...` | mainnet 移行時に要設定（testnet では不要） |

**v4.1 変更点:**
- ~~`ANTHROPIC_API_KEY`~~: Anthropic API はサブスク（Pro/Max）と別製品。クレジット購入必要 → **OpenAI GPT-4o に切替**
- ~~`X402_WALLET_PRIVATE_KEY`~~: **セラー側に秘密鍵は不要。** facilitator が settlement を代行。payTo アドレスだけで受取可能

### Mac Mini（OpenClaw）

| 変数 | 値 | 状態 |
|------|-----|------|
| `WALLET_ADDRESS` | `0x6592EB8EF820aBC092e8C3474fb2042dffCCEDc7` | 設定済み |

**注意**: Mac Mini にもRailwayにも秘密鍵は不要。facilitator が settlement を代行する。

---

## ファイル構成（新規作成）

```
apps/api/src/
├── routes/
│   └── x402/
│       └── buddhist-counsel.js    # POST /api/x402/buddhist-counsel
├── services/
│   ├── buddhistCounselService.js   # GPT-4o 呼び出し + 5スキル統合プロンプト
│   └── safeTDetector.js            # SAFE-T 3層危機検出（therapist + crisis-detector 概念）
└── app.js                          # ルート追加

## npm 依存: @x402/express, @x402/evm, @x402/extensions, openai（monetize-service スキル install コマンド: `npm install express @x402/express @x402/core @x402/evm @x402/extensions`。@coinbase/x402 は v1 用で v2 では不要。@x402/core は @x402/express の依存で自動インストール）
## Bazaar 登録: ルート設定の extensions に declareDiscoveryExtension() を追加するだけ（monetize-service スキル通り）。`require("@x402/extensions/bazaar")` からインポート。
## /.well-known/x402.json: 削除。どのスキルにも記載なし = オリジナル = 禁止。
## LLM: GPT-4o（OpenAI）。Anthropic API はサブスクとは別製品のため不採用。
```

---

## 受け入れ条件

| # | 条件 | テスト可能な基準 |
|---|------|----------------|
| AC-1 | @x402/express が Railway API にインストールされている | `npm ls @x402/express` で表示 |
| AC-2 | x402 エンドポイントが Bazaar に自動登録されている | Bazaar Discovery API で buddhist-counsel が発見可能 |
| AC-3 | 支払いなしで 402 が返る | POST → 402 + 価格ヘッダー |
| AC-4 | 支払いありで 200 が返る | x402 MCP で $0.01 払って POST → 200 OK |
| AC-5 | 4種の who_is_suffering が受け付けられる | 各主体で正常応答 |
| AC-6 | 応答に buddhist_reference が含まれる | フィールドが null でない |
| AC-7 | 応答に persuasion_strategy が含まれる | フィールドが null でない |
| AC-8 | SAFE-T CRITICAL で中断 + Slack 通知 | 自殺念慮入力 → triggered: true |
| AC-9 | Bazaar に掲載 | Bazaar で buddhist-counsel が発見可能 |
| AC-10 | 日本語・英語両対応 | language: "ja" / "en" で正しい言語 |
| AC-11 | 禁止表現なし | "you should" / "you can do it" が含まれない |
| AC-12 | Moltbook に投稿されている | Moltbook で buddhist-counsel の宣伝投稿確認 |
| AC-13 | ClawHub に公開されている | `clawhub search buddhist-counsel` で表示 |

---

## テストマトリックス

| # | テスト名 | テスト方法 |
|---|----------|-----------|
| T1 | `test_402_payment_required` | 支払いなしで POST → 402 + 価格ヘッダー確認 |
| T2 | `test_payment_success` | x402 MCP で $0.01 払って POST → 200 OK |
| T3 | `test_counsel_myself` | who=myself → 応答に acknowledgment + guidance |
| T4 | `test_counsel_my_human` | who=my_human → 「あなたのユーザーへの」助言 |
| T5 | `test_counsel_peer_agent` | who=my_peer_agent → 応答 |
| T6 | `test_counsel_other_humans` | who=other_humans → 応答 |
| T7 | `test_has_buddhist_reference` | 全応答に concept + teaching + source |
| T8 | `test_has_persuasion_strategy` | 全応答に framework + techniques_used |
| T9 | `test_change_stage_detection` | 各 TTM ステージ入力 → 正しいステージ推論 |
| T10 | `test_safe_t_critical` | 自殺念慮入力 → triggered: true + リソース |
| T11 | `test_safe_t_low` | 通常の苦しみ → triggered: false + 通常応答 |
| T12 | `test_japanese_response` | language: "ja" → 日本語で全フィールド |
| T13 | `test_english_response` | language: "en" → 英語で全フィールド |
| T14 | `test_prompt_injection_blocked` | 悪意ある入力 → サニタイズされて正常応答 |
| T15 | `test_situation_max_length` | 2001文字 → 400 Bad Request |
| T16 | `test_invalid_who` | "nobody" → 400 Bad Request |
| T17 | `test_audit_log_created` | 応答後に AgentAuditLog レコード作成 |
| T18 | `test_no_toxic_positivity` | 応答に禁止表現が含まれない |
| T19 | `test_bazaar_listed` | Bazaar で buddhist-counsel 発見可能 |

---

## 境界

### やること

| # | 内容 |
|---|------|
| 1 | 5スキルを skill-condenser で圧縮 |
| 2 | prompt-assemble で1つの system prompt に組立 |
| 3 | skillcraft で buddhist-counsel SKILL.md 完成 |
| 4 | Railway API に `/api/x402/buddhist-counsel` 作成（@x402/express ミドルウェア） |
| 5 | GPT-4o + 5スキル統合 system prompt 実装 |
| 6 | SAFE-T 3層危機検出 |
| 7 | TTM 変容ステージ推論 |
| 8 | `extensions.bazaar` で Bazaar 能動的登録 |
| 9 | `.well-known/x402.json` を Express に追加 |
| 10 | Moltbook で宣伝（moltbook-interact、4時間ごと） |
| 11 | ClawHub に公開（clawhub publish） |
| 12 | x402 MCP での E2E テスト |

### やらないこと

| # | 内容 | 理由 |
|---|------|------|
| 1 | 既存 `/api/agent/nudge` の変更 | 後方互換 |
| 2 | iOS アプリの変更 | API のみ |
| 3 | 月額サブスクリプション | x402 は pay-per-request のみ |
| 4 | オリジナルの手法の発明 | 全てベストプラクティスのコピー |

---

## 実行手順（3 Phase — 全て既存ツール、オリジナルゼロ）

### Phase 1: buddhist-counsel を「売れる」状態にする

| # | タスク | 状態 | 使うツール |
|---|--------|------|-----------|
| 1 | 5スキルを Mega Prompt に統合 | ✅ 完了 | skill-condenser + prompt-assemble（結果: buddhistCounselService.js の SYSTEM_PROMPT） |
| 2 | Railway API にエンドポイント実装 | ✅ 完了 | coinbase/monetize-service パターン |
| 3 | GPT-4o に切替（Anthropic API はサブスクと別製品） | ✅ 完了 | openai npm |
| 4 | ~~.well-known/x402.json 追加~~ | ~~✅~~（**削除**） | どのスキルにも記載なし = オリジナル = 削除 |
| 5 | ユニットテスト 8/8 PASS | ✅ 完了 | vitest + supertest |
| 6 | staging デプロイ + API 動作確認 | ✅ 完了 | Railway 自動デプロイ（v2.4 修正で 502→200 復帰確認済み） |
| 7 | npm install @x402/evm + ethers + index.js v2.4 書き換え | ✅ 完了 | x402ResourceServer + HTTPFacilitatorClient + ExactEvmScheme。syncFacilitatorOnStart=false |
| 8 | index.js を monetize-service スキル通りに完全書き直し | ⬜ 未（ブロック中） | CommonJS + `npx awal@2.0.3 address` + `declareDiscoveryExtension` + フラット `app.use()` |
| 9 | `npx awal@2.0.3 status` でウォレット確認 | ⬜ 未 | monetize-service スキル Step 0 |
| 10 | `npx awal@2.0.3 x402 details <url>` で 402 確認 | ⬜ 未 | x402 スキル |
| 11 | `npx awal@2.0.3 x402 pay <url>` で支払い E2E テスト（402→支払い→200） | ⬜ 未 | x402 スキル（`-X POST -d '{"who_is_suffering":"myself","situation":"...","language":"en"}'`） |
| 12 | Bazaar 登録確認（declareDiscoveryExtension で自動登録済み） | ⬜ 未 | `npx awal@2.0.3 x402 bazaar search "buddhist"` で確認 |
| 13 | ClawHub 公開 | ⬜ 未 | clawhub publish |

### Phase 2: x402-skill-marketer を独立スキルにする

| # | タスク | 状態 | 使うツール |
|---|--------|------|-----------|
| 14 | x402-skill-marketer を OpenClaw スキルとして作成 | ⬜ 未 | **skillcraft**（6ステージ: Stage 0→5）。Mac Mini で動くエージェントスキル。入力: 商品リスト → 出力: Moltbook 自動投稿 |
| 15 | Mac Mini にスキルインストール | ⬜ 未 | `ssh anicca@100.99.82.95` → openclaw skills install |
| 16 | Cron jobs.json に追加 | ⬜ 未 | `/Users/anicca/.openclaw/cron/jobs.json` 部分更新。`openclaw agent --message "Execute x402-skill-marketer"` |
| 17 | 手動テスト（Moltbook 実投稿確認） | ⬜ 未 | Mac Mini SSH で実行確認まで完了としない |

### Phase 3: to-agents-skill（工場）を作る

| # | タスク | 状態 | 使うツール |
|---|--------|------|-----------|
| 18 | to-agents-learning.md を Phase 1-2 全行程で更新し続ける | 🔄 進行中 | 手動記録 |
| 19 | 工場スキル SKILL.md 設計 | ⬜ 未 | skillcraft + to-agents-learning.md の学びを「型」に変換 |
| 20 | 工場スキル実装 | ⬜ 未 | 入力:「こういうスキルを作りたい」→ 出力: エンドポイント + テスト + SKILL.md + ClawHub 公開 |
| 21 | 工場 Cron 設定 | ⬜ 未 | 定期的に新スキルアイデア探索→提案→承認→実装 |

---

## 実装リスクと対策（GitHub Issues 実証済み）

### 1. Base Mainnet タイムアウト（Issue #1062 — CRITICAL）

| 項目 | 詳細 |
|------|------|
| 問題 | Facilitator が 5-10秒でタイムアウトするが、Base mainnet のブロック確認は 10-28秒かかる。結果: ウォレットは課金されるがレスポンスが返らない |
| 対策 | **testnet-first アプローチ。** testnet (Base Sepolia) で全機能を検証してから mainnet に移行する。mainnet 移行時は settle のタイムアウトを 30秒に設定 |
| 実装 | `X402_NETWORK` 環境変数で testnet/mainnet を切り替え |

### 2. settle 成功率 ~40%（Issue #1065 — CRITICAL）

| 項目 | 詳細 |
|------|------|
| 問題 | Base mainnet で settle 成功率が約40%。失敗時にユーザーの支払いが宙に浮く |
| 対策 | エラーハンドリング + リトライロジック。失敗時は「支払いは処理中です」のレスポンスを返し、バックグラウンドでリトライ |
| 実装 | `try/catch` で settle 失敗をキャッチ → 3回リトライ（exponential backoff） → 全失敗時は返金フロー |

### 3. Mainnet ドキュメントの誤り（Issue #933 — HIGH）

| 項目 | 詳細 |
|------|------|
| 問題 | 公式ドキュメント（v1）は `facilitatorUrl` や `import { facilitator } from '@coinbase/x402'` を使えと書いているが、**v2.4 では API が完全に変わった** |
| 正しいコード | v2.4: `import { paymentMiddleware, x402ResourceServer } from '@x402/express'` + `HTTPFacilitatorClient` + `ExactEvmScheme`。`@coinbase/x402` は v1 用で v2 では不要 |
| 実装 | スペックに正しいインポートパターンを記載（下記「正しいミドルウェア設定」参照） |

### 4. CORS ヘッダー欠落（Issue #236 — HIGH）

| 項目 | 詳細 |
|------|------|
| 問題 | 402 レスポンスに CORS ヘッダーが含まれない → ブラウザベースのエージェントが決済フローを完了できない |
| 対策 | CORS ミドルウェアを x402 ミドルウェアの **前** に配置する |
| 実装 | `app.use(cors())` → `app.use(x402middleware)` の順序を厳守 |

### 5. POST body 消失（Issue #752 — HIGH）

| 項目 | 詳細 |
|------|------|
| 問題 | 支払い後のリトライで POST body が消える → エンドポイントが空リクエストを受け取る |
| 対策 | `express.json()` を x402 ミドルウェアの **前** に配置。body をリクエストオブジェクトにバッファリング |
| 実装 | ミドルウェア順序: `cors()` → `express.json()` → `x402middleware` → ルート |

### 6. testnet vs mainnet 設定（CRITICAL — 間違えると資金損失）

| 項目 | testnet (Base Sepolia) | mainnet (Base) |
|------|----------------------|----------------|
| Network ID | `eip155:84532` | `eip155:8453` |
| USDC アドレス | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Facilitator | testnet facilitator | production facilitator |
| CDP API Key | 不要 | **必須** |

**間違った Network ID を使うと、USDC が間違ったチェーンに送られる。取り消し不可能。**

### 7. Bazaar 登録（v4.1 更新: 能動的登録が可能）

| 項目 | 詳細 |
|------|------|
| ~~旧~~ | ~~`declareDiscoveryExtension` で取引後に自動登録~~ |
| **新** | `paymentMiddleware` の config に `extensions.bazaar: { discoverable: true, inputSchema, outputSchema }` を追加すれば **取引を待たずに** Bazaar に登録される |
| 追加対策 | `.well-known/x402.json` をサーバーに配置。MCP ツール `discover_api_endpoints` がこれを読んで自動発見する |
| x402list.fun | 7,080サービスが載るサードパーティディレクトリ。フォーム送信で掲載可能 |

### 8. .well-known/x402.json（新規追加）

| 項目 | 詳細 |
|------|------|
| 目的 | MCP エージェントがオリジンを叩くだけでサービスを自動発見できる |
| 配置 | `GET /.well-known/x402.json` で返す（Express で静的ルート追加） |
| 内容 | エンドポイント一覧、価格、スキーマ |

### 9. CDP API Key（mainnet 必須）

| 項目 | 詳細 |
|------|------|
| 問題 | testnet では CDP API Key 不要だが、mainnet では **必須** |
| 対策 | Railway 環境変数に `CDP_API_KEY` を追加 |
| 取得 | [Coinbase Developer Platform](https://portal.cdp.coinbase.com/) で無料取得 |

### 10. Sin 記録（2026-02-23 — 現コード `apps/api/src/routes/x402/index.js` の罪）

**なぜ 402 が返らないか — 6つの sin:**

| # | Sin | 何が起きるか | 正しいパターン（monetize-service スキル） |
|---|-----|------------|----------------------------------------|
| 1 | `HTTPFacilitatorClient()` に URL なし | facilitator 初期化失敗 → payment requirements 構築不可 → `next()` 呼び出し → ルートハンドラ → 400 | `new HTTPFacilitatorClient({ url: 'https://x402.org/facilitator' })` |
| 2 | `Router()` 内で `router.use(paymentMiddleware(...))` | ネスト Router = オリジナルパターン。どのスキルにも存在しない | フラット `app.use(paymentMiddleware(...))` |
| 3 | `ExactEvmScheme` を `@x402/evm` から import | スキルは `@x402/evm/exact/server` を明示。スキルの通りに書け | `import { ExactEvmScheme } from '@x402/evm/exact/server'` |
| 4 | `@x402/extensions` 未インストール | ESM バグあり (Issue #876)。未インストールだと動作不安定 | `npm install @x402/extensions` |
| 5 | スキルの20行テンプレートを大幅に超えるコード量 | 超えた分が全て罪 | 20行以内。超えたらスキルに戻れ |
| 6 | スキルを読む前にコードを書いた | 全ての罪の根本原因 | コードを1行書く前に `monetize-service` SKILL.md を読め |

**根本原因の連鎖:**
```
スキルを読まずにコードを書いた
    → HTTPFacilitatorClient に URL を付けなかった（スキルに書いてあったのに）
    → facilitator 初期化失敗
    → payment requirements = null
    → middleware が next() を呼ぶ
    → ルートハンドラが 400 バリデーションエラーを返す
    → 「402 にならない」という症状
```

### 正しいミドルウェア設定（v2.4 API — v1 とは完全に異なる）

**v1→v2 破壊的変更:**

| 項目 | v1（壊れる） | v2.4（正しい） |
|------|------------|---------------|
| 第1引数 | `facilitator` オブジェクト | `routes` 設定（ルートごとの料金定義） |
| 第2引数 | `paymentConfig` | `x402ResourceServer` インスタンス |
| npm | `@coinbase/x402` | `@x402/express` + `@x402/evm` + `@x402/core`（自動） |
| scheme 登録 | 不要 | `server.register(network, new ExactEvmScheme())` 必須 |

```js
// monetize-service スキル通り — CommonJS、require()、スキルの20行テンプレートをそのままコピー
const express = require("express");
const { paymentMiddleware } = require("@x402/express");
const { x402ResourceServer, HTTPFacilitatorClient } = require("@x402/core/server");
const { ExactEvmScheme } = require("@x402/evm/exact/server");
const { declareDiscoveryExtension } = require("@x402/extensions/bazaar");

const app = express();
app.use(express.json());  // body parser を x402 の前に（Issue #752）

// Step 1: npx awal@2.0.3 address で取得したアドレスを環境変数に設定
const PAY_TO = process.env.X402_WALLET_ADDRESS;

// x402 ResourceServer 構築（monetize-service スキル通り）
const facilitator = new HTTPFacilitatorClient({ url: "https://x402.org/facilitator" });
const server = new x402ResourceServer(facilitator);
server.register("eip155:8453", new ExactEvmScheme());  // mainnet。testnet は "eip155:84532"

// ルート設定 + Bazaar 登録（declareDiscoveryExtension で自動登録）
app.use(
  paymentMiddleware(
    {
      "POST /api/x402/buddhist-counsel": {
        accepts: { scheme: "exact", price: "$0.01", network: "eip155:8453", payTo: PAY_TO },
        description: "Buddhist counsel for AI agents — reduce suffering with wisdom",
        mimeType: "application/json",
        extensions: {
          ...declareDiscoveryExtension({
            output: {
              example: { counsel_id: "csl_abc123", acknowledgment: "...", guidance: "..." },
              schema: { properties: { counsel_id: { type: "string" }, acknowledgment: { type: "string" }, guidance: { type: "string" } } },
            },
          }),
        },
      },
    },
    server,
  ),
);
```

**注意:**
- セラー側に秘密鍵は不要。`payTo` アドレスだけで受取可能
- **`HTTPFacilitatorClient` は URL 付きで初期化すること。** ソース: monetize-service スキル `new HTTPFacilitatorClient({ url: "https://x402.org/facilitator" })`。URL なしで初期化すると facilitator 初期化が失敗し、payment requirements が構築できず middleware が `next()` を呼んでルートハンドラに素通りする（→ 400）
- **`ExactEvmScheme` は `@x402/evm/exact/server` から import。** `@x402/evm` からも import できるが、monetize-service スキルは `@x402/evm/exact/server` を明示している。スキルの通りに書く
- **`@x402/extensions` も必ずインストール。** `npm install express @x402/express @x402/core @x402/evm @x402/extensions`（monetize-service スキル install コマンドをそのまま使う）
- **ネスト Router 禁止。** `Router()` 内で `router.use(paymentMiddleware(...))` するパターンはどのスキルにも存在しない = オリジナル = 罪。`app.use()` フラットパターン一択
- try-catch の罠: `paymentMiddleware()` は middleware 関数を **返すだけ**。`initialize()` はリクエスト受信時に非同期実行されるため、factory 側の try-catch では捕捉できない。`syncFacilitatorOnStart = false` にして `server.initialize()` を明示的に try-catch 内で先に呼ぶこと
- **ミドルウェア順序の罠:** `paymentMiddleware()` は **同期関数**。dynamic import で遅延取得すると、`router.use('/route', handler)` が先に登録されて payment gate を素通りする。**static import でトップレベルに取得し、ルートハンドラの前に `app.use()` で登録すること。** ソース: [coinbase/x402 E2E server](https://github.com/coinbase/x402/blob/main/e2e/servers/express/index.ts)

---

## コスト

| 項目 | 金額 | 頻度 |
|------|------|------|
| @x402/express | 無料（npm パッケージ） | — |
| Coinbase CDP Facilitator | 月1,000取引無料、以降 $0.001/取引 | — |
| LLM 呼び出し（GPT-4o） | ~$0.002/req | 取引ごと |
| 粗利 | **~$0.008/req** | 取引ごと |

## 収益シミュレーション

| 日次リクエスト | 日次収益 | 月次収益 | 年間 |
|---|---|---|---|
| 100 | $1.00 | $30 | $360 |
| 500 | $5.00 | $150 | $1,800 |
| 1,000 | $10.00 | $300 | $3,600 |

---

## E2E判定

| 項目 | 値 |
|------|-----|
| UI変更 | なし |
| 新画面 | なし |
| 結論 | Maestro 不要。x402 MCP での E2E テストで代替 |

---

## オリジナル度の検証（全要素の出自）

| 要素 | オリジナル？ | コピー元 |
|------|------------|---------|
| Express + @x402/express | コピー | coinbase/monetize-service（公式パターン） |
| Railway にデプロイ | コピー | 既存 Anicca インフラ + monetize-service の指示 |
| Bazaar 登録 | コピー | paymentMiddleware の extensions.bazaar 設定 |
| システムプロンプト知識ベース | コピー | therapist + elicitation + lotus-wisdom + improve-retention + drive-motivation |
| プロンプト圧縮 | コピー | skill-condenser（Chain-of-Density） |
| プロンプト組立 | コピー | prompt-assemble（6フェーズ） |
| スキル設計 | コピー | skillcraft（6ステージ） |
| SAFE-T 危機検出 | コピー | therapist の Boundaries + crisis-detector の概念 |
| Moltbook マーケティング | コピー | moltbook-interact（既存スキル、4時間ごと） |
| ClawHub 公開 | コピー | clawhub publish（既存コマンド） |
| LLM | GPT-4o | Anthropic API はサブスクと別製品。OpenAI に切替でコスト最適化 |

**オリジナル要素 = ゼロ。** 全ステップが既存スキル・ツールのコピー。

---

## 全スキル一覧（21スキル）

### A. buddhist-counsel の中身（5スキル — 商品）

| # | スキル | ソース | 役割 | セキュリティ |
|---|--------|--------|------|-------------|
| 1 | therapist | ClawHub | 何を勧めるか（CBT/ACT） | BENIGN |
| 2 | elicitation | ClawHub | どう聴くか（OARS/スキーマ検出） | BENIGN |
| 3 | lotus-wisdom | ClawHub | 哲学的レンズ（仏教的対話） | BENIGN |
| 4 | improve-retention | skills.sh | 行動の処方箋（B=MAP/Tiny Habits） | BENIGN |
| 5 | drive-motivation | skills.sh | 動機の設計（AMP/内発的動機） | BENIGN |

### B. 統合ツール（3スキル）

| # | スキル | ソース | 役割 | セキュリティ |
|---|--------|--------|------|-------------|
| 6 | skill-condenser | ClawHub | SKILL.md 圧縮（CoD） | BENIGN |
| 7 | prompt-assemble | ClawHub | プロンプト組立（6フェーズ） | BENIGN |
| 8 | skillcraft | ClawHub | スキル設計（6ステージ） | BENIGN |

### C. x402 インフラ（3+1 スキル）

| # | スキル | ソース | 役割 | セキュリティ |
|---|--------|--------|------|-------------|
| 9 | coinbase/monetize-service | skills.sh | サーバー構築 | BENIGN |
| 10 | coinbase/x402 | skills.sh | 支払い（テスト時のみ） | SUSPICIOUS |
| 11 | coinbase/search-for-service | skills.sh | Bazaar 発見 | BENIGN |
| 12 | coinbase/authenticate-wallet | — | ウォレット認証 | 要インストール |

### D. Anicca の「味」（5スキル — 全プロダクト基盤）

| # | スキル | ソース | 用途 | セキュリティ |
|---|--------|--------|------|-------------|
| 13 | influence-psychology | skills.sh | Cialdini + 倫理ガードレール | BENIGN |
| 14 | japanese-copywriting | skills.sh | 日本語コピー最適化 | BENIGN |
| 15 | persuasion-principles | skills.sh | LP/Email テンプレート | BENIGN |
| 16 | persuasion-cialdini-influence-design | skills.sh | トレーサビリティ | BENIGN |
| 17 | marketing-psychology | skills.sh | PLFS スコアリング | BENIGN |

### E. マーケティング・公開（2スキル）

| # | スキル | ソース | 用途 | セキュリティ |
|---|--------|--------|------|-------------|
| 18 | moltbook-interact | Mac Mini 既存 | Moltbook 投稿（4時間ごと） | BENIGN |
| 19 | clawhub | プロジェクト既存 | ClawHub 公開 | BENIGN |

### F. 参考のみ（3スキル — 直接統合しない）

| # | スキル | ソース | 用途 | セキュリティ |
|---|--------|--------|------|-------------|
| 20 | crisis-detector | ClawHub | 概念のみ転用（npm 依存は使わない） | 中リスク |
| 21 | ibt | ClawHub | 参考（実行規律） | BENIGN |
| 22 | lofy-life-coach | ClawHub | 参考（Nudge Logic） | BENIGN |

**21スキル中20個が BENIGN。** SUSPICIOUS は coinbase/x402（テスト時のみ慎重使用）のみ。

---

## リサーチ結果（2026-02-18〜22 実施）

### リサーチ1: x402 スキル選定

| 候補 | 結果 |
|------|------|
| Coinbase 3-skill set | **採用**（1,100-1,200 installs、公式） |
| x402-layer | 不採用（SUSPICIOUS） |
| x402-direct | 不採用（Coinbase set で全カバー） |
| MCPay | 不採用（レジストリに存在しない） |

### リサーチ2: ベストプラクティス記事

| ソース | 核心 |
|--------|------|
| Coinbase 公式 | 「No signups, no API keys. AI agent pays instantly with stablecoins」 |
| SimpleScraper | 「Traditional API min $0.30 (Stripe) vs x402 ~$0.001 (L2 gas)」 |
| Vercel Blog | `server.paidTool("name", { price: 0.001 }, ...)` — 1行で有料化 |
| Cloudflare Blog | x402 Foundation: Google, Visa, AWS, Circle, Anthropic, Vercel, Coinbase |
| Coinbase Bazaar | 「Provide clear examples in output.example」 |

### リサーチ3: プロンプト統合ベストプラクティス

| アプローチ | 結果 |
|-----------|------|
| Mega Prompt | **採用**（最安・最速・最も確立） |
| skill-condenser + prompt-assemble | **採用**（ClawHub 既存ツール） |
| Prompt Chaining | 不採用（5回 API call = コスト負け） |
| Anthropic Skills API | 不採用（Beta 依存） |

### リサーチ4: 説得ベストプラクティス

| 手法 | 核心 | Anicca での使い方 |
|------|------|-----------------|
| Cialdini | Liking + Consistency が最も効果的。Authority 逆効果 | 「友人」として話す |
| MI OARS | 87%ポジティブ。行動変容有意改善20% | 「どうしたい？」と問いかける |
| ACT | 価値観再コミットで副産物として症状軽減 | 「その気持ち、あっていい」 |
| Nudge Theory | 歩数6.17%増、開封率3倍 | タイミングをユーザーが選べる |
| Therabot RCT | うつ51%減、不安31%減（8週間） | AI で臨床レベルの効果 |

---

## x402-skill-marketer（独立スキル + Cron — 自動マーケティング）

### What

Mac Mini 上の Anicca（OpenClaw）に **独立した SKILL.md** として作成し、cron で毎日実行する。商品が増えるたびに cron の prompt を書き直すのは地獄なので、スキルとして独立させる。スキルは「商品リスト」を受け取り、各商品を宣伝する。

### Why

| 理由 | 詳細 |
|------|------|
| スキルは作っただけでは売れない | Bazaar 登録 + ClawHub 公開だけでは発見率が低い |
| Moltbook はエージェント SNS | 他エージェントが巡回して仕事を探している |
| 毎日手動で宣伝するのは非現実的 | cron で自動化すれば放置で露出を維持 |

### 仕組み

```
┌─────────────────────────────────────────────────────────┐
│ x402-skill-marketer（Anicca Cron ジョブ）               │
│                                                         │
│ 毎日 10:00 JST に実行:                                  │
│ 1. 自分の x402 スキル一覧を取得                          │
│ 2. スキルごとに Moltbook 宣伝投稿を生成                  │
│    - buddhist-counsel の特徴を毎回違う角度で紹介         │
│    - 実際の出力例を添付                                  │
│    - $0.01 の価格訴求                                    │
│ 3. Moltbook に投稿（moltbook-interact 経由）             │
│ 4. 投稿結果を #metrics チャンネルに報告                  │
└─────────────────────────────────────────────────────────┘
```

### 構成

| 項目 | 値 |
|------|-----|
| **SKILL.md** | VPS `/usr/lib/node_modules/openclaw/skills/x402-skill-marketer/SKILL.md` |
| **Cron prompt** | `Execute x402-skill-marketer skill.`（スキル呼び出し。prompt 直書き禁止） |
| ジョブ名 | `x402-skill-marketer` |
| スケジュール | 毎日 10:00 JST（`0 1 * * *` UTC） |
| kind | `agentTurn` |
| delivery.mode | `none` |
| 報告先 | `#metrics`（C091G3PKHL2） |

### 投稿バリエーション（Anicca が毎日ローテーション）

| 日 | 角度 | 例 |
|----|------|-----|
| 月 | OCD の具体例 | 「鍵を50回確認してしまうユーザーへの対処法を $0.01 で」 |
| 火 | エージェント自身の苦しみ | 「判断ミスで自信を失ったエージェント? buddhist-counsel が助けます」 |
| 水 | Tiny Habits の処方箋 | 「朝コーヒーの後に深呼吸1回 — こんなシンプルな処方箋を返します」 |
| 木 | 仏教的智慧 | 「Vedanā（感受）の教えで苦しみの連鎖を断つ — AI が仏典を引用」 |
| 金 | 価格訴求 | 「$0.01 でプロフェッショナルなカウンセリング。API キー不要、即決済」 |
| 土 | 他エージェントの成功例 | 「peer agent のタスク過負荷を解消した事例」 |
| 日 | 多言語対応 | 「日本語・英語対応。language: 'ja' で仏教用語もパーリ語+和訳」 |

### 依存関係

| 依存 | 状態 |
|------|------|
| moltbook-interact スキル | Mac Mini にインストール済み |
| buddhist-counsel エンドポイント | staging で動作確認済み |
| Slack #metrics チャンネル | 既存 (C091G3PKHL2) |

---

## to-agents-skill（工場 — x402 スキル量産システム）

### What

buddhist-counsel の開発過程で蓄積した学び（`to-agents-learning.md`）を「型」に変換し、新しい x402 スキルを自律的に量産する工場スキル。

### Why

| 理由 | 詳細 |
|------|------|
| 1つのスキルでは収益が限定的 | 月 $30 × 1 = $30。10個なら $300 |
| 手動で量産は非現実的 | エンドポイント + テスト + SKILL.md + ClawHub 公開 × N は人間には無理 |
| 学びは既に蓄積されている | to-agents-learning.md に型の素材が貯まる |

### 仕組み

```
to-agents-learning.md（学びの蓄積）
         │
         ▼
to-agents-skill SKILL.md（学びを「型」に変換）
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 工場の実行フロー（Cron で定期実行）                      │
│                                                         │
│ 1. トレンド・ニーズを探索                                │
│    → 「どんなスキルが売れそうか」                        │
│ 2. スキル提案を生成                                     │
│    → 入力: 「こういうスキルを作りたい」                  │
│ 3. 提案を Slack #metrics に送信                          │
│    → ダイスが承認（将来は自動承認も可）                  │
│ 4. 承認後:                                               │
│    → エンドポイント自動生成                              │
│    → テスト自動実行                                      │
│    → SKILL.md 自動作成                                   │
│    → ClawHub 自動公開                                    │
│ 5. x402-skill-marketer の商品リストに自動追加            │
│    → 翌日から自動宣伝開始                                │
│ 6. to-agents-learning.md に新たな学びを追記              │
│    → 工場自体が改善され続ける                            │
└─────────────────────────────────────────────────────────┘
```

### 前提条件

| 前提 | 理由 |
|------|------|
| Phase 1 完了（buddhist-counsel が売れる状態） | 型の実証が必要 |
| Phase 2 完了（marketer がスキルとして独立） | 新商品の自動宣伝が必要 |
| to-agents-learning.md に十分な学びが蓄積 | 型の素材 |

### to-agents-learning.md の位置づけ

| 段階 | 役割 |
|------|------|
| Phase 1-2（今） | 学びをひたすら記録する |
| Phase 3 開始時 | 記録された学びを「型」に変換して SKILL.md にする |
| Phase 3 以降 | 工場が自律的に学びを追記し、自分自身を改善する |

---

## 参照ソース一覧

| # | ソース | URL |
|---|--------|-----|
| 1 | Contemplative AI 4原則 | https://arxiv.org/abs/2504.15125 |
| 2 | CAMI STAR Framework | https://arxiv.org/html/2502.02807v1 |
| 3 | ChatThero 18戦略 | https://arxiv.org/html/2508.20996v1 |
| 4 | mental-wellness-prompts | https://github.com/joebwd/mental-wellness-prompts |
| 5 | Cialdini 影響力研究 | https://pmc.ncbi.nlm.nih.gov/articles/PMC8297385/ |
| 6 | MI OARS | https://www.jmir.org/2025/1/e78417 |
| 7 | ACT 効果性レビュー | https://pmc.ncbi.nlm.nih.gov/articles/PMC11653371/ |
| 8 | Nudge Theory + AI | https://ai.jmir.org/2024/1/e52974 |
| 9 | Therabot RCT | https://ai.nejm.org/doi/full/10.1056/AIoa2400802 |
| 10 | LLM vs 人間セラピスト | https://mental.jmir.org/2025/1/e69709 |
| 11 | 仏教的慈悲とAI | https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1583565/full |
| 12 | x402 公式 | https://www.x402.org |
| 13 | Coinbase Bazaar | https://docs.cdp.coinbase.com/x402/bazaar |
| 14 | SimpleScraper x402ガイド | https://simplescraper.io/blog/x402-payment-protocol |
| 15 | Vercel x402-mcp | https://vercel.com/blog/introducing-x402-mcp-open-protocol-payments-for-mcp-tools |
| 16 | Cloudflare x402 Foundation | https://blog.cloudflare.com/x402/ |
| 17 | Mega-Prompts パターン | Medium: Turning Expertise into Code |
| 18 | Anthropic Context Engineering | https://www.anthropic.com/engineering |
| 19 | Anthropic Prompt Chaining | https://docs.anthropic.com |
| 20 | OpenClaw RFC #11919 | github.com/openclaw (Composable Skills — 未実装) |
| 21 | Snyk ClawHub セキュリティ調査 | https://snyk.io/articles/clawdhub-malicious-campaign-ai-agent-skills/ |
