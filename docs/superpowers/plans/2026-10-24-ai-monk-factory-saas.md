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

専用HeyGen無料account/API keyの公式GET200・Factory本人一致・独立wallet USD0・wallet自動補充OFFを確認する。入金/生成0。最小入金USD5は公式UIの入力契約として確認し、購入受入とは区別する。専用OpenAIの通常認証・project/key/利用予算を次に準備し、独立予算が揃ってからUpload-Post Professionalの購入を進める。

課金開始前の容量修正を現在cursorへ追加する。理由: 独立read-only検証で25人のtrial解約後、実profile0/送信0でも予約25が残り26人目が拒否される。旧順序はprovider準備→runtime有効化、新順序はprovider準備と並行で未使用枠解放を修正→runtime有効化。新cleanup loopは作らず、公式terminal同期とCheckout expiryの既存経路を使う。trial履歴・実profile・unknown送信を保持し、social lease/旧nonce/再Checkout競合を最小の実DB回帰で検証する。
- [ ] 公式terminal/expiredに対する未使用profile予約解放を、現在世代CAS・未送信lease失効・再予約まで実装し、関連source/DB受入とreview/CI/main反映を行う。

SaaSの提供開始、独立provider課金元、Stripe3日trial、本人IG接続、実avatar/video、公式投稿とmetrics、FactoryのX告知・売上は未完。実利用可能な状態から次の配布へ進む。
