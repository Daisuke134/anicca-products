# AI Monk Plugin配布計画

## 目的・範囲・完了条件
Daisの無料公開でもよいという配布依頼に従い、既存のDatabase remote MCPをChatGPT/Codex共通pluginへまとめる。既存3toolの読み取り専用機能だけを配布し、Factory生成・投稿・決済・private credentialを含めない。main由来のZIP、公式schema確認、公開support/terms/privacy、実SDK接続、portalの提出/掲載readbackを区別して完了を判定する。Museの具体service URLは未特定であり、推測した別サービスへ公開しない。

## 現在の契約
正しいendpointは https://aniccaai.com/.netlify/functions/ai-monk-mcp。/api/ai-monk-mcp は採用しない。掲載は73件（included4/pending69）、archive75、sources57。候補/未確認/収益claimの区別を保持する。OpenAI公式build/pluginsとdeploy/submissionの現行手順に従う。portable root plugin.json / mcp.json / assetsを使い、MCPはstreamable-http/auth none、hooks/秘密/desktop executableは含めない。公式manifestのextensions.com.openaiへ表示情報と5positive/3negative review casesを置く。既存Anicca iconを使い画像生成しない。

## TODO
- [x] MCP用support/terms説明とmetadataをsourceに作る。
- [x] portable packageを公式schemaと実MCPで確かめ、main/CI/公開URLへ反映する。
- [x] mainのZIPをGitHub Releaseで無料配布し公開digestを照合する。
- [ ] portal通常auth/identity/権限/domain challenge、実walkthrough、審査提出/掲載を進める。ZIP作成を掲載と呼ばない。
- [ ] natural-language plugin routingを実hostで確認する。SDKによる直接tool呼出を自然言語routingの受入へ換算しない。

## 既知の外部境界
最新観測は、正規guardとtarget owner登録を持つ`interactive:dais`のlive persistent context内のown targetで、cookieを複製せず通常Google SSOを通過し、OpenAI MFAのpasskey画面へ進む。OpenAIの「他の方法を試す」1回後も同画面、password入力欄0・plugin掲載作成0。先のGoogle `/v3/signin/challenge/pk`はvault-seeded isolated contextの履歴として保持し、現在の停止点と混同しない。本人確認/role/draft/submissionは未確認であり、本人手続きが必須とはまだ断定しない。`cua-driver` skillは指定されたskill roots・Life Manager skills・plugin cacheの限定探索で見つからず、native UI操作は未実施。primaryはOpenAI MFAと対応するnative認証経路を診断する。Apple credential store・認証設定・credential値ログは使わず、観測した画面だけを根拠に次の境界を狭める。実demo recording URLは未作成で、placeholderをmanifestへ入れない。最新のsanitized evidence → `docs/evidence/ai-monk-plugin-auth-diagnosis-20261023.json`。

## 一次資料
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/plugins/deploy/submission

## source受入
Agent Plugins 1.0.0の公開plugin/mcp JSON schemaを取得し、Python jsonschemaで両manifestを検証する。OpenAI docsのauth拡張例はbase MCP schemaがadditionalProperties=falseで受理しないため、認証不要の既存公開endpointは標準のtype/urlだけを宣言し、portalでnoneを照合する。公式提出の文字数制限・5positive/3negativeを確認。demo URLやverified identityは未確認のため捏造しない。

## 実MCP受入で判明した訂正
旧ZIP v0.1.0の5番の審査ケースは、TikTokの結果が2件のため次ページを要求できない。検索の不具合ではなくケースの条件不足として、filterなしの73件から2件ずつ取得する実在ページ分割へ訂正する。修正版v0.1.1はmain `996f33cfd0df29974c2d70226cc737bdec9586ef`由来のZIPとして無料公開済み。731,811 bytes、SHA256 `ae8ef5922c5001d7b314d45c939dd2c529cd1295a0e53aed50c12f1f2a864127`は公開downloadと公式digestが一致する。実SDKの5scenario、3tool、unknown publish tool拒否と本番support/terms/privacy200を受入する。証拠 → `docs/evidence/ai-monk-plugin-v011-release-20261023.json`。natural-language routingとportal提出/掲載は未達を保持する。

## 現在cursor
Database73件/CLI v0.4.2復元とFactory Web公開・localhost plan受入は完了。repo marketplaceのsource受入は既存portable v0.1.1のpayload3filesを保持し、空`CODEX_HOME`の通常CLIで実install/enabled/MCP設定loadまで完了する。次はPR609のmain統合と既存Landing PR CI→公開main SHA固定+sparse受入→host routingとportal診断/提出/掲載。順序変更の理由・契約・残TODO正本 → `2026-10-23-ai-monk-plugin-marketplace.md`。live persistent contextでGoogle SSOを通過した後のOpenAI MFA passkey境界、対応native経路/必要skillの診断、実walkthrough、審査提出/掲載、Muse URL同定は未達を保持する。日次投稿はGrok Bot担当であり、既存loop・生成effect・投稿を操作しない。実HeyGen生成・native公開・売上・USD10K MRR・他者無人収益は未確認のまま保持する。
