# DIST-1 spec: 店を MonetizedMCP wrap → Fluora/MCPay 掲載（2026-07-19）

## Goal（検証可能な done）
franklin の4商品(web-search/funding-rates/funding-rate-arb/research)が Fluora マーケットで
検索・購入可能になり、外部 buyer agent が MonetizedMCP 経由で1件購入するのを on-chain 確認。

## なぜ（実測根拠）
- x402 の live 収益額と X4 状態 → `docs/STATUS.md`。本specが解くボトルネックは、買い手が実際に browse・購入する
  発見面への到達と、そこから外部着金までを通すこと。
- 買い手 agent は CDP Bazaar だけでなく MCP マーケットで探して買う。Fluora=「no sign-ups/no API keys/
  no humans in the loop」P2P マーケット、MonetizedMCP(monetizedmcp.org)+x402 ベース、fluora.ai/submit で登録。
- HTTP x402 storefront と MonetizedMCP のprotocol gapはforward adapterで解消済み。残るのはlive配置、registry提出、
  marketplace検索可能性、colony外buyerの実購入である。

## 不変条件（MUST）
1. 既存 serve-v2 の x402 決済/payTo/検査器を壊さない（追加は additive のみ、外部 x402 挙動不変）。
2. MonetizedMCP サーバは franklin の payTo にそのまま決済を通す（人間 credential ゼロ、wallet=identity）。
3. self-pay を external と数えない（INV-EXT 維持、監査器そのまま）。
4. 4商品のみ公開（集中維持、X402_CATALOG=core）。

## SDK 実測（2026-07-19、node_modules で確認）
- `monetizedmcp-sdk@0.1.23`（ESM, `dist/main.js`）実在。`mcpay@0.1.17` 実在。`@fluora/sdk` は無し（submit は web/PR）。
- API: `class MonetizedMCPServer` を継承し3 method 実装 = `priceListing({searchQuery})` / `paymentMethods()` / `makePurchase(req)`。
- SDK は `PaymentsTools.verifyAndSettlePayment(...)` を持つが、本adapterは呼ばない。settleの正本を`serve-v2`だけに保つ。
- `PaymentMethods.USDC_BASE_MAINNET`。CDP_API_KEY_ID/SECRET があれば CDP facilitator、無ければ x402.org。
- SDK `0.1.23`付属HTTP runnerは1個の`McpServer`を全sessionで再利用し、2回目のinitializeで
  `Already connected to a transport`を投げる。公式TypeScript SDK例はinitializeごとに`getServer()`で新しいserverを作る
  （https://github.com/modelcontextprotocol/typescript-sdk/blob/1e1392e3f91583884fe82a0b4b91335875c3fba6/examples/guides/serving/sessions-state-scaling.examples.ts
  — `await buildServer().connect(transport)`）。adapterのHTTP runnerもこの形にする。

## 確定設計（二重払いゼロ・handler 重複ゼロ）
1. `serve-v2.mjs`は**完全無変更**。既存`paymentMiddleware`が唯一のverify+settle実行点であり、HTTP x402 buyerと
   MonetizedMCP buyerの両方を同じ経路で処理する。internal bypass・別handler・別settlerを追加しない。
2. `mcp-server.mjs`: `MonetizedMCPServer`を継承する薄いprotocol変換層。
   - `priceListing` → 4 core 商品（/web-search /funding-rates /funding-rate-arb /research）。source of truth は
     serve-v2 のコメントに従い最小 hardcode（drift 4行、後で DRY 可）。
   - `paymentMethods` → `{ walletAddress: X402_PAYTO, paymentMethod: USDC_BASE_MAINNET }`。
   - `makePurchase` → buyerの`signedTransaction`をx402 `X-PAYMENT` headerとして
     `http://127.0.0.1:$X402_PORT<path>?<params>`へそのままforwardする。`serve-v2`のmiddlewareが1回だけ
     verify+settleし、同じroute handlerが商品を返す。MCP層は決済を実行しない。
   - upstreamの402/4xx/5xxは成功に変換せず`toolResult`へstatus/bodyを返し、unknown item・必須param不足も
     graceful errorとして返す。
   - INV-EXT: settle は buyer→X402_PAYTO の実 tx。self-pay 監査(verify-inflow の self-tx 除外)はそのまま効く。

## 実装手順（Fable 計画→build→検証）
1. ✅ mcp-server.mjs作成（3 method、buyerのX-PAYMENTをserve-v2へforward、serve-v2変更なし）。
2. ✅ E2E probe（probe-dist1.mjs）: serve-v2+mcp-server を子起動→MCP client で 9/9 PASS
   （tools=3、price-listing 4件、payment-methods=payTo、make-purchase 無決済→402 forward、unknown-id graceful、
   serve-v2 unpaid=402 で外部経路不変、fresh 2 session連続initialize）。commit 済み。
3. ✅ mcp-server を3店舗でKeepAlive live起動（public https `/mcp`まで到達）。
4. ✅ Fluora + MCPayへ3店舗のregistry review requestを提出（公式form障害のため公式GitHub issue fallback）。
5. done 検証: Fluora/MCPay で franklin 商品検索可能 + 外部 buyer 実購入 on-chain（verify-inflow external≥1）。

## 実装状況（現在の実測）
- adapter = `skills/earn/x402-sell/mcp-server.mjs`。設計 v2 採用（forward X-PAYMENT、serve-v2 無変更、二重払い構造的に不可能）。
- E2E = `skills/earn/x402-sell/probe-dist1.mjs`、本番 CDP creds で **9/9 PASS**。2回目のfresh MCP sessionも同じ
  `price-listing/payment-methods/make-purchase`を返し、SDK runnerの単一session crashを回帰検査する。
- live 配置: launchd 3/3 `state = running`、local `8090/8091/8092` `/mcp`=400。公開URLは次の3本で、各URLを
  公式MCP clientからfresh session 2回連続initializeし、毎回3 toolsを取得する。既存rootは3本とも200のまま。
  - franklin1: `https://aniccanomac-mini-1.tail7a0ba4.ts.net/mcp`（443 `/mcp` mount）
  - franklin2: `https://aniccanomac-mini-1.tail7a0ba4.ts.net:10000/mcp`
  - claude-p: `https://aniccanomac-mini-1.tail7a0ba4.ts.net:8443/mcp`
- `:10001`はFunnel statusに残るが公開endpointとして使わない。Tailscale公式仕様はFunnelのlisten portを
  `443`/`8443`/`10000`だけに限定する
  （https://tailscale.com/docs/features/tailscale-funnel — “Funnel can only listen on ports 443, 8443, and 10000.”）。
  false hypothesis=`tailscale funnel statusに:10001が表示されればpublic到達可能`。既存mountと試験用tsbridge nodeは削除せず、
  franklin1の正本URLを安定した443 `/mcp` mountへ切り替える。
- Funnel `--set-path=/mcp`はmount prefixをbackendへ保持しないため、targetが`http://127.0.0.1:8091`ではpublic
  `/mcp`がbackend `/`へ届き404になる。targetを`http://127.0.0.1:8091/mcp`のように明示する。複数のFunnel config
  更新を同時実行すると片方のmountが失われるため、各instanceは順次kickstartしてstatus/MCP clientを直後に検証する。
  boot/plist/TDD/複数session修正は`Daisuke134/anicca` branch `feature/dist1-mcp-launchd`へpush済み。
- Fluora公式submitは「registryへsubmitし、approved後にhuman/agentからdiscoverable」と明記する
  （https://www.fluora.ai/submit）。GitHub OAuth認可までは成功するが、frontendがPOSTするApp Runner API hostnameは
  A/AAAAを返さずcallbackが失敗する。公式repoへ3店舗をまとめたreview requestを提出済み:
  https://github.com/fluora-ai/fluora-mcp/issues/3
- MCPayの現行UIは`https://mcpay.fun/register`。公式sourceのINDEX actionは`runIndex(url)`を呼ぶ
  （https://github.com/microchipgnu/MCPay/blob/main/apps/app/src/app/register/page.tsx）。inspectionは200だが、
  `data.mcpay.tech/index/run`は証明書失効後にVercel `DEPLOYMENT_NOT_FOUND`を返す。既存の掲載依頼issue #48と同じfallbackで
  3店舗のreview requestを提出済み: https://github.com/microchipgnu/MCPay/issues/49
- 掲載確認は未達。両review requestはopen・comment 0、MCPay `/servers`は`Something went wrong`、Fluora registry APIは
  DNS解決不能で、検索面そのものが利用不能。3 seller walletを`verify-inflow.mjs 72`で再走査した結果は全て
  `EXTERNAL=0 / externalUsdc=0`（¥0）。自己購入・自己送金でdoneにしない。
- Franklin1のHTTP x402発見面は再実測済み。x402scan公開server pageは4商品・正しいpayToを表示し、Agent402の
  metadata修正PR #473はmerge済み。live `/api/route?q=research%20financial%20analysis`も
  `GET https://franklin1.tail7a0ba4.ts.net/research`、price=`0.003`を返す。
- 自律loopでだけ発生したx402scan再登録失敗は、runtime copyに`@x402/extensions`が無い
  `ERR_MODULE_NOT_FOUND`が原因。既存seller bootと同じmother-repo fallbackを登録scriptへ適用した
  Anicca main `7dcf0127`をruntimeへ配布。x402-sell全test 116/116 PASS、runtime実行は
  `reregistered:true`の後に冪等な`reregistered:false`を返す。168h on-chain再走査は
  self-pay 7件/$0.043、`EXTERNAL=0 / externalUsdc=0`であり、外部購入のdone条件は未達。
- Franklin1のfunded `auto` computeがx402 lifecycleを選べるよう、空引数だけを強制していたruntime promptを
  4 action（ensure/review/improve/update）へ修正（Anicca main `77db578b` / `6c213126`、focused 32/32 PASS）。
  live loopはPhase 1中`ANICCA_SLOT_ALLOWLIST=x402_sell`に集中し、自然wakeが
  `args={"action":"review"}`を選択。review実測はattempts24h=84、externalCount=0、externalUsd=0。
- 次の自然wakeは`args={"action":"improve"}`を選んだ。初回結果のDeFi 11 listingsは先頭500件だけの
  biased sampleだったため、市場scoutをCDP Bazaar全24,991 priced listings + 公式
  `quality.l30DaysTotalCalls/l30DaysUniquePayers`へ修正した（Anicca main `5121eb5a` / `b7b42e83`、
  x402-sell全test 119/119 PASS、独立review PASS）。live結果はDeFi=`1,014 listings / 9,398 calls/30d /
  1,925 payer signals / median $0.01`、LLM=`191 / 5,677 / 334 / $0.01`。旧cacheは自動stale化される。
  さらにlive自然wake `ts=1784690962`でFranklin自身が`action:improve`を再選択し、上記DeFi値、
  LLM値、Image=`147 / 653 / 347 / $0.01`をledgerへ記録した。手動`run.sh`なしでGREENを確認。
- external判定はFranklin1 payToを明示して168h再検証し、`inflows=7 / selfPay=7 ($0.043) /
  EXTERNAL=0 / externalUsdc=0`。外部収益はまだ$0。外部掲載PR #838もFranklin1 v2 storeを追加してhead
  `72ebb673`へ更新。旧Anicca 31 route + Franklin1 4 routeの全35 URL=402、MERGEABLE/CLEANを実測:
  https://github.com/xpaysh/awesome-x402/pull/838
- CDP公式semantic searchではFranklin1 `/research`が`research digest`の2/5位、`/funding-rates`が
  `perpetual funding rates`の11/15位で返る。自然wakeの次回reviewは`attempts24h=108 / external=0`。
  発見可能性と自律監視は動作するが、外部settlementはまだ無い。

## 残作業（DIST-1 内、順）
1. ✅ 3店舗を有効Funnel portのpath mountで公開し、各URLを公式MCP clientのfresh 2 sessionで実測
2. ✅ mcp-server の launchd 化 + franklin2/claude-p展開（非差別、3/3 running）
3. ✅ Fluora/MCPay の実 submitフロー調査 → 公式GitHubへreview request提出（issue #3 / #49）
4. ⏳ Fluora/MCPayで検索可能 + 外部 buyer実購入 on-chain（review/API復旧待ち。HTTP x402側は
   x402scan/Agent402で発見可能だが、Franklin1の168h `EXTERNAL=0`）

## リスク
- registry運営のAPI復旧・review承認は外部状態。issueを監視し、掲載後にmarketplace検索を実測する。
- Funnel path routingの回帰はGET 400だけでは捕捉できないため、公式MCP clientでinitialize→tools/listを2 session連続実測する。
- 4商品のmetadataがserve-v2とdriftする可能性→live配置前のprobeでid/price/required paramsを照合する。
