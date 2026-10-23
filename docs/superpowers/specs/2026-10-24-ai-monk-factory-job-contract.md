# AI Monk Factory job契約

## 目的・範囲・完了条件

verified Auth UIDへ制作・本人Instagram接続・日次投稿を結ぶ。所有は`monk-factory-jobs.js`、tick/background関数、既存store/APIの必要最小変更、追加migration、関連test。UI・provider adapter・既存migration・日次Grok/HeyGen/Postiz/Mac loopは変更しない。source受入は関連RED→GREEN、synthetic Postgresでlease/CAS/二重送信0/本人帰属を確認し、専用branchへcommit/pushする。実provider・本番DB・認証・課金・生成・投稿は実行しない。全体契約 → `2026-10-24-ai-monk-factory-saas-design.md`。provider入出力 → `2026-10-24-ai-monk-factory-provider-contract.md`。

## 信頼・予約・送信境界

client UID/customer/profile/script/modelを採用しない。Auth server UIDとStripe公式同期の期間だけを使う。avatar occurrenceは生涯固定、videoは本人UIDに結ぶ`Idempotency-Key` UUID。既存`reserve_job`で試行・成功候補・秒数・USDを予約し、失敗/不明を自動解放しない。trialは3日/20秒/3試行/3成功、avatar1体、USD4.25。paidは45秒/36試行/30成功、USD70。captionは保存時に信頼できる固定AI fictional disclosureを先頭へ付ける。台本の内容判断はLLMだけで行い、DBの既存winning playbooks helperから根拠を取得する。

jobは期限付きleaseで1workerだけがclaimする。各POST直前に同じlease/stageを条件とするCASで`status=effect_unknown`と`*_submitting`を永続化する。provider成功後のID/結果保存に失敗した場合は同じDB更新だけを短く再試行し、provider再送0。期限切れleaseからPOSTを再実行しない。公式IDのあるpendingはGETだけで回復し、IDの無いunknownは具体的な診断/evidenceと予約を保持する。各境界へrun/owner/occurrence/releaseSHA/非secret runtime/phase/command/exit/effect/readback/receipt/error/retryability/next_actionを記録し、base64/JWT/provider raw bodyを保存しない。

avatar: reserved→image_pending→image_submitting→image_ready→avatar_submitting→avatar_pending→completed。同期画像POSTはNetlify backgroundだけで実行し、240秒のprovider timeoutを許容する。短命HMAC ticketはjob ID/nonce/expiryだけを含み、公開URLでも改竄・別job・期限切れを拒否する。background retryはDB fenceで画像POST0。生成JPEGはprivate Netlify Blobsへserverだけが保存し、公開APIへbase64を返さない。PhotoAvatar公式GETのcompleted/avatar_ivを確認してaccountへavatar ID/previewを保存する。

既存Blobs v8のclassic contextはstrong GETに必要なuncachedEdgeURLを持たないため、immutable keyの通常GETを使い、反映待ちnullは一時失敗として再読取する。SDK内蔵の5秒×5回retryは単発transportで止め、10秒timeoutとtick共通25秒signalを通す。5xx/timeoutは内部408へ正規化してSDK retryを止めるだけで、成功や0件へ置換しない。診断は`image_storage_unavailable`とし、private画像/provider fenceを保持する。

video: reserved→script_submitting→script_ready→speech_submitting→speech_ready→video_submitting→video_pending→completed。公式speech durationが正・有限・当該job上限以内でなければrender POST0。各有料POST前にStripe公式同期を行い、period一致・未取消・利用権・auto originなら明示ONを再確認する。OFFや取消後は後続の制作/投稿POSTを止め、既存pendingのGETは継続できる。

## 本人接続・投稿・metrics

stable profileは`factory_<verified UUID>`。GET一致を優先し、公式404で未作成と確認した後だけaccountの永続fenceを取得してprofile作成を1回行う。unknownはGETで照合し、再POSTしない。JWT Connect URLは明示Connect要求だけへ返し、保存/logしない。戻りqueryは接続証明にせず、公式socialStateのprofile完全一致・opaque account ID・reauthRequiredを保存する。

自動投稿ONは明示API操作だけ。ON時点の完成済み未投稿videoを先に使い、最初の投稿機会はON時点、以後24時間を起点とする。account lockの下で日次occurrence/次回時刻を予約し、同時tickは同じvideoを投稿しない。制作/投稿直前のStripe同期、ON、公式IG再照合を必須にする。投稿直前fence・公式request ID・GETで回復し、unknownは再送しない。OFF/解約/失効は次回制作/投稿を止める。metricsは本人profile/native post IDの公式値と取得時刻を保存し、欠落を0にしない。

Stripe queueは既存pendingEvents/markEventとsyncFactoryBillingを使う。期限切れCheckoutは公式sessionのnonce/user/statusを照合し、未成立・provider profile未作成・trial未使用の予約だけ解放する。旧subscription receiptは現在のactive subscriptionへ上書きせず、既知旧IDの公式帰属を確かめno-opとする。

## 公開APIとruntime

POST action: `generate_avatar`/`generate_video`→202 `{jobId}`、`connect_instagram`→200 `{url}`、`autopost`→200 `{auto_post:true}`、既存`stop`→`{auto_post:false}`。GETは`{ready,account,jobs,usage}`。accountへavatar_ready/connected/social_checked_atを追加し、secret/customer/nonce/evidence/base64は出さない。usageはDBで公式periodからvideosRemaining/attemptsRemaining/maxSeconds/periodEnd/asOfを算出し、不明はnullにする。job公開列は既存最小列とmetrics_atのみ。

tickは既存Netlify scheduleで1分、最大4work item/22秒の処理予算とする。公式scheduled上限30秒に対して全native fetch/DBを25秒の共通AbortSignalで打ち切り、Stripeの10秒timeoutは開始前12/15秒の余裕確認で囲む。POST fence前には11秒以上の残り時間を要求する。background関数は`monk-factory-image-background`（公式15分、画像timeout240秒、lease6分）。公式失敗retryがあってもfenceで再POSTしない。根拠: https://docs.netlify.com/build/functions/scheduled-functions/ 、https://docs.netlify.com/build/functions/background-functions/ 。内部HMAC secret `MONK_FACTORY_JOB_SECRET`（最低32byte）と固定origin `https://aniccaai.com`を使う。新scheduler/依存/Mac processは追加しない。readiness falseはprovider送信0。live配置・秘密設定・スケジュール配線・main統合・実受入はprimaryが所有する。

## 現在cursor

source実装と関連RED→GREENを完了する。独立Postgres20件でquota/lease/CAS、OFF・取消との競合、unknown replay-zero、公式request ID回復、保存応答消失、profile帰属、期限切れCheckout/旧nonce、内部列非公開を確認する。実adapterと最小transport fixtureを通して実DB playbook→script→speech→render→publish→metrics、署名background画像→private blob→PhotoAvatarも確認する。Factory関連core44件がGREEN、DBは別runで20/20を確認する。provider raw body/JWT/base64の公開0。新migrationはCLI生成`20261023184014_monk_factory_jobs.sql`、元migration変更0。live条件はmain統合/DB反映/専用billing/keyとJOB_SECRET/Netlify schedule/private Blobs/実認証/本人IG接続/実画像・動画・投稿・metricsであり、今回のprovider通信・本番DB・課金・生成・投稿は0。
