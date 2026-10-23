# AI Monk Index remote MCP

## 目的・範囲・完了条件

公開済みCLI/stdio MCPと同じデータ・検索・toolを、既存Aniccaサイトのpublic HTTPS endpointから利用できるようにする。3つの読み取り専用toolをホストし、ChatGPT/Codexのplugin接続と第三者のMCP clientが利用できる基礎を作る。新規host、課金API、認証、動画生成・投稿、顧客DBは追加しない。

完了条件は、公式SDK clientによるローカルRequest/Responseのprotocol受入、必要な不正入力の拒否、既存CI、本番HTTPSへのSDK client接続・tools/list/search/get/statsのreadback、公開導入/プライバシー説明である。plugin directoryは別の提出・審査・公開を要し、HTTP endpoint完成だけで掲載済みとは扱わない。

## 現在の根拠

- CLI/stdio v0.1.0はmain由来GitHub Releaseとして公開し、公開URLのnpm導入と75 records/48 sourcesの読出しまで確認する。データは9調査対象+66未確認候補、AI reported4/unverified71/confirmed0を保持する。
- [OpenAI MCP server guide](https://developers.openai.com/plugins/build/mcp-server)はcustom UIなしのtoolsだけのpluginを認める。サーバーinstructions、入力/出力schema、annotationsが利用契約になる。
- [OpenAI remote MCP review requirements](https://developers.openai.com/plugins/deploy/app-review)はpublic domainのMCP URLと実接続を要求し、公開前にidentity verification、api.apps.write/read、plugin metadata・privacy URL・test cases・審査と公開を要する。掲載可否や審査日数は未確認のまま断定しない。
- OpenAI guideのSDK例はv1 package名を示すが、実際に使う公式MCP SDKの採用版v2.3.1をregistry/repoで照合する。v2のWebStandardStreamableHTTPServerTransportはsessionIdGenerator省略でstateless、enableJsonResponseで単発JSON response、maxRequestBodySizeでrequest boundを持つ。

## 実装契約

1. `packages/ai-monk-index/src/mcp.mjs` を唯一のtool登録実装とし、stdio/HTTP両方で利用する。検索/順位付けは既存helper、データは既存public JSONだけを正本にする。
2. SDKのWeb Standard Request/Response transportでrequestごとのstateless serverを作る。session・Cookie・ユーザー保存・永続background processは作らない。toolは従来の3つのみ。
3. 既存Netlify Functionに薄いwrapperを置く。buildがcore/query/データをignored generated directoryへ取り込む。依存はSDK serverとZodのみをlandingにも追加し、npm ciと既存deploy経路で再現する。
4. bundlerがJSONを含められる静的importを使い、snapshot SHAは正本の元bytesからbuild時に計算する。Node.js 20.19以上を明記し、単独tarballも継続して検証する。生成された2つの配布先は編集しない。
5. SDK標準のHost/Origin検証を使い、非browser clientのOriginなしを許容する。既知のAnicca/ChatGPT originsだけをCORSで返す。64 KiBのrequest bound、適切なmethod rejectionとJSON errorを保持する。外部URLをclientから指定して取得する機能は作らない。
6. applicationはquery/filterを返答のため処理し、保存しない。hosting providerが処理する接続情報と提供者のpolicyへの参照を公開privacy説明に示す。実際に未確認のretentionや匿名性は保証しない。
7. v0.1.0配布物は変更せず、更新するpackageはv0.2.0とする。今回もgeneration/factory/subscriptionの完成として宣伝しない。

## 実行順・現在cursor

CLI/stdioと日本語書籍の販売公開は完了し、rootはこの独立したremote配信を再開する。残り画像の出所確認は別worktreeで並行する。AM-14の旧effect/費用診断を保持し、外部effectの中断・再送はしない。

- [x] planを専用branchへcommit/push。
- [x] HTTP client/provenanceと境界の失敗テストを先に確認。
- [x] 最小transport/wrapper/build/公開説明を実装。
- [ ] CLI/stdio/pack継続テスト、HTTP protocol、landing CI、fresh review。
- [ ] main統合、既存Netlify本番配信、実URLでMCP client readback。
- [ ] v0.2.0配布とspec更新。plugin提出は実際の権限・identity・portal readbackを確認して別段階で進める。

## 途中状態

HTTP未実装のREDを確認し、CLI/stdio/別directoryへのtarball導入とHTTP SDK client、旧protocol、Host/Origin/容量/method境界の11テストをローカルでPASSする。Netlify wrapper・静的JSON bundle・privacy説明・CI/deploy呼出し元を実装する。review/CI/main/本番readbackは未実施。Daisの明示されたUI改修（全profile icon、見出しAI Monk Database、直接的なcopy、Mobbin/競合参照）を優先し、このbranchをpushして保持する。既存外部effectは中断・再送しない。

## 再開cursor

日本語版の本番readbackを終え、専用worktree `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-remote-mcp-20261023` へ保存済みbranchを展開し、最新mainをmergeする。現在cursorは既存11 protocol/CLI/packテストの再確認、現行landingのbook/UI契約を保持したCI、source検証である。既存taskのRED→GREEN記録は維持し、同じ仕様の再実装や新しいtask frameworkは増やさない。現在のUI選択モデルを継承し、skill/referenceの固定model指示は適用しない。公開・pushはDaisの既存委任で実行し、skillの再承認要求を進行条件にしない。
