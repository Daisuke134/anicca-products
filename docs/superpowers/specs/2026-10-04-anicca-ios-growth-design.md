# ANICCA iOS 収益改善の設計

## 目的と依頼の境界

既存ANICCA iOSを最初のケースに、配信→ストア獲得→初回価値→有料購読→継続→利益を同じ成長ループで測り、改善する。長期構想は公開アプリをそれぞれ$10K MRRへ育てることだが、最初の経営目標はポートフォリオ合算$10K MRRとし、需要と採算が確認できた勝ちアプリから投資する。仕組みを他アプリへ移すのはANICCAで再現できてからとする。目標額は達成保証でも期限予測でもない。

この文書は継続中の実行目標を支えるspecであり、実作業は後述のplanの順序と担当境界に従って進める。この文書branchはspec/plan/handoverだけを変更し、製品変更や外部公開の完了を意味しない。ソース変更は専用worktreeで該当Taskの範囲内に行い、ASC metadata・価格/購読条件・広告・公開投稿・稼働中loopはownerとeffect境界を確認してから扱う。利益の確定はCFO laneの同期間公式receipt/cost接続に委ね、Growth laneで二重に計算しない。

## 正本と再開情報

- Growthの文書repo: `Daisuke134/anicca-products`。ANICCA iOSのsource authorityは`Daisuke134/life-manager/apps/mobile/anicca-ios`であり、source editはLife Manager worktreeだけに置く。旧product repo READMEとcanonical app README/AGENTSはこの移行を示す。
- 文書worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- 文書branch: `docs/anicca-ios-growth-plan-20261004`
- push先: `origin/docs/anicca-ios-growth-plan-20261004`
- source audit baseline: `081eeb2e6fc9b44087eb4439e81951fa30c2cb9c`。fresh fetchのlatest `anicca-products origin/main`は`48e2cbd417c46623802aca863148c6716c41e5dc`で、差分はCapafy article追加1 fileだけ。Growth対象ANICCA sourceは変化なし。将来のsource実装worktreeはLife Manager origin/main `82d31995e6`由来で作る。
- 実行計画: `../plans/2026-10-04-anicca-ios-growth-plan.md`
- 再開メモ: `../../../.claude/handovers/2026-10-04-anicca-ios-growth.md`
- 残作業とcursorの唯一の正本は実行計画の「タスク一覧」。このspecに第二のTODOを作らない。
- `/Users/anicca/anicca-project`は他者の変更がある共有checkout。切り替え、cleanup、変更の巻き戻しをしない。
- この文書worktreeはsparse checkoutで文書だけを展開する。製品ソースは`git show HEAD:<path>`で読める。将来の実装は新たに最新main由来の専用worktreeを作り、そこで対象ソースを展開する。

## 現在の担当と再利用境界

- Growth documentation laneの書込対象はこのspec、対応するplan、handoverのみ。ANICCA iOS sourceはLife Manager canonical repoの専用worktreeで修正する。Current version evidence: `anicca-products@48e2cbd4`と`life-manager@82d31995e6`のPaywallVariantBView/ContentView/SubscriptionManager/project.pbxprojはSHA一致（7f90ebc2から82d31995e6までapps/mobile/anicca-iosに差分なし）だが、Life Manager AGENTSとapp READMEがsource authorityを指定するため、mirror repoには実装しない。
- 既存 `lm-cfo-observability-1002` はLife Managerの `feat/lm-mobile-metrics-20261003` を所有する。collector、ASC/RevenueCat取得、Finance Detail producer、CFO consumerへの接続をこちらで重複実装しない。本人へ取得済みの公開build/offerings/source refs/hashを照会済みで、返信は未確認。
- `codex-money-printer` は全体primary。私のgrowth文書・CFO worktree・mobile producerを編集しないとの返信を確認する。全体TODO/orderはLife Manager統合SSOTのprimary管理§217/§340/§343に従い、この計画はgrowth内の細分手順であって全体順序を変更しない。
- latest ANICCA source-main readbackでは`PaywallVariantBView` still sends `.paywallPlanSelectionViewed` directly and calls `trackPaywallViewed()` in the same `hasTracked` path。dedupe correction commit `76cf8b6e5968f958ee837318d68b6842386f4eb2` remains on `fix/anicca-paywall-event-dedupe-20261004-growth`, absent from `origin/main`, and has no PR. This confirms the code debt but does not prove event count or public-binary behavior.
- 公式ASC/RC readbackは既存取得owner一人が生成し、両laneが同じrefs/hash/期間をread-onlyで消費する。今回はprovider再取得、認証/共有profile/state変更、投稿、本番操作を行わない。
- Task 1の基準表とTask 3の配信資料は別の読取束として並行できる。shared journalは読取だけ、全体SSOTはprimaryだけが統合する。本人の未返信を所有権解放と扱わない。

### CFO・既存Mobile laneの成果とGrowth側の境界

| 既存成果 | Growthで再利用できるもの | まだ証明していないこと |
|---|---|---|
| CFO Task 1 — Moneytree freshness | Candidate commit `aaf8509f4f28` marks stale/empty balances and incomplete transactions truthfully; the candidate plan marks its focused source tests PASS. This is implemented source behavior on the candidate branch. | It does not refresh Moneytree data. Latest direct read has no source-update/sync cursor, transaction coverage only through 2026-08-25, and missing September/October rows; personal balance/flows remain stale/partial. The source changes are not in `origin/main`. |
| CFO Task 2 — canonical Financial Manager daily path | Candidate commit `35d93870cd27` routes the existing local report through Financial Manager and keeps provider receipt/digest replay boundaries; the candidate plan marks its focused tests PASS. It can be the finance-output sink after verified app revenue/cost sources are connected. | It does not collect Mixpanel user steps, onboarding completion, paywall view, or purchase cohort. The legacy local/hourly delivery receipt is not a natural run of this full-source candidate path; CFO Task 8 Step 4 natural daily receipt/replay-zero is still open. The source change is not in `origin/main`. |
| CFO Task 3 + Task 8A — business coverage and replay guard | Candidate commits `8acc6ea889fc` and `d6cb0d4070cd` join source-specific business receipts/unknown gaps and avoid re-ingesting on an exact, delivered same-day CFO report replay; 8A focused tests 15/15 and review `SHIP` are recorded. | This is financial-source completeness/idempotence, not app campaign attribution or paywall event dedupe. CFO candidate branch `docs/lm-cfo-cost-observability-spec-20261002` is now at `641e0f1120a8cfa59dd05ee36f2b2209d98afa9c`; current Life Manager `origin/main` is `82d31995e6`, which contains unrelated Capafy documentation but not these source commits. PR #6478 changed only the design document. Natural candidate-path receipt/replay-zero and seven-day observation are pending. Latest B7 still has 14/14 loops unknown, 137/132 historical/trailing gaps, and unknown MRR/runway. |
| CFO §87-B ASC acquisition readback | production collectorのread-only aggregateはAnicca iOSでcombined data window 2026-09-30..10-02、processing date 10/03、first-time downloads 1 / total impressions 16 / unique impressions 11 / product page views 0。 | attributionは`unattributed`、campaign metrics unavailable。sourceごとの正確なdata_from/data_toが保存されていない。これはsame-user cohortではなく、10/01 Standard Discovery rawの20 impressions/5 Page viewsとも整合済みではないため、分母を混ぜて転換率を作らない。|
| CFO §87-Q RevenueCat direct readback | complete period 2026-10-03のAnicca MRR chart pointはJPY 3,196.91（同期間USD queryはUSD 20.34）。Calendar September RevenueCat proceeds metricはJPY 3,363.77。現行growth baselineより新しいprovider observation。 | MRRはrun-rate point、proceedsはRevenueCat project metric。Apple FINANCIAL settlement/bank receipt/net profitではない。JPY queryの`yaxis_currency=JPY`に対しsymbol-only `unit=$`が返る。local `business-outcomes`ではcurrency/revenue_definition未格納で、CFO ledger/reportへのintegrateも未完。|
| CFO §87-N Apple FINANCIAL / Mobile Task 8 FINANCE_DETAIL crosswalk | mobile candidate source/testはApple child identifier `6762049696` + SKU `ai.anicca.app.ios.yearly.b`をsubscription catalog経由でparent app `6755129214`へ写す候補を保持し、synthetic JPY 4,250 rowのtestがある。CFO側には“Anicca Annual” fiscal rowのreadbackがある。 | `FINANCIAL/ZZ` rowと`FINANCE_DETAIL/Z1` rowの同一性・report/row/evidence crosswalkは未確定。issue #6547はopen・comments 0で、GitHub APIの最新readbackは`author_association=OWNER`と`Daisuke134`の+1 reactionを返し、plan記載のapproval signalはある。ただしunassigned-positive-row partial coverage fix、fresh review、main/release、natural import/provider receiptは未完。JPY 4,250をGrowth revenueに加えない。|
| Mobile plan Task 9/10 | feature branchにはprivate/experimental ASC D7 cohort readback、campaign/product-analytics missing-reason表示のsource/testsがある。保存probe（2026-09-25 cohort）はAnicca/Honne各0/1 D7。 | D7はn=1のexperimental/private sampleでproduction trendではない。Task 10ではAnicca campaign tokenなし、2026-10-03 Mixpanel raw counts 3/1/2にpurchase event/user denominatorなし、Honne report-window mismatch、PostHog credential unavailable。feature branch `1f045eff3d27cfec3945cd8d2dff64f06928c834`にPRはなく、これらはGrowth Task 2/3の同一user funnelやpost→install帰属を閉じない。|

**2026-10-04 22:48 JSTの番号と完了状態:** CFO plan上のTask 1–3は、候補branchでsource/testの実装が完了している。一方、Growth planのTask 1（公開build/offerings/同一ユーザーファネルの基準確認）は未完である。CFO Task 1–3の差分はLife Manager `origin/main`に未統合で、ライブのfresh cash、同一期間のsettled revenue/cost、14/14 loop coverageも未成立。CFO ownerの最新cursorはunified SSOT §87-ACのqueue-order source fix → 正式なpromotion経路 → candidate Financial Managerの自然な日次receiptと同期間replay-zero → 7日連続観測。Growth laneはCFO/Mobile sourceを引き取らず、既存ownerの成果を読取・接続する。

出典: CFO laneのunified SSOT/spec/planは`Daisuke134/life-manager` branch `docs/lm-cfo-cost-observability-spec-20261002` HEAD `641e0f1120a8cfa59dd05ee36f2b2209d98afa9c`（§87-U/V/Z/AA/AB/AC、Task 1–3/8A、current cursor）。現Life Manager `origin/main`は`82d31995e6`（#6585のCapafy article merge）。apps/mobile/anicca-iosは7f90ebc2から差分なし。Mobile laneのcrosswalk/T9/T10 planは`Daisuke134/life-manager` branch `feat/lm-mobile-metrics-20261003` HEAD `1f045eff3d27cfec3945cd8d2dff64f06928c834`。Growthはこれらをread-only consumerとして利用し、各ownerのsource/shared state/provider requestを重ねない。

### 2026-10-05 Mobile Metrics候補branchのreadback

Life ManagerのMobile Metrics candidateはfeat/lm-mobile-metrics-20261003、clean HEAD 1f045eff3d27cfec3945cd8d2dff64f06928c834。候補branchの計画ではTask 1（分母を守るASC store rates）、Task 2（ASC settled proceedsとRevenueCat chart observationの分離）、Task 3（CFO summaryのfunnel/source status表示）はsource/test完了。install_to_paidは同一app・windowのpaid cohortがなくunavailableのまま。これは候補branch上のsource完了であり、Growth Task 1のbuild/offerings/cohort証拠完了や本番運用完了ではない。

保存済みASC Subscription State report（processing 2026-10-04、data window 2026-10-01〜10-03、81 rows）には、Anicca Annual（6762049696）、Anicca Monthly B（6769264298）、Anicca Weekly（6762049888）と旧Annual/Monthly Subscription recordが含まれる。reportのOffer Type/Name欄は空欄で、state metricにはchurnも含むため、aggregate countをcurrent active subscriberやtrial eligibilityとして読まない。Mobile Metrics owner planの既存RevenueCat readbackではproject 1件、app record 8件、6 app IDに21 productがある。これはcatalog coverageであり、live paywall offeringや実checkoutの証拠ではない。根拠: /Users/anicca/.local/state/life-manager/marketing-metrics-daily/evidence/business/2026-10-03/anicca-ios/6755129214-subscription_state.json、candidate plan Task 7 / RevenueCat account readback。

前回のlocal business-outcomes rowは2026-10-05 00:00 JSTに更新され、business_date 2026-10-03 / observed_at 2026-10-04T15:00:23.470913Z。Discovery evidence SHAは20699ca154166f5b2db9f0463c6f5b8baeb235509f1c8dc04362c84c4c2c9b71、Downloads evidence SHAはb49f392b5fa9c70de77d9b6c1716b8dcf0afaa6b56ef58d04490410b1bd81f73で、report windowと値は前回保存分から変わっていない。Mixpanelはunique-user cohortなしのraw 5/1/4、RevenueCat chartは20.34 / Actives 5でcurrencyとrevenue_definitionなし。App Store Salesはavailableだがrow_count 0・proceeds object空で、settled zeroを示さない。PostHogはmissing_project_read_credentialでunavailable。

2026-10-05 fetch時のLife Manager origin/mainは82d31995e6。Mobile Metrics branchはmain-only 24 commits、candidate-only 34 commitsで、PRなし、worktree clean。current mainとのdiffにapps/mobile/anicca-iosは含まれず、変更はapps/life-manager、skills/cfo、marketing producer/Financial Managerと関連tests/evidenceにある。したがってGrowth native onboarding/paywall実装とはファイルownerが分かれており、candidateをこのbranchへcherry-pick/mergeしない。Mobile Metrics ownerがbackend/CFO branchを維持し、Growth/CFO readback laneは同じsource refsをread-onlyで消費する。

Task 8の最後のwhole-branch reviewはfix-firstで、positive unassigned_row_countがFinancial Managerのpartial coverageとして表示されない。Issue #6547はopen・comments 0。現在のGitHub readbackではDaisuke134（repository permission admin）の+1 reactionがあり、PR templateが求めるmaintainer approval signalは満たす。残りはcandidateを最新mainへ追従、partial-coverage regression/fix、最新main上での受入れ再実行、fresh whole-branch ship review、single PR/main integration、immutable release/targeted apply、自然なFinance Detail import、B7/Financial Manager readback、同一occurrenceのCFO provider receipt/readback。candidate planの「maintainer +1 pending」は古い。

この確認ではbranch・issue・既存計画と保存済みlocal business-outcomes/report artifactsをread-onlyで読み、ASC/RevenueCat/provider APIを再取得していない。production/app_store_financialとCFO receiptに関する数値は引き続き直近保存readback（2026-10-04）の時点付き証拠であり、fresh 2026-10-05 measurementではない。Growth Task 1は未完。Task/順序の正本は下記planであり、この節はlane境界と再利用可能な候補証拠だけを記録する。

2026-10-05の最新remote/worktree readback: Mobile Metrics checkout `/Users/anicca/Projects/life-manager-main/.worktrees/lm-mobile-metrics-20261003` はcleanで、HEADは `1f045eff3d27cfec3945cd8d2dff64f06928c834`。Life Manager `origin/main=82d31995e68a5220b7a288318a893866a24c7ea6` よりmain-only 24 / candidate-only 34 commitsで、PRはない。Mobile Tasks 1–3はsource/testの実装まで完了しているが、paid-cohort rateは別Taskの証拠待ち、live Finance Detail productionは未接続、summaryは6アプリ全体のcoverageやsettled proceedsを確立していない。Issue #6547はOPENで、Daisuke134の+1は `2026-10-04T01:11:20Z`。candidate planのcursorは+1 pendingのままなので、担当者がapproval記載を整合する。**並行継続とし、候補branchを引き継いだり変更したりしない。** Mobile Metrics ownerはCFO/backendの受入れとpromotion、Growth laneはこの計画とread-only evidence接続を担当する。ファイル変更は分かれている。provider readとproduction/runtime操作はownerを一人に保ち、このlaneは既存公式refsを読み、重複requestを行わない。このreadbackで確認できるのはrepo状態であり、他agent seatの稼働状態ではない。

最新persisted Anicca local row（business_date `2026-10-04` / observed_at `2026-10-04T18:13:35.541917Z`）は前回の10/03 rowを更新する。保存済みDiscovery Standard reportはwindow 10/01–10/03、43 rows、daily `Impression` Counts 20/14/22、10/01 `Page view` Counts 5、10/02 `Tap` Counts 1で、canonical `evidence_sha256`は`98ce6116378dfd1b7fc3921491dfb0fc5ed443b0ac0a3eb671f8ce65f00a5084`。Downloads Standard reportは10/02 first-time download 1（App Store search / DE / iPhone / version 1.9.4、evidence_sha256 `b49f392b5fa9c70de77d9b6c1716b8dcf0afaa6b56ef58d04490410b1bd81f73`）。同じlocal rowのproduct analyticsはraw app_opened 2 / onboarding_started 1 / onboarding_step_advanced 2で、unique-user cohortやpurchase eventではない。RevenueCat chartはMRR 20.34 / Actives 5だがcurrency/revenue_definitionなし。`app_store_sales`は`provider_query_failed`、PostHogは`missing_project_read_credential`。settled zero、install→paid CVR、net MRRとは読まない。local `business-outcomes.jsonl`全132 rowsに`app_store_financial` sourceはなく、このproceeds rowは現CFO feedへ未import。

Mobile ownerの保存済みofficial `FINANCE_DETAIL/Z1` readbackはone-sale row、settlement date `2026-09-12`、partner share JPY 4,250、report SHA-256 `cbe1dc9242aca2cf049b7ced284a08601bddcef7eafa0a0c4553ea5e53957070`を記録する。`Apple Identifier 6762049696` + SKU `ai.anicca.app.ios.yearly.b` はofficial `asc subscriptions list --app 6755129214`のAPPROVED Anicca Annual subscriptionへjoinし、app mappingは解決した。readbackはMobile Metrics candidate commit `1f045eff3d27cfec3945cd8d2dff64f06928c834`内の`docs/evidence/cfo/2026-10-03-mobile-metrics-readback.md`にある。raw report bytes/refund-adjustment coverageとFINANCIAL/ZZとの共通transaction identityは未確認で、現local `business-outcomes`へのFinance Detail importもない。Growth laneのevidence modelではZ1を唯一のcanonical proceeds row、FINANCIAL/ZZを非加算の同期間/product corroborationとして扱い、二重計上しない。Mobile/CFO ownerによるcanonical採用とFinance Detail importは未完。

### 2026-10-05 ASC private listing metadata access

既存Mobile Metrics owner plan/evidenceと保存済みlocal report inventoryには、現在のhidden keyword field、promotional text、metadata更新日時、localized screenshot/PPO historyのreadback refがない。CloakBrowser `localhost:9222`の新規ASC tabはApple sign-inへ遷移し、既存credentialsで認証後にApple 2FA待ちとなった。通常のSMS認証を選択したが、コード欄は未入力で、private app metadataへのrequestは実行していない。最後に確認したのは`2026-10-04T17:59:33Z`で、今回のreadbackではshared browserを再確認していない。ASCのmetadataは未確認のまま。安全な再開条件はDaisがopen tab上で2FAを完了するか、Mobile ownerが同じASC項目のread-only refsを共有すること。OTPはchat/spec/repositoryへ記録しない。`cua-driver` skillが現在の環境にないため、Messages等の個人通信UIからコードを取得しない。

### 2026-10-05 FastlaneにあるASO metadata候補

Life Manager `origin/main=82d31995e68a5220b7a288318a893866a24c7ea6`には6 localeの `apps/mobile/anicca-ios/fastlane/metadata/<locale>/keywords.txt` がある。全ファイルは `0e0758d7f7`（2026-09-17、iOS source co-location）で追加された。

| locale | tracked keyword candidate | 文字数 |
|---|---|---:|
| ja | `アファメーション,引き寄せ,自己肯定感,セルフケア,自己愛,マインドフルネス,不安,瞑想,癒し,眠り` | 50 |
| en-US | `affirmation,manifestation,self love,self care,positive,mindfulness,anxiety,calm,gratitude,sleep` | 95 |
| de-DE | `Affirmation,Manifestation,Selbstliebe,Selbstfürsorge,Achtsamkeit,Angst,Ruhe,Dankbarkeit,Schlaf` | 94 |
| fr-FR | `affirmation,manifestation,amour de soi,soin de soi,positivité,pleine conscience,anxiété,calme` | 93 |
| es-ES | `afirmaciones,manifestación,autocuidado,amor propio,positividad,mindfulness,ansiedad,calma,gratitud` | 98 |
| pt-BR | `afirmação,manifestação,amor próprio,autocuidado,positividade,mindfulness,ansiedade,calma,gratidão` | 97 |

文字数はファイルのUnicode code point数で、ここではApple field limitへの適合判定をしない。Fastlane docsは `<metadata_path>/<locale>/keywords.txt` をApp Storeのkeywords fieldへ対応付けている。[Fastlane Deliver](https://docs.fastlane.tools/actions/deliver/)

同じ `Fastfile` の `ios upload` laneは `upload_to_app_store(skip_metadata: true)` を指定する。一方 `ios submit_review` は `deliver(skip_metadata: false, skip_screenshots: true)` を呼び、`full_release` はupload→wait→submit_reviewを連結する。したがって `ios upload` だけではmetadataは送られず、submission laneはcandidate値を送る可能性のある経路だが、実行receiptやASC readbackは見つかっていない。source/CI検索ではFastfile以外の実行callerは見つからず、READMEと古いplanのコマンド記載は実行証拠ではない。Tracked Fastlane treeに `promotional_text.txt` はなく、hidden keywords・promo text・update time・PPO historyの現行値は未確認。public App Store pageはversion 1.9.4 / June 25と表示し、metadata candidateは2026-09-17にrepoへ追加されたが、現live値とは推定しない。

## 継続調査の基準表

以下は既存担当文書とlocal artifactの読取で更新する。担当の公式API観測と、私が独立に再取得した観測を混同しない。

| 対象 | 確認できること | 残る確認 | 既存の根拠 |
|---|---|---|---|
| 公開アプリ | 担当のpublished auditはAnicca/Honne/Dhamma Quotes/Sleep Reset/STUDIO CHERIE/Thankfulの6件。旧CFO rosterの未公開4件とは別 | 最新の公式refs/hash共有 | mobile設計のProvider observations |
| locale別public IAP表示 | US: Annual Plan $59.99 / Anicca Monthly $9.99 / Annual Retention $29.99 / Weekly Premium $7.99 / Annual Premium $29.99 / Monthly Plan $12.99。JP: Monthly Plan ¥2,000 / Annual Plan ¥10,000 / Annual Premium ¥5,000 / Anicca Monthly ¥1,500 / Annual Retention ¥5,000 / Weekly Premium ¥1,300。DE: Anicca Monthly €9.99 / Annual Retention €34.99 / Weekly Premium €8.99 / Annual Premium €34.99 / Annual Plan €69.99 / Monthly Plan €14.99。 | Public IAP recordは購入画面のlive RevenueCat offering、ASC subscription parent mapping、trial eligibilityを証明しない。重複名称/価格をactual checkout refsと照合するまで価格実験の基準にしない | [US](https://apps.apple.com/us/app/id6755129214)、[JP](https://apps.apple.com/jp/app/id6755129214)、[DE](https://apps.apple.com/de/app/id6755129214) |
| ASC acquisition | 既存feature branchはreport日付の交差と分母0/期間不一致を扱い、6公開アプリを対象にする。追加4件は担当観測でreport_pending。Apple定義ではDiscovery `Counts`はtotal events、`Unique Counts`はrowごとのunique users、Discovery Impression eventはpage viewを含まない。一方Analytics `Impressions (Unique Devices)`にはunique product page viewsが含まれる。保存済みStandard Discovery reportでは10/01にImpression 12行・Counts合計20、Page view 3行・Counts合計5。rowごとのUnique Countsは全体unique audienceではなく、Rork Analytics common-windowは10/01に5 unique impressions / 0 unique page views。 | Page view total5とAnalytics unique page views0の差は同じ指標/segmentではない。Discovery row単位のUnique Countsを合計せず、同一Detailed request refsとfresh owner outputで照合する。 | 同設計のAcquisition/Acceptance、`/Users/anicca/.local/state/life-manager/marketing-metrics-daily/evidence/business/2026-10-03/anicca-ios/6755129214-discovery.json` evidence_sha256 (canonical JSON) `20699ca154166f5b2db9f0463c6f5b8baeb235509f1c8dc04362c84c4c2c9b71`; file-byte SHA256 `46e3e18e47cf0c7c28f78a18164374d9572be6df9027eadd7ffec12062977d44`、[Apple Discovery report](https://developer.apple.com/documentation/analytics-reports/app-store-discovery-and-engagement)、[Apple metric definitions](https://developer.apple.com/help/app-store-connect-analytics/reference/metrics-definitions) |
| Rork page-view enum mismatch | mobile owner branch `feat/lm-mobile-metrics-20261003` / HEAD `1f045eff3d27cfec3945cd8d2dff64f06928c834` の`rows()`はTSV値をそのまま保持し、集計は`row.Event === "Page View"`だけを採用。fixtureも`Page View`。保存済みのApple Standard Discovery reportは`Event="Page view"`を3行で記録し、Countsは1/3/1（合計5）。このreportと現行sourceのcase-sensitive enum不一致は確認済み。 | 同じowner Detailed requestのraw outputがこのpredicateで落ちたこと、focused regression、修正後same-request fresh readbackは未確認。Standard reportの値だけでDetailed requestのproduction mapping repairやRork 0の確定原因と断定しない。Growth laneはcollectorを編集しない | `/Users/anicca/Projects/life-manager-main/.worktrees/lm-mobile-metrics-20261003/apps/life-manager/scripts/marketing-asc-acquisition.js:35,252-253`、同`marketing-asc-acquisition.test.js:43`、保存済みStandard report path; business-outcomes `evidence_sha256` (canonical JSON) `20699ca154166f5b2db9f0463c6f5b8baeb235509f1c8dc04362c84c4c2c9b71`; file-byte SHA256 `46e3e18e47cf0c7c28f78a18164374d9572be6df9027eadd7ffec12062977d44` |
| ANICCAの公開store面 | 2026-10-04T18:30Zの最新metadata readback（公開versionは1.9.4のまま; screenshot visualは10/04監査）: US title `Daily Affirmations - Anicca`, subtitle `Affirmations, Calm & Self-Love`, version1.9.4 (Jun 25), rating overview表示に件数不足。JP title `毎日のアファメーション - アニッチャ`, subtitle `自己肯定感・名言・瞑想・感謝・ポジティブ`, 47 ratings。DE title `Affirmationen - Anicca`, subtitle `Eine Zeile bei Bedarf`。3 localeとも6言語対応と表示。IAP一覧はlocaleごとに異なる価格/名称を表示し、legal subscription textはAnicca Pro Monthly/Annualの2種だけを記す。 | 公開1.9.4 binaryとの訴求一致、各localeのlocalized screenshots、ASC metadata/keyword/promo history、IAP6件と実際のASC/RevenueCat live offering・checkoutの対応。表示IAPを現行offerと見なさない | [US App Store listing](https://apps.apple.com/us/app/id6755129214)、[JP App Store listing](https://apps.apple.com/jp/app/id6755129214)、[DE App Store listing](https://apps.apple.com/de/app/id6755129214)、[Apple app information limits](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information) |
| 公開版とcurrent sourceのbuild対応 | `anicca-products origin/main` `48e2cbd4`の`aniccaios.xcodeproj/project.pbxproj`はiOS target `MARKETING_VERSION=1.9.5`, `CURRENT_PROJECT_VERSION=365`, bundle `ai.anicca.app.ios`。Life Manager `origin/main` `82d31995e6`も同値（7f90ebc2以降、当該iOS project設定の差分なし）。local ASC App Downloads Standard row（business date 2026-10-03のsaved snapshot内）は2026-10-02 first-time download 1、App Store search、App Version 1.9.4、DE/iPhoneと記録。2026-10-05 crwlでも公開App Store pageは1.9.4のまま | build 365/1.9.5と公開1.9.4・download row versionの正確なASC build/version mapping、1.9.5の現在のASC state。source mainのversion設定だけでは公開済みbinaryを証明しない。既存ownerのASC refsを待つ | `aniccaios/aniccaios.xcodeproj/project.pbxproj` on `anicca-products@48e2cbd4` and `life-manager@82d31995e6`; local `6755129214-downloads.json`; [US App Store listing](https://apps.apple.com/us/app/id6755129214) |
| 公開ASO素材 | 2026-10-04T12:24ZのUS pageでiPhone 6.7-inch screenshots `APP_IPHONE_67_01..04`が4枚見える。見出し順は「Personalized Affirmations」「Reminders to Stay Positive」「Choose From 8 Themes」「Change How You Think」。1/2/4枚目はaffirmation card中心で見た目が似ており、3枚目はtheme picker。descriptionは13 self-care themesと、AIが必要な時間を学び通知する旨を主張する。titleは27/30文字、subtitleは30/30文字で各30文字上限内。2026-10-05 metadata-only crwlでも版と言語別訴求は更新なし。screenshotのvisual readbackは10/04分。promo textの有無とpreview videoは取得pageでは確認できない | 8と13の差、およびAI timing/voice/adaptive-learning claimsが公開版で真に動くかをsource ownerで確認する。別locale/deviceの素材、metadata history、PPO eligibility/trafficは未確認。機能確認前にcopyを直さず、keywords fieldでtitle/subtitle/categoryと重複語を避ける。最初の3枚を転換実験の中心に置くが、十分なtraffic/sampleなしに勝者を宣言しない | [US App Store listing](https://apps.apple.com/us/app/id6755129214)、2026-10-04 public screenshot readback、[Apple App Store search](https://developer.apple.com/app-store/search/) |
| install→paid | 既存branchのD7はprivate/experimental endpointで、成熟日/同一app/date/整数payer/分母を検証する。小標本を効果としない | 十分なコホートと公開された計測経路 | 同設計のD7 contract |
| Mobile Task 9 D7 cohort | owner feature branchのprivate/experimental cohort readbackは2026-09-25 mature cohortでAnicca/Honne各0/1 D7。2026-09-26 Anicca cohort n=3は当時cutoff前だったが、2026-10-04時点ではmature ageに到達 | 成熟後のfresh owner readbackはまだ受領していない。n=1/3はtrend/production CVRを証明しない。Mixpanel step/user identity、D35/renewalも未確認 | Mobile plan Task 9、`feat/lm-mobile-metrics-20261003` HEAD `1f045eff3d27cfec3945cd8d2dff64f06928c834` |
| RevenueCat/Apple | 担当branchにはcurrency/roster/mobile freshness/Finance Detailの子ID→親app mapping修正がある。本番import完了とは別 | 現行offering、実購読イベント、production receipt接続 | 同設計のCFO source contract |
| CFO RevenueCat direct readback | direct API v2 readbackはAnicca iOSのcomplete period 2026-10-03 MRR JPY 3,196.91（同period USD query USD 20.34）、calendar September `proceeds` JPY 3,363.77を報告する | MRRはrun-rate、proceedsはRevenueCat metricで、Apple FINANCIAL settlement/bank/net profitではない。JPY queryのexplicit currencyはJPYだが表示unit `$`と矛盾。CFO ledger/reportへの取り込み、Apple payout、会社全体netは未完 | `Daisuke134/life-manager@9bf6abfd601eb9e2360524a1d0f157c2fb519d28:docs/evidence/mobile/2026-10-04-revenuecat-live-readback.md`、CFO SSOT §87-Q |
| FINANCIAL/FINANCE_DETAIL crosswalk candidate | 2026-10-05に保存済みApple `FINANCIAL/ZZ` rowを照合: fiscal period 2026-08-30–2026-09-26、Apple Identifier `6762049696`、SKU `ai.anicca.app.ios.yearly.b`、Anicca Annual、quantity 1、sale、customer price JPY 5,000、partner share JPY 4,250。既存owner `FINANCE_DETAIL/Z1` readbackは同じ子ID/SKU/title/period/partner shareとtransaction/settlement date 2026-09-12を記録する | period/product/amountは一致するが、両reportに共通transaction/order/return keyもZ1のraw full row/refund-adjustment evidenceもなく、同一取引の証明にはならない。独立read-only reviewはsame-transaction claimをHOLD。二重計上しない。Growth laneのevidence modelではZ1を唯一のcanonical proceeds source、FINANCIAL/ZZを非加算のcorroborationとして扱う。Mobile/CFO ownerのcanonical採用・coverage・import・CFO receiptへの接続は未完のため、CFO totalへは加えない。issue #6547 partial-coverage fix、main/release、natural import/provider receipt、24 app ID coverageも未完 | local compressed artifact `/Users/anicca/.local/state/life-manager/asc-finance.o6lcSp/report.tsv.gz` SHA-256 `cf6aec69bc83c40d9b4f389c4ad4b61a4df3a7dbb08e30f43a123a918ce9098e`; owner Z1 evidence SHA-256 `cbe1dc9242aca2cf049b7ced284a08601bddcef7eafa0a0c4553ea5e53957070` in `Daisuke134/life-manager@1f045eff3d27cfec3945cd8d2dff64f06928c834:docs/evidence/cfo/2026-10-03-mobile-metrics-readback.md`; fresh reviewer snapshot same commit; Mobile plan Task 8/issue #6547; CFO SSOT §87-N/§87-Q |
| アプリUX | anicca-products origin/main `081eeb2e6fc9b44087eb4439e81951fa30c2cb9c`で10-step→2-step paywall、個別画面の固定文、表示イベント二重送信を再確認 | 公開1.9.4 build/ソース対応、live画面 | 既存Swift source |
| product analytics | 前回Anicca保存rowはbusiness_date 2026-10-03 / observed_at `2026-10-04T15:00:23.470913Z`。Mixpanel raw totalsは`app_opened=5` / `onboarding_started=1` / `paywall_primer_viewed=4`, rows10。RevenueCat chartは2026-10-03 MRR20.34/Actives5だが通貨と`revenue_definition`なし。App Store Sales sourceはavailableだがrow_count0・proceeds object emptyでありsettled zeroとは扱わない。PostHogは`missing_project_read_credential` | first-openのunique分母、段階/時間/購入のuser join、RC chart通貨/定義、ASC Salesの正式receipt/settlement、PostHog read credential | `/Users/anicca/.local/state/life-manager/marketing-metrics-daily/state/business-outcomes.jsonl`、同`6755129214-sales-2026-10-03.json` |
| CFO/mobile analytics snapshot | Mobile plan Task 10のAnicca 2026-10-03 Mixpanel snapshotはraw `app_opened=3` / `onboarding_started=1` / `paywall_primer_viewed=2`。CFO planはpurchase event/user cohort denominatorなし、Anicca campaign tokenなしと報告する | Growth local rowの5/1/4は別snapshot。rowsやeventsを合算せず、どちらもstep conversion/purchase rateではない。campaign-to-ASC attribution unavailable | `Daisuke134/life-manager@9bf6abfd601eb9e2360524a1d0f157c2fb519d28:docs/superpowers/plans/2026-10-03-mobile-app-metrics-funnel.md` Task 10 |
| PostHog | 同保存行はmissing_project_read_credential | 所有者経路で既存project readを解決 | 同保存行 |
| 配信receipt census | current strict rolling 28d window（2026-09-06T14:26:22Z〜10-04T14:26:22Z）の`product_id=anicca-ios` / `status=published` / unique `provider_post_id`は557件（Instagram229/TikTok231/YouTube97）。前回11:34Z cutoffの562件とは窓が異なるため同数比較しない。最新published receiptは11:17:22Zで、このreadbackまでAniccaの新しいpublished receiptなし | 次の更新では新しいcutoffを明記し、別windowのcountを同一basisとして扱わない。click/campaign token/ASC acquisitionへのjoinはない | `/Users/anicca/.local/state/life-manager/marketing/receipts.jsonl`、個別receipt store `/Users/anicca/.local/state/life-manager/marketing/receipts/` |
| 投稿別metrics sample | 2026-10-04T14:26:22Zのstrict-window readbackは97 unique Postiz IDsのうち93件をpublished receipt `provider_post_id`へplatform別exact join。397 mature posts中46件にin-window 168h checkpoint（32 measured/14 unavailable）があり、46/46 raw hashesがprovider-response journalに一致し、46/46 native IDsが最新resolved publication-identity rowに一致。測定値はInstagram10 posts reach sum8,331/views11,586、TikTok8 posts views311、YouTube14 posts views7。 | per-post sumsはunique audienceではない。impressionsはnull、click schemaはなく、ASC install/paid joinもない。fresh rowsはmetrics 13:42Z、identity 14:22Zまで。 | `/Users/anicca/.local/state/life-manager/marketing-owner-events/state/post-metrics.jsonl`、`evidence/metrics/provider-responses.jsonl`、同`state/publication-identity.jsonl` |
| Task3 current local-journal diagnostic | Last Anicca-specific diagnostic remains cutoff 2026-10-04T16:14:47Z: 557 published provider IDs (IG229/TT231/YT97), 98 Anicca metrics IDs/94 exact receipt joins, 57 in-window 168h candidates, 53 receipt-bound (37 measured/16 unavailable), 53/53 response hashes and latest identity matches. New saved portfolio collector summary observed 2026-10-04T17:26:07Z (native-metrics-latest.json SHA-256 1336ae5eda76b36b9e3932cd7745b05f4e373361097aa1d2b144d10573114889): eligible835, ledger_rows905, new_rows0, excluded ambiguous2/error21/unresolved47. Read-only native_metrics.py plan at 17:38:30Z returned due0/missed0 across all products. Neither aggregate proves Anicca D7 values, unique audience, ASC install or paid attribution. | The local journals changed after the historical 14:26Z cutoff and still lack per-row ingestion time, so the 46-vs-53 snapshots are not the same basis. Latest collector added no metrics rows. Preserve exact current file hashes/mtime and re-read with the owner’s immutable query before comparing; do not convert missing acquisition/paid joins to zero. | post-metrics.jsonl SHA-256 527895f50996b18d62d433c0653caf7b5835e440b4fce50e5c68190c4f49a6aa (mtime 17:18:17Z, 3042 rows); provider-responses.jsonl SHA-256 9696da4b6e10f38438668ecaf283d80f9b27f4597d781be3f9a90d6debfaea40 (mtime 17:18:17Z, 3042 rows); publication-identity.jsonl SHA-256 5fece387ebbeef116b43d1cf7719332418906912635b3dd823c725cdc59c99f5 (mtime 17:26:03Z, 905 rows); native-metrics-latest.json; local read-only planner command
| Platform metrics readers | Latest read-only lm-loop status at 2026-10-04 17:38Z shows Instagram and TikTok both loaded-idle, exit75, resource_effect_unknown, no provider_receipt_id/official_readback_ref, next action retry_after_eligibility. Current installed release SHA is 9a76dcc87dfe2e24958ef19f6a69f871df4dbef1 for Instagram and 82d31995e68a5220b7a288318a893866a24c7ea6 for TikTok. Last attempts remain Instagram 17:17:29Z and TikTok 17:16:03Z. | This remains an external-effect fence, not permission to retry. No wake, replay, or fence-close. The prior 16:12Z adapter diagnosis and 09/27 destination-matched negative chat-history readback remain historical evidence; neither supplies an occurrence-bound receipt. | sanitized bin/lm-loop status readback; old claim life-manager-instagram-metrics:18d9127d765110d8-47098; prior tg_user.py and owner-report readback
| Aniccaの現行獲得 | 前回保存rowはobserved 2026-10-04T15:00:23Z。10/01 App Store Discovery Standard rawはImpression 12 rows / Counts20、Page view 3 rows / Counts5（row Counts 1/3/1）。Downloads Standard report processing 10/04は10/02 first-time download1、version1.9.4、App Store search、DE/iPhone。Rork common-window 10/01 is 0 first-time downloads / 5 unique impressions / 0 unique page views。CFO `collectProduct()` is a separate 09/30..10/02 aggregate: DL1 / total impressions16 / unique11 / pageviews0 / unattributed. | Discovery `Unique Counts`はrow-level valuesで、全体unique audienceには合算しない。report windows/definitionsが違うためCVRは未算出。Detailed request raw/fix/fresh readbackと、CFO aggregateのsource-level dates/segmentsを既存owner refsで照合する | local `business-outcomes.jsonl`、`6755129214-discovery.json` evidence_sha256 `20699ca154166f5b2db9f0463c6f5b8baeb235509f1c8dc04362c84c4c2c9b71`; `6755129214-downloads.json` evidence_sha256 `b49f392b5fa9c70de77d9b6c1716b8dcf0afaa6b56ef58d04490410b1bd81f73`; CFO branch `9bf6abfd601eb9e2360524a1d0f157c2fb519d28` §87-B |
| 保存済みASC Purchases/Subscription Events | App Store Purchases Standard (processed 2026-09-18)は09/07にapp `6755129214` / content `6762049696`のin-app purchase 1、Sales USD31.40 / report Proceeds USD26.69 / Paying Users1を記録。Subscription Event Standard (processed 2026-09-15)は09/12に同subscription ID `6762049696`のfull-price start activation 1を記録する。 | これは異なるreport/dateの集計でsame-user joinではなく、Purchase reportのproceedsはApple FINANCIAL settlement/bank receiptではない。Fiscal `FINANCIAL/ZZ`と`FINANCE_DETAIL/Z1`の同一行照合や現行renewal/MRRも証明しない。金額をRevenueCat/事業netへ加えない | `6755129214-purchases.json` evidence_sha256 `eb0c76a76ee18112173fc57bd0f1b809fc3de86e7f1232d206159cea9488201c`; `6755129214-subscription_events.json` evidence_sha256 `c338d96d24ff7dcc77475bb18ba597c97a5ead185e77c477e843971942078068` |
| CFO direct ASC acquisition aggregate | production `collectProduct()` read-only snapshot (2026-10-04 11:56–11:57 JST)はAnicca iOS、combined data window 2026-09-30..10-02 / processing date 10/03、first-time downloads 1 / total impressions 16 / unique impressions 11 / product page views 0。Attributionは`unattributed`、campaign metricsは`unavailable: not configured` | source別data_from/data_toがsnapshotに残らない。10/01 Standard reportのImpression 20 / Page view 5と未reconcileで、campaign/post/user cohortではない。1/11や1/16をcohort conversionにしない | `Daisuke134/life-manager@9bf6abfd601eb9e2360524a1d0f157c2fb519d28:docs/evidence/mobile/2026-10-04-asc-acquisition-readback.md` / CFO SSOT §87-B |
| 全アプリの獲得に関する依頼者の現状認識 | 依頼者は「全アプリ合計で1日約3 install」と報告 | app別内訳、期間、公式sourceの一致が未確認。ASC基準値として使わず、Task 1で照合する | 2026-10-04の依頼者発言 |
| Aniccaの月額換算指標 | 前回local `business-outcomes` row (`2026-10-04T15:00:23Z`)は2026-10-03 period USD20.34/Actives5だがcurrency/revenue_definition欠落。CFO direct readbackでは同period MRR JPY3,196.91 / USD20.34、September `proceeds` JPY3,363.77 | provider chart unit/currency mismatchとlocal projection欠落は未解消。値はいずれもMRR/provider revenue metricであり、Apple settled proceeds/bank/net profitではない | mobile design §Provider observations、local `business-outcomes.jsonl`、CFO §87-Q / `2026-10-04-revenuecat-live-readback.md` |

rawイベント件数から離脱率を計算しない。primer4/started1のような値は再訪/再表示/取得windowを含みうるため、400%のconversionや3人の新規購入と解釈しない。ASC Discoveryのrowごとの`Unique Counts`を合計してoverall unique audienceにしない。Rork Analyticsのunique metricとDiscovery totals、Downloads reportはそれぞれ定義・日付・分母を保ったまま照合する。具体的な離脱箇所は未確認のまま残す。

Source inference: fresh `collectProduct` readbackのpage-view 0は、Apple enum `Page view`をowner collectorが`Page View`として比較しているため落とした可能性が高い。根拠は、同じowner branchのTSV parserにcase normalizationがなく、metric predicateとtest fixtureがともに大文字Vを要求し、Appleの公式enumと既存raw Standard reportの値は小文字vであること。Detailed reportの実際のpayloadと同じrequestの再readbackはmobile ownerが確認する。

今回のUS listingでは、似た名前の月額/年額IAPが複数あり、掲載価格も週$7.99〜年$59.99にまたがる。これは公開pageで確認できた事実で、購入画面に同じ選択肢が表示される証拠ではない。Inference: 年額/継続offerの名前と価格が実際のpaywallでも整理されていなければ、価値提案を読む前に選択を難しくする可能性がある。実購入画面とlive offering mappingを確認してから、ASO/paywallのどちらを変えるか判断する。

投稿metricsの前回受入れ済み168h strict-window sample（cutoff 2026-10-04T14:26:22Z）は397 mature posts中46 checkpoint、32 measured/14 unavailable。Instagramは19 checkpoint（10 measured）でper-post reach合計8,331/views11,586、TikTokは13 checkpoint（8 measured）でviews311、YouTubeは14 checkpoint（14 measured）でviews7。raw response hashとlatest resolved publication identityは各46/46一致する。reach/views合計は投稿間deduplicated audienceではなく、platform間で同じmetric定義でもない。impressions値はこのsampleで全てnull、click metricはschemaになく、ASC install/paid同一user joinもない。

同じ14:26Z in-window sampleのreceipt metadataでは、IGの10 measured postsは4つのmedia/caption hash組（5/3/1/1）、TikTokの8 postsは1組、YouTubeの14 postsは5組（5/5/2/1/1）だった。Inference: TikTok measured sampleは同一media/captionを反復しており、新しいplatform-native assetとの一変数比較が次のdistribution test候補になる。小標本とprovider per-post valuesであり、hashだけでは因果効果を示さない。既存cadenceは維持し、追加volumeやplatform budget変更の根拠とはしない。

local metrics snapshotがあるため、投稿→platform reach/views sample pathは部分的に閉じた。一方、Instagram/TikTok metrics readerには別の`resource_effect_unknown` fenceが残るため、readerの状態とは分ける。旧Anicca ASC Analytics 10/01 readbackは0 first-time downloads/5 unique impressions/0 unique page viewsだが、page-view zeroはowner collectorのenum mismatch候補があり、修正とfresh readbackまではstore conversionに使わない。post→qualified reach→store acquisitionは依然未測定で、campaign token/account/new publisherは追加しない。

既存mobile設計の参照元は `/Users/anicca/Projects/life-manager-main/.worktrees/lm-mobile-metrics-20261003/docs/superpowers/specs/2026-10-03-mobile-app-metrics-funnel-design.md`、読取SHAは `1f045eff3d27cfec3945cd8d2dff64f06928c834`、文書SHA256は `1833426e22112a84b39c80dc3566c316353ced30f228980475cdebd6db87af26`。local sourceは `/Users/anicca/.local/state/life-manager/marketing-metrics-daily/state/business-outcomes.jsonl`、配信journalsは `/Users/anicca/.local/state/life-manager/marketing/{receipts,jobs}.jsonl`。原文payload、credential、個人IDはコピーしない。

前回のCFO監査で見つけた10対6 scope/hash/完全一致時刻の問題は旧handover/loaded sourceの所見である。既存mobile feature branchの修正を読まずに同じ修復を始めない。CFOのsettlement/actual cost/runwayと、このgrowth基準表を別成果として保持する。

## 現状の証拠

### 前回の外部観測

以下は前セッションのASC CLI観測。保存したrawレポートは一時ファイルであり、このブランチには存在しない。現在の状態として扱う前にTask 1で再取得する。時点が違う数字を同一コホートと扱わない。

| 観測 | 前回の結果 |
|---|---|
| ASC登録 | 24件、うち6件にREADY_FOR_DISTRIBUTION版あり。地域別販売可否とは別 |
| ANICCA | app `6755129214`、bundle `ai.anicca.app.ios`、配布可能版1.9.4、1.9.5はREJECTED |
| 9月初回DL | 全体62、ANICCA30。type1/1Fを集計し更新/IAPを除外 |
| ANICCA国別DL | JP24、DE1、US1、CL1、IN2、GB1 |
| 9月ANICCA年額購入 | 1件、販売額JPY5,000、Appleレポート上Developer Proceeds JPY4,250 |
| 9月Honne年額購入 | 1件、販売額JPY6,000、Developer Proceeds JPY5,100 |
| 9/21〜9/27 ANICCA | DL8、Impression522、Page view47 |
| 同週Impression内訳 | Search516、Browse6。SNS全体の到達数ではない |
| 同週Page view内訳 | Search28、App referrer11、Browse8 |
| PPO | 実験7件、すべてSTOPPED |

ページ閲覧47とDL8は同一ユーザーの一本道ファネルではない。検索結果からの直接DLもあるため8/47をPPOの正式なCVRとしない。年額入金をそのままMRRへ入れず、MRR、売上、Developer Proceeds、入金確定、利益を分ける。

### mainの実コードで再確認した所見

- `aniccaios/aniccaios/Onboarding/OnboardingFlowView.swift`は10段階の`OnboardingStep`を表示し、`PaywallFlowContainer`へ進む。コメントの11段階表記は実列挙と違う。
- `ContentView.swift`は`isOnboardingComplete == false`なら`authStatus`を判定する前に`OnboardingFlowView`を表示する。したがって未ログインの初回ユーザーもsource上はonboarding/paywall経路へ入れる。これはcurrent mainのsource pathであり、公開1.9.4 binaryとの対応は未確認。
- `OnboardingFlowView`はwelcome表示時に`onboarding_started`、step移動ごとに`onboarding_step_advanced`を送る。最後のNotifications stepではpaywallを表示する前に`onboarding_completed`を送るため、このeventは有料化を意味しない。close経路は`onboarding_paywall_dismissed_free`を送る。
- `Onboarding/OnboardingBibleViews.swift`の`PaywallFlowContainer`はprimer→`PaywallVariantBView`を表示し、閉じるボタンを常時出す。
- 別の`Onboarding/PlanSelectionStepView.swift`はPostHogの`hard_paywall`を読むが、この呼び出し経路で使われているとは言えない。公開1.9.4のbuildとソースの対応は未確定。
- `Onboarding/PaywallVariantBView.swift`のonAppearは`.paywallPlanSelectionViewed`を直接送信し、同じイベントを送る`AnalyticsManager.trackPaywallViewed()`も呼ぶ。
- 購入成功後はpaywall viewからclient event `onboarding_paywall_purchased`、RevenueCat customer-info delegateから`purchase_completed`が別々に送られる。delegateは`trackPurchaseCompleted`にcached packageの価格、またはfallback `$9.99`を渡す。これらはserver-confirmed transaction/settlementではないため、同じ購入を分析上二重に足さない。RevenueCatはその後`syncNow()`を呼ぶ。
- `Services/SubscriptionManager.swift`の購読更新delegateには、取引IDによる新規購入の重複防止が見えない。実際の重複発生は未測定。
- PostHogはapp launch時に`Purchases.shared.appUserID`でidentifyされる。Mixpanelの`identify(userId:)`は`AuthCoordinator` loginから呼ばれる`AppState.updateUserCredentials()`時だけ実行される。現行sourceにMixpanel aliasや明示的なcross-source user bridgeは見当たらない。Inference: 保存済みaggregateではlogin前の匿名Mixpanel eventをRC/App Store customer eventへ安全に結合できず、実SDK/backendのidentity mergeとlogin時期は未確認。
- `Onboarding/PersonalizedInsightStepView.swift`は回答を参照せず、固定のlocalized文字列を表示する。
- Mixpanel、PostHog、RevenueCatは既存導入済み。導入済みと受信・正しい集計を区別する。
- `aniccaios/aniccaiosTests/OnboardingV2Tests.swift`には現enumにない旧case名への参照がある。既存テストがそのまま有効だとは仮定しない。実行時にtarget inclusionとbaselineを確認する。

### Source-onlyの計測重複修正

- 旧candidateは`Daisuke134/anicca-products` mirror branch `fix/anicca-paywall-event-dedupe-20261004-growth` / commit `76cf8b6e5968f958ee837318d68b6842386f4eb2`にあり、`PaywallVariantBView.swift`の直接event送信1行を削除している。テストなし、PRなし、公開buildでの受信証拠なし。このmirror branchはsource authorityでないため統合しない。
- 同一source fileはcurrent canonical `Daisuke134/life-manager@82d31995e6`にも存在（同ファイルは7f90ebc2から変更なし）し、現在の`onAppear`は`.paywallPlanSelectionViewed`と`trackPaywallViewed()`の両方を呼んでいた。Growth Task2aのcanonical fixはLife Manager branch `fix/anicca-paywall-view-dedupe-20261005` / commit `3fee4d6cec74fdd469237a30b880106411c46f26`で直接送信1行だけを削除し、helperと`hasTracked`を保持する。`trackPaywallViewed()`はイベントを1度送り、SKAN conversion value 2を更新する。
- Active flowはOnboardingFlowView→PaywallFlowContainer→PaywallVariantBView。`PlanSelectionStepView`のhard flagはこの呼び出し経路に含まれない。Public 1.9.4/build mappingは未確認で、source-only fixをproduction effectと扱わない。
- Independent read-only review of Life Manager base `82d31995e68a5220b7a288318a893866a24c7ea6` → head `3fee4d6cec74fdd469237a30b880106411c46f26` found no Critical/Important issue. Offline source-call-graph check confirms origin/main has two send paths and the branch has one; `swiftc -frontend -parse` and `git diff --check` pass. Xcode 26.6 has no simulator runtime, `build-for-testing` failed at destination selection (exit 70), and focused test dependency checkout failed for low disk (exit 74, 531 MiB at that attempt). No actual event count/public receipt is proved; branch is pushed but not PR-merged/released.
- Reviewer also noted `PlanSelectionStepView.swift` contains an event call; a fresh search of canonical Swift files found only its type declaration and no active call site. Leave it unchanged; if a future flow uses it, re-audit its event path before enabling that flow.

### 未確認事項

現在のMRR、匿名IDとRevenueCat IDの対応、段階別離脱、実験の割当、offeringsとトライアルの稼働設定、投稿別reach/クリック/購読帰属、無料/有料の実提供差分、81%改善主張とレビュー引用の根拠は未確認。未確認を0、未稼働、故障と断定しない。

## 公開ASOの暫定監査

**対象:** US listing `https://apps.apple.com/us/app/id6755129214`。metadataは2026-10-04T18:30Zに再readback、screenshot visual auditは2026-10-04分。AniccaはChallenger tier（public rating overviewがなく、広いブランド認知や大きなinstall baseを示す公開根拠がない）。これは公開面の監査で、App Analyticsのconversionやkeyword順位を測った結果ではない。

| Dimension | Score | Grade | 根拠 |
|---|---:|:---:|---|
| Title & Subtitle | 5/10 | C | 主語のkeywordはあるが`Affirmations`が両方に重複し、subtitleの30文字を使い切る。keyword fieldは非公開。|
| Description | 6/10 | C | 冒頭の価値訴求と見出し構成はある。social proof/明確なCTAがなく、timing/AI personalizationの具体的約束は製品対応未確認。|
| Visual Assets | 4/10 | D | iPhone 6.7-inchは4枚。見出しはあるが、1/2/4枚目が似たカード画面。first-threeの独立した価値storyになっていない。iconは文字なしの青緑ringで落ち着いた印象だが、affirmation機能は読み取りにくい。preview videoは取得pageで確認できず。|
| Ratings & Reviews | 0/10 | F | Appleはoverview表示に十分なrating/review数がないと明記。0点はrubricの「評価不能」であり、実ratingsが0という意味ではない。|
| Metadata & Freshness | 5/10 | C | Health & Fitness、6言語、13+。公開版1.9.4はJun 25表示で約3か月前。locale別素材、ASC promo text、in-app eventsは未確認。|
| Conversion Signals | 4/10 | D | Free + 6件のIAP価格が掲載されるが、legal subscription textはMonthly/Annualの2種類だけを説明し、live checkout/offer mappingやsocial proofは未確認。|
| **Weighted overall** | **38/100** | **D** | Weighted sum: `(5×.20 + 6×.15 + 4×.25 + 0×.20 + 5×.10 + 4×.10)×10`. Ratingを評価不能として0にしたrubric依存の暫定値。|

**Top 3 quick wins（準備・確認のみ）:**

1. **8 vs 13 themesを実機能で照合する** — 公開build/source ownerのtheme catalogを見てから、screenshotかdescriptionの片方を正しい数へそろえる。確認前のcopy変更はしない。
2. **ASC keyword fieldをreadbackする** — title/subtitle/categoryで既使用の語を除き、残る100文字枠の利用状況を棚卸しする。Appleはtitle/subtitle/keywords/primary categoryのtext relevanceを検索要因に挙げ、keyword field内で重複語を避けるよう案内している。[Apple App Store search](https://developer.apple.com/app-store/search/)
3. **IAP名と購入画面を対応づける** — public listの6件とAnicca Pro Monthly/Annual表記を、既存ASC/RevenueCat ownerのlive offering/checkout refsと照合する。掲載額を実購入条件とみなさない。

**具体的な所見と提案:**

- **Title/subtitle:** 現title `Daily Affirmations - Anicca` は27/30文字で、generic search termとbrandを両立するため維持候補。subtitle `Affirmations, Calm & Self-Love` は30/30文字で、titleとの語重複がある。比較候補は `Self-Care, Calm & Inner Peace`（29/30文字）だが、search intentやproduct promiseを照合する前に採用しない。Apple PPOはasset実験とし、text metadata変更と同時にしない。
- **Description:** 冒頭は「必要な時に届くdaily affirmation」という明快な位置づけ。長いfeature list、固定時刻の例、AIが気分/内面の変化を察知する表現、voice/adaptive learningの提供を、現行公開build・privacy表示・実画面で検証する。Apple検索のtext relevance列挙はtitle/subtitle/keywords/primary categoryで、descriptionは閲覧後の納得を助ける面として扱う。promo textは公開HTMLから判別できずASCで確認する。
- **Visuals:** 4枚の順は1) 個別affirmation、2) reminder、3) theme picker、4) thought change。Apple検索結果では条件により最大3枚のscreenshots/previewsが出るため、現在重複して見える先頭3枚を別々のbenefitにする価値が高い。[Apple App Store search](https://developer.apple.com/app-store/search/)
- **Ratings/reviews:** 十分なoverviewがまだない。rating promptはonboarding/paywall中に挟まず、実際に価値を受けたmoment後にApple標準promptを使う案を検討する。購入や高ratingを条件にした誘導はしない。
- **Metadata/freshness:** categoryはHealth & Fitness、6 listed languages。日本語など各localeのtitle/subtitle/screenshots/claimsを個別確認し、US listingを全marketへ外挿しない。Appleのversion history表示とASC metadata編集日時は別証拠にする。
- **Conversion:** 6 IAP namesとlegal欄の2 plan familyが公開上並ぶ。購入者が実際に選べるplans、期間、trial、更新価格を画面で確かめ、descriptionとcheckoutをそろえる。

**Keyword hypotheses（volume/rank未取得）:** `overthinking`, `self compassion`, `inner peace`, `positive self talk`, `confidence`。descriptionのテーマとの意味一致候補にすぎない。ASC keyword field、各locale、実機能を見てから採用し、Apple Search Ads/App Analyticsのquery dataがあれば需要を優先して絞る。volumeや順位は推定しない。

**Limitations:** Apple keyword field、promo text、historical rank/search term volume、product-page conversion、既存PPO結果、locale別page、live offers/checkout、公開版source対応は取得できていない。Competitor比較も未実施。したがって38/100は改善優先度を決める暫定scoreであり、conversion予測ではない。

## 理想のユーザー体験

```mermaid
flowchart LR
  A[悩みに合うSNS・記事] --> B[同じ価値を示すストア]
  B --> C[インストール]
  C --> D[悩みを選ぶ]
  D --> E[必要なら困る時間を選ぶ]
  E --> F[回答に合う実カードを読む]
  F --> G[通知の価値を理解する]
  G --> H[必要な場面で通知を選ぶ]
  H --> I[料金・期間が明確なpaywall]
  I --> J[購入または明示された無料範囲]
  J --> K[役立つ利用・更新]
```

オンボーディングの第一案は歓迎→主な悩み→体験を変える場合だけ困る時間→悩みに合う実カード→通知価値の説明と適切な許可依頼→明確な料金/期間/trial/更新条件を持つpaywall。通知を拒否しても続行でき、既存購入者はrestoreできる。hard/softのどちらを採用するかは先に決めず、公開build・実offering・Task 2の同一cohort計測を確認し、一変数実験で選ぶ。回答が体験を変えない質問や固定説明を減らす。既存カード描画を再利用し、新しいチャットや推薦基盤を作らない。

## 計測と改善方針

- ASC: ストア獲得の正本。Mixpanel: 初回起動以後の製品ファネル。RevenueCat: 実購読/更新/返金/MRR。PostHog: 必要な実験制御だけ。
- 既存イベントを再利用し、不足する表示/完了/CTA/失敗/割当だけ追加する。課金正本はサーバー取引であり、クライアントの推定価格を売上へ集計しない。
- 同じ匿名ユーザーのfirst-openコホート、app version、onboarding version、step、experiment/variant、offering/productを結べることを成果条件にする。
- 心理的な悩みの自由記述を分析イベントへ送らない。不要な個人情報を収集しない。
- 主要指標は実購入率と成熟D35 cohortの売上/インストール。初回価値到達、D1/D7利用、返金、解約、次回更新は最初の有料cohortから保護指標として追う。MRRは継続課金で積み上がるため、継続測定を「獲得後」に先送りしない。
- 配信を最優先にし、計測整備と並行する。日本を最初の市場候補とするが、最新の地域データと既存担当者の実績を先に確認する。
- SNS案は週10本の独立クリエイティブ、記事は勝った悩みの切り口を週1本。実行本数は既存担当の能力に合わせる。成功実績ではなく運用仮説である。
- スクショ最初の3枚は悩み/結果→届く場面→個別の実体験を第一案にする。現行対一案でPPOを設計する。
- 価格/トライアル/課金ゲート/スクショ/オンボを同時変更しない。低標本では未確定。Apple PPOは公式の標本見積りと信頼度を使う。
- 現行のhard/softを確認するまで切り替えを決めない。softは無料範囲と再課金のきっかけ、hardは読込/restore/既存購読者の復旧を含める。
- 新SDK、MMP、配信基盤、web課金、新規アプリ工場は今回の対象外。campaign/CPPの集計帰属と個人単位帰属は区別し、UTMの自動継承を仮定しない。

## $10K MRRの計算例

目標の解釈は二つある。第一段はポートフォリオ合算$10K MRR、長期の野心目標は選ばれた各winner appが$10K MRR。すべてのアプリが$10Kに届く保証は置かない。

ポートフォリオ目標は、たとえば1本$10K、2本×$5K、5本×$2Kで作れる。これは配分シナリオで、アプリが均等に売れるという予測ではない。

MRRを**月額へ正規化した売上**とすると必要な有料会員数は次の通り。ここで月換算額は仮定で、現行priceまたはCFOが確定したnet proceedsではない。

| 月換算MRR/active paid subscriber | $10Kに必要なactive paid subscribers |
|---:|---:|
| $5 | 2,000 |
| $10 | 1,000 |
| $20 | 500 |

月換算$10/人で1,000人を維持する例では、月次解約10%なら月100人の補充が必要。有料転換率別の必要新規DLは次の通り。

| D35 download-to-paid仮定 | 月100人を新規有料化するDL/月 | 平均DL/日 |
|---:|---:|---:|
| 2.1% (RevenueCatのfreemium app群のmedian) | 4,762 | 159 |
| 5% (planning scenario) | 2,000 | 67 |
| 10.7% (hard-paywall app群のmedian) | 935 | 31 |

算式は `active paid = monthly MRR goal / monthly-normalized revenue per payer`、`new paid needed = target active paid × monthly churn`、`install needed = new paid needed / mature-cohort D35 conversion`。RevenueCatの2.1%/10.7%はアプリ群の中央値であり、Aniccaに適用した結果ではない。installとRevenueCat customer cohortが同一userで結べない場合、この式の実測係数へ混ぜず、別シナリオとして扱う。継続率や単価を良く見せるための外挿をしない。

CFO direct RevenueCat readbackは2026-10-03 Anicca MRR point JPY 3,196.91/USD 20.34とSeptember proceeds JPY 3,363.77を示す。ただし`business-outcomes` projectionへのcurrency/revenue_definition接続、Apple FINANCIAL rowのapp attribution、Apple payout/bank receipt、CFO settled netは未達。MRR target comparisonはprovider run-rateの参考値だけで行わず、同じsubscription definition/currencyとactual net economicsがそろうまで現行net MRRや倍率を断定しない。

### $10Kまでの収益ゲート

下表は月換算$10/active paid subscriber・月次解約10%・D35 install-to-paid 5%を置いた運用例である。RevenueCat chartやCFO確定値から得たANICCAの予測ではない。月間install数は、そのMRR段階を維持するための補充量だけを示し、目標まで伸ばす純増分は含まない。

| 月額MRRの段階 | 必要active paid subscriber | 月次補充paid数（解約10%仮定） | 維持に必要な新規install（D35 5%仮定） |
|---:|---:|---:|---:|
| $100 | 10 | 1 | 20 |
| $1K | 100 | 10 | 200 |
| $3K | 300 | 30 | 600 |
| $10K | 1,000 | 100 | 2,000（約67/日） |

各段階では補充分に純増paid目標を足して必要DLを計算する。実測cohort、実際の月額換算額、月次解約、返金が揃うまでは単価や転換率を計画シナリオとして分ける。短期の到達期限は置かない。

| ゲート | 次へ進める証拠 |
|---|---|
| 0. 基準を読める | 同一app・期間・sourceでASC、初回起動以降のunique cohort、実購読を結び、欠損と分母が見える |
| 1. 獲得を再現できる | 既存post IDの公式reach/view/clickをASCのstore acquisition期間へ結び、どの配信切り口が対象者へ届くか分かる |
| 2. Store pageが転換する | 同一locale/windowでimpression→page view→first-time downloadを測り、PPOの必要標本を満たす一案を比較できる |
| 3. 初回価値と購入がつながる | 同一新規cohortでonboarding完了→実カード価値→paywall→server-confirmed first purchaseを観測し、一度に一つの要素を改善できる |
| 4. MRRを利益へ接続できる | 成熟cohortのrenewal/refundと同期間のApple proceeds、手数料、変動費、paid CACをCFO ownerの公式記録から比較できる |
| 5. 勝ち筋を拡大できる | 反復で有効なchannel/product experienceと正のnet unit economicsを確認してから、既存アプリ内の投資を増やし、次の需要があるappへ移す |

これは「まず大量installを買い、その後に計測する」順ではない。今の配信cadenceを保って投稿別到達を読み、最低限の計測を並行して整える。reach不足ならdistribution、reach後にstore遷移が落ちるならASO、install後に価値/支払が落ちるならonboarding/paywallを次の実験対象にする。継続と返金はMRRの純増を決めるので最初のcohortから見る。

### 最初のTikTokテスト案

既存sampleのTikTokは日本語`larry` affirmation-carouselを8投稿し、7日後の投稿別views中央値は39.5（合計311）。8件すべて同じmedia/caption hashを使っている。これは反復素材の観測であり、views低下の原因やalgorithm penaltyを証明しない。

推奨テストは、追加投稿ではなく次の既存予定枠を、同じ承認済み日本語affirmation内容・caption・CTAを使う15〜30秒の9:16 short-form videoへ置き換えること。変数はcarouselからvideoへのcreative format/assetだけにし、audience、message、locale、CTA、投稿slotを固定する。最初の1〜2秒にclear hook、実際のproduct experience、字幕と音声を入れる。TikTok for BusinessのCreative Codesは9:16、hook→body→close、soundを勧めるが広告向け資料なので、organic成果の保証ではなく制作heuristicとして使う。[TikTok Creative Codes](https://ads.tiktok.com/business/en-US/creative-codes)

Task 1で公開版と機能の一致を確認するまでは、smart timingやAIが気分を検知するなど未確認の主張を使わない。Primary metricは既存owner metricsの168h views/post、secondaryは同sourceで取れるlikes/shares/saves。8件のcarousel履歴（median39.5、max58 views）は歴史的baselineであり、同時期controlではない。1本のpilotはscreeningに留め、過去medianを超えた場合も、既存slotで新しい2素材を再試験するまでcadence/投資を変えない。metrics schemaにclickがなくASC install/paidにjoinしていないため、views上昇だけをrevenue liftと呼ばない。

### アプリ工場の投資ゲート

1. **獲得仮説:** 一つの対象者/課題について、既存担当の投稿ID→reach/click→同一ASC期間のstore acquisition refsを結ぶ。日付不一致やcampaign不在はunavailable。
2. **ストア転換:** Impression→product page view→first-time downloadを同じwindowで測り、Apple PPOは取得可能標本/期間の見積りが実験可能な場合だけ行う。
3. **初回価値と購入:** 同じ新規ユーザーのstep表示/完了→実カード価値→paywall→初回購入を測る。raw event totalsからconversionを作らず、hard/softと価格を同時に変更しない。
4. **継続とunit economics:** renewal/refund、月換算MRR、Apple proceeds、AI/infra variable cost、paid CACを別sourceで同期間比較する。買い切り・年額gross・未精算をMRR/profitにしない。paid scalingは実測net LTVがCACを上回る根拠ができるまで拡大案としてのみ残す。
5. **横展開/停止:** winnerの人員を増やし、同じ再現可能手順を顧客課題が重なる次アプリへ移す。計測が揃わない、価値体験が弱い、unit economicsが負の候補へアプリ数だけを増やさない。

RevenueCat 2026 reportでは、subscription appsのMRR YoY median growthは5.3%、top decileは306%超、公開subscription revenueの69%は2020年より前に出たappsから生じる。アプリ作成本数ではなくwinnerのdistribution/retention/monetizationがportfolio目標を左右すべきだという参考証拠であり、Anicca達成の予測ではない。

## 完了の区別

今回の文書完了: spec/計画/再開メモが専用branchにcommit/pushされ、remote objectで存在を確認できる。

成長タスク完了: planのTaskごとのsource/計測/公開条件を満たし、観測した結果と外部反映を分けて報告する。$10Kの目標達成を計測整備、実装、少数購入、未精算MRR chartと同一視しない。

## 一次資料

- https://www.revenuecat.com/state-of-subscription-apps-2026/
- https://developer.apple.com/documentation/analytics-reports/app-store-discovery-and-engagement
- https://developer.apple.com/help/app-store-connect-analytics/reference/metrics-definitions
- https://www.revenuecat.com/blog/growth/hard-paywall-vs-freemium/
- https://developer.apple.com/app-store/product-page-optimization/
- https://developer.apple.com/app-store/custom-product-pages/
- https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
- https://developer.apple.com/app-store/search/
- https://www.revenuecat.com/docs/integrations/third-party-integrations/mixpanel
- https://github.com/rorkai/App-Store-Connect-CLI
- https://github.com/rorkai/app-store-connect-cli-skills

前回調査の要点: 初日の有料転換50.6%と「80%がオンボ中に課金」は同義ではない。hard10.7%/freemium2.1%のD35転換率は異なるアプリ群の観測であり、切り替えの因果効果を保証しない。soft化は他の価格/パッケージ変更も含む成功事例と悪化事例がある。
