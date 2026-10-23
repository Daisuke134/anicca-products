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
Files: apps/landing/app/ai-monk-factory/page.tsxとclient、scripts/stage-ai-monk-factory.mjs/関連test、Database/support links、functions config/関連CI、Factory privacy/terms。
- [x] Supabase login/Generate/進捗/preview/IGConnect/自動投稿ON・停止/metrics/3日trial後199ドルの請求/解約を最小UIで結ぶ。
- [x] 旧4fileはdownload pathへ移しpublic static/Next route衝突を解消する。利用者向けAPIkey/CLI設定を増やさない。
- [ ] 関連source acceptance・fresh money/security review・CIを通してmainへ統合し、main由来の公開をreadbackする。
- [ ] Factory専用provider/Stripe3日trial/本人IG接続/実avatar-video/公式postとmetricsを区別して確認し、利用可能な事実だけをXへ告知する。

## 現在cursor
Task2のjob/APIとTask3画面を統合する。primaryのcore47件＋client5件がGREEN、独立Unix socket Postgres20件がGREEN。unknown保持/並列lease/POST前fence/保存応答消失/重複背景/OFF・取消競合/実adapterを使う制作→投稿→帰属metricsを隔離fixtureで確認する。Factory対象TypeScriptは診断0、既存CIと同じ固定版共通asset配置後の実buildは651ページでPASS。desktop1440/mobile390のローカル表示は横溢れ0、実media未生成の空状態を確認する。全体tscには既存dashboard/income/lmの6診断がある。

fresh read-only reviewは6b9e0b55でhold。Stripe SDKだけが25秒signal外で34.8秒まで延びる反証と、解約portal欠落でもready=trueとなる反証を受け入れる。最小REDを先に確認し、既存Stripe SDKのfetch transportをtickの共通25秒signalへ結び、Price/portal/webhook/live-mode不足はAPIとscheduledの両方で新規実行0にする。状態取得障害時も停止ボタンを表示する。修正後のprimary focused検証52件はPASS、独立再確認は既存商品隔離1件を含む53件PASSでsource ship（fdab2f2a）。実handler→実Stripe SDKの共通deadline中断を確認する。receipt → ../../evidence/ai-monk-factory-release-review-20261024.json。PR626の初回CIはDB19/20で失敗し、fresh checkoutでは未生成のDatabase moduleを台本がimportすることを確認する。テスト前に既存package build --netlifyを実行し、前提不足を明示する診断を追加する。CI/main統合が次のcursor。

Factory専用provider/支払元の実確認を進める。既存Grok用wallet/key/Postiz・日次loopを使わない。本番DB migration・SaaS公開受入・Stripe価格公開・実生成・投稿・売上は未完。設定未完の間はcheckoutと新規生成を無効のまま保持する。独立課金元と本人IGが揃ってから実providerの結果を区別して確認する。
