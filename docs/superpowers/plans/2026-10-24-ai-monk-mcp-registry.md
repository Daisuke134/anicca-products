# AI Monk IndexのMCP Registry公開

## 目的・範囲・完了条件
公開済みの6tool remote MCPを公式MCP Registryへ登録し、各MCP clientから発見できる配布口を追加する。範囲はremote-only server.json、main限定の手動GitHub Actions OIDC公開、README/正本cursor/受入証拠のみ。npm公開、runtime/tool/payload/課金/日次loopは変更しない。ChatGPT/Museの審査掲載とは区別する。

完了は公式publisherのvalidate、YAML/権限/namespace/main制限のsource確認、PR/main統合、OIDC実公開、公式Registry APIのexact name/version/remote URL readback。新secret/PAT/DNS変更は追加せず、GitHubのrepo所有者namespaceを使う。

## 根拠と方式
公式 docs/modelcontextprotocol-io/quickstart.mdx と remote-servers.mdx はremote-only/remotesを許可する。github-actions.mdxのgithub-oidc経路を使い、id-token:writeとcontents:readだけをpublish jobへ与える。publisher v1.8.2の公式release asset/digestを固定する。登録metadataはio.github.Daisuke134/ai-monk-index、remoteは既存の https://aniccaai.com/.netlify/functions/ai-monk-mcp。Registry検索ai-monkは0件であり、実publish時の既存version/URL占有は公式応答で別に判定する。

## TODO
- [x] source/specを先にcommit/pushし、remote SHAを確認する。
- [x] metadata無しは公式validate exit1、追加後はexit0。最小のserver.jsonとmain限定workflowを追加する。
- [ ] 公式validateとYAML/権限/既存6tool URLの照合を受入し、commit/push/PR/mainへ統合する。
- [ ] Database139sourceの公開readback後、mainからworkflowを実行しOIDC登録する。
- [ ] Registryの公式GETでexact name/version/URLを確認し、README/正本cursorへ記録する。

## 現在cursor
Database PR614はmain fbc141f759c01d0d14269f22e4f75525fcf252c0へ統合済み。CLI v0.4.4の公式asset669669941/digest/公開URL導入/実stdio6toolは受入済み。Netlify39985074291はSUCCESS、公開JSON/Web/MCPの73件/139出典/snapshot一致を受入する。Registry metadataは公式validate exit0、YAML/namespace/version/remote URL/main限定manual/OIDC最小権限とdownload digestのself-checkをPASSし、PR/main統合前にsourceをcommit/pushする。公開effectの順序はDatabase→Registry/Pluginとし、Factory実装を先行しない。残28の商品発見linkのread-only調査はworkerが私的証拠へ保存する。source/effect/公式掲載/売上は別に判定する。
