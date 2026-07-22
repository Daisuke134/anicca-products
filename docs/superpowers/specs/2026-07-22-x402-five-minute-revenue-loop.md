# X402-REV-1: 5分収益フィードバックループ

## Goal

Franklin が自分のwalletとClawRouter/BlockRun computeを使い、外部buyer向けx402商品を販売する。
外部売上が無い間も、人間の指示を待たずに5分ごとに状態を評価し、重複しない小さな商品実験を適用・検証する。

Doneは次の全条件で判定する。

1. x402の収益controllerがbrainのtool call成否に依存せず、実験状態を更新する。
2. 新商品`/llm`がFranklin自身のBlockRun computeを仕入れて返し、仕入上限より販売価格が高い。
3. 実験は5分未満では二重適用せず、5分経過かつ外部売上増分ゼロの時だけ次へ進む。
4. self-payはreward=0。外部settlementだけをrewardとし、外部売上が増えた実験は保持する。
5. live Franklin1で公開manifestに商品が現れ、無決済requestは402、既存4商品の挙動は不変である。
6. 最終成果は外部buyerからのon-chain入金。売上が無い時は金額を`$0 / ¥0`と報告し、改善実験を継続する。

## 実測した真因

- Franklin1のfunded auto loopは自然wakeで`action=improve`を複数回選び、CDP Bazaar全catalogから
  DeFi=`1,014 listings / 9,398 calls30d`、LLM=`191 / 5,677`、Image=`147 / 653`を取得する。
- しかし`store-improve.mjs`は`recommendation`をJSONへ書くだけで、商品、価格、metadata、登録状態を変更しない。
- `store-update.mjs`も「modelが先にコードを編集した」前提で既存manifestを再登録するだけである。
- したがって現在のloopは`observe -> recommend -> record`で止まり、`act -> verify -> learn`が欠落する。
- Coinbase Bazaarは最初のsettlementでcatalogへ載り、quality指標は6時間周期で再計算する。したがって5分は
  **改善controllerの評価間隔**であり、5分売上保証や5分ごとのBazaar順位変動ではない。

## 既存解をcopy+tweakする根拠

- FranklinのADRはx402を経済substrateとし、wallet残高、per-turn spend cap、fallbackを構造的な安全境界にする。
  Source: https://github.com/BlockRunAI/Franklin/blob/main/docs/adr/0001-x402-as-economic-substrate.md
  — “The wallet, not the user account, is the rate limiter.”
- `blockrun-cli`はAPI key無しでchatをUSDC払いでき、`--budget-limit`で1 invocationの支出上限を固定する。
  Source: https://github.com/Daisuke134/blockrun-cli
  — “Each call is billed in fractions of a cent, settled in USDC on Base or Solana via x402 micropayments.”
- contextual banditの形に合わせ、選んだ実験だけの外部settlementをrewardとして更新する。self-payや閲覧数を
  収益rewardへ混ぜない。

## 設計

### 1. 売る商品: `/llm`

- Input: `GET /llm?prompt=<text>`。prompt長とoutput tokenを上限固定する。
- Supplier: BlockRunのOpenAI互換endpoint。human API keyを使わず、各instanceの`loadEvmKey()`で解決したagent
  walletだけでx402 payment payloadを署名する。Franklin1/2/claude-p間でwalletを共有しない。
- 最初に未払いrequestで実quoteを取得し、公式`@blockrun/llm`の
  `parsePaymentRequired / extractPaymentDetails / createPaymentPayload`で支払う。paid requestへ渡すheaderは
  `Content-Type / User-Agent / PAYMENT-SIGNATURE`だけで、親processのcredentialsを継承しない。
- 初期offerはsmart/eco compute、仕入上限`$0.010`、販売価格`$0.015`。handler成功時だけ200を返す。
- float下限、日次仕入上限、per-call budget上限を支出前にfail-closedで検査する。
- upstream失敗は5xx。既存x402 middlewareのsettle-on-success契約により、handler失敗時にbuyerをsettleしない。

### 2. 5分controller

wallet別の`store-experiment-<payTo>.json`を持つ。状態は
`experimentId / variantIndex / startedAt / baselineExternalCount / status`のみを正本とする。

- 状態なし: 最初のLLM offer実験を開始。
- `now - startedAt < 5分`: `waiting`、変更なし。
- 外部settlement増分`>0`: `winner`、現在variantを保持。
- 5分経過かつ増分`=0`: 次の安全な事前定義variantへ進む。
- 同じvariant/fingerprintを二重適用しない。候補を一周した後も、最新market/bandit順位で次を選ぶ。
- 価格variantは常に`price > upstreamMaxUsd`を満たす。満たさない設定は起動前に拒否する。

controllerは5分ごとに評価できるが、seller restart/registry再登録はstateが実際に変わった時だけ行う。
機構故障だけを既存`self-fix.sh`へ昇格し、単なる需要ゼロで高価なcoderを5分ごとにspawnしない。

### 3. 安全境界

- 既存4 route、payment middleware、payTo、self/external判定は変更しない。追加商品はadditive。
- wallet送金、self-buy、内部colony buyをbootstrapや収益として使わない。
- `BLOCKRUN_WALLET_KEY`はbuyer inputから生成しない。agent自身のkeyだけをchild envへ渡し、stdout/logへ出さない。
- promptはshellやchild processへ渡さず、長さを検査したJSON dataとしてbare `fetch`へ渡す。
- controller/handlerはI/O注入可能にし、RED/GREENはwalletやnetworkを使わない。

## 検証

1. Pure tests: 5分境界、外部reward、self-pay除外、idempotency、利益率fail-close。
2. Handler tests: prompt validation、支出guard、argv injection耐性、upstream error、成功JSON。
3. Regression: `skills/earn/x402-sell/__tests__/*.test.mjs`全件。
4. Live: Franklin1 manifestへ`/llm`、unpaid 402、既存route 402、launchd running。
5. Natural wake: x402 skill実行時に`applied|waiting|winner`を記録し、recommendation-onlyではない。
6. 5分監視: `verify-inflow`のexternal増分を実測。ゼロなら次variant、増えたらwinner保持。

## Live evidence

- 実装は`anicca` branch `feature/dist1-mcp-launchd`の`f851667c`までpush済み。
- x402 regressionは`152/152 PASS`、runtime focused regressionは`24/24 PASS`、plist lintは`OK`。
- Franklin1 public manifestは5商品を返し、`/llm`未払いrequestはHTTP 402を返す。payToは
  `0x3EcCAD24794ca298D25378E9902A251322ea8749`で固定する。
- 最初のBlockRun unpaid quoteは`$0.003`。全variantは仕入hard cap`$0.010`より高い
  (`$0.015 / $0.012 / $0.020`)。
- natural wakeは初回`eco-margin / $0.015`を`applied`、次wakeを`waiting`として記録する。
- brainが一度`router_no_realized_action`になってもcontrollerを止めないため、
  `ai.anicca.x402-experiment-franklin1`を独立launchd one-shotとして300秒間隔で実行する。
- launchd初回実行はexit 0。外部売上0を検知し、`eco-margin / $0.015`から
  `eco-market / $0.012`へローテーションし、seller restartと5商品再登録を完了する。public 402 quoteも
  `maxAmountRequired=12000`へ変わる。
- 300秒後の再発火も`runs=2 / last exit code=0`。外部売上0のため`eco-premium / $0.020`へ進み、
  seller restart、5商品再登録、public `maxAmountRequired=20000`まで自動反映する。
- on-chain `verify-inflow.mjs 168`は`inflows=7 / selfPay=7 / EXTERNAL=0 / externalUsdc=0`。
  現在の本物の外部売上は`$0 / ¥0`であり、self-pay `$0.043`は収益に数えない。

## TODO（この機能の正本）

- [x] RED: LLM resale handler + controller tests
- [x] GREEN: `/llm` additive route + spend guards
- [x] GREEN: 5分experiment state/action wiring
- [x] x402全回帰
- [x] Franklin1 live配布・公開402・自然wake
- [x] 5分external売上判定。`$0 / ¥0`を正直に記録し、独立launchdで次実験を継続
