# to-agents-learning.md — x402 スキル量産の学び

**目的**: buddhist-counsel を作る過程で得た全ての学びを記録し、to-agents-skill（工場）の型にする。

---

## Phase 1: buddhist-counsel 構築ログ

### Step 1+2: 5スキル圧縮 + Mega Prompt 組立（統合実行）

| # | 学び |
|---|------|
| 1 | skill-condenser と prompt-assemble は別々にやる必要なし。5スキルの SKILL.md を全部読んで、buddhist-counsel の Output 構造に合わせて必要な要素だけ抽出→1つの system prompt に直接組み立てる方が速い |
| 2 | elicitation は「2,500行」と言われていたが SKILL.md 本体は 476行。リファレンスファイル込みの数字だった。リファレンスは読まなくてOK — SKILL.md だけで十分な知識密度がある |
| 3 | 5スキル合計 1,523行 → 約120行の system prompt に圧縮。圧縮率 92%。捨てたのは: 例示の繰り返し、著者紹介、参考文献リスト、スコアリング指示、製品設計パターン（buddhist-counsel には不要） |
| 4 | therapist (96行) はほぼそのまま使えた。短くて密度が高いスキルは圧縮不要 |
| 5 | lotus-wisdom の「STOP HERE」インタラクティブ対話パターンは API レスポンスでは使えない。概念（upaya, 非二元）だけ抽出してプロンプトに埋め込んだ |
| 6 | drive-motivation の「7つの外的報酬の致命的欠陥」は直接使わないが、「指示的アドバイスは逆効果」の根拠として禁止事項セクションに統合した |
| 7 | improve-retention の B=MAP と Tiny Habits Recipe はそのまま guidance セクションの設計指針になった。最も直接的に使えたスキル |
| 8 | Mega Prompt のセクション順序: WHO → HOW → NEVER → TOOLKIT → LANGUAGE → OUTPUT。ネガティブ制約（NEVER）を TOOLKIT の前に置くことで、ツール適用時に禁止事項が先に頭に入る |
| 9 | Output は JSON only で返させる。自然言語で返すと後処理が必要になる。JSON schema を system prompt 末尾に明示するのが Anthropic 推奨パターン |
| 10 | counsel_id は Sonnet に生成させる（`csl_<random8chars>`）。サーバー側で上書きしてもいいが、LLM に生成させることでレスポンス内の一貫性が保たれる |

### Step 3: SKILL.md 完成（skillcraft）

| 時刻 | 学び |
|------|------|
| — | （作業開始後に記録） |

### Step 4: Railway エンドポイント実装

| 時刻 | 学び |
|------|------|
| — | （作業開始後に記録） |

### Step 5: テスト（testnet E2E）

| 時刻 | 学び |
|------|------|
| — | （作業開始後に記録） |

### Step 6: 公開（ClawHub + Moltbook）

| 時刻 | 学び |
|------|------|
| — | （作業開始後に記録） |

---

## 失敗パターン（再現防止）

| # | 何が起きたか | 原因 | 対策 |
|---|-------------|------|------|
| — | （発生次第記録） | — | — |

## 成功パターン（再利用）

| # | 何がうまくいったか | なぜ | 再利用方法 |
|---|-------------------|------|-----------|
| — | （発生次第記録） | — | — |

---

## リサーチ段階の学び（Phase 1 開始前に記録）

| # | 学び | ソース |
|---|------|--------|
| 1 | x402-layer は SUSPICIOUS。api.x402layer.cc という第三者プロキシを経由する。Coinbase 3-skill set を使え | x402-layer 25ファイル分析 |
| 2 | `/.well-known/x402.json` は x402 公式仕様に存在しない。Zapper も 404 を返す | GitHub tree 全検索 + 実サービス確認 |
| 3 | Bazaar 登録は declareDiscoveryExtension で自動。ただし最初の取引後に初めてカタログ化される | Bazaar API 調査 |
| 4 | Facilitator 手数料: 月1,000無料、以降 $0.001/取引 | Coinbase 公式ドキュメント |
| 5 | Base mainnet タイムアウト問題（Issue #1062）: ファシリテーター 5-10秒 < ブロック確認 10-28秒 → testnet-first 必須 | GitHub Issues |
| 6 | settle 成功率 ~40%（Issue #1065）→ リトライ + 返金フロー必須 | GitHub Issues |
| 7 | 公式ドキュメントの facilitatorUrl は嘘。`import { facilitator } from '@coinbase/x402'` が正解（Issue #933） | GitHub Issues |
| 8 | CORS → express.json() → x402 middleware の順序が CRITICAL（Issue #236 + #752） | GitHub Issues |
| 9 | `@x402/extensions` は別パッケージ。ESM インポートバグあり（Issue #876） | GitHub Issues |
| 10 | CDP API Key は mainnet のみ必須。testnet は不要 | GitHub Issues |
| 11 | 新規セラーの Month 1 収益: $0〜$30 が現実。12,559件中アクティブ 612件（4.9%） | x402scan.com リアルタイムデータ |
| 12 | Mega Prompt が最安・最速。Prompt Chaining（5回 API call）はコスト負け | OpenAI + Anthropic 公式 |
