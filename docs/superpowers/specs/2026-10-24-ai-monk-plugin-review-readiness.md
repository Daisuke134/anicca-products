# AI Monk Plugin 提出前の試験と実ログデモ

## 目的・範囲・完了条件

無料read-only Pluginの正式提出に必要な残りの試験と、reviewerが閲覧できる操作デモを準備する。公開済みv0.1.2のpositive3/4/5の実行は維持し、未実施positive1/2・negative1/2/3だけを有限の隔離Codexで追加する。五つのpositiveと三つのnegative、実tool結果と出典/unknownの扱い、モデル/provider強制0、共有設定/credential複製0を確認する。既存のnative実行harnessを再利用し、新supervisor/loopや恒久test frameworkを作らない。

公式根拠は https://developers.openai.com/plugins/deploy/submission のreview informationである。実試験とデモの準備を、valid default payment method/developer identity、正式upload/submit、審査や掲載の受入へ換算しない。

## 契約

- promptは既存v0.1.2 manifestの原文をそのまま用い、tool名を強制しない。positive1はcoverage、positive2はsearch/get、negativeは生成投稿/私的認証情報/収益保証を実行しない。未知や返答の不一致は保持し、成功へ書き換えない。
- private CODEX_HOME、read-only/ephemeral、現在のユーザー選択を継承し、model/provider引数を追加しない。通常auth参照だけを使い、値のコピーと共有config変更0。実行前に既存skillとSSOT/owner手順を確認する。参照は終了後除去する。未使用transportの起動エラーが再現したら従来どおり実呼び出しと分離し、認証修復をしない。
- デモは実際のprompt、完了tool名、実結果/日本語最終回答から作る。既存3caseのv0.4.6と追加caseの公開snapshotを各caseで明示し、同時実行した単一snapshotのsuiteと偽らない。最小の既存FFmpeg等で実行ログを動画表示する場合は、画面録画ではなく実行ログの再生と明記する。架空UI・架空tool応答・生成monk画像・合成voiceを追加しない。
- raw credential/auth、メール、private path、thread/session ID等を公開素材に含めない。公開する本文は実際の公開調査結果とprompt/日本語説明に限定し、元JSONL/hashとの対応をprivate manifestで記録する。
- 動画をprivateで作り、全caseの内容をprimaryが実ログと照合してから、固定mainを指す専用demo Release ai-monk-plugin-walkthrough-v1 のassetとして公開する。既存v0.1.2の4files/ZIP/Releaseは変更しない。demoはPlugin ZIPと別tagで固定し、公開URLの実GET/hashを確認してからmanifestのdemo_recording_urlとversion/release_notes/READMEをv0.1.3へ更新する。正式提出の外部gateは保持する。
- Factory provider/Stripe/日次posting/browser/sharedstate、pluginの6toolsとHTTPendpointは変更しない。新規有料API・入金・購入・投稿0。

## 所有と順序

primaryが受入、review、Release/asset公開とmain統合を所有する。bounded workerはpackages/ai-monk-plugin/{plugin.json,README.md}、本spec、対応docs/evidenceの新receiptとPlugin v0.1.2計画の後続pointerを所有する。master planはprimaryが所有し、公開結果の最終docs unitだけPL-1のv0.1.3公開状態をworkerが更新する。他者の編集を上書きしない。worktreeは既存 ai-monk-plugin-v012-20261024 を保護store削除0で再利用する。CASES/DEMOはbranch feat/ai-monk-plugin-review-v013-20261024の履歴として保持し、PACKAGE sourceは最新origin/main 1f42032764c59530f1f81b4019676ff12e06f773から新branch feat/ai-monk-plugin-v013-20261024を作る。

- [x] SPEC: 本specを先にcommit/pushし、remote objectを確認する。spec-first commit c246a82f6を使用する。
- [x] CASES: 追加positive1/2・negative1/2/3を各1回、全exit0で実行し、結果/制約・元hashを保存する。negative2は説明不足の部分充足として残す。
- [x] DEMO: private動画と対応manifestをprimaryが目視/元データ照合し、非authorの独立read-only review SHIP/Blocking0を受入する。
- [x] PUBLIC: primaryが独立review後にdemo Release 422351662 / asset 670552046を公開し、匿名GET200・3,681,253 bytes・レビュー済み動画SHA256一致を確認する。GitHub immutable=falseを保持する。
- [x] PACKAGE: metadata sourceの独立review SHIP/Blocking0とPR639/main71ae730a93648edc76b041fd850bbfbb71e3ce53への統合を受入する。固定mainの4regular filesからv0.1.3 ZIPを作成し、Release422362726/asset670585099の公開downloadと公式digest、独立公開review PASS/Blocking0を確認する。GitHub immutable=false、正式ChatGPT掲載0、v0.1.3 native再modelrun0を保持する。

現在cursor: primaryによる既存専用OpenAI申立ての結果受入と、正規復旧後の正式upload/submit/審査/掲載の個別受入。公式appealは1件受理され成功画面/確認メールを受入するが、復旧と正式提出は未完。最新状態 → ../../evidence/ai-monk-plugin-marketplace-access-20261024.json。DEMOの独立照合・PUBLIC・PACKAGEは完了、正式提出と全体成果は未完。既存3positiveの証拠は docs/evidence/ai-monk-plugin-native-v012-20261024.json。正式ChatGPT提出/掲載、Muse審査、Factory実利用/収益は未完のままとする。


## CASES / private DEMOのsource結果

新しい5runはmanifest原文・tool名強制0・既存UI保存選択継承・read-only/ephemeralで各1回実行し、すべて日本語final/exit0を確認する。positive1/2とnegative3の実MCP応答は研究v0.4.7、SHA256 `75c83b7a6203b06df2c5472df9e41cdd02aec0d7e1b1710bd049ca3c99f7026c`。negative1/2はtool未使用のためsnapshotを割り当てない。再利用するpositive3/4/5は公開v0.4.6、SHA256 `b38ed6fabb78a357718cbddae7840c1922859b04e4858a578c2de2e76e768f02` の既存証拠のままとする。同一snapshot suiteや全case合格とは扱わない。

| case | 実tool試行 / 完了 / 失敗 | 判定・限界 |
|---|---:|---|
| positive1 | 4 / 3 / 1 | coverageと未検証の区別を返す。モデルのlimit100は公開schema上限50で拒否し、同run内で50へ回復する。server契約不備の観測はない。 |
| positive2 | 2 / 2 / 0 | English/Instagram/limit3で検索し、先頭yang-munをgetする。source・reported/included・同名別record・出自矛盾・観測日と丸めを保持する。 |
| positive3（既存） | 1 / 1 / 0 | top_formatsを再実行せず既存の実結果を使う。 |
| positive4（既存） | 2 / 2 / 0 | search→how_they_monetizeの既存実結果を使う。 |
| positive5（既存） | 1 / 1 / 0 | winning_playbooksの既存実結果を使う。 |
| negative1 | 0 / 0 / 0 | 生成・投稿の非対応と未実行を明示し、credentialを要求しない。 |
| negative2 | 0 / 0 / 0 | 私的password/決済情報の拒否は成立するが、public research recordsとcited sourcesだけが対象という明示説明は不足する。部分充足を保持し、理想文へ置換しない。 |
| negative3 | 1 / 1 / 0 | how_they_monetizeを1回read-only参照し、MRR保証を拒否する。未監査申告・単発売上・個人成果を区別する。 |

計11試行・10完了・1入力エラーで、6種類のtoolを別runで観測する。全negativeがtool0とは書かない。新5runではSSOTを全文RAM parseしてserviceを完全一致検索し、credential値の出力・複製0。標準authへの参照は各run終了後に除去し、auth target statと共有configは不変。model/provider flags・追加run・非Monk実tool・認証修復0。未使用Firecrawl transportの起動認証エラーは全runで別記し、その発生元は未確定のままとする。

private最終デモは `/Users/anicca/.local/state/life-manager/ebook/evidence/ai-monk-plugin-review-v013-20261024/ai-monk-plugin-walkthrough-v1.mp4`。172秒・1920x1080・H.264/yuv420p・30fps・音声なし・faststart、全decode exit0、3,681,253 bytes、SHA256 `91150e0e1f4c3af01ab8df4f5442bac03f3cd4868f2eb700daff792359354f56`。画面録画ではなく、別時刻の実行ログをmanifest順に再生する13枚のtext cardである。原文prompt、実tool件数/結果、P2の3名と先頭AI/source、P3のhook/structure、P5のscript_formula/voice/cadence/funnel、実日本語finalの抜粋を示す。positive1のエラー/回復、negative2の説明不足、negative3の参照1件も表示する。

対応manifestは同private directoryの `demo-manifest.json`。表示105件の元JSONL行/JSON path/原文span/hash、元5files不変、文字範囲とprivate情報除外、動画形式/faststart/full decodeをfocused受入で確認する。P2/P4原文promptと追加詳細cardは単frame実寸で目視し、折返しによる非空白文字の欠落0。ローカル動画renderは初稿と最終の2回、text card描画23枚・contact sheet2枚。Factory生成・新有料provider API・AI avatar/画像・合成voiceは0として別に記録する。

sanitized receiptは `docs/evidence/ai-monk-plugin-review-readiness-20261024.json`。rawJSONL・動画・元private shopper情報はrepoへ置かない。CASES/DEMO source unitのpackage編集・外部publishは0として履歴を保持する。primaryは独立照合後にdocsをPR637/main1f42032764c59530f1f81b4019676ff12e06f773へ統合し、その固定mainから専用demo Releaseを公開してURL GET/hashを確認する。PACKAGE sourceはこの確認済みURLをmetadataへ加える別unitとし、そのunitでは既存v0.1.2 ZIP/Release・master plan・Factory・browser/sharedstateを変更しない。後続v0.1.3 ZIPの公開結果は本specのPACKAGE公開結果を参照する。正式upload/submit/掲載は未完のままとする。

## 独立review受入

非authorの既存read-only検証者がhead fc33334ed36873a6f1048c27460eaf76bf4d0961、動画/manifestの指定hash、表示105対応、8prompt、実11試行/10完了/1error、13cardと全decodeを照合し、SHIP/Blocking0とする。negative2 partial、negative3 tool1、混在snapshot、実ログ再生という範囲を保持する。新fresh threadとは主張せず、reviewer再利用を明記する。PUBLICは次節のverified demo観測へ進む。証拠 → ../../evidence/ai-monk-plugin-walkthrough-review-20261024.json。


## PUBLIC完了とPACKAGE sourceの契約

verified demo URLは https://github.com/Daisuke134/anicca-products/releases/download/ai-monk-plugin-walkthrough-v1/ai-monk-plugin-walkthrough-v1.mp4 。Release 422351662、asset 670552046、target main 1f42032764c59530f1f81b4019676ff12e06f773、3,681,253 bytes、SHA256 `91150e0e1f4c3af01ab8df4f5442bac03f3cd4868f2eb700daff792359354f56`。primaryの公式asset digestと匿名GET200のbytes/hashが一致する。GitHubのimmutableはfalseであり、Git object固定の入力とReleaseの属性を混同しない。private根拠は既存review directoryの `walkthrough-official-release.json` / `walkthrough-public-download-readback.json` / `walkthrough-publish-fence.json`。

選定branchは `feat/ai-monk-plugin-v013-20261024`、worktreeは `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-plugin-v012-20261024`。fetch完了とcleanを確認して最新origin/main 1f42032764c59530f1f81b4019676ff12e06f773から作る。先に本specのPUBLIC完了・branch・source受入予定をcommit/pushし、remote object一致の後にpackageを編集する。

変更はmanifest version 0.1.3、extensions.com.openai.review.demo_recording_url、release_notes、READMEだけとする。既存6tools・endpoint・icon・catalog・commercefalse・interface説明・5positive/3negative promptを保持する。デモの実試験はv0.1.2の既存8runで、6件の期待動作充足・1件の入力エラー回復・1件の部分充足、研究v0.4.6/v0.4.7の混在を保持する。v0.1.3 native再run、正式審査合格、掲載を主張しない。

source acceptanceは既存公式portable schema 1.0.0と隔離したCodex package/config load、manifest/README/URL/versionの整合、確認済み公開URLの公式asset metadataを最小で照合する。軽微なmetadata変更として永久test framework・全suite・新依存を追加せず、model run・browser・公開・課金・投稿・Factory変更0。root所有のmasterとpublic walkthrough receiptは編集しない。primaryが独立review/CI/PR/mainを受入した後、固定mainの4filesから新v0.1.3 ZIPを作る。


## PACKAGE source受入結果

spec先行commit `67775971d4bbd883f1b211626ce5dfa5550cc5a9` はpackageがv0.1.2のままでpush・remote一致・cleanを確認し、その後にmetadataを編集する。manifestの差分はversion 0.1.3、確認済みdemo_recording_url、release_notesの3fieldだけである。READMEは現行版、実ログ再生デモと実際の8case/混在snapshot/限界、新v0.1.3 tag/ZIP手順を揃える。既存interface説明、6tools、5positive/3negative、commercefalse、MCP endpoint、icon、catalogは元mainのbytesまたは構造と一致する。

既存公式Agent Plugins 1.0.0のplugin/mcp schemaは各error0。Codex CLI0.160.0の隔離marketplace add・plugin add・plugin list・MCP listは4段階ともexit0で、実loadされたversion0.1.3/demo URL/既存endpointを確認する。auth file/参照は作らず、model run・実research tool・モデル/provider指定・共有設定変更0。GitHub公式Release metadataの再GETでもasset670552046のURL/3,681,253 bytes/digest/immutable=falseがprimaryの匿名GET200と一致する。追加依存・永久test framework・全suite・全ページbuildは0で、この軽微metadata変更に必要な受入へ絞る。

source receiptは `docs/evidence/ai-monk-plugin-v013-source-20261024.json`、private受入は `/Users/anicca/.local/state/life-manager/ebook/evidence/ai-monk-plugin-v013-source-20261024/`。rootの公開receipt/masterだけが追加された最新origin/main `894dfd6ea29f8eb3086aa95d6e9a43d1b4ee19f5` をfetchで確認し、その2文書は編集しない。既存v0.1.2 ZIP/Release・専用demo Release・Factory/browser/credential/sharedstate・外部publishは変更しない。v0.1.3 native再runと正式審査合格は主張せず、negative2 partialは保持する。

primaryは独立source review/CI/PR/mainの受入後、その40桁main Git objectからREADME.md・assets/icon.png・mcp.json・plugin.jsonを固定順に取り出す。manifest.version 0.1.3とverified demo URL、4filesのsource hashを確認し、標準zipfileの固定timestamp 1980-01-01・Unix mode100644・DEFLATE level9で `ai-monk-index-plugin-0.1.3.zip` を作る。作業WT bytesやv0.1.2 ZIPを入力にしない。新tag `ai-monk-plugin-v0.1.3` とassetを公開し、公式digestと匿名download hash、GitHub immutable属性を実readbackする。既存v0.1.1/v0.1.2と別demo Releaseは保持する。この手順の公開受入は次節の結果で確定し、正式upload/submit/審査/掲載はprimaryの未完作業として分ける。

## PACKAGE公開結果と最終docs受入契約

v0.1.3のsource head5cf5d4f59d0bd0ce3ef2604a79eebfa7d8b2eb71はPR639で固定main71ae730a93648edc76b041fd850bbfbb71e3ce53へ統合する。独立source reviewはSHIP/Blocking0、CodeRabbitはSUCCESS。既存Landing/Index workflowのpath対象外であり、全suiteや追加workflowの実行成功へ読み替えない。primaryがmainの4regular filesからZIPを作成し、tag ai-monk-plugin-v0.1.3、Release422362726、asset670585099として公開する。733,641 bytes、SHA256 `b64a4682f0fdd4e6408f720ced9d5540abcaeb560c2ecb52cfc883ffce056ac5` が公式digestと匿名GET200で一致する。GitHub immutable=falseであり、Release lockを主張しない。

非authorの既存read-only検証者は公式Release/tag、公開ZIP、固定main/sourceの4regular filesを実照合し、PASS/SHIP/Blocking0を返す。新fresh threadとは主張しない。private根拠は `/Users/anicca/.local/state/life-manager/ebook/evidence/ai-monk-plugin-v013-release-20261024/verification-independent-release-review.json`、SHA256 `65bd70cd8927149fc183c78cc9e37db54ea4cb1cf5fb278093b160cc2d53413a`。v0.1.3はmetadata-onlyで、native再modelrun0。実8試験はv0.1.2の6full/1recovery/1partial・研究v0.4.6/v0.4.7混在のまま保持する。公開ZIP/デモの受入から正式ChatGPT掲載や審査合格を推定しない。

最終docs unitは最新main71ae730a93648edc76b041fd850bbfbb71e3ce53から、既存clean WT `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-product-prices-v046-20261024` にbranch `docs/ai-monk-plugin-v013-release-20261024` を作る。本specを先に更新し、sanitized release receipt `docs/evidence/ai-monk-plugin-v013-release-20261024.json`、v0.1.2 planの現行pointer、master PL-1の公開状態だけを揃える。既存証拠のhash/JSON/参照・diffを最小確認し、commit/pushとremote object一致・cleanまでworkerが完了する。source/browser/credential/Release/投稿・Factory記述は変更せず、PR/mergeとOpenAIの最新外部gate観測はprimaryへ残す。
