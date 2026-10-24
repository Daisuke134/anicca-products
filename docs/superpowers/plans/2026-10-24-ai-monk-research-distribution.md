# AI Monk Database・Plugin・Factory実行計画

## 目的・範囲・完了条件
既存のDatabase/6tool CLI・Pluginを土台に、profile/product/revenueの根拠を拡充し、ChatGPT掲載のidentity gateで待ち続けず、収益性を検証できるcloud Factoryへ進む。正式marketplace掲載は各providerの審査条件が揃った時点で再開し、USD10K MRRは未達の事業目標として追跡する。要件の正本はfield-guide末尾「Database・Plugin・Factoryの追加契約」。通常判断はprimaryが実行し、承認待ちや固定stageを追加しない。brainstormingの承認質問はDaisの明示No-human-loopと詳細指定へ置き換える。Stripe実装時は既存Checkout/Billingを再利用し、既存runtimeの日次effect/ownerは触らない。

## 順序と現在cursor
現在cursorはZen Muun counter batchのDB-1 v0.4.17 public release。source差分とローカルacceptanceは完了し、75 archive/73 public/229 sources/114 offersを固定mainからWeb/CLI/MCPへ揃える。5件はseller-displayed counter claimであり、注文・売上・利益に換算しない。Factoryの直近確認では画面の「preparing to open」とbutton disabledはAPI readiness gateによる。Netlify productionには58変数があるが`MONK_FACTORY_*`は0件であり、click handlerの故障ではない。Gemini専用projectは未課金、HeyGen walletはUSD0、Upload-PostはDefault plan/limit 2、全社hard spend capも未設定なので、生成/接続/Checkoutを有効化しない。旧cursorはDB-1 residual source batch。順序変更の理由はsource acceptanceを終え、DB/CLI/MCPの固定main公開へ進む一方、Factoryの実生成・顧客接続は個別provider準備と支出上限が不足しているため。

SaaS-1はPR #686 head `53c09618fe6cbe733e334cf0d032c809ad46b187`、CI `40100777243` SUCCESS、merge `28fc06ecdd79377e19b1eed734922da468d46284`。Supabase migration `20261024140729 monk_factory_capacity_intent`適用済み。Netlify Deploy `40101137159`/post-deploy smoke SUCCESS、published deploy `6adcbc9e5d86f3902f2e08ed` ready。Factory固有のNetlify env変数が0件である公式readback、3本無料/no-trial release → ../../evidence/ai-monk-factory-free-three-release-20261024.json。

新しい順序はDB-1 residual→SaaS-2再開。現cursorではsourceを拡大し切ったと偽らず、profile/product/offer/revenueを根拠付きで追加する。SaaS-2はGeminiの公式model GETが200で必要な2 modelを返すが、credential SSOTでは専用project `prepared_unfunded`/`billing_verified=false`。HeyGen公式`GET /v3/users/me`は200・wallet USD0、Upload-Post公式`GET /api/uploadposts/users`は200・Default plan・0 profiles・limit 2。どの確認でも生成/プロフィール作成/投稿/課金は0。Factoryの利用者quota USD4.25/70は会社全体hard spend capではない。API keyなどの秘密値はこのplanへ書かない。読み取り専用readback → ../../evidence/ai-monk-factory-provider-readiness-20261024.json。

2026-10-24T14:44:21ZのNetlify公式production readbackでは、環境変数58件中 `MONK_FACTORY_*` は0件。最新production deploy `6adcc0c0d29df2fc313aa4d6` はreadyで14:29:52Z公開、`commit_ref` はnull。公開URLの取得結果は3本無料・20秒・カード不要・期限なしを表示する。添付された21:31 JSTの画面はこのdeployより前で、deploy後の認証済み画面は未観測。現mainは `MONK_FACTORY_ENABLED` とjob/provider readinessが不足すれば生成/Checkoutを止めるため、無効ボタンはclick-handler不具合ではなく未設定APIのfail-closed状態である。環境・設定・生成・Checkout・投稿の変更は0。readback → ../../evidence/ai-monk-factory-readiness-recheck-20261024.json。

2026-10-24T15:04:12ZにNetlify production env/deployを再readback。58変数、`MONK_FACTORY_*` 0件。最新deployは同じ`6adcc0c0d29df2fc313aa4d6`、ready、14:29:52Z公開、`commit_ref=null`。添付21:31–21:32 JST画面はこのdeploy前。公開ページは期限なしの3本無料を表示するが、最新deploy後の認証済み画面は未取得。ReelFarmの現行公式ページは3 TikToks無料、automation作成→TikTok接続→毎日の自動生成/投稿、analyticsを掲げ、Growth/Scale/EnterpriseにAPI accessを記載する。Factory envは0件なので生成・Checkout・socialのボタンはreadiness gateによりdisabledで、クリック故障ではない。env変更、生成、接続、投稿、決済は0。readback → ../../evidence/ai-monk-factory-readiness-recheck-20261025.json。

2026-10-24T15:25:20ZのNetlify公式production readbackでは環境変数58件、`MONK_FACTORY_*`は0件。最新deploy `6adccb4b7e7dd5fa6b820179`はready、15:14:56Z公開、`commit_ref=null`、titleはmain merge `46e8a672e8d0030ed94b993b95739aefc6200cb4`。公開ページは期限なしの3本無料・20秒・カード不要・USD199/月を表示し、StudioにはCheckout/new generation unavailableの状態を出す。添付screenの日付は読み取れず、deploy後の認証済み画面は未観測。コードではgeneration/social/checkoutのreadinessがfalseなら各buttonをdisabledにし、APIもactionを503で拒否するため、画面をクリック可能にするだけでは動作しない。production設定/生成/接続/投稿/決済の変更は0。詳細 → ../../evidence/ai-monk-factory-button-readiness-20261025.json。

### DB-1 completed source batch
Yang Munの販売者本人が公開する商品カタログを調べ、重複しないeBook/digital offersのうち、商品ページでUSD価格・variant・デジタル配送が確認できるものだけを現在観測として追加する。購入、注文数、売上は未確認のままにする。無料PDFへの直リンクや$0 placeholderなど、支払要件を確認できない商品は有料offerへ数えない。売上counterを再利用・重複追加せず、従来のclaim/revenue observationsを変更しない。各追加に一次source URL・確認日・variant IDを持たせ、source acceptanceと公開snapshotを揃えてからreleaseする。

このsource batchで19 ebook/ebook bundleと4 audiobook/audiobook bundleのUSD表示価格、exact variant/product ID、digital delivery evidenceを照合し、catalog JSONと23の商品ページの24 source rowsを追加した。canonicalは75 profiles/224 sources/114 offer rows、Yang Munは29 offers。既存offers、creator claims 4件、revenue observation 1件、seller counters 4件を保持。orders/revenueはunknownのまま。source receipt `../../evidence/ai-monk-yangmun-digital-catalog-20261024.json` はcatalog raw SHA-256と一致し、package test 16/16 PASS。v0.4.16 public release/Registry receipt → `../../evidence/ai-monk-cli-mcp-v0416-release-20261025.json`。

### DB-1 current unit: Zen Muun seller counters
目的は既存のZen Muun候補に結び付く公開5ページで、商品・会員のseller-displayed counter claimsを追加し、CLI/MCP/Webで出典と未監査statusを保持すること。scopeは`/`・`/alimentos`・`/tiempo-para-sanar`・`/camino`・`/comunidad`の公開HTTP responseと既存profile routeのみ。新しいprice/offerは、明示価格が確認できない限り追加しない。seller countersは実注文・売上・利益と区別し、overlapping countsを合算しない。`paid_orders`、`revenue_observations`、`creator_claims`、`ai_status`、`directory_scope`、creator identity/ownershipは変更しない。acceptanceは5 URLのfresh body hash/claim/source mapping、最小一時assertion RED→GREEN、既存package/render/JSON tests、v0.4.17のfixed-main Web/CLI/stdio MCP/HTTPS MCP/Registry同一snapshot受入。ログイン、checkout、購入、投稿、Factory/provider変更は0。

SOURCE/DATA受入: 5ページからsite-wide reader 10,000+ (scope unclear)、Alimentos reader 500+、Tiempo de Sanar seller-claimed purchases 7,000+、El Camino reader 2,782、Comunidad members 500+を記録する。5 source rows追加、75 archive/73 public/229 sources/114 offers。Zen Muunの既存4 offer価格は全てunknown、revenue observation 0、AI status/directory scope/identityは不変。source receipt → ../../evidence/ai-monk-zenmuun-seller-counters-source-20261025.json。v0.4.16のfixed-main/Registry受入 → ../../evidence/ai-monk-cli-mcp-v0416-release-20261025.json。Factoryのボタン/readiness一次readback → ../../evidence/ai-monk-factory-button-readiness-20261025.json。

この計画の下位節には過去の作業結果と当時のcursorを履歴として残す。現在の実行順とcursorはこの節およびTODOを正本とし、過去のcursor記述で上書きしない。

添付画面ではPersonal/Default projectのDeveloper identityが`Identity in review`で、Persona完了画面も表示される。OpenAIの[submission guide](https://developers.openai.com/plugins/deploy/submission)はorganization verificationを完了してverified Developer identityを選ぶ手順を示し、[MCP review requirements](https://developers.openai.com/plugins/deploy/app-review)は正式提出前のidentity verificationを要求する。従って、この画面のorganizationから正式reviewへsubmitできる状態ではない。Personaの完了とOpenAI側の`Verified`は別状態である。[Verification FAQ](https://help.openai.com/en/articles/10910291-api-organization-verification)は反映に時間がかかる場合があるとして、同じaccount/orgの確認、refresh/reopen/sign out/inを案内する。個人は一つのaccountまたはorganizationだけで確認でき、結果は手動overrideできない。再確認、Business切替え、新account作成はしない。以前のappeal-denied receiptは別のaccount固有証拠であり、この画面とのidentity一致や復旧を示さない。OpenAIのplugin directoryはChatGPTとCodex両方のdiscoverabilityを提供するが、repo/Registry上のCodex配布はdirectoryのreview・approval・publishとは別である。[Guidelines](https://developers.openai.com/plugins/plugin-guidelines#commerce-and-monetization)はdigital products/services、subscriptions、content、creditsの直接/間接販売、freemium upsell、価格・trial・promotionの宣伝を認めないため、OpenAI掲載版は独立価値のある無料research pluginとしFactory/ebookの課金導線を置かない。

MuseはOpenAI identityと独立したsubmission/reviewである。[Muse公式docs](https://platform.muse.ai/docs)はbusiness verification、data processing questionnaire、integration credentials/tool documentation、reviewer用test account/demoを要求し、Approved connectorsだけがMuse内でdiscoverableとする。Muse toolがsensitive writeに分類された場合は各実行で承認が必要で、Always allowにできない。SNS publishがsensitiveに該当するかはMuse reviewの判断であり、Muse Connector上の無人投稿は約束しない。既存portalの最後の保存済みreadbackはBusiness Approved、Data processing/Integration credentials In reviewだが、今回portalは再読していない。Grokの[Connectors](https://grok.com/connectors)公式ページはfavorite toolsの接続口を示すが、取得できた公式情報ではpublisher directory申請手順を確認できない。Custom接続のreadbackと公式directory掲載を別扱いにする。これらprovider gateは非blockingであり、Database/CLI/Plugin/Factoryを止めない。

## 4つの成果状態

- Databaseの大規模AI Monk index: 公開済みv0.4.16は73 public profiles/75 archived records/224 sources/114 offer rows。v0.4.17 source candidateは5 seller-displayed countersと229 sourcesを含むが、まだ未公開。source coverageを継続し、世界最大・全網羅は主張しない。
- 日次IG/TikTok運用: ownerはGrok Bot。Dais提供のPostiz integration IDはTikTok `cmo5rwq2p00twn10yrsdglng3`、Instagram `cmoopzaak04yop70y1yx1bwr1`。これらはユーザー提供IDであり、この計画更新で接続状態や投稿実績をreadbackしていない。Codexは日次投稿effectを変更・再送しない。
- eBook + AI Monk事業でUSD10,000超MRR: 未達の事業目標。Stripeのpaid recurring invoiceから測り、eBookの一回払いをMRRへ混ぜない。
- 無人運転AI Monk Factory: 未完。Instagram OAuthを一度行った後に既定avatar/profile/scriptを選び毎日自動生成・投稿する。完成動画3本を期限なし/カードなしで無料とし、3日trialは採用しない。利用者はprofile編集・停止ができ、TikTokは公式audit後に追加する。

## 作業履歴

先行の専用account限定作業はDaisの「Go fix」に基づく復旧・審査対応。範囲・旧順序→新順序・受入の正本 → 2026-10-24-ai-monk-marketplace-resolution.md。OpenAIは既存同caseの最終却下を再取得し、復旧通知は確認できない。Museは今回native URL入力からの実ページ遷移を確認できず、最新審査状態は未取得。過去の審査中を今回の観測へ置換しない。公開MCPの実SDK6toolは正常で、設定変更・再申立て・再提出0。結果 → ../../evidence/ai-monk-marketplace-resolution-20261024.json。正式掲載の未完を保持し、独立したDatabase/CLI/plugin配布を継続する。
独立並行の既存書籍X配布はKeio提出の現在cursorを置き換えず、日次Grok所有effectや送信済み作用を重複させない。状態・証拠・残TODOの正本 → 2026-10-24-ai-monk-book-x-funnel.md。

独立して受入済みのDatabase/CLI v0.4.13は73公開/75archive/196出典、商品・サービス観測archive91行/公開88行で、公開JSON/Web・固定main Release・公開URL導入/CLI・実stdio/HTTPS MCP各6tool・公式Registry active/isLatestの同一snapshotを確認する。公開Webは73card/71画像を維持する。Yangjunの11サービス価格は50/75/100/120 USDのseller表示で、課金周期・注文・売上は未確認。Yang Munの既存通貨観測を含む旧195出典/80offerは保持する。公開受入 → ../../evidence/ai-monk-cli-mcp-v0413-release-20261024.json。Database→CLI/plugin→Factoryの優先順と日次Grok所有境界を維持し、Factoryの有料billing・実生成・利用者IG接続/投稿・metrics・USD10K MRRを未完として追跡する。

## 先行する実行順の更新（履歴）
旧順はDatabase v0.4.15公開後にDB-1 residual→Plugin品質準備→Grok接続確認→Factoryだった。新順はFactory SaaS-1→DB-1 residual→Plugin walkthrough/Grok接続準備とする。理由はFactoryの生成・Checkout操作がglobal ready gateで無効で、free quotaがtrial/subscriptionに結びつき、画面にも3-day trialが残っているため、収益プロダクトの提供ブロッカーを先に解く。v0.4.15の公開を完了したため、現在cursorをSaaS-1へ進めた。完成動画3本を認証userごとに期限なし・カードなしで無料とし、Stripe trialは作らず、3本消費後にsubscriptionを案内する。generation/billing/social readinessは別々に判定し、無料生成をCheckout設定の有無だけで塞がず、未準備のproviderを利用可能と偽らない。productionの不足env/provider状態は未読取のままなので、専用支払元・予算・生成権限・公式Instagram接続を実測するまでは本番生成/投稿をenableしない。OpenAI/Muse審査は独立gateとし、Grok Botの日次投稿はownerのまま変更しない。ChatGPT掲載版は無料read-only research valueを維持し、ebook/Factoryの課金導線を置かない。

## 公開後の実行順更新
旧順序はPR #686のsource受入→PR/CI→merge→migration→Netlify deploy→provider setup。これらsource/release作業は完了した。新順序は専用providerの支払元/モデル権限と全体spend cap→生成runtime→Instagram公式OAuth/publishing→3本freeの実動画受入→3本後のCheckout/metrics→Factory告知。理由は本番env APIにFactory設定が0件で、ボタンが未準備状態として無効であり、生成/投稿を有効化する費用・権限・総額上限が未確定なため。準備中はDB/Pluginの独立TODOを進めても、日次Grok Bot/Postiz所有postingは変更しない。

## TODO
- [x] DB-2: v0.4.14の公開JSON/Web/CLI/stdio/HTTPS MCP/Registryで同一snapshotを受け入れ済み。公開ページは73件、source archiveは197 sourceを返す。
- [x] DIST-1: Database/PluginのX告知1件とGrokへの配布依頼1件を送り、readback済み。
- [x] COST-1: ReelFarmの公式ページで3本無料・アカウント接続・毎日の自動生成/投稿・分析導線を確認。2026-10-24再取得ではGrowth USD49/100 slideshows、Scale USD95/250、Enterprise USD195/750とAPI access表示を観測。以前のページ取得時に価格表示がなかった履歴は保持する。AI動画原価・実収益/転換率は別途受入する。参照: https://reel.farm/。
- [x] DB-1 batch: Master Kaizenの2026-10-24 follower/video metrics sourceを追加し、AI状態・pending scope・売上unknown・旧metricsを保持。canonical 75 records/197 sources。source receipt acceptance RED→GREEN、package15/helper9、JSON/reference/diffをPASS。
- [x] DB-1 local batch: Maitre Yun/SifuChen Californiaのfirst-party Reel pageとprofile timelineを取得し、各投稿のInstagram AI content labelを記録。SifuのReel caption says matcha while linked Amazon ASIN resolves to dog omega-3; product/creator relation/commission/price/orders/revenue are unknownで、offerへ誤帰属しない。2 included、ai_status=reportedのまま、75 archive/73 directory/200 sources。source test RED→GREEN、package16/helper9 PASS。公開前snapshot → ../../evidence/ai-monk-profile-reels-source-20261024.json。
- [x] CLI-1: PR678/main `8ceeaaa17e6d6b6e521edab729cd777c822a8468`、main package CI/Netlify deploy+smoke PASS。v0.4.14 fixed-main Release、public JSON byte/hash、73-card Web、public release install/CLI、stdio/HTTPSの6tool、Registry active/isLatestを同一snapshotで受入。証拠 → ../../evidence/ai-monk-cli-mcp-v0414-release-20261024.json。
- [x] PL-CODEX-1: Codex向けportable Plugin v0.1.3とMCP Registryは公開済み。公開installをChatGPT Directory掲載・販売・Factory利用可能状態とは扱わない。
- [x] DB-1 release: main `acff973cfb8740407a4c735d3992d0f3a6a081d1`, CI PASS, production deploy 40096420806 SUCCESS, GitHub Release `ai-monk-index-v0.4.15` public with asset SHA-256 `783d140f758199e7ccc48a72f7276b9354ac356f0a4d769e998e55610900d45e`, and official MCP Registry workflow 40096908757 SUCCESS. Public page returned 73 profiles; public JSON has 75 account records/200 sources and matches canonical SHA-256 `3ae2ecb91ee198b69f1c736ad66c184695d44bfb88d9b453195668b2f7ee57a6` after removing the transport-added trailing newline. The downloaded release tarball installed in an isolated prefix and `ai-monk-index stats` returned the same snapshot/counts. Registry readback is version 0.4.15, active, isLatest=true. Full receipt → ../../evidence/ai-monk-cli-mcp-v0415-release-20261024.json.
- [x] SaaS-1: PR #686の3本生涯無料/no-trial、readiness分離、Stop-safe OAuth、legacy test修正をmainへ反映。Factory 60 tests pass/30 DB cases skipped without fixture、isolated Postgres 30 pass、PR CI 40100777243 SUCCESS、migration 20261024140729適用、main deploy/post-deploy smoke 40101137159 SUCCESS。Netlify published deploy 6adcbc9e5d86f3902f2e08edはready。公開ページの無料3本・カード不要・期限なしを確認。証拠 → ../../evidence/ai-monk-factory-free-three-release-20261024.json。SaaSの実利用開始は未完。
- [x] DB-1 source batch: Yang MunのUSD表示価格とvariant・digital deliveryが照合できる19 eBook/eBook bundle・4 audiobook/audiobook bundleを追加。75 profiles/224 sources/114 offer rows、既存claim/revenue/counters/offer observationsを保持。catalog SHA-256、source receipt、package test 16/16をPASS。
- [x] DB-1 release: PR #690 head `78e5188fe28e127dc5cc01975c41b9a68ff1b9a6` merged as main `46e8a672e8d0030ed94b993b95739aefc6200cb4`; all 3 PR checks PASS. GitHub Release `ai-monk-index-v0.4.16` targets that main commit; asset SHA-256 `07c3082817ae582518faa8d992567d278d4357eb6505d3390b1858c177199c44`. Netlify production deploy `6adccb4b7e7dd5fa6b820179` is ready. Public JSON, isolated Release CLI/stdio MCP, live HTTPS MCP stats/get, and Registry metadata match canonical snapshot SHA-256 `a623d9358dad0f3ba703b58298bb1192cc1549fb719ec2f9335b86aafd882cc4`; 75 archive records, 73 directory profiles, 224 sources, 114 offers; Yang Mun has 29 offers. Registry version 0.4.16 is active/isLatest. Receipt → `../../evidence/ai-monk-cli-mcp-v0416-release-20261025.json`.
- [x] DB-1 residual source batch: Zen Muunの5 first-party page counter claimsを追加し、5 source/5 seller_counters、75 archive/73 public/229 sources/114 offers。4 prices unknown、paid orders/revenue/profit observation追加0。temporary assertion RED→GREEN、package 16/16とdirectory helper 9/9 PASS。landing render testはworktreeにReact依存がなくimport時点で実行不可。receipt → `../../evidence/ai-monk-zenmuun-seller-counters-source-20261025.json`。
- [ ] DB-1 v0.4.17 public release (current): publish fixed-main snapshot 75/73/229/114; verify the same data/hash through Web/JSON, released CLI/stdio MCP, HTTPS MCP and official MCP Registry.
- [ ] DB-1 residual: continue dated creator product/checkout/revenue evidence batches; keep seller claims, listed prices, paid orders, revenue and profit separate and preserve unknowns.
- [ ] SaaS-2 (external readiness): Netlify official GET at `2026-10-24T15:25:20Z` returns 58 production variables and zero `MONK_FACTORY_*`; latest deploy is ready. Provider prerequisites from their last authoritative reads/SSOT are Gemini dedicated project unfunded/billing unverified, HeyGen wallet USD0, Upload-Post Default plan/limit 2/no white-label, and Stripe catalog prepared/runtime disabled. Factory job secret is prepared in SSOT but not deployed. Per-user USD4.25/70 reservations are not a company-wide hard spend cap. Keep generation disabled until dedicated provider funding/permissions, production runtime configuration, and a company-wide cap are in place. Instagram requires a customer-scale official API/OAuth path and any required review; Checkout requires fixed Price/live mode/webhook/portal. Button diagnosis/evidence → `../../evidence/ai-monk-factory-button-readiness-20261025.json`.
- [ ] PL-PREP-1: The v0.4.17 release carries direct Zod 4.6.7 in both CLI/MCP and hosted landing app, and the CLI/MCP package audit is clean. The last full landing-app audit reported 107 findings (5 low, 32 moderate, 68 high, 2 critical); seven optional nested wallet-SDK peer entries use zod@3.25.76. Review findings reachable from Factory OAuth/billing before enabling those paths. Then confirm the free read-only research Plugin has 5 positive/3 negative cases, fix the two known negative explanations, and prepare a real Plugin walkthrough URL. Directory listing copy must not include prices, subscriptions, free trials, promotions, or ebook/Factory upsells.
- [ ] GROK-1: `https://grok.com/connectors`を現行の公開entry pointとして記録する。匿名で読める公式情報ではpublisher listing/submission flowもCustom MCPの画面手順も確認できなかったため、Custom接続を確定した操作として案内しない。Grokの実際の接続UIをread-onlyで確認してから簡潔なuser setup guideを作る。connectionとdirectory listingを区別し、Grok Botの日次投稿は変更しない。
- [ ] PL-FACTORY-1: Factory API稼働後、既存CLI/Pluginから自動運転の作成・停止、job状態・metrics取得を追加する。tenant認証を必須にし、SNS tokenはserverに保持する。接続時の一度限りのOAuth同意のみFactory Webへ渡し、その後の日次処理はAPIで行う。
- [ ] PL-1 (external gate, nonblocking): この添付のPersonal/Default projectが`Identity in review`の間はformal Directory reviewへsubmitしない。Persona完了画面はOpenAI側のVerified readbackではない。同じaccount/orgでOrganization settingsをrefresh/reopenし、必要ならsign out/inして反映を確認する。なおpendingならHelp Centerで正確なstatusを検索し、flowにretry/appealが表示された時だけ公式手順に従う。結果はmanual override不可なので、support回答を承認扱いしない。再本人確認、Business切替え、新account作成はしない。`Verified`後、organization ownerまたは`api.apps.write`を確認し、既存ZIPをuploadしてscan/findingsを解決し、5 positive/3 negative cases、review fields、public demo recording、required HTTPS listing URLs/attestationsを揃えて一度だけsubmitする。review Approved後にpublishし、ChatGPT/Codex Directory listing URLを確認する。Codex repo/Registry配布は独立して継続できる。根拠: [submission guide](https://developers.openai.com/plugins/deploy/submission)、[MCP review requirements](https://developers.openai.com/plugins/deploy/app-review)、[verification FAQ](https://help.openai.com/en/articles/10910291-api-organization-verification)、[Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines#commerce-and-monetization)。
- [ ] MUSE-1 (external gate, nonblocking): Museの既存submissionだけを追跡し、再提出しない。最後に保存したportal readbackはBusiness Approved、Data processing questionnaireとIntegration credentialsがIn reviewであるが、今回live portal statusは再取得していない。新規要求が来たら既存submission上で対応し、overall Approved後にMuse内discoverability/listingをreadbackする。Museがsensitive writeに分類する機能は各回承認が必要なため、post toolの分類・scopeを確認するまでは無人投稿の対応を宣伝しない。証拠 → ../../evidence/ai-monk-marketplace-followup-20261024.json。根拠: [Muse Connector submission docs](https://platform.muse.ai/docs)。
- [ ] EVIDENCE-1: Factoryを自社accountで継続利用し、TikTok/Instagramの公式analytics readbackから期間付きviews/reachと投稿実績、Stripe paid invoiceから売上・MRR、provider費用から粗利を別々に取得する。account identity・source・period・currencyを添えて、公開するcase studyは確認済みの数値だけにする。viewsを売上へ換算しない。
- [ ] DIST-2: EVIDENCE-1後、観測済みの成果だけを使いXで告知し、Grokへ配布協力を依頼する。既存Grok Botの日次投稿はそのownerに任せ、未確認views/収益/MRRや利益保証を主張しない。
- [ ] REVENUE-1: 実際のStripe paid invoice、refund、cancelを用いてRecurring MRRを測り、ebookのone-time salesは別集計する。ebookとAI Monk事業のUSD10,000超MRRは未達の目標として追跡し、followers、creator claims、install数から換算しない。
- [ ] MOBILE-1: web funnelで継続利用と有料需要を確認した後にiPhone appを検討する。

## 境界
調査・配布段階の新規契約/top-upは0。Factoryのprovider設定と実生成は採用した原価/予算契約と支払元の実確認を満たす範囲で行い、Grok共有walletへfallbackしない。既存creditとspend-capを守る。無料提供は期限なしの完成artifact3本で、time-based trialやカード登録を置かない。3本で自動生成/投稿を止め、subscription後に再開する。個人wallet/口座資金移動、既存loop restart、未完effect再送、shared credential複製は行わない。Factoryの本番価格は実原価・provider費・失敗/再試行費から決める。MRRとone-time ebook salesを混ぜず、架空の利益/注文を置かない。

## 取得済み証拠
- docs/evidence/ai-monk-profile-audit-20261024.json — 67profileのUI観測と未取得境界。
- docs/evidence/ai-monk-product-research-20261024.json — 15site/13取得成功/20商品、18価格/2価格unknown。
- docs/evidence/ai-monk-factory-unit-economics-20261024.json — HeyGen APIとReelFarm公開料金の区別、生成原価と未確認。
- docs/evidence/ai-monk-factory-heygen-alternative-20261024.json — Full Video Agentの設定上限での動画費と既存予算を比較し、代替採用/追加購入0を記録する。

Databaseのpackage metadata/READMEはv0.4.7へ揃え、新しいmain固定入力のReleaseとして配布済みとする。既存Releaseを変更せず、公開JSON/Web/MCP・URL導入・実stdio6toolとRegistryの同一snapshotを受入する。GitHub Releaseロックはimmutable=falseのまま記録する。証拠 → docs/evidence/ai-monk-cli-mcp-v047-release-20261024.json。

## 配布口と下位ルールの更新
OpenAI公式submission guideはVerified Developer identityとownerまたはApps Management Write権限を求める。Persona完了だけではOpenAIのIdentity in reviewをVerifiedへ変えず、正式submit前のgateは未通過。Verification FAQは状態反映に時間がかかる場合に同じaccount/orgの確認とrefresh/reopen/sign out/inを案内し、個人は一つのaccount/orgだけで本人確認できるとする。Plugin guidelinesはChatGPT Directoryでdigital goods/services・subscription・contentの販売、freemium upsell、価格やtrialの告知を禁じるため、Pluginは無料で独立価値のあるread-only research toolとして維持し、Factory/ebookの有料導線をChatGPT内に置かない。初回MCP reviewは5 positive/3 negative case、review information、walkthrough video、scan、attestationを要する。既存v0.1.3 ZIPには5/3 casesとpublic demo URLがあるが、negative 2の説明とexecution-log replay demoをreviewer向けに整える。

Museはsecurity/privacy/integrity risk assessment、tool review、end-to-end QA後にapproved connectorをdirectoryで発見可能にする。最後に保存された既存submission readbackはBusiness Approved、Data processing/Integration credentials In reviewであり、承認とlisting URLは未確認。xAI公式資料は利用者がgrok.com/connectorsでpublic Custom MCPを接続する方法を示すが、publisherのpublic directory submit/review/listing flowは記載しない。これは現行資料からの判断であり、別の公式掲載手段があるとは推定しない。ReelFarmの現行public pageは3 TikToks free、TikTok接続、日次生成・自動投稿、analyticsを示す。今回のpublic page retrievalではpaid plan pricesを確認できないため、過去の価格メモをcurrent priceとして使わない。Instagramはprofessional Business/Creator account、publish permission、他社user向けAdvanced AccessのMeta App Review/Business Verificationが要る。TikTokはregistered app、`video.publish`承認と利用者認可、public posting用app auditが必要で、audit前の投稿はprivateに制限される。Instagram LoginではFacebook Page連携を避けられる。参照: [OpenAI submission](https://developers.openai.com/plugins/deploy/submission)、[OpenAI verification](https://help.openai.com/en/articles/10910291-api-organization-verification)、[OpenAI Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines#commerce-and-monetization)、[Muse Connector docs](https://platform.muse.ai/docs)、[Grok Connectors](https://docs.x.ai/grok/connectors)、[ReelFarm](https://reel.farm/)、[Instagram overview](https://developers.facebook.com/docs/instagram-platform/overview/)、[Instagram content publishing](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/)、[TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started/)。
正式Muse Connector Platformの既存submissionは3/3 requirementsの受付済み。最後の公式readbackではBusiness verificationはApproved、Data processingとIntegration credentialsはIn reviewで、connector全体の承認とlisting URLは未確認。xAI公式Connectorsはpublic Custom MCPへの利用者接続を説明する。user connectionとpublisher listingを区別する。MCP Registryはremote-only/OIDC公開を完了し、v0.4.14のactive/isLatestを確認する。

LM docs/team/README.md・RULES.md・WORKFLOW.mdの無料trial禁止と矛盾しないよう、本Factoryは時間trialを設けず完成artifact3本を無料にする。既存の他商品/日次loopの課金設計は変更しない。

MCP Registryの公開契約とsource受入 → 2026-10-24-ai-monk-mcp-registry.md。公開effectとreadbackの証拠 → docs/evidence/ai-monk-distribution-status-20261024.json。既知profile/productの拡充は続き、全世界の全件網羅や全収益監査を達成扱いしない。

Netlify AI Gatewayは現accountの公式GETで利用不可を確認する。team共通creditと通常AI上限の適用範囲も独立Factory予算の代替にならないため、plan/課金/設定/生成を変更しない。代替調査 → docs/evidence/ai-monk-factory-netlify-gateway-preflight-20261024.json。

## 未確認profileと配布口の限定followup

専用OpenAIの正規アクセスとMuse審査は外部状態の未完条件として保持し、同じ認証失敗の再試行や重複提出を行わない。このunit開始時はSaaS-1のprovider利用準備がcursorであり、このunit内でDB-1のsifuchen-california/master-kaizen-tiktokの2件とPL-1の公式カタログ入口確認へ進めた。理由はproviderが公式401/account_deactivatedで非retryableの一方、既知profileの公開一次資料と配布仕様は無料・read-onlyで精査できるため。全体のFactory/収益成果と既存TODOは縮小せず、日次IG/TikTok/Postiz/HeyGen/Grok loopのeffectを変更しない。

- [x] 2profileの既存canonical/discovery/auditを比較し、native handle/画像/公開商品を追加できる一次根拠を限定取得する。同名の別personaとの同一性、AI制作、売上を推測しない。未取得なら実際に確認した出所と不足を残す。古いbatch対象外という理由を、現在のprofile項目が必ず欠落しているという意味へ流用しない。
- [x] OpenAI公式docsを実取得し、GitHub repo marketplaceでの直接配布とChatGPT/Codex共通の正式Plugin directory/提出フローを区別する。Museの既存submissionとGrokの既存依頼はread-onlyで確認し、受付/審査/承認/配布receiptを分ける。新しいlogin、submit、依頼、X投稿はこのunitに含めない。
- [x] 公開sourceによって確定できるdata差分があればcanonicalと呼び出し先を揃え、既存の関連検証、必要なreview/CI/main由来公開まで進める。sourceが増えた場合だけ次のCLI/Registry snapshotを作り、v0.4.7のReleaseを上書きしない。data差分がない場合は現在のv0.4.7/180sourceを維持し、限定調査と現在状態のreceiptを正本へ反映する。

所有はprimaryがmaster/source/公開受入、read-only workerが2profileのprivate調査証拠とする。repo/worktreeの他者編集を上書きせず、保護storeを削除・移動しない。限定unitの完了を全世界の全件把握、正式カタログ承認、Factory稼働、売上達成へ換算しない。

SifuChenの取得結果ではnative URL/canonical/@handleが一致し、本人bioのAI自己表示、丸め表示834K followers、プロフィール画像を確認する。ai_status=reported/directory_scope=pendingを維持し、動画形式・creator・商品現況・監査済み売上へ拡張しない。bioのSpanishと投稿音声言語を区別する。この1profileと画像出典を更新し、他74recordsと旧180sourcesは保持した181source snapshotをv0.4.8のWeb/CLI/MCP/Registryへ反映する。Kaizen oEmbedは汎用応答のためcanonical sourceを増やさない。画像は既存Maldita screenshotからnative avatarの元bytesへ切替え、公開画像件数は増加させない。root/master/README/manifestの現在版だけを揃え、旧Release/証拠は保持する。

独立source reviewでbio限定言語の根拠がWeb表示から落ちることを確認する。bioを根拠とする言語はカード上に「profile bio; spoken language not audited」を表示し、言語filterのlabelは維持する。focused render回帰で実assertionのRED→GREENを確認し、修正headのCIを受入する。

最終docs unitはmain c4bd859c48cfc879b37f056d9e97aa2fb887952d由来の専用branch docs/ai-monk-v048-publication-20261024で、v0.4.8公開receipt、限定HeyGen料金調査receipt、本planとfield-guideの現在pointerだけを更新する。公開URL導入・stdioは非author検証、Web/JSON/画像/HTTPS MCP/Netlify/Registryはprimaryの実readbackで区別する。既存の公開artifact・旧receipt・source・認証・課金・日次effectを変更しない。参照hash/JSON/diffと既存PR checksを確認し、commit/push/remote一致・main統合まで完了する。

公開受入はPR642/main c4bd859c48cfc879b37f056d9e97aa2fb887952d、CLI v0.4.8 Release422387165/asset670678777、Web73件/画像71件/181出典、公開JSON元bytes、実stdio/HTTPS MCP各6toolの同一snapshotで完了する。Registry40038988033 SUCCESSとexact GET active/isLatestを確認する。独立source reviewのbio言語表示指摘は1回のfocused RED→GREENと最終head CIで修正し、公開artifact/URL導入/CLI/stdioは非author検証PASS/Blocking0とする。sourceの初回reviewと修正後の検証は区別し、追加source再reviewは主張しない。証拠 → ../../evidence/ai-monk-cli-mcp-v048-release-20261024.json。旧v0.4.7とPlugin v0.1.3/既存demoの証拠は保持する。

HeyGenの追加料金調査 → ../../evidence/ai-monk-factory-heygen-prompt-rate-followup-20261024.json。Photo Avatar作成1.32USD/call、Avatar IV Photo2.31USD/min、TTS0.12USD/minを公式料金表で再確認する。type=promptの総料金対応と独立台本生成・hard durationは未確認で、仮にavatar1.32USDならtrialの動画/TTS/avatarは3.75USD、36attempt月は66.93USDとなるが台本費前の条件付き算術である。既存4.25USD/70USD上限は変えず、このendpointをFactory全体の代替として採用しない。

この限定followupは完了し、現在cursorはPL-1の専用OpenAIの正規アクセス復旧/正式提出・Muse審査と、SaaS-1の独立provider予算・実生成・本人接続の受入とする。外部状態の未完を無料配布や公開データ更新で閉じず、同じ非retryable認証失敗・提出・投稿を再送しない。日次IG/TikTok/Postiz/Grok所有effectは変更0。

## Factory専用providerの限定preflight

目的は専用OpenAIの非retryable無効化と独立に、元のFactory生成要件と既存予算を満たせる経路を確かめること。Database→Plugin→Factoryの順と未完成果は維持し、現在のSaaS-1内cursorを画像・台本providerの限定read-only preflightへ進める。Full Video Agentは既存cap超過のため再採用しない。単なる支払元不足を理由に高額な別方式へ切り替える判断は維持して棄却する。

既存の画像→台本→TTS→Avatar IV→本人IGの呼出経路・予算/尺/attempt制御をコードで確認する。最初の候補はGemini台本＋HeyGen画像であるが、公式HeyGen Image契約はidentity/reference画像を必須とし、入力ゼロの最初のavatarを作れない。この根拠により候補をGemini Developer APIの台本＋画像へ絞る。公式料金・無料枠/課金条件・構造化出力・入力データ条件・専用project/keyの可否を調べ、旧GPT原価を無料へ置換しない。共有Grok/既存顧客のkeyやwalletへのfallback、OpenAIの別account作成、日次loopの変更はしない。

このunitは新規project/key作成・支払い・生成・本番設定変更を含めず、完了条件は実コードと公式一次資料から、採用可能な最小経路または不足条件を具体化して正本へ反映すること。成立した経路の実装・専用認証・実費/生成受入は同じSaaS-1の次の作業として続ける。無料枠の存在だけで本番生成・採算・正式Plugin掲載の達成としない。専用OpenAIの正式復旧条件はPL-1に残す。

並行するsource修正は、code探索で判明した完了済みCheckout再開の1件に限定する。APIのcheckout応答がcomplete=trueなら外部redirectをせず同じ認証sessionの状態を再取得し、未完Checkout・portal・IG接続のURLは既存のprovider別HTTPS検証を維持する。既存client helperと直接UI呼出元・型・最小回帰だけを更新し、新しい抽象やテスト基盤、後方互換層を作らない。実assertion RED→GREEN、必要な既存検証/CI、main由来Web反映まで受入し、実決済済みとは呼ばない。生成providerの採用・budget・enable flag・実effectを変更しない。

限定preflightの一次資料と条件付き原価 → ../../evidence/ai-monk-factory-gemini-provider-preflight-20261024.json。Gemini 3.1 Flash-Liteの台本と同Imageの1K portraitを次の実装候補に選ぶ。画像modelに無料枠はなく、専用の有料Cloud project/key・支払状態・モデル権限は未確認である。利用条件上の18歳未満対象の禁止と有料データ取扱い、project capの処理遅延も実装/利用準備に反映する。既存price/quota/reservationを変更せず、正確なREST/MIME/token契約・専用課金準備・実生成を次に受入する。現時点のsource/runtime採用・入金・生成は0で、PL-1のOpenAI正規復旧条件を削除しない。

Checkout sourceは4fileの最小修正で実RED→GREEN/client7件を確認する。任意の全体noEmitは別領域6診断でexit2、baseline比較は未確定のため合格扱いしない。最終headの既存CIと公開反映はprimaryが受入する。証拠 → ../../evidence/ai-monk-factory-checkout-resume-source-20261024.json。

## Checkout本番反映と次のprovider実装

このdocs unitはmain `9437dd32055a6bb8965f2b8e94b791c40674be9f`由来の専用branch `docs/ai-monk-checkout-provider-result-20261024`で、今回の公開receipt・本planの現在cursor・Factory planのpointerだけを更新する。既存receiptの上書き、新しいsource/認証/provider/runtime/price/quota/enable変更、課金・生成・日次effectは0。JSON/hash/参照/diffと既存PR checks、push/remote一致、main blob一致まで確認する。docs-onlyの追加deployは要求しない。

PR645/head `119b718cc3ad6aa13bc62e10308d94f70b6eb801`はfresh source review SHIP/Blocking0、client7件PASS、Landing CI40040305050 SUCCESSを通し、上記mainへ統合する。main由来Deploy40040724468 SUCCESS、Netlify公式published ready `6adbf0b3dd3542817d78d614`、公開HTML/route JavaScriptのHTTP200と厳密boolean分岐・URL存在時だけredirect・既存host検証の保持を確認する。任意noEmitの別領域6診断/exit2とbaseline比較未確定を保持し、認証付き実Checkout・実請求・生成成功とは扱わない。公開受入 → ../../evidence/ai-monk-factory-checkout-resume-production-20261024.json。

旧SaaS-1 cursorは専用OpenAI復旧をFactory全体の唯一の前提とする。新cursorはGeminiの画像・台本adapter実装→専用有料project/key/支払状態→実費と実生成→本人IG接続/投稿/metricsの受入とする。理由は、公式資料で入力画像なしの1K avatar生成・構造化台本・既存予約内の条件付き原価を確認し、後続のHeyGen/Upload-Post工程を維持できるため。現runtimeの採用状態とは区別し、PL-1のOpenAI復旧・Muse審査は残す。GCPの既存billingを読むCDP操作は、正規lease取得後も共有browser lease要求のtool guardで実行前拒否となる。GCP側のlogin/作成/支払/生成は0であり、provider側失敗とは扱わない。自分のlease解放を確認し、同経路の再試行や保護policy変更をせず、独立して進められるadapter sourceを次に実装する。

## Gemini画像・台本adapterのsource実装

目的はFactoryの画像/台本2箇所を予算内候補のGeminiへ置換し、既存HeyGen/Upload-Post/認証/period予約と再送0を維持すること。所有と受入の正本 → ../specs/2026-10-24-ai-monk-factory-provider-contract.md。新SDK・provider二重実装・quota/価格/SQL変更は0。usageは数値だけを既存evidenceへ残して実費検証の入力にし、出力tokenとthoughtを混同しない。privacyの生成providerと18歳以上向け案内を揃える。専用有料project/key・本番設定・課金/実生成・Factory enableはこのsource unitに含めず未完とする。最小RED→実装→GREEN、fresh money source review、既存CI/main由来公開まで進める。

Gemini adapterの最小RED→GREENはprovider/jobs33件、隔離Postgres25件で確認する。不完全応答でも既知の数値usageとreceiptをeffect_unknown evidenceへ保存し、unknown/欠落を無料へ変換しない。source receipt → ../../evidence/ai-monk-factory-gemini-adapter-source-20261024.json。この初回source時点の未完であるfresh review・修正後CI・main公開は下記production receiptで受入する。旧receiptは書き換えない。

初回f21d025の独立reviewはNO_SHIP/Blocking2で、異常応答ID優先と画像保存障害時の記録保持を修正する。実RED→GREEN/provider/jobs35件PASS。初回CI SUCCESSと旧source receiptは履歴保持し、修正headを独立限定再検証・CI/main公開の対象とする。修正証拠 → ../../evidence/ai-monk-factory-gemini-review-fix-source-20261024.json。

## Gemini公開・未課金準備の結果保存

このdocs unitはmain `505aa8182356e286c586aa9a5f618d8509806f2e`由来の専用branch `docs/ai-monk-gemini-acceptance-20261024`で、新規production/project準備receiptと本plan・provider契約・準備plan・Factory pointerだけを更新する。既存source receiptの上書き、data/package/source/認証/課金/Factory enable・日次effectの変更は0。JSON/hash/参照/diff・既存PR checks、push/remote一致、main blob一致で受入する。docs-onlyの追加deployは要求しない。

修正head `e147e59624dccb351d9902ea345b765337cf838b`は独立限定再検証SHIP/Blocking0・provider/jobs35件、隔離Postgres25件と最終head CI40042813632 SUCCESSを受入し、PR647/main `373eec46af11c0d32566386df7fbd201413b3d5b`へ統合する。Deploy40043161929 SUCCESS、公式Netlify ready `6adbf70525414dfac7733352`、公開page/route chunk/privacy/terms各HTTP200を確認する。commit_ref=nullのためGHA main SHAとdeploy titleで対応付け、公開UI/API実生成の証明へ拡張しない。公開受入 → ../../evidence/ai-monk-factory-gemini-adapter-production-20261024.json。

PR648/main `6c54f3a9a4c4df080174c1d76ddbbaa85a168737`の先行planに従い、専用project `anicca-monk-factory-20261024`とGemini APIだけに制限したkeyを各1回作成する。SSOT exact service1行と保存後2モデルGET200を確認し、独立read-only検証は9項目PASS/Blocking0。billingEnabled=false/未接続であり、paid権限・残高・invoice・生成は未受入。最初の検証側selector不備FAILはprovider call0の履歴として保持し、訂正後PASSは別receiptへ保存する。準備受入 → ../../evidence/ai-monk-factory-gemini-project-preparation-20261024.json。

CDP操作は正規lease取得後も保護hookに実行前拒否され、policy変更・迂回・再送は0。別native経路ではbundle-only selectorが別業務profileを選んだため、UI観測をbilling受入から除外する。自分が変えた空ページ表示を復元し、自分の確認用window閉鎖・既存window保持・lease解放を確認する。公式APIでも請求先は既存1件のまま、Factory projectは未課金。新billing accountの最終送信・支払い・生成は0。Factory再開時はPID/profileに固定できるUI経路と専用billingを扱い、共有walletへlinkしない。

Databaseの別ownerによる日次更新PR649/main `505aa8182356e286c586aa9a5f618d8509806f2e`はsource v0.4.9/187出典、CI40044430970とDeploy40044430905 SUCCESS。公開JSONの00:23:54Z観測は75archive/181出典・SHA `e7fe35a6219381f90da1a5f8ce3e0df98935948f2f37e0053bdbaf91dd539516`で、v0.4.9の全配布面受入へ置換しない。Factory source373→505は差分0。rootは日次ownerのsource・release・Registryを変更/再送せず、独立して未確認の商品・収益根拠を精査する。

## 商品構造化データの限定追加

DB-1の現在unitはAris The Stillの既存商品 `aris-21-rituals` の公開価格不明を、公式seller HTMLのJSON-LDで再確認する。目的は既知商品の価格・通貨根拠を拡充してWeb/CLI/MCPへ同一snapshotを配ること。対象は `https://www.aristhestill.com/` の商品名・Offer価格/通貨・availability表示、既存profileとの帰属経路のみ。ログイン・cart・checkout・支払い・売上推定は0。MonjeWu/MonjeLinの探索結果はreceiptに境界だけを記録し、この実装unitのデータ対象を増やさない。

main `ad08dd187d3b3c051bb29d9e1040ec76272f5461`由来の専用branch `feat/ai-monk-product-jsonld-20261024`を使う。所有はprimary。先行契約をpushしてからcanonical JSONの新source/新しい日付付きoffer観測、package/lock/README/server metadata、当planと新規receiptだけを変更する。旧187sources・全75recordsの既存field/offer・4included/69pending/2excluded・AI状態・画像・指標・revenue観測は保持する。既存null観測を上書きせず、新しい観測から旧商品IDを参照する。JSON-LDのInStockはseller metadataであり実在庫/購入成功へ昇格しない。billing recurrenceとmerchant会計通貨は独立未確認なら補わない。

受入は、未追加の価格観測について最小の一時assertion RED→データ追加→GREEN、既存shared/helperとpackage検証、fresh read-only data review・既存CI/main公開とする。新parser/runtime/依存/恒久的mirroring testは作らない。新v0.4.10のmain固定Release・公開JSON/Web/CLI/stdio/HTTPS MCP・Registryを同一snapshotで確認し、v0.4.9を含む旧Release/receiptを変えない。別ownerの日次v0.4.9公開を中断・再送しない。Factory・plugin payload・認証/課金・X・日次Grok所有effectは変更0。現在cursorはこのDB-1の根拠追加、次はPL-1の既存正式配布口の未完条件。

Arisの公式HTML HTTP200/JSON-LDで同一商品17 USDを確認し、新しいsource1件・日付付きoffer1件を追加する。旧187sources/既存全観測・収益fieldを保持するsource acceptanceはRED→GREEN。既存package15件/shared・render15件とbuild済みget/monetizationの価格/出典返却を確認し、v0.4.10/188出典へ揃える。source証拠 → ../../evidence/ai-monk-product-jsonld-source-20261024.json。source時点の次段階であるreview・最終head CI・main由来公開/新Release/Registryは下記公開結果で受入する。

## 正式Plugin掲載のアクセス復旧

Daisの「Go fix」に従い、PL-1の専用OpenAI account無効化とMuse審査の未完条件を現在cursorへ進める。DatabaseのAris sourceはPR652/main `8a5f78fb9ade2c45cd213c5beabcf71ee718c25d`へ統合済みで、新版の公開/Release/Registry受入は中断・重複せず並行して完了する。

専用branch `fix/ai-monk-plugin-marketplace-access-20261024`は上記最新main由来。目的は既存専用identityの正規アクセス復旧と、Muse公式submissionの不足要求を修正し正式提出/審査/掲載を前進させること。所有はprimary。本unitはSSOT全文のRAM確認、本人/owner/既存lease/session照合、最新の公式復旧手順・通知・Muse要求の取得を先に行い、同じ非retryable loginの再実行や提出重複をしない。正規の復旧/既存提出の不足修正は必要な範囲で進め、他account新設や他者identityへの切替、共有wallet/日次loop変更、課金は0。外部審査結果は自分で承認扱いにせず、公式receipt/掲載URLを個別に確認する。

完了条件は本人accountへの公式アクセス、必要なdeveloper identityと正式upload/submit/公開readback、Museの全requirements/審査/掲載を区別して閉じること。未解消なら原因・自分が直した範囲・provider受付ID/要求・次の具体的操作を新しいreceiptへ残す。既存receiptを書き換えない。既存source/正式掲載/売上を混同せず、source修正が必要な場合だけ関係する契約と最小検証を先行更新する。Google/login skillのKeychain指定・復旧停止はDaisのSSOT/Apple store禁止と今回の正規復旧委任を優先し、browser再起動・新context・guard迂回は行わない。


## v0.4.10公開と正式掲載復旧の結果

Aris sourceはPR652/head747b93d7c/main8a5f78fb9へ統合する。GitHub Codexのexact-head reviewはcompleted/no findings、CodeRabbitはstatus SUCCESSだが実レビューはskippedで、local独立raw source reviewは未実行として区別する。既存source CIとmain package/deployはSUCCESS。固定mainのRelease422460536/asset671015557、公開URL install/CLIとstdio/HTTPS各6tool、公式Registry40053864882 SUCCESS/exact GET active/isLatest、Netlify ready 6adc118d5255413148e7de29を受入する。公開JSONはcanonical元bytesのSHA256 3dd7cddc6dd8e4da0c751984ea0fb2894f405fc4d291743833b3561ab81bfeb9と一致する。旧Release/receiptを変更せず、GitHub immutable=false、Netlify commit_ref=nullとtitle/GHAによる対応付けを保持する。公開証拠 → ../../evidence/ai-monk-cli-mcp-v0410-release-20261024.json。

OpenAIの通常認証/APIで確認したaccount_deactivatedに対し、公式復旧資料と通知検索を先に確認し、既存専用identityから正式appealを1回送信する。初回のnative送信はdaemon/cache不在のローカル拒否で外部送信0、fresh state後の実送信は1件/再送0であり、公式成功画面と受付番号付き確認メールを確認する。受付番号はprivate SSOTだけに保存する。匿名Help Centerの先行message1件は実表示を確認するがemail識別の受理は未確認で、正式case受理はappeal側の証拠で確定する。復旧・正式Plugin upload/submit/承認/掲載は未完。

Museの既存submissionを本人sessionで再読し、3/3、Business Approved、Data/credentials In reviewを確認する。全体のSubmittedと将来stepのラベルを承認済みへ読み替えない。Data詳細はUnder review、認証不要・Streamable HTTP POST・正しい公開MCP/6 read-only tools・GET405の説明は保存済み。AXで長文が空になる項目は実画面を照合し、OCRのURL誤読を入力不備と扱わない。所有するGmail2受信箱のexact recipient検索は既存の事業メール確認1件だけで、新たな審査結果/修正要求を見つけないが、Muse直接受信箱の全件取得とは主張しない。新提出/編集/再送は0。

native PIDキー入力が別windowへ届いたため、対象を改めて観測し、送信/決済0のまま元Receptionist site/titleへ戻し、自分の新規空window閉鎖と両lease解放/controller exit0を確認する。保護hookのCDP実行前拒否を迂回せず、browser/基盤/日次loopを再起動しない。復旧の証拠 → ../../evidence/ai-monk-plugin-marketplace-access-20261024.json。次は既存caseへのprovider回答/追加要求の受入であり、正規復旧後に同じv0.1.3を正式upload/submitする。回答待ちだけを理由に全goalを完了/blockedへ変更しない。


## 審査待ちと独立した未確認商品の精査
前turnは公式OpenAI appeal受理とMuse既存requirementsのreadback、v0.4.10公開受入を正本へ反映したprogressと判定する。審査結果の未着を同じlogin/提出の再送理由にしない。Database→CLI/plugin→Factoryの優先順を維持し、回答待ちと独立にDB-1の既知商品Monje Wu/El Maestro Lin/Ling Haoの匿名販売価格・通貨を精査する。限定範囲・状態・受入の正本 → 2026-10-24-ai-monk-product-checkouts.md。source差分が成立した場合だけ新版を公開し、未知の売上と正式掲載は未完のまま維持する。

DB-1の限定sourceは3公式checkoutの4観測（Monje Wu主商品19.99 USD/未選択addon5.99 USD、Maestro Lin17 USD、Ling Hao9.99 USD）と別建てJP表示額を追加し、v0.4.11/191出典へ揃える。188出典と全既存観測/収益/掲載scopeは保持、source acceptance RED→GREEN/package15/helper9/render6/built get/monetizationはPASS。source時点ではCI/main/新版公開は未受入。source時点の全配布面受入はv0.4.10で、次cursorはv0.4.11公開であった。下記の公開結果でこの境界を受入する。source証拠 → ../../evidence/ai-monk-product-checkouts-source-20261024.json。


## v0.4.11公開結果と次の実行cursor
PR655/head2db9ce6ac/main a4719691e4cbe77891cf16c111fe9dc3b2c1d4c1のsource CI・main package40056441948/deploy40056441955はSUCCESS。既存のserver設定による自動Codex reviewはexact headでcompleted/no findingsを観測するが、手動の追加review依頼は0、CodeRabbitはcontent review skippedで区別する。固定main Release422479575/asset671100571、公開URL導入/CLI/実stdioと公開HTTPS MCP各6toolの同一snapshotを受入する。公開JSON元bytes SHA256 3f9b316cd49554c0805068c8c581c367021702b0912e3cd351a98ceddd20665a、73card/71画像/191出典と新価格表示、Registry40056843384 SUCCESS/exact GET active/isLatest、Netlify ready 6adc1fede8e7aae85ab2bea5を確認する。GitHub immutable=false、Netlify commit_ref=nullとGHA/titleの対応付けは限界として保持する。公開証拠 → ../../evidence/ai-monk-cli-mcp-v0411-release-20261024.json。旧v0.4.10を含むReleaseとreceiptは変更しない。

旧cursorはDB-1の3商品checkout精査→v0.4.11公開とPL-1の正規復旧申立て。新cursorは既存OpenAI case/Muse追加要求の受入と独立に、SaaS-1の専用Gemini課金元・実使用可能予算・有料モデル権限を確認する準備である。理由は限定Database/CLI配布面の今回受入と正式な申立てを完了しており、外部審査結果待ちだけを理由にFactoryの必要条件を止めると収益への到達が遅れるため。全体のDatabase→CLI/plugin→Factoryという優先順、継続調査・正式掲載・実生成/本人IG接続/投稿/metrics・USD10K MRRという成果条件は縮小しない。

Factoryのsource上の次境界は既存provider契約とGemini準備planを参照する。専用project/keyとモデルGET200を、有料権限や実生成へ昇格しない。MONK_FACTORY_ENABLEDは全provider/Stripe readinessの共通gateであり、Geminiだけの部分enableを新設しない。trial4.25USD/paid70USDは生成予約の上限で、Factory全体のbootstrap spend-capへ流用しない。次unitで独立支払元・必要額と既存予算を具体化し、共有Grok/既存顧客の財布へfallbackしない。今回の公開unitはFactory設定/支払い/生成/日次投稿の変更0で閉じる。OpenAI/Museの新しい審査結果は今回の通知followupで未受領、再送0を維持する。

## Yang Mun現行offerの通貨精査

既存Databaseのdaily-20261024-yangmun-0/1は$49.99/$59.99という表示を保持するが、ISO通貨と現行購入商品への対応は未確認である。既存の歴史的USD観測を上書きせず、sellerの公開Journeyページ・そこから辿れる商品/variantメタデータと匿名の購入画面の表示を確認する。cart/checkoutへのPOST、account/signup、個人情報、支払、purchase、provider/日次投稿変更は0とする。公開商品情報だけで不足する場合は不足を記録し、通貨を推測しない。

primaryがspec/data/公開を所有する。必要な独立read-only研究者は当sellerのpublic商品対応・通貨とprivate raw証拠だけを所有する。既存75archive/73public/191sourcesと全観測・scope・売上のunknownは保持する。明確な新規観測が得られた時だけsourceと日付付きoffer観測を追加し、package/Registry metadataをv0.4.12へ揃える。価格を注文/売上と呼ばず、地域表示額と基本通貨・購入方式を分離する。ソース差分が無ければ新版やReleaseを作らない。

- [x] SOURCE: 公式公開URLの時刻・最終URL・本文/raw hashとvariant/product対応、明示通貨を照合する。
- [x] DATA: 新観測欠落の最小一時assertion RED→data追加→GREEN、package15/helper・render15とbuilt CLI/monetizationを受入する。旧75records/191source/78offerは新要素を除くと完全一致する。独立raw照合のblockingは0。source結果 → ../../evidence/ai-monk-yangmun-offer-source-20261024.json。runtime/依存/恒久mirroring testの追加は0。
- [x] PUBLIC: PR663/main5c4471addaaa0f6cd1ae3937465ceb10e0113437、source CIとmain package/deployを受入する。Release422513094/asset671246432・公開URL導入/CLI・stdioと公開HTTPS各6tool・公開JSON/Web・Registry40062441129 SUCCESS/exact GET active/isLatestの同一snapshotを確認する。証拠 → ../../evidence/ai-monk-cli-mcp-v0412-release-20261024.json。

SOURCEでJourney/Complete Collectionの購入variantがseller商品ページのJSON-LD Offer URLと一致する。USD指定表示は49.99/59.99 USD、通常の匿名商品表示は8000/9600 JPYで、4ページともHTTP200・明示priceCurrencyを確認する。DATAは4sourceと2日付付きoffer観測を追加して195sources/75archive/73public、offer archive80/公開77を目標とする。USDをmerchant会計通貨やUS Checkout実表示へ昇格しない。無料ギフト2件は購入リンクの商品対応の調査証拠に留め、今回の新offer件数には数えない。通常表示のJPYは別のpresentment_priceと出典へ分離する。

## v0.4.12公開受入の結果保存

main5c4471addaaa0f6cd1ae3937465ceb10e0113437由来のdocs/ai-monk-v0412-publication-20261024で、本planの現在pointer/状態と新しい公開receiptだけを保存する。primaryは本planと統合、workerは新receipt1件を所有する。旧receiptの変更、新規source/data/version/runtime/認証/課金/生成/投稿は0。今回のJSON parse/参照bytes/hash、秘密値非混入とdiff、commit/push/remote object一致、PR/mainの対象blob一致を最小受入とし、docs-onlyの追加deployは要求しない。

公開JSONは480570bytes/SHA256 e6f897828510031412a6ea0ff1058d617c58ae3c6dbc05852c12deb4fb38bf22で固定mainと一致する。Webは73card/71画像/195出典とYang Mun先頭2offerを確認する。固定main tarballは64038bytes/SHA256 cbf206926ec14ea6d92c4efd0963214cb952a699ad645f6b0ffc7156b1cb4705で公式digest/匿名GET/公開URL導入と一致する。Netlify published ready6adc335eec8e8c7c79b49f34のcommit_refはnullで、GHA/titleと公開snapshotによる対応付けに留める。GitHub immutable=false、browser viewport/paid納品/注文/売上は未検証。既存Plugin payload v0.1.3は変更せず、正式ChatGPT/Muse掲載やFactory実利用・MRRの成果へ換算しない。

## Master Kaizenの公開メタデータ更新

2026-10-24の匿名公開TikTokページをread-onlyで取得し、profile follower 275,700、既知videoのplays 648,600 / likes 62,000 / comments 14,900 / shares 11,100 / duration 75秒をembedded metadataから記録する。capture bytes 433031、SHA256 `9e650a3726ad3ba2dc94f227eba75159857402d74ed50f3852a8cd019e5cee4e`。`crwl crawl`は空結果のため`scrapy fetch`へ切替えた。動画自体を再生・目視せず、TikTok embedded AIGC flagsがfalse/emptyでもAI originへ推論せず、既存`unverified`/`pending`・unknown revenue/offersを維持する。旧2026-10-22観測はすべて保持する。receipt → ../../evidence/ai-monk-master-kaizen-video-metadata-20261024.json。

DATA差分はsource1件追加、75 archive/73 public/197 sources、offer/revenue観測追加0。package/README/server metadataをv0.4.14へ揃え、変更前assertion RED→変更後GREEN、package15/helper9、JSON/reference/diffをPASS。main PR/CI/Release/Netlify deploy後の公開JSON/Web/CLI/stdio/HTTPS MCP/Registryは同じsnapshot hashで受入済み。詳しいprovider readback → ../../evidence/ai-monk-cli-mcp-v0414-release-20261024.json。次cursorはDB-1 residual coverage。OpenAI identity reviewとMuse審査は並行待機、Factory・認証・課金・日次投稿へのeffectは0。

## v0.4.14公開受入

PR678 head `dae8df5db2b613249abacaf3b9783850e69eb59a`をmain `8ceeaaa17e6d6b6e521edab729cd777c822a8468`へsquash merge。main package workflow 40089033339とNetlify deploy workflow 40089033395/post-deploy smokeをPASSする。main SHAから`ai-monk-index-v0.4.14`を作成し、asset `anicca-ai-monk-index-0.4.14.tgz` 65,833 bytes / SHA256 `8a432ea47090583c53d1c9ff2b25930309fb16c8afc6f27c745b4c46a4a27c22`を公開する。公開URLから隔離prefixへinstallし、CLI get/statsとreleased tarballのstdioを実行する。公開JSON 200/500806 bytesはcanonical 500806 bytesとSHA256 `65e73a3b9ca597705f2a10a95ff165452b332f425f42fc1c400178dcb177979a`まで一致。Webは73 profiles found、Kaizen 276K followers。stdio/HTTPSは各6 read-only tools、73 query records/197 sources、同じsnapshot SHAを返す。Registry workflow 40089496202成功後、official version endpointはHTTP200/0.4.14/active/isLatest trueで確認する。公開成果はAI originの検証、収益増、注文、ChatGPT/Muse directory approval、Factory実利用を意味しない。完全receipt → ../../evidence/ai-monk-cli-mcp-v0414-release-20261024.json。
