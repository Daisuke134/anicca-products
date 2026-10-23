# AI Monk Factory provider契約

## 目的・所有範囲・完了条件

Factory専用の画像・台本・avatar・音声・縦動画・本人Instagram接続・投稿・metrics adapterを実装する。所有範囲は`monk-factory-providers.js`、同focused test、このspecの3ファイル。新依存は追加しない。source契約のRED→GREENとcommit/pushを完了条件とする。実契約・credential変更・課金・生成・接続・投稿は実行せず、sourceテストをlive成果と呼ばない。

全体契約 → `2026-10-24-ai-monk-factory-saas-design.md`。予算予約・quota・lease・effect fence・再実行判断・認証済みuserとjobの所有権はrootのstore/tickが所有する。adapterは一度だけsubmitし、公式IDと正規化readbackを返す。

## 公式根拠と採用

| 対象 | 一次資料 | 採る契約 |
| --- | --- | --- |
| 旧画像案の不成立 | https://developers.heygen.com/docs/models/heygen-image.md | `heygen-image-1`は`identity_images`と`reference_images`必須、`identity_remix`のみ、`prompt`非対応。公表$0.28をtext-to-imageの料金として扱わない。 |
| 独自画像 | https://developers.openai.com/api/docs/models/gpt-image-1-mini.md 、https://developers.openai.com/api/docs/guides/image-generation | `POST /v1/images/generations`、`gpt-image-1-mini`、1体、1024×1536、high、JPEG。入力画像0・固定ASCII promptのみ。返る`b64_json`をserver内でPhotoAvatarへ渡す。 |
| 台本 | https://developers.openai.com/api/docs/models/gpt-4o-mini 、https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create | 既存`apps/api/src/routes/mobile/preReminder.js`と同じChat Completions API。アプリ用`gpt-4o-mini-2024-07-18`を使い、JSON schemaでscript/caption/source IDを受ける。Codex UIのモデルは変更しない。 |
| PhotoAvatar | https://developers.heygen.com/reference/create-avatar.md 、https://developers.heygen.com/reference/get-avatar-look.md | `POST /v3/avatars`の`type:photo`、`file`は生成JPEGのbase64。`GET /v3/avatars/looks/{id}`で`completed`と`avatar_iv`対応を確認する。 |
| 音声 | https://developers.heygen.com/reference/generate-speech.md | `POST /v3/voices/speech`、`engine:starfish`。公式`audio_url`・正の有限`duration`・engineを検証する。 |
| 動画 | https://developers.heygen.com/reference/create-video.md 、https://developers.heygen.com/photo-avatar.md | `POST /v3/videos`、`type:avatar`、`engine:{type:avatar_iv}`、9:16、1080p、公式音声URL。`GET /v3/videos/{id}`でpollする。 |
| 本人接続 | https://docs.upload-post.com/api/user-profiles 、https://docs.upload-post.com/api/connect-api | `POST /api/uploadposts/users`、`POST /users/generate-jwt`。hosted OAuthから戻ったqueryは証拠にせず、`GET /users/{profile}`のprofile完全一致とIGのopaque `username`を使う。 |
| 投稿 | https://docs.upload-post.com/api/upload-video 、https://docs.upload-post.com/api/upload-status | 公式GETで本人の接続IDを直前照合し、`POST /api/upload`のmultipart、IG Reels、`async_upload:true`。`request_id`と公式idempotency headerを送り、GETで投稿結果を読む。 |
| metrics | https://docs.upload-post.com/api/get-analytics | native IG post IDと本人profileをqueryへ送り、返るprofile/post ID/platformを照合する。`post_metrics_source:platform_api`の報告値だけを返し、欠落を0へ変えない。 |

## 原価とruntimeの限界

OpenAI画像の公表出力は1024×1536/highでUSD0.052、text入力はUSD2/1M token。入力画像は使わず、固定ASCII promptは1024byte以内に制限する。現promptの実測は596byte。byte単位token化を保守的に置くと1024tokenで入力USD0.002048、出力との合計USD0.054048となる推算であり、画像の保守予約はUSD0.06とする。この予約は保証されたinvoice ceilingではない。画像の実token使用量・公式request receiptを返すが、税・実tariff・請求額の証明は別である。台本はgpt-4o-miniの公表input USD0.15/1M token、output USD0.60/1M token。DB資料を含む入力を12000byte以内、outputを1200token以内に限定し、保守予約USD0.005とする。rootのperiod予算はこれらをcall前に予約する。

HeyGenのPhotoAvatar USD1.32、Avatar IV Photo USD2.31/分、別Starfish USD0.12/分、Upload-Post Professional USD50/月25profileの原価正本は全体specに従う。既存Grok key/wallet/Postiz/profileへのfallbackは0。

Images APIは同期で、生成IDを使う公式poll endpointはない。`x-request-id`はrequest receiptであり、後から画像を取り直せるjob IDではない。画像だけは背景処理向け240秒timeoutと任意の呼出元signalを使い、その他methodの10秒と分離する。rootは待機可能な背景関数runtimeを選ぶ。通信timeoutや応答消失後は`provider_effect_unknown`として予約とfenceを保持し、自動再送しない。画像base64はserver内だけで保持し、client response/logへ含めない。

## 設定とreadiness

`createFactoryProviders({env,fetchImpl=fetch})`は設定だけを読み、認証やlive通信を行わない。

- `MONK_FACTORY_OPENAI_API_KEY`、`MONK_FACTORY_HEYGEN_API_KEY`、`MONK_FACTORY_HEYGEN_VOICE_ID`、`MONK_FACTORY_UPLOAD_POST_API_KEY`。
- 各serviceの`MONK_FACTORY_{OPENAI,HEYGEN,UPLOAD_POST}_BILLING_VERIFIED=true`と`..._BILLING_EVIDENCE_REF`は独立課金元のoperator確認記録を指す。設定値をprovider-side証明と呼ばず、欠落はreadinessの`unverified`へ残す。
- `MONK_FACTORY_UPLOAD_POST_WHITELABEL_VERIFIED=true`は実planの確認記録。未確認ならprofile/Connect/投稿submitを拒否する。
- `MONK_FACTORY_SCRIPT_MODEL`は省略時`gpt-4o-mini-2024-07-18`。料金を確認した同モデルだけを許容し、無確認モデルへ切り替えない。

`readiness()`は`{ready,missing,unverified,limits}`を返す。秘密値やevidence参照本文は返さない。必要キー欠落、独立課金元未確認、white-label未確認は成功へ置換しない。readbackは既存effectの診断に必要なため該当serviceのAPI keyだけで実行できる。

## interfaceと返り値

- `createAvatarImage({requestId,signal})` → `{id,status,imageBase64,mediaType,usage,reservedUsd}`。`id`はOpenAI公式request receipt。画像base64はserver専用。
- `createPhotoAvatar({imageBase64,mediaType,requestId})` → `{id,status}`。base64はOpenAI JPEGを直接渡す。既存利用者が無いためURL互換入力は追加しない。
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

全POSTは1回。公式idempotency契約のあるHeyGen avatar/videoとUpload-Post uploadだけheaderを使う。OpenAIとspeech、profile作成、JWT発行へ推測でheaderを足さない。通信・5xx・409・不正成功応答はsubmitのeffect不明、4xxの明示拒否はeffectなしとして返し、provider本文やsecretはerrorへ含めない。GET失敗はreadback失敗として再診断できる形で返す。

## 最小検証

設定不足と独立課金元未確認でPOST0、日次keyへのfallback0、画像/PhotoAvatar/LLMの公式payload、Starfish duration欠落/上限超過で動画POST0、timeoutでsubmit1回、secret/raw診断非露出、公式profile/opaque account照合、hosted URLのorigin制限、公開postの成功条件、metrics欠落非0をfocused testで確認する。実APIアクセス・実課金・全suiteはこのsource受入に追加しない。

現在cursor: specの先行pushとfocused REDを確認し、adapterの20件がGREEN。生成APIのlive呼出は0。live provider設定・独立課金元・モデル/white-label権限・関数runtime・本人接続は未確認。
