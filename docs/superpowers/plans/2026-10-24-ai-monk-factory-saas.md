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
- [ ] avatar画像→PhotoAvatar、Database由来の独自script→speech duration確認→縦動画、本人profile Connect→official GET、IG投稿→公式post URL/metricsを実装する。
- [ ] tickの時間/件数とserver予算、stop/cancel、opaque account帰属/容量、provider failed/unknownを検証しcommit/pushする。

## Task 3: 同じURLの実Webと公開
Files: apps/landing/app/ai-monk-factory/page.tsxとclient、scripts/stage-ai-monk-factory.mjs/関連test、Database/support links、functions config/関連CI、Factory privacy/terms。
- [ ] Supabase login/Generate/進捗/preview/IGConnect/自動投稿ON・停止/metrics/3日trial後199ドルの請求/解約を最小UIで結ぶ。
- [ ] 旧4fileはdownload pathへ移しpublic static/Next route衝突を解消する。利用者向けAPIkey/CLI設定を増やさない。
- [ ] 関連source acceptance・fresh money/security review・CIを通してmainへ統合し、main由来の公開をreadbackする。
- [ ] Factory専用provider/Stripe3日trial/本人IG接続/実avatar-video/公式postとmetricsを区別して確認し、利用可能な事実だけをXへ告知する。

## 現在cursor
Task3の画面は既存Authと固定APIへ接続し、実進捗/残枠/preview/Instagram接続/明示ON・停止/請求・解約を表示する。client transportは5件、旧asset stageは3件がGREEN。旧local4fileはdownload pathへ分離し、利用者へAPI設定を要求しない。Factory terms/privacyは実装のデータ・trial・請求・試行枠に合わせる。Factory対象TypeScriptは診断0、既存CIと同じ固定版共通asset配置後の実buildは651ページでPASS。全体tscは既存dashboard/income/lmの6診断があり、今回のFactoryへ診断は出ていない。Netlify公式のscheduled30秒上限/background15分と自動retryを確認し、毎分tickを両deploy rootへ設定する。既存日次処理と退役scheduleは変更しない。Task2のjob/APIとの最終結合・source review・CI・本番受入は未完。

Task1のAPI/署名/課金/認証18件、既存商品分離12件、実DB8件がGREEN。verified UIDで読取/停止/課金を結び、API応答から内部customer/nonceを除外する。Checkoutは保存済みpayloadとidempotency keyを再利用し、24時間後は公式全page検索の完了前に新nonceを発行しない。署名eventは識別子だけを一意queueへ保存し、権限を直接付与しない。Task2でqueue消費、provider adapter、job/effect fence、同期画像用backgroundの重複0とIG接続/投稿を結ぶ。HeyGen Imageの既存画像必須を確認しOpenAI text-to-imageへ改めるが、avatar予約USD1.60/trial4.25は保守枠として維持する。本番DB反映・SaaS公開・料金公開・実生成・売上は未完。
