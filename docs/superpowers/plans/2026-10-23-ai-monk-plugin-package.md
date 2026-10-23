# AI Monk Plugin配布計画

## 目的・範囲・完了条件
Daisの無料公開でもよいという配布依頼に従い、既存のDatabase remote MCPをChatGPT/Codex共通pluginへまとめる。既存3toolの読み取り専用機能だけを配布し、Factory生成・投稿・決済・private credentialを含めない。main由来のZIP、公式schema確認、公開support/terms/privacy、実SDK接続、portalの提出/掲載readbackを区別して完了を判定する。MuseはサービスURL回答待ちであり、推測した別サービスへ公開しない。

## 現在の契約
正しいendpointは https://aniccaai.com/.netlify/functions/ai-monk-mcp。/api/ai-monk-mcp は採用しない。掲載は73件（included4/pending69）、archive75、sources57。候補/未確認/収益claimの区別を保持する。OpenAI公式build/pluginsとdeploy/submissionの現行手順に従う。portable root plugin.json / mcp.json / assetsを使い、MCPはstreamable-http/auth none、hooks/秘密/desktop executableは含めない。公式manifestのextensions.com.openaiへ表示情報と5positive/3negative review casesを置く。既存Anicca iconを使い画像生成しない。

## TODO
- [x] MCP用support/terms説明とmetadataをsourceに作る。
- [ ] portable packageを公式schemaと実MCPで確かめ、main/CI/公開URLへ反映する。
- [ ] mainのZIPをGitHub Releaseで無料配布し公開digestを照合する。
- [ ] portal通常auth/identity/権限/domain challenge、実walkthrough、審査提出/掲載を進める。ZIP作成を掲載と呼ばない。

## 既知の外部境界
Googleの通常account選択後にOpenAI passkey MFAへ進み、他の方法を1回試しても同画面を観測する。本人確認/role/draft/submissionは未確認。Apple credential storeを使わず、既存の通常認証経路を追加観測する。実demo recording URLは未作成で、placeholderをmanifestへ入れない。

## 一次資料
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/plugins/deploy/submission

## source受入
Agent Plugins 1.0.0の公開plugin/mcp JSON schemaを取得し、Python jsonschemaで両manifestを検証する。OpenAI docsのauth拡張例はbase MCP schemaがadditionalProperties=falseで受理しないため、認証不要の既存公開endpointは標準のtype/urlだけを宣言し、portalでnoneを照合する。公式提出の文字数制限・5positive/3negativeを確認。demo URLやverified identityは未確認のため捏造しない。

## 実MCP受入で判明した訂正
公開ZIP v0.1.0のhash/bytesと本番support/terms/privacy200は一致するが、5番の審査ケースはTikTokの結果が2件のため次ページを要求できない。検索の不具合ではなくケースの条件不足。filterなしの73件から2件ずつ取得する実在ページ分割へ訂正し、source v0.1.1をmain統合後に再配布する。natural language routing/portal掲載の未確認を保持する。
