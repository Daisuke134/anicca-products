# AI Monk Factoryのクラウド実装・原価契約

## 目的と範囲
Databaseの根拠を台本へ戻し、利用者はInstagramを一度OAuth接続するだけで、Factoryがmonk identity/profile・台本・縦動画を選び、毎日自動生成・投稿するWeb appを作る。完成動画3本を無料で提供し、3日trialは置かない。初期設定は不要で、既定profileは任意で編集できる。Instagramを先行し、TikTokは公開Content Posting API監査後に追加する。利用者にAPI key/CLI/configや日々の手動操作を要求しない。web appを先に提供し、iPhone appは後続とする。既存の日次Grok所有loop、書籍決済は変更しない。公開mockやlocalhost planをSaaS完成と扱わない。

初回導線は「3本無料」→Google認証→Instagram接続だけとする。OAuthへ進む前に「接続後は既定の架空AI monkを作り、毎日1本ずつ自動生成・公開する。無料3本を使い切るかStopを押すと停止する」と明示する。公式readbackで接続完了した後はserver APIがautopostを有効にし、avatar生成と日次jobを開始する。別途Generate/Turn on操作を必須にしない。動画を手動生成する既存操作は補助機能として残す。OAuth後の実投稿には対象accountの公式permissionとprovider審査が必要で、未確認なら生成と投稿のreadinessを別々に表示する。

## 採る方式と理由
既存Next/Netlify/Supabase/Stripeを使い、server-verified user IDへjob・billing・接続を結ぶ。画像/台本はGemini API、動画はHeyGen API、投稿はInstagram/TikTok公式APIを使う。接続時に各platformのOAuth同意を一度行い、その後の生成・投稿・metrics取得はserver APIで動かす。providerキーとOAuth tokenはserverだけが持つ。Instagramはprofessional Business/Creator accountとpublish scopeが必要。Instagram Loginを選ぶとFacebook Page連携なしで利用できるが、他社userへ公開するにはAdvanced Access・Meta App Review・Business Verificationが要る。Page接続accountでPage Publishing Authorization (PPA)が要求された場合は利用者側で完了する。TikTokはregistered app、`video.publish`のapp承認と各userのOAuth認可、public posting用app auditが必要で、audit前の投稿はprivateに制限される。既存依存を再利用し、新frameworkや設定画面を増やさない。

旧local CLIをcloud経由で利用者へ公開する案はtenant認証と永続jobを持たず、Macの日次所有系を巻き込むため採らない。Postiz通常APIの接続先は自社organizationであり、tenant帰属の正式契約が不足する。Postiz Enterpriseは公開ページで新規申請停止のため採らない。Upload-Post Professionalは月USD50で25 profilesの容量上限があるため、成長時の顧客接続基盤として採用しない。既存実装は移行元とし、販売前に公式Instagram/TikTok APIへ接続を移す。Instagramの一度限りのOAuth認可は必要だが、日々の投稿に人の操作を求めない。

## Database Plugin/CLIとの接続
Factory Web appを先に提供し、tenant認証付きAPIが稼働した後に、既存CLI/Pluginから自動運転の作成・停止、生成job状態とmetrics取得を追加する。SNS tokenはserver側に保持する。host上でOAuth同意を完結できない場合は、Factory Webの一度限りのOAuth画面へ誘導する。利用者が同意した後の日次生成・投稿・metrics取得はAPIで実行し、毎日の手動操作を要求しない。この連携はFactory Web公開を止める前提ではない。

## 価格と原価
有料価格の現行候補はUSD199/月、月30本、1本45秒以内。paidは成功最大30本・課金試行最大36回とし、追加6回を含む予算で管理する。provider/台本のperiod予算をUSD70へ制限する。無料枠は認証アカウントごとに完成動画3本、1本20秒以内、期限なし・カード登録なし・再生成枠なしとし、最初の3本のprovider/台本原価をUSD4.25以内に制限する。Stripe statusが`active`/`trialing`以外の既存userは、以前のtrial使用歴だけを理由に新しい無料枠から排除しない。有効な`active`/`trialing` subscriptionは無料枠より優先する。3本を使い切ると自動生成・投稿を止め、月額subscriptionを案内する。無料枠とpaid期間のquotaは分け、繰越0。未完/費用不明も成功候補枠と原価予約を保持する。初期monk profileは1体。USD199は現行provider原価に基づく候補であり、売上・利益を保証しない。

Avatar IV Photoは公表USD2.31/分。30本×45秒はUSD51.975、20%追加生成込みUSD62.37。別Starfish TTSを使う最悪予算はUSD3.24/月。HeyGen ImageのUSD0.28はidentity/reference画像を要求する再構成用で、文章から独自画像を作る経路ではない。画像・台本providerはGemini Developer APIの専用有料projectへ置換する。1K portraitのgemini-3.1-flash-lite-imageと台本gemini-3.1-flash-liteを使い、画像の全model上限による条件付き推算USD0.139264に対して画像枠をUSD0.14とする。従来のavatar予約USD1.60（画像保守枠USD0.28＋PhotoAvatar USD1.32）は維持し、差額を実請求額や毎月の再生成費と呼ばない。1K画像のUSD0.0336は画像出力部分だけである。Interactionsのthoughtを含むoutput上限は画像4096/台本1200token、台本はinput12000tokenという仮定でUSD0.0048。byte制限から実token数/請求額を保証せず、usageと公式実費は専用課金準備後に検証する。無料3本の条件付き最大費USD3.903664、paid36attempt最大尺シナリオUSD67.242064は既存予約内だが、税/失敗課金/実利益は未確認。正確なAPIとusage契約 → 2026-10-24-ai-monk-factory-provider-contract.md。課金CTA/実生成は独立有料課金元・モデル権限・18歳以上向け利用条件の実受入まで有効化しない。

Upload-Post Professionalの既存調査値は月USD50・25 profiles。1profileあたり月USD2は25枠を全て使えた場合の平均にすぎず、固定費と上限が残るため販売拡大時の採用先にしない。

Stripe JPの標準公表card3.6%＋Billing0.7%、FXが必要な場合の追加2%を保守的な6.3%として試算する。既存merchant個別契約の請求率と断定しない。台本推論・保存・hosting等へ別途USD10/有料利用者/月を原価予算として置くが、実測請求額とは区別する。

無料3本の動画・TTS・avatar予約の小計はUSD4.03、その他を含むprovider/台本のhard budgetはUSD4.25。画像を別APIへ変えた後もUSD0.28の保守枠を残す計算であり、HeyGen単独の実請求ではない。無料3本→paid10%という仮定では獲得無料枠費USD42.50/有料利用者となる。初月利益試算は有料1人でUSD16.753、5人でUSD56.753、25人でUSD64.753。paid側のUSD1.60はavatarを再利用する通常経路では実費0となる保守予備費で、毎月再生成する仕様ではない。転換率5%・有料1人ではUSD-25.747で赤字。売上・継続率・税・実手数料の未確定部分を隠さず、実請求と実転換率から更新する。

ReelFarmの現行公式ページは「3 TikToks free」、TikTok接続、日次の自動生成・投稿、analyticsを掲げる。公開価格はGrowth USD49/月・100 slideshows、Scale USD95/月・250、Enterprise USD195/月・750。Factoryは無料3本→OAuth接続→自動投稿→metricsの導線を参考にする。AI avatar動画とslideshowsでは原価が異なるので本数・価格をそのまま転用しない。現在のUSD199/月・30本は候補であり、USD95前後の案を含め、実原価・失敗/再試行費・決済/hosting費とユーザーの「約USD100/月で使っていた」という価格期待を比較して確定する。参照: [ReelFarm](https://reel.farm/)。

2026-10-24の最新公式価格を使うと、20秒の投稿1本はHeyGen Avatar IV Photo USD0.77 + Starfish TTS USD0.04 + Gemini script reserve USD0.005 = USD0.815/日、30日でUSD24.45。初回だけPhoto Avatar USD1.32とGemini 1K portrait reserve USD0.14を加える。無料3本の同じ上限シナリオはUSD3.905/新規利用者で、quotaのUSD4.25/user予約内。paid 30 completed/36 attempts/45秒上限では動画USD62.37 + TTS USD3.24 + script reserve USD0.18 = USD65.79のprovider原価シナリオとなる。USD199候補から残るUSD133.21は決済・hosting・storage・posting・税・無料利用者獲得費・追加失敗を引く前の金額であり、利益ではない。無料reserve USD4.25/user、仮定転換率10%なら有料1人あたり無料獲得費USD42.50を引き、USD199/30の残額はUSD90.71、USD95/30ならUSD-13.29（いずれも決済・infra控除前）。同じ10%仮定のUSD95/10・12-attempt案は直接生成原価USD21.93、無料獲得費控除後USD30.57が決済・infra前に残る。いずれもモデル計算で、実費・転換率・利益の観測ではない。ReelFarmの価格anchorを参照しつつ、slideshowsと同じ成果数を動画quotaへ当てはめない。料金表・原価式 → `../plans/2026-10-24-ai-monk-research-distribution.md` と `../../evidence/ai-monk-factory-cost-and-button-readiness-20261025.json`。

Instagram公式OverviewはInstagram LoginでFacebook Page連携を不要にできると説明し、他社user向けAdvanced AccessにはMeta App ReviewとBusiness Verificationを要求する。Content Publishing guideはprofessional account、publish permission、accountによってはPPA完了を求める。TikTok公式Content Posting APIはregistered app、scopeのapp承認と利用者認可を求め、audit前clientの投稿をprivateに制限する。Instagramを先行し、TikTokのpublic postingはaudit後に有効化する。参照: https://developers.facebook.com/documentation/instagram-platform/overview 、https://developers.facebook.com/documentation/instagram-platform/content-publishing 、https://developers.tiktok.com/docs/en/content-posting-api-get-started 。

## 最小の利用導線
利用者は既存Supabase login後にInstagramを一度OAuth接続する。接続前に「接続後は1日1本を自動生成・投稿し、いつでも停止できる」と説明する。OAuth callbackでaccount IDとpublish permissionを確認したら、追加のGenerate操作なしでFactoryがmonk名・profile・架空avatar画像・Database由来の独自台本・縦動画を既定値で選び、1日1本の自動運転を開始する。利用者はprofileを任意編集できるが、開始に設定入力は不要。完成した無料動画3本までは料金/カードを要求せず、3本後に月額subscriptionのCheckoutを表示する。UIは処理状況と完成previewを表示する。

Instagramはprofessional Business/Creator accountを接続する。OAuthから戻っただけではconnectedにせず、公式APIでaccount IDとpublish権限を確認する。確認が完了したら1日1本を既定時刻に制作・投稿する。自動運転は常に停止可能にし、停止・解約・認可失効は次回の生成/投稿を止める。利用者はmonk profileを編集できるが、投稿先・script・scheduleや毎日のGenerate操作は要求しない。TikTokは公式app audit後に同じ最小導線へ追加する。

dashboardは実provider状態、投稿URL、取得日時付きのviews/likes等を表示し、未取得を0にしない。無料枠の残り（3本からの減算）、有料月間の残数、次回投稿、subscription状態、停止/解約を簡潔に表示する。動画とcaptionはAI生成であることを明示する。

## 実装の境界
- 現在の公開draft入口を同じURLの実Web appへ置き換える。localhost向け4file配布はdownload用pathへ移し、public staticとNext routeを衝突させない。既存利用者や永続draft移行の要件は確認されていないので互換レイヤーを増やさない。
- 無料quotaは認証userごとに完成動画3本の生涯枠とし、時間経過でresetしない。Stripe trial fieldsは使わない。有料quotaは公式paid invoice期間に紐づけ、paid30成功/最大36attemptを繰越0で管理する。費用不明の試行は原価予約を保持し、公式に非課金と確認できたものだけ解放する。
- readinessは共通booleanへ集約せず、generation・checkout・socialをaction別に返す。core runtime flag/job secretが不足する場合はjobを停止し、provider設定不足は生成を、Stripe設定不足はcheckoutを、公式OAuth/publish設定不足はsocial actionだけを止める。clientへsecretや内部env値を返さず、なぜ操作できないかを利用者向けの安全なstatusで表示する。無料quota中はStripe customer/subscriptionなしでavatar/video生成とInstagram OAuthを許可する。
- Netlify APIはSupabase server getUserでbearerを検証する。client入力user_id/customer_id/profileを信用しない。RLSは自分のrowの読取だけ、課金/生成/接続の更新はserver限定とする。
- account/job/provider-eventを永続化する。unique occurrence/lease、atomic count/seconds/USD予約で連打・並列・scheduled再実行の二重効果を防ぐ。timeout後のeffect不明は予約を保持し、公式GETで照合する。
- 全利用者のgeneration job予約を共有する会社上限をUSD10/UTC日で開始する。無料1人分の予約USD4.18（avatar USD1.60 + video 3本 USD0.86）を基準に、2人分USD8.36とUSD1.64の余裕を置く。DB予約transactionで同時実行を直列化し、当日作成されたjob、当日更新されたgeneration-stage job、過去日の未解決 `reserved`/`processing`/`effect_unknown` generation jobを合算してからmanual/auto双方のjobを許可する。social `post_*` stageはgeneration費を使わないため別枠とする。上限は実provider請求額ではなく、現在のmodel/usage前提に基づく予約costの上限であり、price change前に予約額と上限を更新する。
- 先にspeechを生成し公式durationを読んでからAvatar IVへ渡す。単語数から秒数を保証しない。上限超過の短文化は残予算内だけで行い、音声が上限を満たさなければ動画生成しない。
- Stripe Checkoutは固定server Price、mode subscription、server user IDをmetadataへ保存する。無料quota中はcheckout/cardを要求せず、quotaを使い切った後にだけcheckoutを表示・許可する。subscription作成にtrial_period_daysやtrial fieldsを含めない。webhookはraw署名・event一意性・公式subscription再取得で利用権を更新し、success URLだけから有料化しない。portalは認証済み本人のcustomerだけを使う。
- Checkoutのnonce/作成時刻/公式session IDを永続化し、通信失敗後も同じStripe idempotency keyとpayloadを使う。期限後に結果不明のsessionを別nonceで再作成しない。課金状態の同期は利用者ごとの期限付きnonceで排他し、公式GET前に取得したnonceが一致する場合だけ更新する。有料期間はsubscription itemの公式periodと同じ期間のpaid invoice lineで確定し、古いinvoiceだけで次月を有効化しない。解約予定も次の有料生成/自動投稿を止める。
- 同一Stripe accountの既存webhookへFactory eventが届いても、別商品のdropletやwake-callを作らない。広いsubscription受付を持つ既存2handlerはFactoryのproduct IDだけを除外し、既存商品の契約を変えない。
- platform OAuth tokenはserver側の各user/accountへ保存し、接続・投稿・metricsの公式GET/POSTで状態を確定する。OAuth開始前にdaily automationへの明示意思を永続化し、公式接続readback後だけ開始する。停止はautomation stateとpending intentを一操作で消し、後続OAuth readbackが勝手に再有効化しない。別userのtoken/accountへアクセスできないtenant境界を維持し、Grok所有accountを接続試験やSaaS投稿先に選ばない。Instagram/TikTok公式審査が未完なら公開投稿を有効化しない。投稿APIがtimeoutした場合はprovider ID/statusを照会してから再送し、重複投稿を防ぐ。
- 非同期生成と投稿は永続jobを短いscheduled tickで進める。新schedulerやMac常駐processを作らず、利用者向けAPI request中に長時間待たない。同期画像生成APIだけは既存Netlifyのbackground functionを使う経路を検証し、DBの所有権と送信前fenceを取得した最初の1回だけproviderへ送る。自動retryは当該fenceを読んで再送せず、費用不明は予約を保持する。submit→provider ID保存→next_run_at付きpollへ分け、1tickの件数/時間を上限で止める。既存CLIの--waitやbackground functionの自動retryをそのまま移植しない。各効果はprovider ID/official readback/費用/次の操作を持つ。
- Factory専用の独立billing sourceを使い、Grok key/walletへのfallbackは0とする。shared Grok walletやAPI残高を利用者quotaの代わりにしない。walletのauto-reload設定は変更せず、既存threshold guardと利用者/全体予算を守る。Factory用の支払元・使用可能予算が足りなければ生成前に具体的な不足を表示し、成功へ置換しない。
- API key・OAuth JWT・webhook secretはprivate SSOTとdeployment secretsだけで扱い、client/repo/logへ出さない。
- 生涯無料artifact数とsocial接続容量を分けて永続化する。subscriptionのcancel/expirationはpaid生成・次回投稿を止めるが、無料artifact履歴と実費を消去しない。完了済み動画数は成功したartifactだけを数え、timeout後の不明なprovider費用・投稿はreceipt/readbackで確定するまで再送しない。
- 定期tickはStripe SDKを含む全通信へ共通25秒の打切りを適用し、Netlifyの30秒上限より先に終了する。Stripe Price/portal/webhook secret/live-modeが欠ける間はcheckoutを停止し、generation readinessを誤ってfalseにしない。provider key/model accessが欠ける間は生成だけを停止する。状態取得が失敗した場合も、本人認証後の停止操作は課金同期を通さず利用できる。

## 完了条件と実行順
1. 原価表、価格/回数/秒数、本人確認とjob/接続/課金契約を正本へ先にcommit/pushする。
2. 関係する最小の失敗テストを先に確認し、auth/tenant隔離・quota同時予約・Stripe署名/重複・OAuth帰属・job再実行を実装する。関連検証とsource review/CIを通す。
3. 最新mainへ統合し、必要なprovider/deployment設定を対象限定で反映する。実login/3本無料枠/有料subscription/本人OAuth接続/独自avatar・video/公式投稿・metricsを実receiptと分けて確認する。
4. 実利用できる状態をXで告知する。売上・MRR・他者利益・正式directory掲載は、対応する外部結果が無い限り未達とする。

## SaaS-1の過去readback
PR #686はhead `53c09618fe6cbe733e334cf0d032c809ad46b187`、merge commit `28fc06ecdd79377e19b1eed734922da468d46284`でmainへ統合済み。PR CI `40100777243`はSUCCESS。Supabase Primaryの公式readbackでmigration `20261024140729 monk_factory_capacity_intent`を確認する。

main由来Netlify Deploy `40101137159`とpost-deploy money-path smokeはSUCCESS。公式published deploy `6adcbc9e5d86f3902f2e08ed`はready、titleにmain SHA `28fc06ecdd79377e19b1eed734922da468d46284`を含み、Netlifyのcommit_refはnull。公開 `/ai-monk-factory` は「最大3本の無料動画・各20秒・カード不要・期限なし」、消費後は月USD199の案内となり、3日trial文言は表示されない。

ただし、Netlify env APIのGET 200で `MONK_FACTORY_*` は0件。生成・social・Stripe runtimeのFactory設定はまだ無い。コードでは `MONK_FACTORY_ENABLED` とjob runtime/provider readinessが偽ならAPIは準備状態を返し、`factory.tsx` の `generationReady` 判定がGenerateボタンをdisabledにする。したがって今回の「押せない」はclick handler故障ではなく、意図した未設定時gateである。main merge、3本無料quota、公開copyは完了したが、実動画生成や利用者Instagram接続を完了したとは扱わない。

private SSOTの状態確認では、Factory専用Gemini projectは `prepared_unfunded` / `billing_verified=false`、HeyGenはAPI key確認済みのfree accountでauto-reload off、Upload-PostはDefault/free・2 profile・paid plan未購入、Stripeは商品catalog準備済みだがruntime disabled。生成・Stripe Checkout・Instagram OAuth・投稿・課金は今回0件。キーやwallet値はreceiptへ保存しない。

## 現在cursor
2026-10-25のBUDGET-1 release受入は完了。PR #697の会社全体USD10/UTC日estimated reservation capはhead `77037b54ac96f7f77d315075492bb9aae47abf8f`、CI `40118114389` PASSでmain `488452ee0bd87c428933b666a8edadb3fb320524`へ統合。PR #698のmigration source version整合はhead `522c81933d7e061b691b64c43e4046697ffe6c9d`、Landing CI `40118937033` PASS、merge main `c6d90ab4b7c7e570a6549585a2013afe3cc52460`。Netlify deploy `40119267904`とpost-deploy smoke PASS。Supabase公式migration一覧は `monk_factory_company_budget` version `20261024175709`を1件だけ返し、read-only SQLでUSD10/UTC日の予約上限、RLS=true、client SELECT禁止、service_role SELECT許可を確認した。migration DDLの再適用は0。公開ページreadbackは動画3本無料・20秒・カード不要・時間trialなしを表示する。

現在cursorはSaaS-2（provider/runtime readiness）。公式API readback `2026-10-24T18:17:47.897Z`はNetlify env GET 200/62 variables/`MONK_FACTORY_*` 0件、HeyGen GET 200/wallet 0、Upload-Post GET 200/Default/0 of 2 profiles、Gemini models GET 200/required models present/専用project `billing_verified=false`。最新sourceは `MONK_FACTORY_ENABLED=true` をgeneration/checkout/socialの前提とし、Factory envが0件のため `studio_setup` が無効状態の根本理由と推定できる。ただし、このprobeでは認証済みFactory API snapshotは取得していないので、`studio_setup`はsource+envからの推論として保持する。最新readback → `../../evidence/ai-monk-factory-readiness-20261024T181747Z.json`。推定会社上限はprovider実請求/現金支出の上限ではない。日次Grok Bot所有投稿は変更しない。

2026-10-24T17:20:07Zの公式read-only再確認では、Netlify production env APIはHTTP 200、58 variables、`MONK_FACTORY_*`は0件。最新deploy `6adce42e0d5c44f3fd32870f`はreadyで17:01:27Z公開、titleはmain `f2353829b831325e744868b95adf065cdbc002b8`、`commit_ref=null`。公開ページは3本無料・期限なし・カード不要・$199/月候補を表示する。ユーザー画像のstudio disabled状態は別の症状証拠であり、日付不明の画像をauthenticated live readbackとみなさない。

Factory codeは `MONK_FACTORY_ENABLED=true`、job runtime secret、provider keysと独立billing evidenceが揃わないとgenerationをreadyにせず、Checkoutとsocialも個別ready gateで閉じる。`factory.tsx`はreadiness falseなら該当ボタンをdisabledにし、APIはcapability actionを503で拒否する。したがって「ボタンを押せない」の根本原因はUI handlerではなく未設定runtimeであり、押せるよう見せるだけの修正はしない。focused API testは6/6 PASS。

Fresh provider GETではHeyGen `/v3/users/me`がHTTP 200、wallet USD0.00、billing type wallet。Upload-Post `/api/uploadposts/users`はHTTP 200、Default plan、profile 0/limit 2。Gemini models GETはHTTP 200で `gemini-3.1-flash-lite` と `gemini-3.1-flash-lite-image` を返すが、これはbilling proofではなく、private credential SSOTの専用project `billing_verified=false` と一致する。Stripe catalogは用意済みでもproduction runtimeはdisabledのまま。今回のAPI readはすべてGETで、provider account、Instagram接続/投稿、checkout/課金、本番envの変更は0。

現行実装のInstagram接続/投稿adapterはUpload-Postであり、customer-scale white-label契約は未確認。Meta公式Instagram LoginはBusiness/Creator accountとpublish permissionsを必要とし、Advanced AccessにはMeta App Review・Business Verificationが必要。公式Content Publishing APIはpublicly hosted mediaを使い、AI生成Reelではmedia container作成時に `is_ai_generated=true` を渡せる。Factoryを顧客へ販売する前に、Upload-Postの無料2-profile経路へ依存しない公式Meta API/OAuthか、確認済みwhite-label契約を選び、その認可・token保存・投稿・metricsのend-to-endを完了する。Instagram official docs: [overview](https://developers.facebook.com/docs/instagram-platform/overview/), [content publishing](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/)。

現行の原価参照はHeyGen公式price article（2026-10-19更新）でAvatar IV Photo USD2.31/min、Photo Avatar USD1.32/call、Starfish USD0.12/min、API free creditsなし。Google公式pricingは Gemini 3.1 Flash-Lite input USD0.25/output USD1.50 per 1M tokens、Gemini 3.1 Flash Lite Image 1K output USD0.0336。20秒を1日1本ならUSD0.815/日、30日USD24.45の直接生成シナリオ。初回avatar/portraitを含むfree 3本は最大USD3.905見積り、USD4.25/user quota内。30本/36 attempt/45秒 paid capはUSD65.79の直接原価モデルで、$199候補の利益確定ではない。Fresh source, formula and blocked readiness → `../../evidence/ai-monk-factory-cost-and-button-readiness-20261025.json`。

今回の画像にあるGenerate/Instagram/Checkoutのdisabledはclick handler障害ではなく、production `MONK_FACTORY_*` 0件、Gemini課金未確認、HeyGen wallet USD0、Upload-Post Default plan/0 profiles、Stripe runtime disabledにより、UIとAPIがfail-closedしている状態である。現行mainではcapabilityごとのreadiness reasonを表示するコードを公開済み。添付画面の日付は不明で、post-deploy authenticated UI readbackではないため、最新表示は未確認として保持する。

旧順序は会社全体上限・provider funding・customer-scale Instagram API/OAuthを一束で受け入れてからFactoryを有効化する。新順序はBUDGET-1（USD10/UTC日の共有job予約上限とreadiness/UI表示を実装・検証）→ provider funding/権限・Meta API/OAuth契約の外部条件確認 → 全runtime readinessが揃った時だけproduction有効化 → PL-FACTORY-1（Web/CLI/Plugin操作）→ 外部Plugin listingと成果計測。順序変更理由は、BUDGET-1がmain deployとSupabase公式readbackまで完了し、次に独立して進められる実測blockerが専用provider funding/runtime・Instagram publishing permissionであるため。現在cursorはSaaS-2。Grok Bot所有の日次投稿effectには触れない。完了後も利用者別USD4.25/70 reservationやこのUSD10/dayの予約上限を、実請求・利益実績と呼ばない。実行順 → `../plans/2026-10-24-ai-monk-research-distribution.md`。
