# AI Monk Database・Plugin・Factory実行計画

## 目的・範囲・完了条件
既存のDatabase/6tool CLI・pluginを土台に、商品/収益の根拠拡充と配布を先に完了し、原価が成立するcloud Factoryへ進む。要件の正本はfield-guide末尾「Database・Plugin・Factoryの追加契約」。通常判断はprimaryが実行し、承認待ちや固定stageを追加しない。brainstormingの承認質問はDaisの明示No-human-loopと詳細指定へ置き換える。Stripe実装時は既存Checkout/Billingを再利用し、既存runtimeの日次effect/ownerは触らない。

## 順序と現在cursor
現在cursorはPL-1の既存OpenAI申立ての結果・Muse既存提出への追加要求を追跡すること。OpenAIは公式異議申立て1件を受理し、成功画面と専用受信箱の受付メールで確認する。復旧・正式Plugin upload/submit/掲載は未完であり、同じ申立てを再送しない。Museは3/3 requirements提出済み、Business Approved、Data processing/Integration credentials In reviewで、全体の進行表示はSubmitted。追加要求と掲載URLは未観測。正式復旧/審査の最新証拠 → ../../evidence/ai-monk-plugin-marketplace-access-20261024.json。

独立して受入済みのDatabase/CLI v0.4.10は73公開/75archive/188出典、商品観測archive74行/公開71行で、公開JSON/Web・固定main Release・公開URL導入/CLI・実stdio/HTTPS MCP各6tool・公式Registry active/isLatestの同一snapshotを確認する。Arisの17 USDはseller JSON-LDの価格観測で、売上や実在庫は未確認。公開受入 → ../../evidence/ai-monk-cli-mcp-v0410-release-20261024.json。Database→CLI/plugin→Factoryの優先順を維持し、provider回答待ちと独立に既知商品の根拠拡充を進める。Factoryの専用有料billing・実費/実生成・利用者所有IG接続/投稿・metrics・USD10K MRRは未完。日次IG/TikTok/Postiz/Grok所有effectは変更しない。

## 実行順の更新
旧順は既知profileの調査完了→plugin正式掲載→Factory。新順は取得済みsnapshotの公開受入→plugin配布/Registry公開/Muse提出→Factory実装とし、新規一次資料・審査結果は到着時に反映する。理由は73公開件/176出典のWeb・CLI・MCP、配布と申告の受入が揃い、残る取得不可入口や外部審査の待機だけでは次の成果が進まないため。収益へ必要なFactory制作/課金契約を独立して実装する。既存の日次effectを中断・重複しない。旧cursorはSaaS-1のGemini画像・台本adapterと専用provider準備。Daisの最新優先順に従い、新cursorはDB-1の商品・収益根拠の拡充→PL-1のCLI/plugin配布→SaaS-1の有料billing・実費/実生成・本人IG受入とする。理由はDatabaseとpluginによる配布を先に進め、Factoryは実原価を確認してから提供するため。Gemini adapterはPR647/main373eec46af11c0d32566386df7fbd201413b3d5b由来Webへ公開済み。専用未課金project/keyとSSOT保存後のモデルGET200は受入するが、Netlifyへの専用key設定・paid billing・実生成・Factory enableは未完。公開受入 → ../../evidence/ai-monk-factory-gemini-adapter-production-20261024.json。専用準備 → ../../evidence/ai-monk-factory-gemini-project-preparation-20261024.json。PL-1の正式掲載に必要な専用OpenAI正規アクセス復旧は独立した未完条件として保持する。通常メールコード認証後の公式UIはaccount削除または無効化を示し、既存専用keyのGET /v1/modelsは401/account_deactivatedを返す。原因と削除の有無、現在のbilling値は未確認で、別account新設や共有Grok予算への切替は行わない。現在状態 → ../../evidence/ai-monk-factory-openai-account-state-20261024.json。本人確認・quota・Stripe配線はsource review/CIを通してmainへ統合し、main由来Web/API/DBを公開する。専用199USD Product/Priceと解約portalは作成・公式GET確認済みで、利用者Checkout/請求は0。課金CTAは無効のまま専用生成予算を準備する。DB-1/PL-1は未確認を保持し、外部待ちを成功へ置換しない。

## TODO
- [x] DB-2（188source snapshotの公開JSON/Web/MCP/CLI/Registry受入済み）: 既存関連検証でsource参照/scope/価格と売上区別を確認し、main/公開JSON/Web/MCPと必要なCLI版へ反映する。
- [x] DIST-1（本人X1本・正式Grok BOARD依頼をreadback、受領/追加投稿は別）: Database/Pluginの新launch copyを根拠付きで作り、自分のX投稿とGrok協力依頼を1回ずつ送る。公式receipt/permalinkと重複0を記録する。
- [x] COST-1（API/Stripe/接続費の一次資料と仮定別原価表を取得、実請求/転換率はSaaSで追跡）: ReelFarm公開価格/無料枠/導線、HeyGen実API単価、45/60秒・1日1本/2本・3日trial・再生成・Stripe手数料から原価と利益を計算する。取得不足はunknownとし課金top-upしない。
- [ ] SaaS-1: 原価からprice/生成上限を決め、最小auth・Stripe3日trial・Generate avatar/video・IG接続・自動投稿・metricsを既存Web/APIから実装して公開する。TikTokは後続。実API生成/Stripe subscription/利用者所有接続/公式投稿とmetricsを成果条件として追跡する。
- [ ] DIST-2: 実利用できるFactoryをXで告知し、Grokにも配布協力を依頼する。未実装や未達収益を宣伝しない。
- [ ] PL-1: 既存無料Codex pluginと正式ChatGPT/Grok/Muse配布口を確認する。6toolを案内する旧portable v0.1.2はmain2cfc70e由来の固定ZIP/asset670323615公開と公式digest/download一致を確認する。source・新Release・正式提出/掲載を分けて追跡し、正式ChatGPT掲載は未完とする。初回の専用OpenAI org準備時にはupload前のdeveloper identityでvalid default payment methodを要求されたが、後の通常再認証と独立API再確認では401/account_deactivatedとなる。現在の外部gateは専用accountの正規アクセス復旧であり、原因/現在billingは未確認、upload/submitは0。公式異議申立ては1件受理され、成功画面と確認メールを受入する。復旧決定は未受領。最新の受付/審査状態 → ../../evidence/ai-monk-plugin-marketplace-access-20261024.json。既存accountのpasskey MFAとは区別する。現在状態 → ../../evidence/ai-monk-factory-openai-account-state-20261024.json。Museは3/3 requirements受付済み、BusinessだけApproved、Data/credentialsはIn reviewで、全体掲載は未確認。公開証拠 → `../../evidence/ai-monk-plugin-v012-release-20261024.json`。拡張3機能のnative自然言語routingはPR634/main0d41902d79630541d8024ce0b0472fafc7719997で受入する。先行のpositive3/4/5の計4呼び出しは履歴として保持する。証拠 → `../../evidence/ai-monk-plugin-native-v012-20261024.json`。後続の新5runを含む8caseで6種類のtoolを観測し、6件充足・1件入力エラー後回復・negative2は限定説明不足の部分充足とする。172秒の実ログ再生デモはmain1f42032764c59530f1f81b4019676ff12e06f773由来の専用Release/asset670552046として公開し、匿名GET200と指定hash一致を確認する。旧v0.4.6/新v0.4.7をcase別に示し、全case合格や正式審査/ChatGPT UI実演へ拡張しない。公開証拠 → `../../evidence/ai-monk-plugin-walkthrough-public-20261024.json`。検証済みdemo URLを含む現行metadata-only v0.1.3はPR639/main71ae730a93648edc76b041fd850bbfbb71e3ce53の4regular files由来ZIPとして公開する。Release422362726/asset670585099/733,641 bytesの公式digestと匿名GET200のSHA256が一致し、独立公開review PASS/SHIP/Blocking0を受入する。GitHub immutable=false、v0.1.3 native再modelrun0。実8試験はv0.1.2のままとし、正式ChatGPT掲載は未受入。公開証拠 → `../../evidence/ai-monk-plugin-v013-release-20261024.json`。次の正式提出cursor → `../specs/2026-10-24-ai-monk-plugin-review-readiness.md`。詳細 → `2026-10-24-ai-monk-plugin-v012.md`。
- [ ] DB-1: 既知73profileの商品/売上/creator/言語/画像の調査coverageを記録し、取得可能な公開一次資料から精査・拡充する。pending非掲載という旧reasonを修正し、unknownを保持する。 確定3系統の商品価格/通貨はv0.4.6へ反映し、main95f50a9dd由来のReleaseと公開Web/CLI/MCP/Registryの同一snapshotを受入する。限定cursor/公開受入 → `2026-10-24-ai-monk-product-price-currencies.md`。 追加X告知2113731126355468705は投稿時のv0.4.5/176source snapshotとして履歴保持し、v0.4.6の公開証拠へ流用しない。 Kaelの公開checkoutで27USD/一回払いとJP4320JPYを追加観測し、v0.4.7の180source snapshotをWeb/CLI/MCP/Registryへ公開する。限定公開unit → ../specs/2026-10-24-ai-monk-kael-currency.md。証拠 → ../../evidence/ai-monk-cli-mcp-v047-release-20261024.json。元179sourceとv0.4.6のRelease/証拠は履歴として保持する。

## 境界
調査・配布段階の新規契約/top-upは0。Factoryのprovider設定と実生成は採用した原価/予算契約と支払元の実確認を満たす範囲で行い、Grok共有walletへfallbackしない。既存creditとspend-capを守る。free試用は3日というユーザー指定を優先し、無制限生成を約束しない。個人wallet/口座資金移動、既存loop restart、未完effect再送、shared credential複製は行わない。Factoryの実設計・価格はCOST-1の結果から具体化し、ここで架空の利益/注文を置かない。

## 取得済み証拠
- docs/evidence/ai-monk-profile-audit-20261024.json — 67profileのUI観測と未取得境界。
- docs/evidence/ai-monk-product-research-20261024.json — 15site/13取得成功/20商品、18価格/2価格unknown。
- docs/evidence/ai-monk-factory-unit-economics-20261024.json — HeyGen APIとReelFarm公開料金の区別、生成原価と未確認。
- docs/evidence/ai-monk-factory-heygen-alternative-20261024.json — Full Video Agentの設定上限での動画費と既存予算を比較し、代替採用/追加購入0を記録する。

Databaseのpackage metadata/READMEはv0.4.7へ揃え、新しいmain固定入力のReleaseとして配布済みとする。既存Releaseを変更せず、公開JSON/Web/MCP・URL導入・実stdio6toolとRegistryの同一snapshotを受入する。GitHub Releaseロックはimmutable=falseのまま記録する。証拠 → docs/evidence/ai-monk-cli-mcp-v047-release-20261024.json。

## 配布口と下位ルールの更新
正式Muse Connector Platform https://platform.muse.ai で既存IDの正式提出と全3requirementsの受付を確認する。Data processingの追加提出は1回、再送0。Business verificationはApproved、Data processingとIntegration credentialsはIn reviewで、コネクタ全体の承認と正式掲載URLは未確認とする。xAIは https://docs.x.ai/developers/tools/remote-mcp の公開仕様がremote MCPの接続を説明する。API互換の案内とhost実受入/公式directory掲載を区別する。MCP Registryは公式remote-only/OIDC公開を完了し、v0.4.7のexact GET active/isLatestを確認する。

LM docs/team/README.md・RULES.md・WORKFLOW.mdの無料trial禁止は、Daisの最新のStripe3日trialという明示指示により本Factoryでは上書きする。旧ルールをSaaS実装の停止点にしない。既存の他商品/日次loopの課金設計は変更しない。

MCP Registryの公開契約とsource受入 → 2026-10-24-ai-monk-mcp-registry.md。公開effectとreadbackの証拠 → docs/evidence/ai-monk-distribution-status-20261024.json。既知profile/productの拡充は続き、全世界の全件網羅や全収益監査を達成扱いしない。

Netlify AI Gatewayは現accountの公式GETで利用不可を確認する。team共通creditと通常AI上限の適用範囲も独立Factory予算の代替にならないため、plan/課金/設定/生成を変更しない。代替調査 → docs/evidence/ai-monk-factory-netlify-gateway-preflight-20261024.json。

## 未確認profileと配布口の限定followup

専用OpenAIの正規アクセスとMuse審査は外部状態の未完条件として保持し、同じ認証失敗の再試行や重複提出を行わない。旧実行cursorはSaaS-1のprovider利用準備、新しい独立作業cursorはDB-1のsifuchen-california/master-kaizen-tiktokの2件とPL-1の公式カタログ入口確認とする。理由はproviderが公式401/account_deactivatedで非retryableの一方、既知profileの公開一次資料と配布仕様は無料・read-onlyで精査できるため。全体のFactory/収益成果と既存TODOは縮小せず、日次IG/TikTok/Postiz/HeyGen/Grok loopのeffectを変更しない。

- [x] 2profileの既存canonical/discovery/auditを比較し、native handle/画像/公開商品を追加できる一次根拠を限定取得する。同名の別personaとの同一性、AI制作、売上を推測しない。未取得なら実際に確認した出所と不足を残す。古いbatch対象外という理由を、現在のprofile項目が必ず欠落しているという意味へ流用しない。
- [x] OpenAI公式docsを実取得し、GitHub repo marketplaceでの直接配布とChatGPT/Codex共通の正式Plugin directory/提出フローを区別する。Museの既存submissionとGrokの既存依頼はread-onlyで確認し、受付/審査/承認/配布receiptを分ける。新しいlogin、submit、依頼、X投稿はこのunitに含めない。
- [x] 公開sourceによって確定できるdata差分があればcanonicalと呼び出し先を揃え、既存の関連検証、必要なreview/CI/main由来公開まで進める。sourceが増えた場合だけ次のCLI/Registry snapshotを作り、v0.4.7のReleaseを上書きしない。data差分がない場合は現在のv0.4.7/180sourceを維持し、限定調査と現在状態のreceiptを正本へ反映する。

所有はprimaryがmaster/source/公開受入、read-only workerが2profileのprivate調査証拠とする。repo/worktreeの他者編集を上書きせず、保護storeを削除・移動しない。限定unitの完了を全世界の全件把握、正式カタログ承認、Factory稼働、売上達成へ換算しない。

SifuChenの取得結果ではnative URL/canonical/@handleが一致し、本人bioのAI自己表示、丸め表示834K followers、プロフィール画像を確認する。ai_status=reported/directory_scope=pendingを維持し、動画形式・creator・商品現況・監査済み売上へ拡張しない。bioのSpanishと投稿音声言語を区別する。この1profileと画像出典を更新し、他74recordsと旧180sourcesは保持した181source snapshotをv0.4.8のWeb/CLI/MCP/Registryへ反映する。Kaizen oEmbedは汎用応答のためcanonical sourceを増やさない。画像は既存Maldita screenshotからnative avatarの元bytesへ切替え、公開画像件数は増加させない。root/master/README/manifestの現在版だけを揃え、旧Release/証拠は保持する。

独立source reviewでbio限定言語の根拠がWeb表示から落ちることを確認する。bioを根拠とする言語はカード上に「profile bio; spoken language not audited」を表示し、言語filterのlabelは維持する。focused render回帰で実assertionのRED→GREENを確認し、修正headのCIを受入する。

最終docs unitはmain c4bd859c48cfc879b37f056d9e97aa2fb887952d由来の専用branch docs/ai-monk-v048-publication-20261024で、v0.4.8公開receipt、限定HeyGen料金調査receipt、本planとfield-guideの現在pointerだけを更新する。公開URL導入・stdioは非author検証、Web/JSON/画像/HTTPS MCP/Netlify/Registryはprimaryの実readbackで区別する。既存の公開artifact・旧receipt・source・認証・課金・日次effectを変更しない。参照hash/JSON/diffと既存PR checksを確認し、commit/push/remote一致・main統合まで完了する。

公開受入はPR642/main c4bd859c48cfc879b37f056d9e97aa2fb887952d、CLI v0.4.8 Release422387165/asset670678777、Web73件/画像71件/181出典、公開JSON元bytes、実stdio/HTTPS MCP各6toolの同一snapshotで完了する。Registry40038988033 SUCCESSとexact GET active/isLatestを確認する。独立source reviewのbio言語表示指摘は1回のfocused RED→GREENと最終head CIで修正し、公開artifact/URL導入/CLI/stdioは非author検証PASS/Blocking0とする。sourceの初回reviewと修正後の検証は区別し、追加source再reviewは主張しない。証拠 → ../../evidence/ai-monk-cli-mcp-v048-release-20261024.json。旧v0.4.7とPlugin v0.1.3/既存demoの証拠は保持する。

HeyGenの追加料金調査 → ../../evidence/ai-monk-factory-heygen-prompt-rate-followup-20261024.json。Photo Avatar作成1.32USD/call、Avatar IV Photo2.31USD/min、TTS0.12USD/minを公式料金表で再確認する。type=promptの総料金対応と独立台本生成・hard durationは未確認で、仮にavatar1.32USDならtrialの動画/TTS/avatarは3.75USD、36attempt月は66.93USDとなるが台本費前の条件付き算術である。既存4.25USD/70USD上限は変えず、このendpointをFactory全体の代替として採用しない。

この限定followupは完了し、現在cursorはPL-1の専用OpenAIの正規アクセス復旧/正式提出・Muse審査と、SaaS-1の独立provider予算・実生成・本人接続の受入とする。外部状態の未完を無料配布や公開データ更新で閉じず、同じ非retryable認証失敗・提出・投稿を再送しない。日次IG/TikTok/Postiz/Grok所有effectは変更0。

## Factory専用providerの限定preflight

目的は専用OpenAIの非retryable無効化と独立に、元のFactory生成要件と既存予算を満たせる経路を確かめること。Database→Plugin→Factoryの順と未完成果は維持し、現在のSaaS-1内cursorを画像・台本providerの限定read-only preflightへ進める。Full Video Agentは既存cap超過のため再採用しない。単なる支払元不足を理由に高額な別方式へ切り替える判断は維持して棄却する。

既存の画像→台本→TTS→Avatar IV→本人IGの呼出経路・予算/尺/attempt制御をコードで確認する。最初の候補はGemini台本＋HeyGen画像であるが、公式HeyGen Image契約はidentity/reference画像を必須とし、入力ゼロの最初のavatarを作れない。この根拠により候補をGemini Developer APIの台本＋画像へ絞る。公式料金・無料枠/課金条件・構造化出力・入力データ条件・専用project/keyの可否を調べ、旧GPT原価を無料へ置換しない。共有Grok/既存顧客のkeyやwalletへのfallback、OpenAIの別account作成、日次loopの変更はしない。

このunitは新規project/key作成・支払い・生成・本番設定変更を含めず、完了条件は実コードと公式一次資料から、採用可能な最小経路または不足条件を具体化して正本へ反映すること。成立した経路の実装・専用認証・実費/生成受入は同じSaaS-1の次の作業として続ける。無料枠の存在だけで本番生成・採算・正式Plugin掲載の達成としない。専用OpenAIの正式復旧条件はPL-1に残す。

並行するsource修正は、code探索で判明した完了済みCheckout再開の1件に限定する。APIのcheckout応答がcomplete=trueなら外部redirectをせず同じ認証sessionの状態を再取得し、未完Checkout・portal・IG接続のURLは既存のprovider別HTTPS検証を維持する。既存client helperと直接UI呼出元・型・最小回帰だけを更新し、新しい抽象やテスト基盤、後方互換層を作らない。実assertion RED→GREEN、必要な既存検証/CI、main由来Web反映まで受入し、実決済済みとは呼ばない。生成providerの採用・budget・enable flag・実effectを変更しない。

限定preflightの一次資料と条件付き原価 → ../../evidence/ai-monk-factory-gemini-provider-preflight-20261024.json。Gemini 3.1 Flash-Liteの台本と同Imageの1K portraitを次の実装候補に選ぶ。画像modelに無料枠はなく、専用の有料Cloud project/key・支払状態・モデル権限は未確認である。利用条件上の18歳未満対象の禁止と有料データ取扱い、project capの処理遅延も実装/利用準備に反映する。既存price/quota/reservationを変更せず、正確なREST/MIME/token契約・専用課金準備・実生成を次に受入する。現時点のsource/runtime採用・入金・生成は0で、PL-1のOpenAI正規復旧条件を削除しない。

Checkout sourceは4fileの最小修正で実RED→GREEN/client7件を確認する。任意の全体noEmitは別領域6診断でexit2、baseline比較は未確定のため合格扱いしない。最終headの既存CIと公開反映はprimaryが受入する。証拠 → ../../evidence/ai-monk-factory-checkout-resume-source-20261024.json。

## Checkout本番反映と次のprovider実装

このdocs unitはmain `9437dd32055a6bb8965f2b8e94b791c40674be9f`由来の専用branch `docs/ai-monk-checkout-provider-result-20261024`で、今回の公開receipt・本planの現在cursor・Factory planのpointerだけを更新する。既存receiptの上書き、新しいsource/認証/provider/runtime/price/quota/enable変更、課金・生成・日次effectは0。JSON/hash/参照/diffと既存PR checks、push/remote一致、main blob一致まで確認する。docs-onlyの追加deployは要求しない。

PR645/head `119b718cc3ad6aa13bc62e10308d94f70b6eb801`はfresh source review SHIP/Blocking0、client7件PASS、Landing CI40040305050 SUCCESSを通し、上記mainへ統合する。main由来Deploy40040724468 SUCCESS、Netlify公式published ready `6adbf0b3dd3542817d78d614`、公開HTML/route JavaScriptのHTTP200と厳密boolean分岐・URL存在時だけredirect・既存host検証の保持を確認する。任意noEmitの別領域6診断/exit2とbaseline比較未確定を保持し、認証付き実Checkout・実請求・生成成功とは扱わない。公開受入 → ../../evidence/ai-monk-factory-checkout-resume-production-20261024.json。

旧SaaS-1 cursorは専用OpenAI復旧をFactory全体の唯一の前提とする。新cursorはGeminiの画像・台本adapter実装→専用有料project/key/支払状態→実費と実生成→本人IG接続/投稿/metricsの受入とする。理由は、公式資料で入力画像なしの1K avatar生成・構造化台本・既存予約内の条件付き原価を確認し、後続のHeyGen/Upload-Post工程を維持できるため。現runtimeの採用状態とは区別し、PL-1のOpenAI復旧・Muse審査は残す。GCPの既存billingを読むCDP操作は、正規lease取得後も共有browser lease要求のtool guardで実行前拒否となる。GCP側のlogin/作成/支払/生成は0であり、provider側失敗とは扱わない。自分のlease解放を確認し、同経路の再試行や保護policy変更をせず、独立して進められるadapter sourceを次に実装する。

## Gemini画像・台本adapterのsource実装

目的はFactoryの画像/台本2箇所を予算内候補のGeminiへ置換し、既存HeyGen/Upload-Post/認証/period予約と再送0を維持すること。所有と受入の正本 → ../specs/2026-10-24-ai-monk-factory-provider-contract.md。新SDK・provider二重実装・quota/価格/SQL変更は0。usageは数値だけを既存evidenceへ残して実費検証の入力にし、出力tokenとthoughtを混同しない。privacyの生成providerと18歳以上向け案内を揃える。専用有料project/key・本番設定・課金/実生成・Factory enableはこのsource unitに含めず未完とする。最小RED→実装→GREEN、fresh money source review、既存CI/main由来公開まで進める。

Gemini adapterの最小RED→GREENはprovider/jobs33件、隔離Postgres25件で確認する。不完全応答でも既知の数値usageとreceiptをeffect_unknown evidenceへ保存し、unknown/欠落を無料へ変換しない。source receipt → ../../evidence/ai-monk-factory-gemini-adapter-source-20261024.json。この初回source時点の未完であるfresh review・修正後CI・main公開は下記production receiptで受入する。旧receiptは書き換えない。

初回f21d025の独立reviewはNO_SHIP/Blocking2で、異常応答ID優先と画像保存障害時の記録保持を修正する。実RED→GREEN/provider/jobs35件PASS。初回CI SUCCESSと旧source receiptは履歴保持し、修正headを独立限定再検証・CI/main公開の対象とする。修正証拠 → ../../evidence/ai-monk-factory-gemini-review-fix-source-20261024.json。

## Gemini公開・未課金準備の結果保存

このdocs unitはmain `505aa8182356e286c586aa9a5f618d8509806f2e`由来の専用branch `docs/ai-monk-gemini-acceptance-20261024`で、新規production/project準備receiptと本plan・provider契約・準備plan・Factory pointerだけを更新する。既存source receiptの上書き、data/package/source/認証/課金/Factory enable・日次effectの変更は0。JSON/hash/参照/diff・既存PR checks、push/remote一致、main blob一致で受入する。docs-onlyの追加deployは要求しない。

修正head `e147e59624dccb351d9902ea345b765337cf838b`は独立限定再検証SHIP/Blocking0・provider/jobs35件、隔離Postgres25件と最終head CI40042813632 SUCCESSを受入し、PR647/main `373eec46af11c0d32566386df7fbd201413b3d5b`へ統合する。Deploy40043161929 SUCCESS、公式Netlify ready `6adbf70525414dfac7733352`、公開page/route chunk/privacy/terms各HTTP200を確認する。commit_ref=nullのためGHA main SHAとdeploy titleで対応付け、公開UI/API実生成の証明へ拡張しない。公開受入 → ../../evidence/ai-monk-factory-gemini-adapter-production-20261024.json。

PR648/main `6c54f3a9a4c4df080174c1d76ddbbaa85a168737`の先行planに従い、専用project `anicca-monk-factory-20261024`とGemini APIだけに制限したkeyを各1回作成する。SSOT exact service1行と保存後2モデルGET200を確認し、独立read-only検証は9項目PASS/Blocking0。billingEnabled=false/未接続であり、paid権限・残高・invoice・生成は未受入。最初の検証側selector不備FAILはprovider call0の履歴として保持し、訂正後PASSは別receiptへ保存する。準備受入 → ../../evidence/ai-monk-factory-gemini-project-preparation-20261024.json。

CDP操作は正規lease取得後も保護hookに実行前拒否され、policy変更・迂回・再送は0。別native経路ではbundle-only selectorが別業務profileを選んだため、UI観測をbilling受入から除外する。自分が変えた空ページ表示を復元し、自分の確認用window閉鎖・既存window保持・lease解放を確認する。公式APIでも請求先は既存1件のまま、Factory projectは未課金。新billing accountの最終送信・支払い・生成は0。Factory再開時はPID/profileに固定できるUI経路と専用billingを扱い、共有walletへlinkしない。

Databaseの別ownerによる日次更新PR649/main `505aa8182356e286c586aa9a5f618d8509806f2e`はsource v0.4.9/187出典、CI40044430970とDeploy40044430905 SUCCESS。公開JSONの00:23:54Z観測は75archive/181出典・SHA `e7fe35a6219381f90da1a5f8ce3e0df98935948f2f37e0053bdbaf91dd539516`で、v0.4.9の全配布面受入へ置換しない。Factory source373→505は差分0。rootは日次ownerのsource・release・Registryを変更/再送せず、独立して未確認の商品・収益根拠を精査する。

## 商品構造化データの限定追加

DB-1の現在unitはAris The Stillの既存商品 `aris-21-rituals` の公開価格不明を、公式seller HTMLのJSON-LDで再確認する。目的は既知商品の価格・通貨根拠を拡充してWeb/CLI/MCPへ同一snapshotを配ること。対象は `https://www.aristhestill.com/` の商品名・Offer価格/通貨・availability表示、既存profileとの帰属経路のみ。ログイン・cart・checkout・支払い・売上推定は0。MonjeWu/MonjeLinの探索結果はreceiptに境界だけを記録し、この実装unitのデータ対象を増やさない。

main `ad08dd187d3b3c051bb29d9e1040ec76272f5461`由来の専用branch `feat/ai-monk-product-jsonld-20261024`を使う。所有はprimary。先行契約をpushしてからcanonical JSONの新source/新しい日付付きoffer観測、package/lock/README/server metadata、当planと新規receiptだけを変更する。旧187sources・全75recordsの既存field/offer・4included/69pending/2excluded・AI状態・画像・指標・revenue観測は保持する。既存null観測を上書きせず、新しい観測から旧商品IDを参照する。JSON-LDのInStockはseller metadataであり実在庫/購入成功へ昇格しない。billing recurrenceとmerchant会計通貨は独立未確認なら補わない。

受入は、未追加の価格観測について最小の一時assertion RED→データ追加→GREEN、既存shared/helperとpackage検証、fresh read-only data review・既存CI/main公開とする。新parser/runtime/依存/恒久的mirroring testは作らない。新v0.4.10のmain固定Release・公開JSON/Web/CLI/stdio/HTTPS MCP・Registryを同一snapshotで確認し、v0.4.9を含む旧Release/receiptを変えない。別ownerの日次v0.4.9公開を中断・再送しない。Factory・plugin payload・認証/課金・X・日次Grok所有effectは変更0。現在cursorはこのDB-1の根拠追加、次はPL-1の既存正式配布口の未完条件。

Arisの公式HTML HTTP200/JSON-LDで同一商品17 USDを確認し、新しいsource1件・日付付きoffer1件を追加する。旧187sources/既存全観測・収益fieldを保持するsource acceptanceはRED→GREEN。既存package15件/shared・render15件とbuild済みget/monetizationの価格/出典返却を確認し、v0.4.10/188出典へ揃える。source証拠 → ../../evidence/ai-monk-product-jsonld-source-20261024.json。source時点の次段階であるreview・最終head CI・main由来公開/新Release/Registryは下記公開結果で受入する。

## 正式Plugin掲載のアクセス復旧

Daisの「Go fix」に従い、PL-1の専用OpenAI account無効化とMuse審査の未完条件を現在cursorへ進める。DatabaseのAris sourceはPR652/main `8a5f78fb9ade2c45cd213c5beabcf71ee718c25d`へ統合済みで、新版の公開/Release/Registry受入は中断・重複せず並行して完了する。

専用branch `fix/ai-monk-plugin-marketplace-access-20261024`は上記最新main由来。目的は既存専用identityの正規アクセス復旧と、Muse公式submissionの不足要求を修正し正式提出/審査/掲載を前進させること。所有はprimary。本unitはSSOT全文のRAM確認、本人/owner/既存lease/session照合、最新の公式復旧手順・通知・Muse要求の取得を先に行い、同じ非retryable loginの再実行や提出重複をしない。正規の復旧/既存提出の不足修正は必要な範囲で進め、他account新設や他者identityへの切替、共有wallet/日次loop変更、課金は0。外部審査結果は自分で承認扱いにせず、公式receipt/掲載URLを個別に確認する。

完了条件は本人accountへの公式アクセス、必要なdeveloper identityと正式upload/submit/公開readback、Museの全requirements/審査/掲載を区別して閉じること。未解消なら原因・自分が直した範囲・provider受付ID/要求・次の具体的操作を新しいreceiptへ残す。既存receiptを書き換えない。既存source/正式掲載/売上を混同せず、source修正が必要な場合だけ関係する契約と最小検証を先行更新する。Google/login skillのKeychain指定・復旧停止はDaisのSSOT/Apple store禁止と今回の正規復旧委任を優先し、browser再起動・新context・guard迂回は行わない。


## v0.4.10公開と正式掲載復旧の結果

Aris sourceはPR652/head747b93d7c/main8a5f78fb9へ統合する。GitHub Codexのexact-head reviewはcompleted/no findings、CodeRabbitはstatus SUCCESSだが実レビューはskippedで、local独立raw source reviewは未実行として区別する。既存source CIとmain package/deployはSUCCESS。固定mainのRelease422460536/asset671015557、公開URL install/CLIとstdio/HTTPS各6tool、公式Registry40053864882 SUCCESS/exact GET active/isLatest、Netlify ready 6adc118d5255413148e7de29を受入する。公開JSONはcanonical元bytesのSHA256 3dd7cddc6dd8e4da0c751984ea0fb2894f405fc4d291743833b3561ab81bfeb9と一致する。旧Release/receiptを変更せず、GitHub immutable=false、Netlify commit_ref=nullとtitle/GHAによる対応付けを保持する。公開証拠 → ../../evidence/ai-monk-cli-mcp-v0410-release-20261024.json。

OpenAIの通常認証/APIで確認したaccount_deactivatedに対し、公式復旧資料と通知検索を先に確認し、既存専用identityから正式appealを1回送信する。初回のnative送信はdaemon/cache不在のローカル拒否で外部送信0、fresh state後の実送信は1件/再送0であり、公式成功画面と受付番号付き確認メールを確認する。受付番号はprivate SSOTだけに保存する。匿名Help Centerの先行message1件は実表示を確認するがemail識別の受理は未確認で、正式case受理はappeal側の証拠で確定する。復旧・正式Plugin upload/submit/承認/掲載は未完。

Museの既存submissionを本人sessionで再読し、3/3、Business Approved、Data/credentials In reviewを確認する。全体のSubmittedと将来stepのラベルを承認済みへ読み替えない。Data詳細はUnder review、認証不要・Streamable HTTP POST・正しい公開MCP/6 read-only tools・GET405の説明は保存済み。AXで長文が空になる項目は実画面を照合し、OCRのURL誤読を入力不備と扱わない。所有するGmail2受信箱のexact recipient検索は既存の事業メール確認1件だけで、新たな審査結果/修正要求を見つけないが、Muse直接受信箱の全件取得とは主張しない。新提出/編集/再送は0。

native PIDキー入力が別windowへ届いたため、対象を改めて観測し、送信/決済0のまま元Receptionist site/titleへ戻し、自分の新規空window閉鎖と両lease解放/controller exit0を確認する。保護hookのCDP実行前拒否を迂回せず、browser/基盤/日次loopを再起動しない。復旧の証拠 → ../../evidence/ai-monk-plugin-marketplace-access-20261024.json。次は既存caseへのprovider回答/追加要求の受入であり、正規復旧後に同じv0.1.3を正式upload/submitする。回答待ちだけを理由に全goalを完了/blockedへ変更しない。
