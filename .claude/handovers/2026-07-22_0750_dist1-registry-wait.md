# Handover — DIST-1 registry review待ち

## 完了

- 3店舗のMonetizedMCP adapterをlaunchdで常駐化。`launchctl`は3/3 `state = running`、local
  `8090/8091/8092 /mcp`はno-session 400。
- 公開正本URL:
  - franklin1: `https://aniccanomac-mini-1.tail7a0ba4.ts.net/mcp`
  - franklin2: `https://aniccanomac-mini-1.tail7a0ba4.ts.net:10000/mcp`
  - claude-p: `https://aniccanomac-mini-1.tail7a0ba4.ts.net:8443/mcp`
- 各公開URLを公式MCP clientでfresh session 2回連続initializeし、毎回
  `make-purchase/payment-methods/price-listing`を取得。既存3 rootも200のまま。
- `monetizedmcp-sdk@0.1.23` runnerの2 session目crashを再現し、公式SDK patternどおりsessionごとに
  `AniccaShopMCP`を生成するrunnerへ修正。probeは本番CDP env込みで9/9 PASS。
- コードは`Daisuke134/anicca`の`feature/dist1-mcp-launchd`へpush済み（`9f65ef69`, `fba111ea`）。
- Fluora review request: https://github.com/fluora-ai/fluora-mcp/issues/3
- MCPay review request: https://github.com/microchipgnu/MCPay/issues/49
- spec正本:
  `docs/superpowers/specs/2026-07-19-dist-1-monetizedmcp-fluora.md`

## 公式submitをissue fallbackにした根拠

1. Fluora UIでGitHub OAuthを実認可したが、callback先App Runner hostnameがA/AAAAを返さず認証失敗。
2. MCPay現行UI `https://mcpay.fun/register`はendpoint inspectionを200で返すが、INDEX先
   `data.mcpay.tech/index/run`の証明書は失効し、TLSを診断用に迂回してもVercel `DEPLOYMENT_NOT_FOUND`。
3. 掲載検索の再試行でもMCPay `/servers`は`Something went wrong`、Fluora registry APIはDNS解決不能。

同一phaseが3経路で失敗したため、Stop条件どおり外部状態待ち。両issueはopen・comment 0。

## 残り1項目

marketplaceで検索可能になった後、colony外buyerの実購入をon-chain確認する。現在のfresh
`verify-inflow.mjs 72`は3 seller walletすべて`EXTERNAL=0 / externalUsdc=0`（¥0）。自己購入・wallet送金は禁止。

再開時はissue #3/#49のreply・listingを最初に確認し、掲載されたmarketplace URLで検索→外部購入→
`verify-inflow external>=1`の順に検証する。承認前にコード変更は不要。
