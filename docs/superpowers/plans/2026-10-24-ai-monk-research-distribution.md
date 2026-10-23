# AI Monk Database・Plugin・Factory実行計画

## 目的・範囲・完了条件
既存のDatabase/6tool CLI・pluginを土台に、商品/収益の根拠拡充と配布を先に完了し、原価が成立するcloud Factoryへ進む。要件の正本はfield-guide末尾「Database・Plugin・Factoryの追加契約」。通常判断はprimaryが実行し、承認待ちや固定stageを追加しない。brainstormingの承認質問はDaisの明示No-human-loopと詳細指定へ置き換える。Stripe実装時は既存Checkout/Billingを再利用し、既存runtimeの日次effect/ownerは触らない。

## 順序と現在cursor
旧順/新順/理由はfield-guideを参照する。Database v0.4.6は73公開/75archive/179出典へ反映し、公開JSON/Web/MCP・新CLI Release/URL導入/実stdio6toolの同一snapshotを受入する。商品関連はarchive69行/公開66行。公式Registry v0.4.6は40024564179 SUCCESS/exact GET active/isLatestで完了する。Codex直接配布・本人X告知・Grokへの正式BOARD依頼は完了し、Grok受領/追加投稿は未確認。Museは正式受付と3/3 requirements完了を確認する。BusinessはApproved、Data processingとIntegration credentialsはIn reviewであり、コネクタ全体の承認・掲載は未確認とする。審査結果待ちと独立して原価/方式を定めたFactory実装へ進む。最新配布証拠 → docs/evidence/ai-monk-distribution-status-20261024.json。Factory公開基盤 → docs/evidence/ai-monk-factory-cloud-foundation-20261024.json、Stripe資源 → docs/evidence/ai-monk-factory-stripe-activation-20261024.json。

## 実行順の更新
旧順は既知profileの調査完了→plugin正式掲載→Factory。新順は取得済みsnapshotの公開受入→plugin配布/Registry公開/Muse提出→Factory実装とし、新規一次資料・審査結果は到着時に反映する。理由は73公開件/176出典のWeb・CLI・MCP、配布と申告の受入が揃い、残る取得不可入口や外部審査の待機だけでは次の成果が進まないため。収益へ必要なFactory制作/課金契約を独立して実装する。既存の日次effectを中断・重複しない。現在cursorはSaaS-1の専用provider課金元・実生成・接続受入。本人確認・quota・Stripe配線はsource review/CIを通してmainへ統合し、main由来Web/API/DBを公開する。専用199USD Product/Priceと解約portalは作成・公式GET確認済みで、利用者Checkout/請求は0。課金CTAは無効のまま専用生成予算を準備する。DB-1/PL-1は未確認を保持し、外部待ちを成功へ置換しない。

## TODO
- [x] DB-2（179source snapshotの公開JSON/Web/MCP/CLI/Registry受入済み）: 既存関連検証でsource参照/scope/価格と売上区別を確認し、main/公開JSON/Web/MCPと必要なCLI版へ反映する。
- [x] DIST-1（本人X1本・正式Grok BOARD依頼をreadback、受領/追加投稿は別）: Database/Pluginの新launch copyを根拠付きで作り、自分のX投稿とGrok協力依頼を1回ずつ送る。公式receipt/permalinkと重複0を記録する。
- [x] COST-1（API/Stripe/接続費の一次資料と仮定別原価表を取得、実請求/転換率はSaaSで追跡）: ReelFarm公開価格/無料枠/導線、HeyGen実API単価、45/60秒・1日1本/2本・3日trial・再生成・Stripe手数料から原価と利益を計算する。取得不足はunknownとし課金top-upしない。
- [ ] SaaS-1: 原価からprice/生成上限を決め、最小auth・Stripe3日trial・Generate avatar/video・IG接続・自動投稿・metricsを既存Web/APIから実装して公開する。TikTokは後続。実API生成/Stripe subscription/利用者所有接続/公式投稿とmetricsを成果条件として追跡する。
- [ ] DIST-2: 実利用できるFactoryをXで告知し、Grokにも配布協力を依頼する。未実装や未達収益を宣伝しない。
- [ ] PL-1: 既存無料Codex pluginと正式ChatGPT/Grok/Muse配布口を確認する。6toolを案内するportable v0.1.2はmain2cfc70e由来の固定ZIP/asset670323615公開と公式digest/download一致を確認する。source・新Release・正式提出/掲載を分けて追跡し、正式ChatGPT掲載は未完とする。新しい専用OpenAI orgではupload前のdeveloper identityにvalid default payment methodが必要で、upload/submitは0。既存accountのpasskey MFAとは区別する。Museは3/3 requirements受付済み、BusinessだけApproved、Data/credentialsはIn reviewで、全体掲載は未確認。公開証拠 → `../../evidence/ai-monk-plugin-v012-release-20261024.json`。詳細 → `2026-10-24-ai-monk-plugin-v012.md`。
- [ ] DB-1: 既知73profileの商品/売上/creator/言語/画像の調査coverageを記録し、取得可能な公開一次資料から精査・拡充する。pending非掲載という旧reasonを修正し、unknownを保持する。 確定3系統の商品価格/通貨はv0.4.6へ反映し、main95f50a9dd由来のReleaseと公開Web/CLI/MCP/Registryの同一snapshotを受入する。限定cursor/公開受入 → `2026-10-24-ai-monk-product-price-currencies.md`。 追加X告知2113731126355468705は投稿時のv0.4.5/176source snapshotとして履歴保持し、v0.4.6の公開証拠へ流用しない。

## 境界
調査・配布段階の新規契約/top-upは0。Factoryのprovider設定と実生成は採用した原価/予算契約と支払元の実確認を満たす範囲で行い、Grok共有walletへfallbackしない。既存creditとspend-capを守る。free試用は3日というユーザー指定を優先し、無制限生成を約束しない。個人wallet/口座資金移動、既存loop restart、未完effect再送、shared credential複製は行わない。Factoryの実設計・価格はCOST-1の結果から具体化し、ここで架空の利益/注文を置かない。

## 取得済み証拠
- docs/evidence/ai-monk-profile-audit-20261024.json — 67profileのUI観測と未取得境界。
- docs/evidence/ai-monk-product-research-20261024.json — 15site/13取得成功/20商品、18価格/2価格unknown。
- docs/evidence/ai-monk-factory-unit-economics-20261024.json — HeyGen APIとReelFarm公開料金の区別、生成原価と未確認。

Databaseのpackage metadata/READMEはv0.4.6へ揃え、新しいmain固定入力のReleaseとして配布済みとする。既存Releaseを変更せず、公開JSON/Web/MCP・URL導入・実stdio6toolとRegistryの同一snapshotを受入する。GitHub Releaseロックはimmutable=falseのまま記録する。証拠 → docs/evidence/ai-monk-cli-mcp-v046-release-20261024.json。

## 配布口と下位ルールの更新
正式Muse Connector Platform https://platform.muse.ai で既存IDの正式提出と全3requirementsの受付を確認する。Data processingの追加提出は1回、再送0。Business verificationはApproved、Data processingとIntegration credentialsはIn reviewで、コネクタ全体の承認と正式掲載URLは未確認とする。xAIは https://docs.x.ai/developers/tools/remote-mcp の公開仕様がremote MCPの接続を説明する。API互換の案内とhost実受入/公式directory掲載を区別する。MCP Registryは公式remote-only/OIDC公開を完了し、v0.4.6のexact GET active/isLatestを確認する。

LM docs/team/README.md・RULES.md・WORKFLOW.mdの無料trial禁止は、Daisの最新のStripe3日trialという明示指示により本Factoryでは上書きする。旧ルールをSaaS実装の停止点にしない。既存の他商品/日次loopの課金設計は変更しない。

MCP Registryの公開契約とsource受入 → 2026-10-24-ai-monk-mcp-registry.md。公開effectとreadbackの証拠 → docs/evidence/ai-monk-distribution-status-20261024.json。既知profile/productの拡充は続き、全世界の全件網羅や全収益監査を達成扱いしない。
