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
- [x] CLI/stdio/pack継続テスト、HTTP protocol、landing CI、fresh review。
- [x] main統合、既存Netlify本番配信、実URLでMCP client readback。
- [x] v0.2.0配布とspec更新。plugin提出は実際の権限・identity・portal readbackを確認して別段階で進める。

## 検証・現在cursor

HTTP未実装のREDから最小transportを実装し、package11tests（HTTP SDK client・旧protocol・Host/Origin/容量/method/CORS、CLI/stdio、別directory tarball導入）がPASS。書籍・Reset/Letter・EN/JA SSR・DBの37関連契約もPASSする。実Netlify wrapperのinitializeも200、serverInfo ai-monk-index/0.2.0。

PR566のhead37be42c4ではpackage CI成功、landing CI39884395696がnpm ci EUSAGE（zod3.25.76が7件不足）となる。node_modules無し・npm10.8.2のclean probeで再現し、lock-only再解決で7つのnested Zod3 recordだけを追加する。既存package record/版本変更は0。clean npm ci dry-runは0となり、修正head08e13f4a3b38dff0f92f130b7a87762e73a291eaでpackage CI39884702345、landing CI39884702372ともsuccess。証拠 → `docs/evidence/ai-monk-mcp-lock-repair-20261023.json`。

fresh-context read-only reviewerは既存11testsを独立再実行し、実wrapperに118追加assertを行う。全75records/48sources/SHA、unknown保持、分割/multibyte/偽Content-Lengthの64KiB制限、Host/Origin/CORS、schema、source/dist/stageのbytes一致に阻害指摘はない。実Netlify bundler出力・HTTPSは本番readbackで確認する。証拠 → `docs/evidence/ai-monk-remote-mcp-source-review-20261023.json`。

PR566はmain f8dde2b78ac9fa81c388f0495ed779e7321379d2へ統合する。Netlify39885561755はsuccess。公式SDK clientから本番initialize/list/tools3種を実行し、75 records/48 sources/SHA・unknown tool error・GET405・ChatGPT Origin204・無関係Origin403を確認する。公開privacyも200。v0.2.0の24,833 bytes tarballは公式asset digestと公開GETのSHAが一致し、公開URLのnpm導入後CLIとstdioが同じ75/48を返す。現在cursorは残画像調査と、plugin portalの既存account・通常login・identity/permission確認。UI選択モデルを継承し、再承認・固定model・重複task frameworkは追加しない。画像17件の本番確認は完了し、残58件の出所確認を別branchで継続する。既存HeyGen/Postiz effectは再送しない。

## 本番・配布証拠

- `docs/evidence/ai-monk-remote-mcp-production-20261023.json`
- `docs/evidence/ai-monk-cli-mcp-v02-release-20261023.json`
- [v0.2.0](https://github.com/Daisuke134/anicca-products/releases/tag/ai-monk-index-v0.2.0) tagはmain f8dde2b78ac9fa81c388f0495ed779e7321379d2を指す。v0.1.0は再作成しない。
- plugin portalのread-only新規tabは`/login`へ遷移する。未認証画面だけで権限不足や本人確認未完を断定せず、既存のGoogle通常loginを次に調べる。ログイン・draft・提出・審査・公開は未実行。根拠 → `docs/evidence/ai-monk-plugin-portal-preflight-20261023.json`。

## Plugin掲載の実行範囲・順序

目的は既存のpublic MCPをChatGPT/Codexのplugin directoryへ提出し、承認された場合は公開readbackまで進めること。MCPの同じ3 tools・同じ75/48 snapshotを使い、生成/投稿/決済の機能を加えない。通常loginは既存browser sessionとcredential SSOTのGoogle exact serviceを照合し、Keychainは使わない。本人/組織の法的情報や審査結果を推測・捏造しない。新しい有料plan/API使用はしない。

- [ ] 既存profileで通常loginし、実account/組織・role・publisher verification・提出権限をreadbackする。
- [ ] Name `AI Monk Database`、直接的description、既存自社logo、company/privacy/MCP URLs、3 toolsのtest prompts/responsesを具体化する。
- [ ] draft/tools scan、必須metadataと対応localeを確認し、提出可能ならreviewへ送る。
- [ ] 公式portalの提出/審査statusをreadbackする。承認後はPublishし、directoryのexact nameまたはURLで公開を確認する。

完了は本番MCP接続とは別に、portalの公式提出・公開状態で判定する。ユーザー本人の必須手続きが必要な画面では不足物と次の操作を記録し、残画像・既存factory等の独立作業を続ける。現cursorは既存Google sessionでの通常login確認。rootはこの掲載計画とportal evidenceを所有し、画像batch4のassets/manifest/UI planには触らない。
