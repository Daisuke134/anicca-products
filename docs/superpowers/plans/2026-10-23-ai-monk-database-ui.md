# AI Monk Databaseの一覧UIとプロフィール画像

## 目的・範囲・完了条件

Daisの公開画面への指摘に従い、見出しを `AI Monk Database` に統一し、全プロフィールをアイコンで識別できる一覧へ直す。比喩・問いかけを使わず、名前、アカウント、公開数値、言語を比較しやすくする。既存の75レコード、検索・絞り込み・並べ替え、出典と未確認表示、記事・書籍・公開データへの導線を維持する。コード、必要な検証、main統合、Netlify反映、公開画面の確認までを今回の完了条件とする。

## 設計

- 参考: [AvatarFactory](https://avatarfactory.io/ai-influencers) の顔・名前・handle・audienceをまとめるカード、[Virtual Humans](https://virtualhumans.org/#influencers) の人物中心の一覧、[Futurepedia](https://www.futurepedia.io/ai-tools) の分類と件数。コピーや収益主張は流用しない。公開される成果指標は未取得で、UI構成の参考として扱う。
- Mobbinは接続toolとplugin検索を確認するが利用可能な連携は見つからない。公開検索カテゴリとSemrushの個別画面を既存ブラウザで確認し、ロゴ・名前・主要情報を揃えたカード、件数とsort、一覧の横のfilterを観測する。取得状況と参照点は `docs/evidence/ai-monk-ui-reference-research-20261023.json` に記録する。
- 小さい見出し・一文の説明の直下に検索とフィルターを置く。白地、明確な境界、デスクトップ3列・中間2列・モバイル1列で表示する。大きな装飾heroは除く。
- 全カードに64px以上のプロフィールアイコンを置く。アカウントとの対応を確認できる公開プロフィール原画像を優先し、ローカルに原bytesを保存する。画像の取得元、対応ID、取得日、hashを記録する。第三者画像をCC BY対象にしない。
- 未取得の画像には名前から作るイニシャルを表示し、実写真と偽らない。読み込み失敗時もイニシャルへ戻る。人物画像を生成して補完しない。
- AI分類、丸め値、取得日、地域情報の根拠、数値の出典は保持する。最大の単一プラットフォームaudienceによる既存順位を変えない。商品価格・自己申告・売上を混同しない。
- 文言はcopywriting指針 `taste-skill/references/copy.md` に従い、名詞の見出し、具体的な説明、短い操作名を使う。追加npm依存やbackendは作らない。

## 順序と現在cursor

旧順序: remote MCPの公開 → 日本語書籍の販売整備 → factory復旧。
新順序: 今回のUI修正 → remote MCPの公開・日本語書籍・factoryの残作業。
理由: Daisが公開ページの理解しにくさと全プロフィールのアイコン不足を具体的に指摘しており、現在の公開入口を先に直す。remote MCPのsourceは専用branchにpush済みで保持し、進行中のprovider effectへ触れない。

- [x] 現行実装・データ契約・参照サイトを確認し、仕様を更新する。
- [x] 参照記録と原画像を収集する。75件のID対応と7画像のhash/sizeを確認し、未取得68件を明記する。
- [x] 直接的なコピーとコンパクトな一覧、全件アイコンを実装する。
- [x] 画像有無・既存根拠表示の最小テスト、既存検索契約、landing CIを確認する。
- [x] mainへ統合し、Netlifyと公開画面・画像を確認する。
- [ ] 未取得68件の画像を引き続き個別に照合し、確認できた分を追加する。

現在cursor: レイアウト・コピー・全75件のアイコン表示はPR #560でmainへ統合し、Netlify run 39879488202と公開ブラウザで確認する。7画像は全てHTTP200と原hashを照合、68件はイニシャル。検索（同名別handleの2件を保持）、媒体別handle/数値、AI状態filter、clear、0件、詳細、画像失敗fallbackはPASS。1440/390/320pxで横はみ出しなし、client error0。根拠 → `docs/evidence/ai-monk-database-ui-production-20261023.json`。次は68件の追加画像収集と、保留したremote MCP・日本語書籍・factoryの各残TODOを進める。実画像の全件取得・網羅的な調査・収益達成は未完。


## 追加画像batch: 公式crosslinkのある4件

目的・範囲: 個別調査で正確なInstagram handleへの公式crosslinkを確認した4画像を、原bytesのまま既存manifestへ付与する。75件のIDを維持し、sourceの画像取得済みを7→11件、未取得を68→64件へ更新する。画像やプロフィールの存在をAI使用・本人確認・売上の証拠にしない。AI分類、数値、canonical dataset、UIコード、field-guide、書籍コードは変更しない。

| 対応ID | 出所と同一性の根拠 | 画像の役割 |
|---|---|---|
| `lead-instagram-shenmuhealer` | [Stan](https://stan.store/shenmuhealer) が `instagram.com/shenmuhealer` へリンクする | `first_party_named_profile_image` |
| `lead-instagram-aristhestill` | [公式site](https://www.aristhestill.com/) が `instagram.com/aristhestill` へリンクし、画像altに本人名を記す | `first_party_named_persona_image` |
| `lead-instagram-ken-lu-monk` | [公式site](https://kenluteachings.com/) が `instagram.com/ken.lu.monk` へリンクし、掲載動画にposterを指定する | `first_party_video_poster` |
| `lead-instagram-monktashirok` | [YouTube about](https://www.youtube.com/@MonkTashirok/about) の `sameAs` と外部リンクが `instagram.com/MonkTashirok` を示す | `platform_profile_avatar` |

作業branchは最新 `origin/main` 由来の `feat/ai-monk-profile-images-20261023`。調査とhashの正本は `docs/evidence/ai-monk-profile-discovery-next-20261023.json`。4画像ともInstagram avatarとの同一性は未確認とし、実際の画像roleとsource/crosslinkを保持する。上流の生成画像filenameからAI状態を確定しない。

受入検証: 75IDの一意性・canonicalとの一致、11画像のbytes/hash、公開JSONのsecret・署名付きURL・private path混入なし、`git diff --check`、既存directory helper 5testsを確認する。新規test・依存は追加しない。CIは作成するPRのhead checksを正本にする。

source受入結果: 全75ID、11画像のbytes/hash、追加4原bytes一致、既存71行とcanonical不変、公開JSONのsecret/署名付きURL/private pathなし、`git diff --check`、既存directory helper 5testsがPASS。

このbatchのcursor: source受入検証を通過し、commit/pushとPRのhead CI確認からrootへの引き継ぎへ進む。merge、Netlify反映、本番readbackはrootが所有する。全75件の実画像取得は引き続き未完。

## 11画像の本番readbackと次の画像調査

PR562 source head `2885ba3db8ce0f8233a7d850349b1082feb0ef90` のLanding CI39881869107が成功し、main `c05ae73a6c65275456c45f7bd6fc9e8d1ed23879` とNetlify39882288310へ反映する。本番で75cards・11画像・64頭文字、11assetのHTTP200/SHA一致、追加4画像のdecode、390px横overflowなし、client error0を確認する。証拠は `docs/evidence/ai-monk-profile-images-production-20261023.json`。

Mobbin接続toolが利用可能になったため、Quo/Meetup/Squareの3実画面を確認し、観察とcanonical URLを既存reference evidenceへ追記する。既存UIに同じicon/name/controlの配置を確認し、不要な再設計は増やさない。利用指標/収益効果は未計測。

次のbatch3は未取得64件から `monkshen`, `linchenhealing`, `thezhenwu`, `oravishen`, `mestre.jin`, `maestroananta`, `tempiovita`, `yunlobsang`, `monjaalma`, `shin_hyun_official` を対象にする。既存20handle調査と重複させず、出所のexact canonical handleへのcrosslinkを確認して原bytesだけを取得する。Instagram直接収集・有料credit購入・生成顔への置換は行わない。別branch/worktreeで調査evidenceと確認済みassetだけを扱い、canonicalのAI分類やmetricsは変更しない。現在cursorはこの10件の出所確認。

## 追加画像batch3: 未調査10handleの出所確認

新規branch `feat/ai-monk-images-batch3-20261023` は最新 `origin/main` の `3c9be56aa426237119574c975b07b78785695846` から開始する。対象は前節の10handle、証拠の正本は `docs/evidence/ai-monk-profile-discovery-batch3-20261023.json`。調査開始前に同evidenceへscope/targets/完了条件を記録する。

| account ID | 公開出所とexact Instagram対応 | source role |
|---|---|---|
| `lead-instagram-monkshen` | [Monk Shen Yu](https://monkshen.com/) のnamed header portraitと `instagram.com/monkshen` | `first_party_named_profile_image` |
| `lead-instagram-linchenhealing` | [Lin Chen](https://linchenhealing.com/) のBeacons profile metadata: `social_links.instagram=linchenhealing` と `profile_picture_url` | `first_party_named_profile_image` |
| `lead-instagram-tempiovita` | [Tempiovita Linktree](https://linktr.ee/Tempiovita) のnamed profile imageと `instagram.com/tempiovita` | `first_party_named_profile_image` |
| `lead-instagram-shin-hyun-official` | [Shin Hyun](https://shin-hyun.com/) の `portrait.jpg`、alt `Shin Hyun` と `instagram.com/shin_hyun_official/` | `first_party_named_persona_image` |

10件のbounded調査から4原画像を確認し、後述のreport起点2件を合わせた現scopeは6原画像追加、coverageは11→17画像、64→58未取得へ進む。画像はHTTP responseの原bytesをそのまま保存し、MIME・SHA256・bytes・出所・crosslink・実際のroleを保持する。4件ともInstagram avatarとの同一性・所有権・再利用license・AI状態は独立確認していない。canonical分類・language・metricsとUI codeは変更しない。

残る6件: `thezhenwu` はYouTubeからexact IG crosslinkなし、`oravishen` は検索でIG外のattributable source未取得、`mestre.jin` はFacebook候補が空body、`maestroananta` のYouTubeは別handle `tempiovita`/`remediosolvidados` にリンク、`yunlobsang` はstore/YouTubeにexact IG crosslinkなし、`monjaalma` のYouTube候補はlive HTMLで404。別recordの画像や同名account画像は割り当てずunknownを維持する。Instagram直接取得・追加credit購入・新認証・生成顔への置換は行わない。

現在cursorは75ID/全17assetのbytes/hash/原byte一致、対象外69行とcanonical不変、secret/署名付きURLなし、既存directory helper/UI tests、72px preview、diff checkのsource受入検証。source/visual検証・commit/push・PR作成/attachまでこのbatchで担当し、head CI監視・merge・Netlify・本番readbackはrootが所有する。

### batch3の補助追加: report起点の2画像と表示crop

既存Maldita原文をrootが確認し、公開本文で `leo-chen` に対応する3列video stillと、`sifuchen-california` に対応するprofile screenshotを発見する。この2件を即座に埋められるため、元の未調査10handleを維持したまま追加画像を4→6件、coverageを11→17画像・64→58未取得へ拡張する。出所は [Maldita原文](https://maldita.es/investigaciones/20260710/cuentas-ia-instagram-facebook-salud-libros/)。新規調査対象の追加ではなく、既存report起点の補助収集としてevidenceに分けて記録する。

| account ID | 実際のsource role | 原画像 |
|---|---|---|
| `leo-chen` | `third_party_attributed_content_still`。本文のLeo Chen段落直後の3列video still | `6a5123b8485e9ia-applevinegar-webp.webp` |
| `sifuchen-california` | `third_party_attributed_profile_screenshot`。本文のSifuChen California段落直後で、画像内display nameとhandleを確認 | `6a5124cad41c8sifu-webp.webp` |

両画像は通常browser navigationのHTTP200応答を原bytesのまま保持し、署名付きURLやcontact情報をmanifestへ複製しない。第三者reportの画像であり、本人提供のavatar・独立したAI分類の証拠・再利用licenseとは扱わない。canonicalのhandle/metrics/分類は変更しない。

Sifuの横長profile stripとLeoのcollageは標準center cropで顔が見えにくいため、UI変更は `apps/landing/components/AiMonkDatabase.tsx` のProfileAvatar周辺の2IDだけに限定する。既存72pxの丸枠内でCSS object-position/scaleを使い、原画像を編集せず顔を表示する。従来11画像とfallbackの表示は保持する。検証は既存helper/UI testsと、guardの空きleaseを使うown新規tabでの独立72px previewに限定する。現在cursorはこの2画像の追加と表示crop。

source受入結果: 75ID一致、全17assetのbytes/hash、新規6原bytes一致、対象外69行とcanonical SHA不変、secret/private path/署名付きURLなし、既存helper5＋UI2 tests、diff checkがPASS。実componentのSSRと実Tailwind CSSを使う独立CDPの72px previewでSifu/Leoの顔可視、Yang Mun/fallback維持、client error0を確認する。browser ownタブを閉じ、leaseを解放する。PNGはrepo外に保持し、evidenceにはhashと観測結果を記録する。

既存ShenMuのHTTP MIME記録image/jpegとraw magic WebPの差はevidenceのlimitsへ記録し、既存row/URL/bytesは変更しない。全17件のMIME一致とは扱わない。新規6件はMIME/signatureが一致する。現在cursorはsource/visual検証PASSから限定commit/push・remote一致・PR attach。17画像/58未取得は本番反映前のsource予定値で、CI監視・merge・本番readbackはrootへ引き継ぐ。

## 追加画像batch4: 未調査・未取得10件の出所確認

最新main `f8dde2b78ac9fa81c388f0495ed779e7321379d2` から `feat/ai-monk-images-batch4-20261023` を作り、clean/remote/baseを確認する。既存batch3 worktreeを再利用し、rootのMCP/本番証拠/他specは編集しない。baselineはsource 17画像・58未取得、75ID。既存20handle調査とbatch3の10handleを除外し、まだ個別sourceを調べていない以下の10件を対象にする。

| handle | account ID | 表示名 |
|---|---|---|
| `yonchenhealing` | `lead-instagram-yonchenhealing` | Yon Chen |
| `innerequelle` | `lead-instagram-innerequelle` | Li Ming |
| `maestroyunkai` | `lead-instagram-maestroyunkai` | Yun Kai |
| `monjeshentao` | `lead-instagram-monjeshentao` | Shen Tao |
| `monacochenn` | `lead-instagram-monacochenn` | Monaco Chen |
| `jin.miaoo` | `lead-instagram-jin-miaoo` | jin.miaoo |
| `maitre_ping.lin` | `lead-instagram-maitre-ping-lin` | Maitre Lin |
| `tenzinremedios` | `lead-instagram-tenzinremedios` | Tenzin Remedios |
| `monacogendun` | `lead-instagram-monacogendun` | Monaco Gendun |
| `masterjiao` | `lead-instagram-masterjiao` | Master Jiao |

調査evidenceの正本は `docs/evidence/ai-monk-profile-discovery-batch4-20261023.json`。このscope/targets/完了条件を先にcommit/pushし、remote object一致を確認してから公開検索を始める。DDG HTML＋scrapy、公式site/公開YouTube/crosslink、必要時の登録済みbrowser own新規tabを使う。browserはSSOT全体を値なしで確認し、registry/owner/既存leaseを尊重し、使用後は自分のtabだけを閉じleaseを解放する。

exact canonical handleへの公式crosslinkまたは公表資料の明確なprofile対応がある原画像のみ採用する。IG直接scraping・vidIQ credit・有料API・新認証・新しいAI顔/他profile画像への代用は行わない。原bytes、HTTP MIMEと実形式、SHA、出所、source roleを保持する。canonical75/48・AI status/language/metrics・既存画像・UI codeは変更しない。未確認は選択10件の具体的な境界と次の出所として記録し、残り全件を調査済みにしない。

検証は75ID/全asset bytes・SHA/新規原byte一致/対象外manifest行とcanonical SHA不変/secret・private path・署名URLなし/既存helper5tests/diff check。意味ある成果を限定stageでcommit/pushしremote一致、PR作成/attachまで進める。自動merge・production反映/readbackはrootへ残す。現在cursorはこのscopeのcommit/pushから10件の公開source確認。
