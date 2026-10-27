# AI Monk書籍へつなぐX配信

## 目的・範囲・完了条件

公開受入済みDatabase v0.4.13の具体的発見を使い、既存の英語書籍The Art of AI Monksの9.99 USD LPへ主CTAを1つ置くX投稿を1本公開する。対象は既存本人アカウントselawmqt。既存の本人投稿receiptと登録済みauth/公式live readbackで同一性を確認し、別accountへ投稿しない。実投稿receipt・author・本文・UTM付きlink・permalinkのprovider readbackを完了条件とする。click/注文/実売上・MRRは別の成果で、未取得はnullのまま保持する。

初回base mainは7ac673209f5474b013b6e44c31d336603439a083、既存専用worktreeのbranch docs/ai-monk-book-x-funnel-20261024を使う。新landing page、課金変更、画像生成、paid ads、別アカウント作成、DM、他SNS投稿、日次Grok所有loop、正式Plugin再提出は対象外。既存Grok配布依頼は保持し、重複送信しない。支出0。新しい規約/セキュリティ/共有設定は変更しない。

今回のdocs unitは既存rebaseの競合解消と、保存済み証拠による本plan・sanitized receiptの事実反映だけを所有する。上流のKeiodaisuke既存accountによる正式Plugin Web提出を最優先cursorとして保持し、X配布は独立並行で追跡する。外部送信・投稿編集・削除・追加投稿とpost-submit-fence.jsonの解除/変更は行わない。PR/main統合はprimaryが所有する。

## Current cursor override — 2026-10-26 JST — Put the book link in one X thread reply

前回の通常X投稿はPostiz作成payloadへ購入URLが入っていたが、公開本文・URL entity・cardから消えていた。Postiz live schemaにも「リンクを除去」とある。Postiz公式public docsはXでのlink stripping時にfollow-up commentへURLを置く方法を明記する。X Article modeはPostiz public API docsでanchor対応だが、X公式helpはArticle publicationをPremium系subscriptionに限定しており、対象accountのPremium状態は未確認。したがって、Article本文へのanchorに賭けず、既存postを編集・削除せず、同じ本人account `selawmqt` / integration `cmt4l2jld031tqp0y8qtyo983` に「通常post + URL付き最初のreply」を1スレッドだけ新規公開する。

**順序変更と理由:** 直前案はX Articleへ購入anchorを置いていた。独立レビューがlive schemaの一般link-stripping指示と対象accountのArticle eligibility未確認を指摘し、Postiz公式helpはstrippingを避けるreply linkを指定する。旧順序はArticle案を投稿。新順序は (1) reply URLを含む完成したthread copyと条件を本specに固定してmainへ統合、(2) single API callでthreadを一度だけ公開、(3) Postiz `PUBLISHED` と公開author・本文・reply URL・permalinkをreadback、(4) sanitized receiptへ事実を記録、(5) Keio審査状態と他の配布TODOへ戻る。現在cursorはcopyのread-only再検証。既存post、Keio提出state/fence、Grok Bot/Postizのdaily owner/schedule、他account、投稿frequencyは変更しない。

前回レビューがMEDIUMとして最近の同一書籍告知との重複懸念を指摘したため、販促だけの文を避け、既存告知に無い「public audience・listed offer・sales evidenceの区別」を主postで伝える。CTA詳細は同じthreadの最初のreplyに置く。公開するのはこの1 threadのみ。

**投稿案:** Postiz `postsAndComments`の1つ目を本文、2つ目を最初のreplyとする。両方ともXの280文字以内。UTM付きURLはreplyにのみ置き、`shortLink=false`とする。

```html
<p>A follower count is an audience number—not a sales receipt. A storefront shows an offer and listed price—not copies sold. For AI monk avatars, date audience snapshots and separate creator-reported sales from independently verified results.</p>
```

```html
<p>Read The Art of AI Monks: Yang Mun, scripts, storefronts, original characters. 71-page PDF + EPUB; $9.99 once. Full manuscript and sources free: https://aniccaai.com/the-art-of-ai-monks?utm_source=x&amp;utm_medium=social&amp;utm_campaign=ai_monk_book_x_cta_20261026</p>
```

本文は公開database/bookの観察方法と商品ページの事実に限定し、収益や成果を保証しない。Provider設定は`post_type=post`、`who_can_reply_post=everyone`、`made_with_ai=true`、`paid_partnership=false`。

公式資料: Postiz X schema https://docs.postiz.com/public-api/providers/x 、link strippingとreply workaround https://docs.postiz.com/general/composer/links-and-validation 、thread parts https://docs.postiz.com/general/composer/threads-and-comments 、X Article eligibility https://help.x.com/en/using-x/articles。

このunitのTODO: [x] 商品ページの現行表示を確認（71-page PDF+EPUB、$9.99 one-time、原稿/出典無料）; [x] 対象integration・live schema・Postizのreply workaroundをreadback; [ ] thread案と順序をcommit/push/PR/main統合; [ ] revised thread copyのread-only再検証; [ ] 既存投稿を変更せずthreadを一度公開; [ ] PostizおよびX公開readbackでauthor・本文・reply URL・permalinkを確認; [ ] sanitized receiptに公開結果を保存。UTMはcampaign識別子であり、click・checkout・注文・売上・MRRの証明として扱わない。支出0。

## 成功事例と採る仕組み

AI monkのX無料roadmap https://x.com/shalevhvs/status/2072997016498815202 は既存観測12,933 views、今回の公開表示12.9Kで、具体的な提供内容の列挙を参考にする。売上の証拠は無い。Daniel Vassalloの書籍告知 https://x.com/dvassallo/status/1209686739146534912 は本人の回顧記事 https://www.linkedin.com/pulse/how-i-made-210822-selling-pdf-video-internet-daniel-vassallo で告知由来16,659 USDのdirect salesを申告するが未監査で、対象分野・時期・読者規模も異なる。得られる内容を具体化して購入LPへ主リンクを1つ置く仕組みだけを採る。完全に同じAI monk/無料tool/9.99 USD書籍の帰属済み転換例は取得できず、小さい配布実験として実測する。

調査正本はprivate ~/.local/state/life-manager/ebook/evidence/ai-monk-x-book-funnel-research-20261024/research-readback.json。既存support導線には書籍への直接CTAが無いため、この投稿は既存書籍LPへ直接案内する。URLはhttps://aniccaai.com/the-art-of-ai-monks?utm_source=x&utm_medium=social&utm_campaign=ai_monk_ugc_book_20261024。UTMの存在をclickや売上の帰属の証拠にしない。

## 商品事実とcopy

本番LPはEnglish First Edition、PDF+EPUB、1回払い9.99 USDを表示する。本文の全文と出典はGitHubで無料公開されていることもLPが開示する。有料版は整形済みformatと研究支援の販売である。今回のLPは71ページ表示で、旧スクリーンショットの59ページを流用しない。投稿ではページ数を省き、台本・商品導線・original character制作という実際の内容を伝える。

Yangjunのseller listingはReel100 USD、UGC Video Ad120 USDを明示し、全11メニューをDatabaseへ追加済み。これを注文/売上/利益・AI制作確認と呼ばない。Factory利用可能・正式ChatGPT/Muse掲載・誰でも利益が出るという表現はしない。social-contentの具体的発見→内容→単一CTAを使い、当社書籍はaffiliate商品ではないためaffiliate用の未確認収益予測や架空disclosureを適用しない。

## 実行順

- [x] COPY: 商品事実・単一CTA・文字数を確認した日本語本文を作り、独立read-only確認はblocking0。予定copyのSHA256と文字数上限212を保存する。
- [x] PREFLIGHT: 先行実行のSSOT/本人照合を保持する。保存済み最終preflightは本人selawmqt・integration有効・同campaign重複0・投稿呼出し前0を示す。今回のdocs unitでは認証/SSOT/既存sessionに触れない。
- [x] PUBLISH: hash付きO_EXCL fenceの後、Postizで1回だけ送信しHTTP201を得る。後続の公式post listはPUBLISHED、X公式readbackは本人/投稿ID/公開本文を確認する。再送0、fence解除0。
- [ ] READBACK: 公開状態・author・本文・IDの一致は確認するが、予定UTM URLが公開本文/URL entity/cardに無いため、当初の購入導線の完了条件は未達。click/注文/実売上・MRRはnullのまま保持する。
- [x] RECORD: 保存済み証拠を照合し、秘密値の無いreceiptと本planへ公開成功・購入導線未達・是正未実施を記録する。branchのcommit/push結果はprimaryへ報告する。
- [ ] CORRECT / MERGE: primaryがURL欠落の発生境界と是正手段を具体化し、PR/main統合を所有する。本docs unitでは投稿の編集・削除・追加/再投稿を行わず、既存fenceを保持する。

## 公開結果と未達

Postizの作成応答はHTTP201、post IDはcmvm1gbz52gnxqu1cilsvc7ms、作成呼出し1回・再送0。作成直後のpublished_verified:falseは元記録のまま保持し、その後の公式post listがPUBLISHEDとrelease ID2113885630384275807を返す。公開URLは https://x.com/selawmqt/status/2113885630384275807 。X公式oEmbedとsyndicationの保存応答もauthor selawmqtと同IDを示すため、投稿自体の公開成功を受入する。

予定のUTM付き書籍URLは保存済みcreate payloadに含まれるが、Postizの公開本文とXの公開本文から欠落する。両本文のSHA256はdfe249e3b20b74b16e8ba199ddb163bed453b1776da7620a4f22ef3e0b70a5cdで一致する。X syndicationのURL entityは空、cardは無く、oEmbedにも書籍linkが無い。欠落が発生した正確な境界/原因は未確認であり、投稿を購入LPへつなぐ成果へ換算しない。是正は未実施で、追加送信・編集・削除0。

保存済みX応答のfavorite_count/conversation_countは各0だが、取得時刻は応答内に無く、現在値とは扱わない。views/reposts/click/注文/実売上・MRRは未取得のnull。新しい公式GETやmetrics取得は今回行わない。

状態・sanitized証拠 → ../../evidence/ai-monk-book-x-funnel-20261024.json。private原本のpost-submit-fence.jsonはSHA256 ccdc4f61709ed906446bb2d656b5d05b8df4a4bacc6e12ea58357f47a47c2682を維持する。現在cursorはKeio正式Web提出を妨げない独立並行のURL欠落診断と是正の具体化であり、本unitの外部effectは0。Keioの所有/提出状態の正本 → 2026-10-24-ai-monk-keio-plugin-submission.md。
