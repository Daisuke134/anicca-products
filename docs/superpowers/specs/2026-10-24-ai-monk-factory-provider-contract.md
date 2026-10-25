# AI Monk Factory provider契約

## 目的・所有範囲・完了条件

Factory専用の画像・台本・avatar・音声・縦動画・本人Instagram接続・投稿・metrics adapterを実装する。所有範囲は`monk-factory-providers.js`と同focused test、`monk-factory-db.test.js`の専用設定fixture、`monk-factory-jobs.js`と必要最小のusage保存回帰、Factoryのprivacy/18歳以上の利用案内、このspec・全体spec・実行plan・新規source receipt。新依存は追加しない。source契約のRED→GREEN、必要な既存検証・fresh money review・CI・main由来公開までをこの実装unitの完了条件とする。実契約・credential変更・課金・生成・接続・投稿は実行せず、sourceテストをlive成果と呼ばない。

全体契約 → `2026-10-24-ai-monk-factory-saas-design.md`。予算予約・quota・lease・effect fence・再実行判断・認証済みuserとjobの所有権はrootのstore/tickが所有する。adapterは一度だけsubmitし、公式IDと正規化readbackを返す。

## 公式根拠と採用

| 対象 | 一次資料 | 採る契約 |
| --- | --- | --- |
| 旧画像案の不成立 | https://developers.heygen.com/docs/models/heygen-image.md | `heygen-image-1`は`identity_images`と`reference_images`必須、`identity_remix`のみ、`prompt`非対応。公表$0.28をtext-to-imageの料金として扱わない。 |
| 独自画像 | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-image 、https://ai.google.dev/api/interactions | Gemini Developer API `POST /v1beta/interactions`、`gemini-3.1-flash-lite-image`、1体、1K・2:3・JPEG inline。入力画像0・固定ASCII promptのみ。`generation_config.max_output_tokens:4096`、`thinking_level:minimal`、`store:false`、`background:false`、streamなし。 |
| 台本 | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite 、https://ai.google.dev/gemini-api/docs/structured-output 、https://ai.google.dev/api/interactions | 同じInteractions APIの`gemini-3.1-flash-lite`、JSON schemaでscript/caption/source IDを受ける。`max_output_tokens:1200`、`store:false`、`background:false`。アプリ用modelの選定でありCodex UIのモデルを変更しない。 |
| PhotoAvatar | https://developers.heygen.com/reference/create-avatar.md 、https://developers.heygen.com/reference/get-avatar-look.md | `POST /v3/avatars`の`type:photo`、`file`は生成JPEGのbase64。`GET /v3/avatars/looks/{id}`で`completed`と`avatar_iv`対応を確認する。 |
| 音声 | https://developers.heygen.com/reference/generate-speech.md | `POST /v3/voices/speech`、`engine:starfish`。公式`audio_url`・正の有限`duration`・engineを検証する。 |
| 動画 | https://developers.heygen.com/reference/create-video.md 、https://developers.heygen.com/photo-avatar.md | `POST /v3/videos`、`type:avatar`、`engine:{type:avatar_iv}`、9:16、1080p、公式音声URL。`GET /v3/videos/{id}`でpollする。 |
| 本人接続 | https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-unified-login/get-started 、https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-unified-login/authentication 、https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business#bisu-token-api | Instagram/Facebook Unified Loginの`config_id`を使い、15分・一回限りのstateを検証する。serverがcodeをBusiness Integration System User Access Tokenへ交換し、client business IDと割り当て済みInstagram professional accountを公式GETで読む。日次自動投稿用設定はtoken expiryを指定しない。expiryを指定する場合は期限前のofficial token management更新を実装し、必要なpermissionを確認してから有効化する。 |
| 投稿 | https://developers.facebook.com/documentation/instagram-platform/content-publishing | Meta Graph APIで`/{ig-user-id}/media`へReels containerを一度作成し、`status_code=FINISHED`後に`/{ig-user-id}/media_publish`を一度実行する。動画は公開取得可能なHTTPS URLとし、AI disclosureを付ける。 |
| metrics | https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/insights/ | 公式media permalink/timestampとInsightsを取得し、投稿ID・URL・Factory ownerを照合する。数値として返った値だけを保存し、空・遅延値を0へ変えない。 |

## 原価とruntimeの限界

Geminiの公表単価はtext input USD0.25/M token、台本output（thinking含む）USD1.50/M token、画像output USD30/M token。画像modelは1Kのみ、1画像出力1120tokenの表示料金はUSD0.0336でありinput/thought等を含む総実費ではない。固定ASCII promptは1024byte以内に保持する。model全input65536tokenと全output4096tokenを最高の画像単価へ置く条件付き計算はUSD0.139264なので、providerの画像推算予約表示をUSD0.14へ揃える。SQLのavatar予約USD1.60（画像＋PhotoAvatar）とperiod USD4.25/70は変更しない。

台本入力はinstructionsとDB資料を含むserialized inputの12000byte上限、outputはthoughtを含む1200token上限にする。12000 input tokenという保守仮定ではUSD0.0048であり既存script予約USD0.005を維持する。byte→tokenと請求額は実測ではなく、予約をinvoiceの厳密hard ceilingと呼ばない。公式thinking資料 https://ai.google.dev/gemini-api/docs/thinking のToken limits and max_output_tokensはthoughtを含む合算hard cutoffを説明し、打切りはincomplete/出力途中・空になり得るため成功へ昇格しない。台本のthinking_levelは無確認の値を指定しない。

有料project/keyと独立支払元・モデル利用権限はlive未受入。画像modelに無料枠はなく、無料/共有Gemini keyへのfallbackは0。有料APIのデータ取扱いと18歳以上のcreator向け利用条件をprivacy/termsへ反映するが、年齢条件の実運用と専用billingの証明はFactory enable前の未完条件として残す。旧OpenAI経路は利用不能な専用accountに依存するため置換し、第二adapter/後方互換層は作らない。PL-1正式掲載のOpenAI正規復旧は残す。限定preflight → ../../evidence/ai-monk-factory-gemini-provider-preflight-20261024.json。

HeyGenのPhotoAvatar USD1.32、Avatar IV Photo USD2.31/分、別Starfish USD0.12/分の原価正本は全体specに従う。投稿先はMeta公式Instagram APIであり、Upload-Postの過去価格観測を現在のFactory費用として扱わない。既存Grok key/wallet/Postiz/profileへのfallbackは0。

Interactionsは同期の`background:false/store:false`で1回送る。公式interaction IDをreceiptとして保存するが、storeしない応答を後からGETで回収できるとは保証しない。画像だけは既存background functionで240秒timeoutと任意の呼出元signal、他methodは10秒を使う。通信timeout・応答消失・incomplete・不正成功は`provider_effect_unknown`として予約とfenceを保持し、自動再送しない。JPEG1枚・正しいMIME・base64と既存5MiB上限を検証し、server内だけで保持する。

`status:completed`と公式IDを必須にし、`steps`内の`model_output.content`だけからimage/textを読む。thoughtやproviderの余分な本文をclient/logへ返さない。台本は1つのJSON textだけを採用し、script/captionの既存長さとsupplied source IDをアプリ側でも検証する。GeminiのJSON schemaで無視されるstring長制約へ依存しない。usageはinput/output/thought/totalを別に正規化し、既存job evidence/private image blobへ数値だけを保存する。token値欠落を0へ変えず、実請求USDへ換算しない。不完全/不正な成功応答にもusageとinteraction receiptが返る場合は、選別した数値とreceiptをerror経由で既存のeffect_unknown evidenceへ残す。HTTP拒否や通信消失で返らないtoken数はunknownのままとし再送しない。

## 設定とreadiness

`createFactoryProviders({env,fetchImpl=fetch})`は設定だけを読み、認証やlive通信を行わない。

- `MONK_FACTORY_GEMINI_API_KEY`、`MONK_FACTORY_HEYGEN_API_KEY`、`MONK_FACTORY_HEYGEN_VOICE_ID`は生成専用credentialを使い、日次Grok ownerのkeyへfallbackしない。
- Gemini/HeyGenそれぞれの`MONK_FACTORY_{GEMINI,HEYGEN}_BILLING_VERIFIED=true`と`..._BILLING_EVIDENCE_REF`は独立課金元と実効支出上限のreadbackを指す。設定値だけをprovider-side証明と呼ばず、欠落はreadinessの`unverified`へ残す。
- Metaは`MONK_FACTORY_META_APP_ID`、`MONK_FACTORY_META_APP_SECRET`、`MONK_FACTORY_META_CONFIG_ID`、HTTPS `MONK_FACTORY_META_REDIRECT_URI`、`MONK_FACTORY_META_WEBHOOK_VERIFY_TOKEN`、`MONK_FACTORY_META_API_VERSION`を使う。`MONK_FACTORY_META_STANDARD_ACCESS_VERIFIED=true`と`MONK_FACTORY_META_STANDARD_ACCESS_EVIDENCE_REF`は対象アプリのStandard Access・test-role・expiryなしのUnified Login config readbackを示し、`MONK_FACTORY_JOB_SECRET`はOAuth stateと保存tokenの暗号鍵として使う。
- `MONK_FACTORY_SCRIPT_MODEL`は省略時`gemini-3.1-flash-lite`。料金を確認した同モデルだけを許容し、無確認モデルへ切り替えない。

`readiness()`は`{ready,missing,unverified,limits}`を返す。秘密値やevidence参照本文は返さない。必要キー欠落、独立課金元未確認、white-label未確認は成功へ置換しない。readbackは既存effectの診断に必要なため該当serviceのAPI keyだけで実行できる。

## interfaceと返り値

- `createAvatarImage({requestId,signal})` → `{id,status,imageBase64,mediaType,usage,reservedUsd}`。`id`はGemini公式interaction receipt。画像base64はserver専用。
- `createPhotoAvatar({imageBase64,mediaType,requestId})` → `{id,status}`。base64はGemini JPEGを直接渡す。既存利用者が無いためURL互換入力は追加しない。
- `avatarStatus(id)` → `{id,status,imageUrl,supportedEngines}`。
- `createScript({playbooks,maxSeconds,requestId})` → `{id,script,caption,sourceIds,usage,reservedUsd}`。DB資料はdataとしてLLMに渡し、script判断のkeyword/regex代替は追加しない。
- `createSpeech({script,requestId})` → `{id,audioUrl,duration,engine}`。公式request ID欠落時はeffect不明とする。
- `createVideo({avatarId,audioUrl,duration,maxSeconds,requestId})` → `{id,status}`。rootが保存した公式speech結果を入力し、正の有限durationがmaxSeconds以内であることを必須にする。duration欠落、20秒trial超過、45秒paid超過は動画submit0。
- `videoStatus(id)` → `{id,status,videoUrl,duration}`。
- `connectInstagram(userId)` → `{profile,accessUrl}`。Meta OAuth URLは`www.facebook.com/dialog/oauth`に限定し、短命stateのhashだけを保存して生stateやtokenをlog/clientへ返さない。
- `completeInstagramOAuth({code,state})`はstateを一回だけ消費し、serverでtoken交換、business ID・assigned Instagram ID/usernameを公式GETし、tokenをAES-GCMで暗号化して保存する。接続対象が複数なら自動選択せず明示的エラーとする。
- `socialState(userId)` → `{profile,connected,accountId,handle,reauthRequired}`。公式`GET /{ig-user-id}?fields=id,username`で保存済みのID/usernameと照合する。
- `publishInstagram({userId,accountId,videoUrl,caption,requestId})` → `{id,status}`。本人ID、公開HTTPS動画URL、captionを検証した後、`POST /{ig-user-id}/media`へ`media_type:REELS`と`is_ai_generated:true`を送り、container IDを保存する。
- `postStatus({userId,id})` → `{id,status}`はcontainerの公式`status_code`を照合する。`IN_PROGRESS`はpoll、`FINISHED`だけpublish準備済みとし、`ERROR`/`EXPIRED`は失敗にする。
- `publishInstagramContainer({userId,accountId,containerId,requestId})`は本人IDを再照合し、`POST /{ig-user-id}/media_publish`を一度だけ送る。native published media IDの公式readback後に初めて完了扱いする。
- `metrics({userId,postId})` → `{postId,postUrl,timestamp,profile,source,metrics}`。`/{media-id}`と`/{media-id}/insights`の結果を照合し、利用可能な数値だけ返す。Insightsの未提供や遅延は空objectのまま保持する。

各provider POSTは一回だけ実行する。公式idempotency契約があるHeyGen avatar/videoだけheaderを使う。Meta media container/publish、Gemini、speechへ未確認idempotency headerを追加しない。Meta publishまでのeffect fenceと公式GET readbackで再送を防ぎ、通信・5xx・不正成功応答はeffect unknownとして予約を保持する。4xxの明示拒否はeffectなしとし、provider本文やsecretはerrorへ含めない。GET失敗はreadback失敗として再診断できる形で返す。

## 最小検証

設定不足と独立課金元未確認でPOST0、日次keyへのfallback0、画像/PhotoAvatar/LLMの公式payload、Starfish duration欠落/上限超過で動画POST0、timeoutでsubmit1回、secret/raw診断非露出、Meta OAuth stateの一回性・token暗号化・official account照合、Reels container/publish fence、公式permalink/Insightsの帰属、遅延metrics非0をfocused testで確認する。実APIアクセス・実課金・全suiteはこのsource受入に追加しない。

source unitの開始点はmain `8e59eda6c0cb241b8f2fe195a06e6a9df5d25772`由来の専用branch `feat/ai-monk-factory-gemini-adapter-20261024`。本契約の先行pushと最小RED→GREEN・修正後CI/main公開は下記production receiptで受入する。専用credential・本番設定・入金・実生成・顧客課金・本人IG接続/投稿はこのsource unitでは0とし、後続の未課金credential準備と区別する。ready=false/enable=falseを維持する。

source受入: provider/jobs33件（画像・台本の新APIと不完全応答usage保存のRED→GREEN）、隔離Postgres25件PASS。DB検証は最後のerror-only usage転送前であり、最終headの既存CIが同DB契約を再確認する。実API/課金は0。source receipt → ../../evidence/ai-monk-factory-gemini-adapter-source-20261024.json。初回sourceの履歴を保持し、後続の最終受入はproduction receiptで記録する。

独立reviewのf21d025で、異常応答のinteraction IDがHTTP追跡IDへ置換される場合と、生成後のblob保存失敗で取得済みID/usageが失われる場合を確認する。公式interaction IDをHTTP headerより優先し、不正成功応答と保存障害にも既知の数値usage/receiptを残す最小RED→GREENを追加する。再送0・予約保持・price/quotaは維持し、修正headを限定再検証する。

上記2指摘はfocused実assertionのRED→GREEN/35件で修正する。初回f21d025のCI40042397129 SUCCESSを修正後の合格へ流用しない。初回receiptはそのheadの履歴として保持し、修正証拠 → ../../evidence/ai-monk-factory-gemini-review-fix-source-20261024.json。

最終sourceはhead `e147e59624dccb351d9902ea345b765337cf838b`の独立限定再検証SHIP/Blocking0・focused35件とCI40042813632 SUCCESSで受入し、PR647/main `373eec46af11c0d32566386df7fbd201413b3d5b`由来Deploy40043161929 SUCCESSと公開Webで確認する。専用project/keyの未課金準備は別unitで受入する。source/main公開 → ../../evidence/ai-monk-factory-gemini-adapter-production-20261024.json。全体の現在cursor → ../plans/2026-10-24-ai-monk-research-distribution.md。
