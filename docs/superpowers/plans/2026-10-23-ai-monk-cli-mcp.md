# AI Monk Index CLI / MCP 配信

## 目的・範囲・完了条件

公開中のAI Monk Indexを、同じ正本JSONと検索実装を使うCLI・読み取り専用MCPとして配布する。公開アカウント・出典・時点・未確認状態を保持し、記事執筆と第三者の調査に再利用できるようにする。この段階はAM-15のデータ配信部分であり、動画生成・投稿factoryやAM-16のsubscription完成とは扱わない。

完了条件は、単独で展開できる公開package、CLI検索/個別取得/統計、MCPの実際のclient接続・検索/個別取得/統計、正本との一致、ライセンスと導入手順、GitHub上の公開配布物である。npm登録、remote MCP、ChatGPT app公開はそれぞれ公式readbackが得られるまで未達とする。新規課金・credential・外部投稿は行わない。

## 順序と所有

旧cursorはAM-14のfactory復旧のみ。旧HeyGenの個別費用と過去effectの証明待ちの間に独立したデータ配信を完成できるため、AM-14の診断を維持したままAM-15のCLI/MCP小段階を並行する。既存effectの再送はしない。rootはProductsの本plan・package・導入案内を所有し、別担当はLife Managerのreceipt再利用境界・S11だけを所有する。

## 契約

- `apps/landing/public/data/ai-monk-avatar-database-2026.json` が唯一のデータ正本。`apps/landing/lib/ai-monk-directory.mjs` が検索/順位付けの正本。package buildで両方をコピーし、生成物はGit管理しない。
- Node.js 20以上、ES modules。CLIは`search`、`get <id>`、`stats`をJSONで返す。searchはquery/status/language/platform/region、audience/directory順、offset/limitに対応し、limitは1–50。未知の引数や不正値は非0終了。通常実行はネットワーク不要。
- search/getは対象recordが参照するsourceを添える。metadataにはschema/update/scope/licenseと順位付けの注意を含める。AI由来・言語・費用・売上が未確認なら補完しない。audienceは最大の単一platformの最新followers/subscribersであり、合算やviewsではない。
- MCPは公式SDK v2のstdio transport、3つのread-only toolsを使う。stdoutはprotocolだけ、起動失敗はstderrに出す。SDKが入力schemaを検証し、structuredContentとtextに同じJSONを返す。
- MITはpackageコードと共有検索helperのみ。Aniccaが執筆したデータ編成・要約はCC BY 4.0、第三者のプロフィール・名称・リンク先素材の権利は含めない。

## 実行順

1. 仕様を保存して専用branchにcommit/push。
2. CLI、provenance、MCP protocolの必要最小の失敗テストを先に実行。
3. 既存helperを再利用する最小実装とbuild/packageを追加。
4. 関連テスト、packしたtarballを別directoryに展開した実行、MCP stdio client接続を確認。
5. fresh read-only review、CI、main統合、main由来tarballのGitHub Release公開とasset readback。
6. 正本specへ結果と残りを記録。factory・remote MCP/app・日本語書籍・subscriptionは継続する。

## 参照した公式資料

- [SDK v2 tools](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/servers/tools.md): registerTool、Zod schema、structuredContent、readOnlyHint。
- [SDK v2 README](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/README.md): McpServer / StdioServerTransport。
- [SDK testing](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/testing.md): SDK clientとtransportでprotocolを検証。
- npm公式registryで`@modelcontextprotocol/server`と`client`のstable 2.3.1、Node>=20、依存関係を照合。Context7のv1指定結果はmain/v2の例を返すため、公式repoとregistryを確認し、現行stable v2に揃える。

## 現在cursor

仕様保存後、CLIとMCPの失敗テストから実装する。
