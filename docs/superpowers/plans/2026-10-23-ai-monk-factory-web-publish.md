# Monk Factory Webの公開接続

## 目的・範囲・完了条件
Life ManagerのFactory Web正本をaniccaai.com/ai-monk-factory/へ公開する。公開側は実際のdraft保存/export/importを持ち、local側は同一UIで既存Factoryの有限実行を扱う。日次自社投稿はGrok Bot担当で変更しない。販売を公開gateにしない。ユーザーがWeb UIだけでクラウド生成できると説明しない。

正本設計/実装計画はLife Manager docs/superpowers/{specs/2026-10-23-ai-monk-factory-web-design.md,plans/2026-10-23-ai-monk-factory-web.md}。productsに別UIや別agent/provider実装を作らず、immutable main SHAと4files(index.html/app.css/app.mjs/project.mjs)のSHA256をmanifestで固定して既存prebuildからstageする。public directoryは生成物としてignoreし、/factoryの別商品は変更しない。

## TODO
- [x] stage helperの成功/hash不一致/不正manifest/symlink拒否を最小REDで観測し、Node標準APIで実装する。
- [x] Life Managerのfocused tests/独立レビュー/CI/mainと固定版localhostのprovider0受入を完了し、そのmainをmanifestへpinする。
- [x] prebuildへstage接続し、DatabaseのFactoryリンクとsitemapを追加する。生成dataやpackage versionは変更しない。
- [x] focused source検証/CI/main/Netlifyと公開4filesのhash、公開draft保存/export/import、local起動導線をreadbackする。
- [x] field-guideの現在cursorと証拠を更新し、Muse/ChatGPT配布へ進む。実課金/投稿/他者収益と公開完了を混同しない。

## 現在cursorと並列順序
Life Manager PR8721はmain `eb78a805c4f79cd807852c27f52f9e4207a1ba61`、products PR602はmain `fcbe8ec027bcc78825f5e50e0d83d0926a036525`へ統合済み。37 focused testsと独立最終blocking0を受入し、Security Scan39964362189はMac待機が解消して全SUCCESS、products Landing CI39966601616とNetlify39967298318もSUCCESS。公開と固定版localhostのplan受入を完了し、現在cursorはplugin配布・認証診断へ進む。日次投稿・既存owner・費用照合の運用はGrok Bot担当とする。

旧順のmain→local受入→pin/buildは、UI4fileとlocal runtimeの独立性に基づき、main→local受入とpin/buildの並列→公開受入へ変更する。この順序による双方の受入は完了済み。stageのfileURL末尾slashによるENOENTは、末尾separator付き回帰とpath.resolve正規化のRED→GREENで解消済み。

## 公開・localhostの受入
公開 https://aniccaai.com/ai-monk-factory/ とslash無しの入口は200、公開4filesは固定したLife Manager mainのhashと一致する。DatabaseのFactory CTA、73card・pending注記69を維持する。公開側の専用isolated browser contextで35,473 byteの日本語draftを保存・reload・実download・同fileのimportまで確認し、localhost requestは0。PC1360/スマホ390でJS errorと横overflowは0。

専用immutable releaseのlocalhost UIから、空scriptを実Codexが165文字へ生成し、run-bound MCP経由の実Python offline planが`planned`/exit0を返す。Factory `provider_calls=0`、`external_effects=[]`、再表示した履歴も同runのplannedを示す。local側も1360/390でJS error・横overflowは0。実HeyGen生成・投稿・native確認・売上・他者無人収益はこの受入に含めない。

合成した受入証拠 → `docs/evidence/ai-monk-factory-web-production-20261023.json`。旧stage証拠とprivate production snapshotの`public_browser_draft=pending`は履歴として保持し、後続のpublic UI証拠でpassへ解消する。配布の残TODO正本 → `docs/superpowers/plans/2026-10-23-ai-monk-plugin-package.md`。
