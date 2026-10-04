# ANICCA iOS 収益改善の設計

## 目的と依頼の境界

既存ANICCA iOSを最初のケースに、配信→ストア獲得→初回価値→有料購読→継続→利益を同じ成長ループで測り、改善する。長期構想は公開アプリをそれぞれ$10K MRRへ育てることだが、最初の経営目標はポートフォリオ合算$10K MRRとし、需要と採算が確認できた勝ちアプリから投資する。仕組みを他アプリへ移すのはANICCAで再現できてからとする。目標額は達成保証でも期限予測でもない。

この文書は継続中の実行目標を支えるspecであり、実作業は後述のplanの順序と担当境界に従って進める。現在の作業はspec/TODOの整合更新で、製品変更や外部公開が完了したことを意味しない。ソース変更は専用worktreeで該当Taskの範囲内に行い、ASC metadata・価格/購読条件・広告・公開投稿・稼働中loopはownerとeffect境界を確認してから扱う。利益の確定はCFO laneの同期間公式receipt/cost接続に委ね、Growth laneで二重に計算しない。

## 正本と再開情報

- リポジトリ: `Daisuke134/anicca-products`。Life Manager本体の`Daisuke134/life-manager`とは区別する。
- 文書worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- 文書branch: `docs/anicca-ios-growth-plan-20261004`
- push先: `origin/docs/anicca-ios-growth-plan-20261004`
- 作成元main: `081eeb2e6fc9b44087eb4439e81951fa30c2cb9c`
- 実行計画: `../plans/2026-10-04-anicca-ios-growth-plan.md`
- 再開メモ: `../../../.claude/handovers/2026-10-04-anicca-ios-growth.md`
- 残作業とcursorの唯一の正本は実行計画の「タスク一覧」。このspecに第二のTODOを作らない。
- `/Users/anicca/anicca-project`は他者の変更がある共有checkout。切り替え、cleanup、変更の巻き戻しをしない。
- この文書worktreeはsparse checkoutで文書だけを展開する。製品ソースは`git show HEAD:<path>`で読める。将来の実装は新たに最新main由来の専用worktreeを作り、そこで対象ソースを展開する。

## 現在の担当と再利用境界

- Growth laneの書込対象はこのspec、対応する計画、再開メモのみ。現在cursorはTask 1、Task 3は既存配信記録のread-only調査中。前回handover記載のAGMSG名`lm-ios-growth-1004`は今回のrepo-local `whoami`で再確認できず、複数identityが返ったため、AGMSG送信前にidentityを解決する。
- 既存 `lm-cfo-observability-1002` はLife Managerの `feat/lm-mobile-metrics-20261003` を所有する。collector、ASC/RevenueCat取得、Finance Detail producer、CFO consumerへの接続をこちらで重複実装しない。本人へ取得済みの公開build/offerings/source refs/hashを照会済みで、返信は未確認。
- `codex-money-printer` は全体primary。私のgrowth文書・CFO worktree・mobile producerを編集しないとの返信を確認する。全体TODO/orderはLife Manager統合SSOTのprimary管理§217/§340/§343に従い、この計画はgrowth内の細分手順であって全体順序を変更しない。
- 公式ASC/RC readbackは既存取得owner一人が生成し、両laneが同じrefs/hash/期間をread-onlyで消費する。今回はprovider再取得、認証/共有profile/state変更、投稿、本番操作を行わない。
- Task 1の基準表とTask 3の配信資料は別の読取束として並行できる。shared journalは読取だけ、全体SSOTはprimaryだけが統合する。本人の未返信を所有権解放と扱わない。

## 継続調査の基準表

以下は既存担当文書とlocal artifactの読取で更新する。担当の公式API観測と、私が独立に再取得した観測を混同しない。

| 対象 | 確認できること | 残る確認 | 既存の根拠 |
|---|---|---|---|
| 公開アプリ | 担当のpublished auditはAnicca/Honne/Dhamma Quotes/Sleep Reset/STUDIO CHERIE/Thankfulの6件。旧CFO rosterの未公開4件とは別 | 最新の公式refs/hash共有 | mobile設計のProvider observations |
| ASC acquisition | 既存feature branchはreport日付の交差と分母0/期間不一致を扱い、6公開アプリを対象にする。追加4件は担当観測でreport_pending。Apple定義ではDiscovery `Counts`はtotal events、`Unique Counts`はrowごとのunique users、Discovery Impression eventはpage viewを含まない。一方Analytics `Impressions (Unique Devices)`にはunique product page viewsが含まれる。10/01の20 total impressionsと5 unique impressionsは直接比較できず、整合する可能性がある。 | Discovery total page-view counts 5とAnalytics unique page views 0の差、同一segment/report refs、十分な日別観測。row単位のunique countsを合計してoverall unique usersにしない | 同設計のAcquisition/Acceptance、[Apple Discovery report](https://developer.apple.com/documentation/analytics-reports/app-store-discovery-and-engagement)、[Apple metric definitions](https://developer.apple.com/help/app-store-connect-analytics/reference/metrics-definitions)、最新business-outcomes report artifact |
| ANICCAの公開store面 | 2026-10-04T11:00:23ZのUS page readbackはtitle `Daily Affirmations - Anicca`、subtitle `Affirmations, Calm & Self-Love`、公開最新版1.9.4（Jun 25）、評価overviewなし。IAP欄はAnnual Plan $59.99 / Anicca Monthly $9.99 / Annual Retention Plan $29.99 / Weekly Premium $7.99 / Annual Premium $29.99 / Monthly Plan $12.99 | 公開1.9.4 binaryとの訴求一致、最新screenshots/PPO、6件の掲載IAPと実際のASC/RevenueCat live offering・checkoutとの対応。掲載IAPを購入可能な現行offerと見なさない | `crwl crawl https://apps.apple.com/us/app/id6755129214 -o markdown-fit`、前回ASC readback |
| install→paid | 既存branchのD7はprivate/experimental endpointで、成熟日/同一app/date/整数payer/分母を検証する。小標本を効果としない | 十分なコホートと公開された計測経路 | 同設計のD7 contract |
| RevenueCat/Apple | 担当branchにはcurrency/roster/mobile freshness/Finance Detailの子ID→親app mapping修正がある。本番import完了とは別 | 現行offering、実購読イベント、production receipt接続 | 同設計のCFO source contract |
| アプリUX | anicca-products origin/main `081eeb2e6fc9b44087eb4439e81951fa30c2cb9c`で10-step→2-step paywall、個別画面の固定文、表示イベント二重送信を再確認 | 公開1.9.4 build/ソース対応、live画面 | 既存Swift source |
| product analytics | Anicca business_date 2026-10-03 / observed_at 2026-10-04T10:56:36.419433Zの保存rowはproduct_analytics available、raw件数 app_opened5/onboarding_started1/paywall_primer_viewed4、rows10。PostHogは`missing_project_read_credential`。同じrowのRevenueCat chart summaryはMRR20.34/Actives5（period 2026-10-03）だが通貨とrevenue_definitionがない。ASC Sales sourceは`provider_query_failed` | first-openのunique分母、段階/時間/購入のuser join、RC chart通貨/定義、sales source回復 | `/Users/anicca/.local/state/life-manager/marketing-metrics-daily/state/business-outcomes.jsonl` |
| PostHog | 同保存行はmissing_project_read_credential | 所有者経路で既存project readを解決 | 同保存行 |
| 配信実績 | 2026-09-06..2026-10-04の28日間に、local marketing receipt journalでAnicca-tagged published/provider_post_id記録567件（Instagram234、TikTok236、YouTube97）。local receiptでproviderへの再readbackは未実施。reach/click/impression-post-ID joinのrecordが同期間のjournalにない | ownerの同じ投稿IDに対する既存platform insights→ASC campaign/store期間。投稿本数ではなくreachからinstall/paidまで判定 | `/Users/anicca/.local/state/life-manager/marketing/receipts.jsonl`、`/Users/anicca/.local/state/life-manager/marketing/jobs.jsonl` |
| Platform metrics reader status | 正規`lm-loop status life-manager-instagram-metrics` / `life-manager-tiktok-metrics` readbackは各exit75 `host_admission_deferred:resource_effect_unknown`。fenced occurrenceは`history_incomplete`/`state=claimed`、`provider_receipt_id`/`official_readback_ref`なし、diagnosis `provider_state=no_adapter`。 | Owner primaryによる既存publication/messageのofficial readbackとreconciliation。再wake/replay/fence closeしない | Unified SSOT §217、2026-10-04 status readback 10:17:07Z/10:22:10Z |
| Platform metrics readers | `life-manager-instagram-metrics` / `life-manager-tiktok-metrics` are loaded-idle on releases `9a76dcc8` / `1a7a8e2f`. Latest natural reports are admission-blocked at 2026-10-04T10:17:07Z / 10:22:10Z by `resource_effect_unknown`; each has an older claimed occurrence with `history_incomplete`, no adapter, no provider receipt/readback. No wake, replay, or fence close performed. | Platform owner’s exact official readback and a valid reconciliation adapter before treating receipt as success. Do not restart/resend the fenced occurrence. | `lm-loop status life-manager-instagram-metrics`; `lm-loop status life-manager-tiktok-metrics` at 2026-10-04 |
| Aniccaの現行獲得 | mobile担当のRork ASC Analytics readbackは共通窓2026-10-01に0 first-time downloads / 5 unique impressions / 0 unique page views。10/04T10:56:36Z観測のlocal Apple Discovery reportは同日にImpression counts 20 / Page view counts 5（source/page/territory segment合計）、Downloads reportは10/01 Restore 1 / 10/02 App Store search由来first-time download 1。Apple定義上、20 total impressionsと5 unique impressionsは直接矛盾せず、前者のImpression eventはpage viewを含まない。first-time downloadsは10/01に0件でRork readbackと一致。page-view counts 5とunique page views 0の差は未解決で、転換率は算出しない | page-viewのsegment/StoreKit含有、Rork metric/source refs、日次readbackと十分な標本 | mobile担当design §Provider observations、`business-outcomes.jsonl` discovery evidence_sha256 `20699ca154166f5b2db9f0463c6f5b8baeb235509f1c8dc04362c84c4c2c9b71` / downloads evidence_sha256 `8004c761579cf82a7d0fd03198918fbf578c357685f26a0d651ae81df070d45f` |
| 全アプリの獲得に関する依頼者の現状認識 | 依頼者は「全アプリ合計で1日約3 install」と報告 | app別内訳、期間、公式sourceの一致が未確認。ASC基準値として使わず、Task 1で照合する | 2026-10-04の依頼者発言 |
| Aniccaの月額換算指標 | RevenueCat owner v2 chart refはcomplete period 2026-10-02、USD、MRR $20.34。10/04T10:56:36Z保存rowは2026-10-03 periodでMRR20.34/Actives5を示すが、currency/revenue_definitionは欠落。いずれもsettled proceeds/profitではない | latest chart currency/definitionの公式readback、CFO同期間接続 | mobile担当design §Provider observations、local business-outcomes row |

rawイベント件数から離脱率を計算しない。primer4/started1のような値は再訪/再表示/取得windowを含みうるため、400%のconversionや3人の新規購入と解釈しない。ASC Discoveryのrowごとの`Unique Counts`を合計してoverall unique audienceにしない。Rork Analyticsのunique metricとDiscovery totals、Downloads reportはそれぞれ定義・日付・分母を保ったまま照合する。具体的な離脱箇所は未確認のまま残す。

今回のUS listingでは、似た名前の月額/年額IAPが複数あり、掲載価格も週$7.99〜年$59.99にまたがる。これは公開pageで確認できた事実で、購入画面に同じ選択肢が表示される証拠ではない。Inference: 年額/継続offerの名前と価格が実際のpaywallでも整理されていなければ、価値提案を読む前に選択を難しくする可能性がある。実購入画面とlive offering mappingを確認してから、ASO/paywallのどちらを変えるか判断する。

配信journal上の567件はowner側の投稿記録であり、reach/閲覧・再生完了・プロフィール遷移・store click・installへの寄与を証明しない。mobile ownerの10/01 ASC acquisitionは0 first-time installs/5 unique impressions、page-view countは0でconversion unavailable。これは28日すべての投稿が無効である証明ではなく、現記録では投稿からinstallへ届いた率が不明という意味。既存ownerの予定済み配信を止めず、最も新しく/十分に観測された既存投稿のofficial insightをASC期間へ結び、post→qualified reach→store acquisitionの経路を測る。campaign token/account/new publisherは追加しない。

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
- `Onboarding/OnboardingBibleViews.swift`の`PaywallFlowContainer`はprimer→`PaywallVariantBView`を表示し、閉じるボタンを常時出す。
- 別の`Onboarding/PlanSelectionStepView.swift`はPostHogの`hard_paywall`を読むが、この呼び出し経路で使われているとは言えない。公開1.9.4のbuildとソースの対応は未確定。
- `Onboarding/PaywallVariantBView.swift`のonAppearは`.paywallPlanSelectionViewed`を直接送信し、同じイベントを送る`AnalyticsManager.trackPaywallViewed()`も呼ぶ。
- `Services/SubscriptionManager.swift`の購読更新delegateには、取引IDによる新規購入の重複防止が見えない。実際の重複発生は未測定。
- `Onboarding/PersonalizedInsightStepView.swift`は回答を参照せず、固定のlocalized文字列を表示する。
- Mixpanel、PostHog、RevenueCatは既存導入済み。導入済みと受信・正しい集計を区別する。
- `aniccaios/aniccaiosTests/OnboardingV2Tests.swift`には現enumにない旧case名への参照がある。既存テストがそのまま有効だとは仮定しない。実行時にtarget inclusionとbaselineを確認する。

### Source-onlyの計測重複修正

- repository `Daisuke134/anicca-products`、source branch `fix/anicca-paywall-event-dedupe-20261004-growth`、commit `76cf8b6e5968f958ee837318d68b6842386f4eb2`。`aniccaios/aniccaios/Onboarding/PaywallVariantBView.swift`の直接event送信1行を削除したsource-only change。
- active flowはOnboardingFlowView→PaywallFlowContainer→PaywallVariantBView。PaywallVariantBView.onAppearの`hasTracked`内では`AnalyticsManager.trackPaywallViewed()`だけを呼び、同関数がpaywall eventを1回送りSKAN conversion value 2を更新する。
- Fresh read-only source review: active flowの修正漏れなし、Critical/Important指摘なし。未使用のPlanSelectionStepViewのhard flagはlive flowの一部ではない。
- `git diff --check`と`xcrun swiftc -frontend -parse aniccaios/aniccaios/Onboarding/PaywallVariantBView.swift`はPASS。Simulator buildとgeneric iOS device buildはどちらもPackage Graphの後、XcodeがiOS 26.5実行先を使用できずexit 70でコンパイル前に停止。`simctl list runtimes`は空。source-only changeでproduction binaryへの適用、実イベント数1回、本番版とのcommit対応は未確認。PR/merge/releaseはなし。
- AnalyticsManagerはMixpanel singletonへ直結し送信数hookがないためイベントcount回帰テストは未追加。fresh reviewerはactive flowのsource修正にCritical/Important指摘なし。レビューとSwift syntax parseは補助確認でありruntime event receiptやbuildの証明ではない。

### 未確認事項

現在のMRR、匿名IDとRevenueCat IDの対応、段階別離脱、実験の割当、offeringsとトライアルの稼働設定、投稿別reach/クリック/購読帰属、無料/有料の実提供差分、81%改善主張とレビュー引用の根拠は未確認。未確認を0、未稼働、故障と断定しない。

## 理想のユーザー体験

```mermaid
flowchart LR
  A[悩みに合うSNS・記事] --> B[同じ価値を示すストア]
  B --> C[インストール]
  C --> D[悩みと困る時間を選ぶ]
  D --> E[自分に合う実カードを読む]
  E --> F[通知の価値と料金を理解する]
  F --> G[購入または定義済み無料範囲へ進む]
  G --> H[役立つ通知・利用・更新]
```

オンボーディングの第一案は歓迎→主な悩み→困る時間→悩みに合う実カード→通知の価値説明→ペイウォール。回答が体験を変える質問を残し、体験を変えない質問や固定説明から見直す。既存カード描画を再利用し、新しいチャットや推薦基盤を作らない。

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

Ownerのreadback上、AniccaはRevenueCat MRR chartで$20.34/complete period 2026-10-02、CFOにはまだ精算収益としてjoinされていない。月換算$10/人の目標例に対して単純比では約492倍に相当するが、MRR定義・10/03保存値のcurrencyが欠け、基準periodも異なるため正式な成長倍率や現行net MRRとは呼ばない。

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
- https://www.revenuecat.com/docs/integrations/third-party-integrations/mixpanel
- https://github.com/rorkai/App-Store-Connect-CLI
- https://github.com/rorkai/app-store-connect-cli-skills

前回調査の要点: 初日の有料転換50.6%と「80%がオンボ中に課金」は同義ではない。hard10.7%/freemium2.1%のD35転換率は異なるアプリ群の観測であり、切り替えの因果効果を保証しない。soft化は他の価格/パッケージ変更も含む成功事例と悪化事例がある。
