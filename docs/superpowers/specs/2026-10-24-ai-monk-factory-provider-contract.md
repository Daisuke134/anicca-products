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
| 本人接続 | https://docs.upload-post.com/api/user-profiles 、https://docs.upload-post.com/api/connect-api | `POST /api/uploadposts/users`、`POST /users/generate-jwt`。hosted OAuthから戻ったqueryは証拠にせず、`GET /users/{profile}`のprofile完全一致とIGのopaque `username`を使う。 |
| 投稿 | https://docs.upload-post.com/api/upload-video 、https://docs.upload-post.com/api/upload-status | 公式GETで本人の接続IDを直前照合し、`POST /api/upload`のmultipart、IG Reels、`async_upload:true`。`request_id`と公式idempotency headerを送り、GETで投稿結果を読む。 |
| metrics | https://docs.upload-post.com/api/get-analytics | native IG post IDと本人profileをqueryへ送り、返るprofile/post ID/platformを照合する。`post_metrics_source:platform_api`の報告値だけを返し、欠落を0へ変えない。 |

## 原価とruntimeの限界

Geminiの公表単価はtext input USD0.25/M token、台本output（thinking含む）USD1.50/M token、画像output USD30/M token。画像modelは1Kのみ、1画像出力1120tokenの表示料金はUSD0.0336でありinput/thought等を含む総実費ではない。固定ASCII promptは1024byte以内に保持する。model全input65536tokenと全output4096tokenを最高の画像単価へ置く条件付き計算はUSD0.139264なので、providerの画像推算予約表示をUSD0.14へ揃える。SQLのavatar予約USD1.60（画像＋PhotoAvatar）とperiod USD4.25/70は変更しない。

台本入力はinstructionsとDB資料を含むserialized inputの12000byte上限、outputはthoughtを含む1200token上限にする。12000 input tokenという保守仮定ではUSD0.0048であり既存script予約USD0.005を維持する。byte→tokenと請求額は実測ではなく、予約をinvoiceの厳密hard ceilingと呼ばない。公式thinking資料 https://ai.google.dev/gemini-api/docs/thinking のToken limits and max_output_tokensはthoughtを含む合算hard cutoffを説明し、打切りはincomplete/出力途中・空になり得るため成功へ昇格しない。台本のthinking_levelは無確認の値を指定しない。

有料project/keyと独立支払元・モデル利用権限はlive未受入。画像modelに無料枠はなく、無料/共有Gemini keyへのfallbackは0。有料APIのデータ取扱いと18歳以上のcreator向け利用条件をprivacy/termsへ反映するが、年齢条件の実運用と専用billingの証明はFactory enable前の未完条件として残す。旧OpenAI経路は利用不能な専用accountに依存するため置換し、第二adapter/後方互換層は作らない。PL-1正式掲載のOpenAI正規復旧は残す。限定preflight → ../../evidence/ai-monk-factory-gemini-provider-preflight-20261024.json。

HeyGenのPhotoAvatar USD1.32、Avatar IV Photo USD2.31/分、別Starfish USD0.12/分、Upload-Post Professional USD50/月25profileの原価正本は全体specに従う。既存Grok key/wallet/Postiz/profileへのfallbackは0。

Interactionsは同期の`background:false/store:false`で1回送る。公式interaction IDをreceiptとして保存するが、storeしない応答を後からGETで回収できるとは保証しない。画像だけは既存background functionで240秒timeoutと任意の呼出元signal、他methodは10秒を使う。通信timeout・応答消失・incomplete・不正成功は`provider_effect_unknown`として予約とfenceを保持し、自動再送しない。JPEG1枚・正しいMIME・base64と既存5MiB上限を検証し、server内だけで保持する。

`status:completed`と公式IDを必須にし、`steps`内の`model_output.content`だけからimage/textを読む。thoughtやproviderの余分な本文をclient/logへ返さない。台本は1つのJSON textだけを採用し、script/captionの既存長さとsupplied source IDをアプリ側でも検証する。GeminiのJSON schemaで無視されるstring長制約へ依存しない。usageはinput/output/thought/totalを別に正規化し、既存job evidence/private image blobへ数値だけを保存する。token値欠落を0へ変えず、実請求USDへ換算しない。不完全/不正な成功応答にもusageとinteraction receiptが返る場合は、選別した数値とreceiptをerror経由で既存のeffect_unknown evidenceへ残す。HTTP拒否や通信消失で返らないtoken数はunknownのままとし再送しない。

## 設定とreadiness

`createFactoryProviders({env,fetchImpl=fetch})`は設定だけを読み、認証やlive通信を行わない。

- `MONK_FACTORY_GEMINI_API_KEY`、`MONK_FACTORY_HEYGEN_API_KEY`、`MONK_FACTORY_HEYGEN_VOICE_ID`、`MONK_FACTORY_UPLOAD_POST_API_KEY`。
- 各serviceの`MONK_FACTORY_{GEMINI,HEYGEN,UPLOAD_POST}_BILLING_VERIFIED=true`と`..._BILLING_EVIDENCE_REF`は有料APIを使える独立課金元のoperator確認記録を指す。設定値をprovider-side証明と呼ばず、欠落はreadinessの`unverified`へ残す。
- `MONK_FACTORY_UPLOAD_POST_WHITELABEL_VERIFIED=true`は実planの確認記録。未確認ならprofile/Connect/投稿submitを拒否する。
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
- `createSocialProfile(userId)` → `{profile,status}`。profileは認証済みUUIDから`factory_<uuid>`としてderiveし、別profileへのfallbackは0。
- `connectInstagram(userId)` → `{profile,accessUrl}`。hosted URLだけをConnectの直前に返し、JWT単体やoperator keyは返さない。URLは短命のprofile credentialなので保存/log共有しない。Business/Creator条件と接続移動の説明はroot UIが所有する。
- `socialState(userId)` → `{profile,connected,accountId,handle,reauthRequired}`。公式`social_accounts.instagram.username`は名前に反してIG自身の不変opaque user IDであり、この値を`accountId`へ正規化する。公開可変`handle`とは分離し、推測した別idフィールドを使用しない。
- `publishInstagram({userId,accountId,videoUrl,caption,requestId})` → `{id,status}`。直前readbackが一致しない時はPOST0。
- `postStatus(id)` → `{id,status,postId,postUrl,profile?}`。`completed`だけでは公開扱いせず、Instagram自身の成功・未skip・公式post ID/URLを要求する。status結果がcontainer IDとURLだけを返す場合、公式`GET /api/uploadposts/post-analytics/{request_id}`でnative `platform_post_id`を取得し、request IDとFactory profileを照合して`profile`も返す。container IDやURLからnative IDを推測しない。
- `metrics({userId,postId})` → `{postId,profile,source,metrics}`。報告される数値だけを返す。

全POSTは1回。公式idempotency契約のあるHeyGen avatar/videoとUpload-Post uploadだけheaderを使う。Geminiとspeech、profile作成、JWT発行へ推測でheaderを足さない。通信・5xx・409・不正成功応答はsubmitのeffect不明、4xxの明示拒否はeffectなしとして返し、provider本文やsecretはerrorへ含めない。GET失敗はreadback失敗として再診断できる形で返す。

## 最小検証

設定不足と独立課金元未確認でPOST0、日次keyへのfallback0、画像/PhotoAvatar/LLMの公式payload、Starfish duration欠落/上限超過で動画POST0、timeoutでsubmit1回、secret/raw診断非露出、公式profile/opaque account照合、hosted URLのorigin制限、公開postの成功条件、metrics欠落非0をfocused testで確認する。実APIアクセス・実課金・全suiteはこのsource受入に追加しない。

現在cursor: main `8e59eda6c0cb241b8f2fe195a06e6a9df5d25772`由来の専用branch `feat/ai-monk-factory-gemini-adapter-20261024`で本契約を先行pushし、最小RED→Gemini adapter置換→GREEN・CI/main公開へ進む。専用credential・本番設定・入金・実生成・顧客課金・本人IG接続/投稿はこのsource unitで実行せず、ready=false/enable=falseを維持する。

source受入: provider/jobs33件（画像・台本の新APIと不完全応答usage保存のRED→GREEN）、隔離Postgres25件PASS。DB検証は最後のerror-only usage転送前であり、最終headの既存CIが同DB契約を再確認する。実API/課金は0。source receipt → ../../evidence/ai-monk-factory-gemini-adapter-source-20261024.json。fresh source review・CI・main反映を次に受入する。

独立reviewのf21d025で、異常応答のinteraction IDがHTTP追跡IDへ置換される場合と、生成後のblob保存失敗で取得済みID/usageが失われる場合を確認する。公式interaction IDをHTTP headerより優先し、不正成功応答と保存障害にも既知の数値usage/receiptを残す最小RED→GREENを追加する。再送0・予約保持・price/quotaは維持し、修正headを限定再検証する。

上記2指摘はfocused実assertionのRED→GREEN/35件で修正する。初回f21d025のCI40042397129 SUCCESSを修正後の合格へ流用しない。初回receiptはそのheadの履歴として保持し、修正証拠 → ../../evidence/ai-monk-factory-gemini-review-fix-source-20261024.json。
