# AI僧侶ビジネス指標の観測更新

## 目的・範囲・完了条件

取得済みの公開観測をcanonical datasetへ追加し、更新日を2026-10-23へ進める。フォロワーと標本動画の視聴数、2件の商品事実だけを更新し、過去の観測・出典・分析・未確認を保持する。現snapshotのREADMEを実数へ合わせ、関連テストとsource受入を確認してPR作成/attachまで進める。main統合・UI/MCP source・release・本番readbackはrootが所有する。

所有は `apps/landing/public/data/ai-monk-avatar-database-2026.json`、`packages/ai-monk-index/README.md` の現snapshot情報、本計画と独自evidenceだけ。canonical field-guide/avatar-scope計画、他のspec/receipt、UI/MCP実装、画像、書籍、購入backend、価格/SKU/認証/課金/投稿は変更しない。package version 0.3.0を保持する。他者の編集を戻さない。

## 基点・根拠

- repository: `https://github.com/Daisuke134/anicca-products.git`
- base: `3085d15b5ab7aaf661acc6cec4a322337040f2ec`（作成時の最新origin/main）
- branch: `data/ai-monk-metrics-refresh-20261023`
- worktree: `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-metrics-refresh-20261023`
- 既存他worktreeは切替・編集せず、新専用worktreeへsparse checkout。会話cwdでnative worktree toolがrepoを認識しない既知の境界があるためGit fallbackを使用。
- root取得のYouTube metadataは3本、2026-10-23 02:47Z。no cookies/no media。private rawの許可fieldだけを照合し、全てchannel ID `UCoMa3p67nJWkk2kk-8hD1jA` / `@Yangmunv2` と一致。raw metadataや署名URLは転記しない。
- root取得の通常公開Instagram headerはexact canonical/profile identityとHTTP200が確認済み。Yang Mun252.3万人、Ming San137.8万人、Yan Chen134.2万人、Yangjun9.5万人。元displayと丸めを残し、旧countとの差から増減率を作らない。
- 現bioのMing San→Beetroot、Yan Chen→El Camino de Vuelta a la Calmaを、公式商品pageの最小crawlで確認する。Beetroot本体価格は不明。24.99のMoringa upsellを採らない。Yanの商品はEUR9.95/103頁のdigital guide、availabilityは相反表示があるため不明。売上・手数料・治療効果・review数から注文を推論しない。
- 外部商品pageだけをcrwlで読み、browser lease・新auth・有料APIは使わない。repo内旧固定検索・dev branch手順より今回のlatest main・限定data指示を優先する。

## 更新方針

1. この計画を先にcommit/pushしてremote objectを確認する。
2. 既存48sourcesを変更せず、IG4件・YT metadata batch1件・商品page2件の計7sourceを重複確認の上で追加する（予定55、実数はevidenceへ）。
3. IG4profileとYouTube subscriberへdated snapshotを追記。旧followers/posts/screenshot観測を削除しない。IGはvalue/display_value/rounded statusとcapture日時を保持する。
4. Yang Munの既存3sampleの旧views/日付/sourceをmetricsへ保存し、新views観測を追加。current views/views_captured_atを更新し、`views_source_id`を新出典へ分離。旧`source_id`・structure_summary・media_status・uploaded_at・durationは保持する。
5. Ming SanとYan Chenへ出所付きの現在offerを追記する。Yanの元cropped screenshot観測は履歴として保持し、公開bioのfull URL確認を別観測にする。健康効果・urgencyは転載しない。既存unknownsのうち今回解決したURL/現在観測だけを限定補足し、未解決creator/売上等は維持する。
6. Yang Munの既存2offerは元source `yangmun-journey-store` のURLだけを補完する。現在価格の再取得ではなく既存観測への導線補完とする。
7. READMEの現更新日・source実数・73対象（研究7+候補66）を合わせる。75archive、対象外2、AI status、USD213000超/3か月の報道値は不変。
8. 最小関連既存テスト、全source参照、旧source/過去観測の保存、canonical ID/AI flag/対象外/revenueの不変、限定差分・secret/署名URL scan・diff checkを確認する。
9. 許可pathのみcommit/pushしremote object一致、PR作成/attach、head/CIと限界を報告して停止する。merge/productionを実行しない。

## TODO・cursor

- [x] 最新main/remote・所有境界・新worktree cleanを確認。
- [x] canonical schema、README、取得済みpublic header/metadataの許可fieldを読む。
- [x] 計画の先行commit/pushとremote確認（`9c710a52d2e86e4bb9344c21e1979002676c102d`）。
- [x] source追記・過去観測保存・現在指標/商品事実・README更新。
- [x] 既存関連テストと最小source受入。
- [ ] 限定commit/push・PR/attach・head/CIをrootへ引継ぎ。

現在cursor: source受入完了。限定commit/push→PR作成/attachとhead/CIを報告し停止する。PR/CI状態はGitHubと完了報告を正本とし、rootへ統合・release・本番確認を引き継ぐ。実観測以上の数値・AI認定・売上は作らない。

## 実施結果

- 新capture sourceは7件、重複IDなしで総55。旧48source、75ID/対象外2/AI状態・売上報道、他71accountと全旧platform snapshot/offer fieldを保持。
- IG4snapshotを元の丸め表示付きで追加。YT3sampleの旧viewsはmetricsに保存し、新views出典はviews_source_idとmetrics.source_idへ分離。metadata-onlyの観測範囲を保持。
- 新2productにas_of=2026-10-23。Mingは本体price不明、Yanはseller表示EUR9.95/103頁・availability不明。Yang Mun既存2offerのurlだけ元sourceから補完。
- 既存12helper/SSR+13package=25tests PASS。新出典のMCP応答、全41source参照、history不変、canonical hashとsecret/署名URL scanを確認。独自evidenceは `docs/evidence/ai-monk-metrics-refresh-20261023.json`。
