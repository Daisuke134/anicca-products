# AI Monk Factoryクラウド実装計画

Goal: Generateから独自avatar/台本/縦動画を作り、本人のInstagramへ自動投稿し実metricsを確認できる、3日trial付きのWebを公開する。
Architecture: 既存Next static export/Netlify FunctionsとSupabase Auth/Postgresを使う。公式APIの非同期IDを永続jobへ保存し、短いscheduled tickで進める。Stripeとsocial帰属はserverがverified user IDに結ぶ。
Tech Stack: Node/Next/React、既存Supabase JS・Stripe、native fetch、Postgres。新frameworkを追加しない。
Spec: ../specs/2026-10-24-ai-monk-factory-saas-design.md

## 制約と受入
月USD199/成功最大30本/45秒、課金試行最大36回。trial3日/成功最大3本/20秒/課金試行最大3回・再生成0、1avatar、生涯1trial。trialとpaid期間は別quota/繰越0。Factory専用課金元を使いGrok wallet/key/既存Postizを使わない。実提供前に課金CTAを有効化しない。
通常判断はprimaryが実行する。既存の明示No-human-loopに従い、skillの選択/承認質問を追加しない。primaryがnative実装し、必要なmoney/security境界だけfresh read-only確認を使う。

## 重点検証
- client user/customer/profile IDを偽装しても別利用者の課金/動画へ到達しない。
- 並列Generate、更新webhook、scheduled再実行でquota/課金/投稿が重複しない。
- timeout後のeffect不明は予約を保持し、成功・0円へ置換しない。
- Stripe取消/失効、IG失効、容量満杯で後続の有料生成を止める。
- provider未設定は具体的な利用不可状態にし、mockの成功や請求だけを提供しない。

## Task 1: 本人確認・永続quota・Stripe
Files: apps/landing/netlify/functions/_lib/monk-factory.js、_lib/monk-factory-store.js、monk-factory.js、monk-factory-stripe.js、_lib/__tests__/monk-factory.test.js、CLIで作るapps/landing/supabase/migrations/*_monk_factory.sql、scripts/test-ai-monk-factory-db.mjs。
Interfaces: authenticateFactoryRequest(event,{env,fetchImpl})→verified {id,email}。buildFactoryCheckout({user,price,customerId,trialUsed})→公式GETしたPriceのUSD199/月/Factory metadataを検証した固定Stripe payload。storeはaccounts/jobs/eventsとservice-only RPCによるslot/生成枠/period予約を提供する。
- [x] missing/invalid token・偽造user ID・固定price/3日trial・二重quota/別user/RLS・署名不正/重複webhookの必要最小REDを確認する。
- [x] server getUser、service-only DB更新、atomic quota/slot、固定Checkout/本人cancel portal、raw署名queueと公式subscription再取得を実装しGREENにする。queue消費はTask2 tickへ結ぶ。
- [x] 既存local Postgresの独立fixtureでRLSと同時予約を確かめ、commit/pushする。本番DBはmain統合まで変更しない。
- [x] 現行Stripeのitem period/同期間paid invoice lineと、user/customer/price/live-mode帰属を照合するpure helperを4件で検証する。解約予定は次の生成予約を止める。
- [x] 既存droplet/wake-call webhookのFactory除外をREDから修正し、既存契約を含む関連22件を確認する。wake-call側は実Stripe SDKの署名を使う隔離fixtureで検証する。
- [x] Checkout contextの並列一意性と課金同期leaseを実DBで検証し、期限切れ旧応答の拒否・生涯trial状態の維持を確認する。

## Task 2: 制作・接続・自動投稿
Files: _lib/monk-factory-providers.js、_lib/monk-factory-jobs.js、monk-factory-tick.js、monk-factory-image-background.js、Task1 API/store/SQL、必要最小の関連test。
Interfaces: jobはuser_id/occurrence/stage/provider_id/next_run_at/lease/cost/evidenceを持つ。provider submitはIDを返し、pollで公式状態へ進める。
- [ ] 独立billing sourceと必要設定の事前確認、clientへのsecret非露出、同じoccurrence/effect不明の再送0を最小REDで確認する。
- [x] avatar画像→PhotoAvatar、Database由来の独自script→speech duration確認→縦動画、本人profile Connect→official GET、IG投稿→公式post URL/metricsを実装する。
- [x] tickの時間/件数とserver予算、stop/cancel、opaque account帰属/容量、provider failed/unknownを検証しcommit/pushする。

## Task 3: 同じURLの実Webと公開
Files: apps/landing/app/ai-monk-factory/page.tsxとclient、scripts/stage-ai-monk-factory.mjs/関連test、Database/support links、apps/landing/app/factory/page.tsxの既存Web app一覧、functions config/関連CI、Factory privacy/terms。
- [x] Supabase login/Generate/進捗/preview/IGConnect/自動投稿ON・停止/metrics/3日trial後199ドルの請求/解約を最小UIで結ぶ。
- [x] 旧4fileはdownload pathへ移しpublic static/Next route衝突を解消する。利用者向けAPIkey/CLI設定を増やさない。
- [x] 公式Web app一覧/factoryへDatabase（無料公開中）とAI Monk Factory（準備中・199USD/月）を登録する。全appが9–19USDという旧一律価格表現を実際の個別価格案内へ置き換える。既存APPSを使い、CI40014673074とmain由来Deploy40015273214はSUCCESS。公開/factoryで両リンク・Free/Preparing価格表示を確認する。
- [x] 関連source acceptance・fresh money/security review・CIを通してmainへ統合し、main由来の公開をreadbackする。
- [ ] Factory専用provider/Stripe3日trial/本人IG接続/実avatar-video/公式postとmetricsを区別して確認し、利用可能な事実だけをXへ告知する。

## 現在cursor
PR626はmain ad3ac0ccecf2762a922853133bcaf253b1448a96へ統合済み。修正後CI40009398593は全工程SUCCESS。独立source reviewは53件、独立Postgres20件がPASS。Stripeを含む共通25秒deadline、設定不足でready false/予約0、状態取得障害時の停止導線を確認する。review → ../../evidence/ai-monk-factory-release-review-20261024.json。

mainの2migrationを本番cycgdwndgfgdbnndithcへ適用し、3tablesのRLS=true、account/job/event各0を公式readbackする。Supabase Google認証は有効でFactory redirectは既存設定に含まれ、認証設定変更0。main由来Netlify Deploy40010066986は公開後money-path検証を含めSUCCESS。公式published deployはreadyでmain SHAをtitleに持ち、Factory4functionsとtick毎分schedule、公開API401、Webの199USD/3日trialを確認する。source/DB受入 → ../../evidence/ai-monk-factory-cloud-foundation-20261024.json。公開WebのGoogle loginは本人一致で完了し、認証付き実API GET200/ready=false/accountなし/jobs0と、準備中表示・Checkout/avatar/video/IG接続disabledを確認する。実認証受入 → ../../evidence/ai-monk-factory-live-auth-20261024.json。

Factory専用のStripe product/固定199USD Price/解約portalを作成し、それぞれ公式GETでlive/metadata/価格と解約専用・既存default非変更を確認する。customer Checkout/subscription作成/請求0。専用署名endpointとruntime設定はprovider準備が揃う直前にまとめて反映し、未設定endpointの長期放置や反復deployを避ける。receipt → ../../evidence/ai-monk-factory-stripe-activation-20261024.json。Providerの独立支払元・容量・white-label・実生成が未確認の間はMONK_FACTORY_ENABLED=falseを保持し、Checkout/新規生成/自動投稿を開始しない。Stripe resource作成をcustomer課金や売上と扱わない。専用Upload-Post無料accountとAPIの公式GETは200、有料Professional/white-labelは未加入。自動作成された空defaultは未接続・未投稿を確認してDELETE1回で整理し、公式GETでprofiles0を確認する。Professional月払い50USD/25枠/white-label/税0・本日合計50USDの実Checkoutを1回準備する。LinkはSSOT本人email一致を確認し、メール認証1回で保存支払元の表示へ進む。保存済支払元の表示を確認し、購入/カード入力0。固定費だけの先行発生を避けるため、Professional購入は専用OpenAI/HeyGenの利用可能予算・キー準備後に行う。申込確定前に請求条件をread-only検証する。HeyGen認証入口が既存Grok accountへ自動loginするため、既存sessionのlogout/切替を行わず、Factory専用の新規profileをidentity ai-monk-factory:provisionとして登録し、全launchd preflight PASS後に動的portで起動して通常signupを進める。cookie/vaultコピー、新context、既存browser restartは0。既存Grok用wallet/key/Postiz・日次loopは使わない。

/factoryの公式Web apps一覧はPR628/main75335e9d402e5faeb24fef180f4a0a4f3c9ff4dc由来Deploy40015273214のSUCCESSと公開readbackを確認し、登録完了とする。/daisは別canonical overlay経路なので未使用sourceを編集しない。

専用HeyGen無料account/API keyの公式GET200・Factory本人一致・独立wallet USD0・wallet自動補充OFFを確認する。入金/生成0。最小入金USD5は公式UIの入力契約として確認し、購入受入とは区別する。専用OpenAIは初回準備時に本人所有メール別名でaccount・独立organization/project・API keyを1件作成し、公式models GET200・残高USD0を観測する。この初回のmodel一覧表示は実生成権限/課金受入を意味しない。当時の公式支払UIはカード番号/期限/CVCを要求しLink選択はなく、SSOTに全カード情報が無いため購入0。verified developer identityの開始にも既定支払方法が必要で、Plugin ZIP upload/提出0。現在の認証状態は後述の再確認を正本とし、初回残高を現在値へ流用しない。独立予算が揃ってからUpload-Post Professionalの購入を進める。現準備の証拠 → ../../evidence/ai-monk-factory-provider-preflight-20261024.json。

HeyGen単独の代替案も公式仕様/料金で追加観測する。架空avatarのprompt生成APIは存在するが、単独台本生成の置換とprompt avatar固有料金は未確認とする。Full Video Agentの5.82USD/分でtrial3本を各20秒まで生成する場合は動画費だけ5.82USD、paid30本を各45秒まで生成する場合は130.95USD、36課金attemptでは157.14USDとなる。短い動画の必須最低額とは扱わない。現契約のtrial4.25USD/paid provider・台本70USDを賄えないため、既存price/quota/providerを変更して迂回しない。独立read-only review SHIP/Blocking0、未確認の実請求/失敗課金/生成権限は保持する。追加購入/生成/設定変更0。証拠 → ../../evidence/ai-monk-factory-heygen-alternative-20261024.json。

課金開始前の容量修正を現在cursorへ追加する。理由: 独立read-only検証で25人のtrial解約後、実profile0/送信0でも予約25が残り26人目が拒否される。旧順序はprovider準備→runtime有効化、新順序はprovider準備と並行で未使用枠解放を修正→runtime有効化。新cleanup loopは作らず、公式terminal同期とCheckout expiryの既存経路を使う。trial履歴・実profile・unknown送信を保持し、social lease/旧nonce/再Checkout競合を最小の実DB回帰で検証する。
- [x] 公式terminal/expiredに対する未使用profile予約解放を、現在世代CAS・未送信lease失効・再予約まで実装する。元2migrationを変えずCLI生成の20261023201136_monk_factory_capacity.sqlを追加する。25人解約後の再入場、生涯trial/費用保持、実profile/unknown/active保持、GET中の世代切替と期限切れ再Checkout、顧客帰属を隔離Postgres25件・関連core48件で確認する。
- [x] 容量修正はfresh read-only review SHIP・CI40018027230 SUCCESSを通してPR629/main710f0347a2981e19b0aa11d73df953a9bd1e9588へ統合する。追加migrationの公式適用1回/remote20261023202156と関数・権限・RLS、main由来Deploy40018476870 SUCCESS/published ready、認証付き実API200/ready=false/accountなし/jobs0を確認する。実顧客や投稿を作らず検証境界を保持する。証拠 → ../../evidence/ai-monk-factory-capacity-release-20261024.json。

SaaSの提供開始、独立provider課金元、Stripe3日trial、本人IG接続、実avatar/video、公式投稿とmetrics、FactoryのX告知・売上は未完。実利用可能な状態から次の配布へ進む。

Netlify AI Gatewayの代替経路は公式docsと現account GETでread-only確認する。既存契約のtype_nameはFree、ai_gateway_available_on_plan=false、auto_topup_enabled=falseであり、Gatewayはこの契約で利用不可とする。通常のAI使用上限はAgent Runners用で、Enterprise以外のGatewayには適用されず、team共通creditを使用する。Factoryの独立hard budgetを満たすと推定しない。plan upgrade・設定・入金・生成0で不採用とし、専用OpenAIの認証状態・支払方法/実生成受入という現在cursorを保持する。証拠 → ../../evidence/ai-monk-factory-netlify-gateway-preflight-20261024.json。

## 専用OpenAIの再認証と現行の不足条件

目的は専用providerの利用可否を現在の公式状態で確かめ、利用不能なまま請求や有料生成を始めないこと。既存専用identity・本人メール別名・通常メールコード認証を使い、SSOT全文確認と宛先/送信元/時刻一致を行う。共有Grok wallet/key・日次loop・別account新設・reset・支払・生成は対象外とする。完了条件は公式UI/APIの状態、秘匿したreceipt、正本の現在cursorの一致とする。

- [x] 旧sessionの無効化を公式UIで確認し、本人の既存Gmail file-backend経路から確認メールをRAMで読む。確認メール要求1回/コード入力1回/再送0。
- [x] コード入力後の公式UIはaccount削除または無効化の認証エラー、既存専用API keyのGET /v1/modelsは401・account_deactivatedを返す。API上の無効化を確認し、削除の有無・原因は未確認とする。SSOTの現行account状態を更新し使用済コードを除く。
- [ ] この専用accountへの正規アクセス復旧、利用可能な専用課金元・実残高/自動補充・画像生成権限を確認する。現在のbilling画面は取得不可で、初期描画/過去残高0を現在値にしない。公式案内のappeal/support経路は確認するが、このunitで第三者への送信は行わない。

この再確認で専用OpenAIの正規復旧条件を保持する。現在のSaaS-1内cursorは配布正本の「Checkout本番反映と次のprovider実装」を参照する。正式ChatGPT upload/submit、Factory enable、customer Checkout/請求、画像/動画生成、IG接続/投稿は0を保持する。Database/公開MCP/Codex Pluginの公開とは独立した未完条件とする。証拠 → ../../evidence/ai-monk-factory-openai-account-state-20261024.json。

Checkoutの公開受入とGemini画像・台本候補への実装順変更、GCP read-onlyの実行前guard拒否の正本 → 2026-10-24-ai-monk-research-distribution.md「Checkout本番反映と次のprovider実装」。旧OpenAI adapterを現runtimeとして保持し、Geminiの専用有料project/key・課金・実生成・Factory enable/実提供は未完とする。
