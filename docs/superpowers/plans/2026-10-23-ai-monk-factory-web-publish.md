# Monk Factory Webの公開接続

## 目的・範囲・完了条件
Life ManagerのFactory Web正本をaniccaai.com/ai-monk-factory/へ公開する。公開側は実際のdraft保存/export/importを持ち、local側は同一UIで既存Factoryの有限実行を扱う。日次自社投稿はGrok Bot担当で変更しない。販売を公開gateにしない。ユーザーがWeb UIだけでクラウド生成できると説明しない。

正本設計/実装計画はLife Manager docs/superpowers/{specs/2026-10-23-ai-monk-factory-web-design.md,plans/2026-10-23-ai-monk-factory-web.md}。productsに別UIや別agent/provider実装を作らず、immutable main SHAと4files(index.html/app.css/app.mjs/project.mjs)のSHA256をmanifestで固定して既存prebuildからstageする。public directoryは生成物としてignoreし、/factoryの別商品は変更しない。

## TODO
- [x] stage helperの成功/hash不一致/不正manifest/symlink拒否を最小REDで観測し、Node標準APIで実装する。
- [ ] Life Managerのfocused tests/独立レビュー/CI/mainと固定版localhostのprovider0受入を完了し、そのmainをmanifestへpinする。
- [ ] prebuildへstage接続し、DatabaseのFactoryリンクとsitemapを追加する。生成dataやpackage versionは変更しない。
- [ ] focused source検証/CI/main/Netlifyと公開4filesのhash、公開draft保存/export/import、local起動導線をreadbackする。
- [ ] field-guideの現在cursorと証拠を更新し、Muse/ChatGPT配布へ進む。実課金/投稿/他者収益と公開完了を混同しない。

## 現在cursorと並列順序
Life Manager PR8721はmain eb78a805c4f79cd807852c27f52f9e4207a1ba61へ統合する。37 focused tests、独立最終blocking0、Factory関連CIと共通source checks13件PASS。変更外Mac loop checkはrunner待機で、必須check/rulesetは未設定を公式APIで確認する。旧順のmain→local受入→pin/buildを、main→local受入とpin/buildの並列→双方を確認して公開受入へ変える。根拠はUI4fileの確定main bytesとlocal runtimeが独立なため。現在はそのmainをmanifestへpinしてCIを進め、local受入は専用isolated releaseで並行する。

実CLIのstageはfileURL由来のtarget末尾slashによりENOENTになる。既存成功/symlink回帰を末尾separator付きtargetへ変え、path.resolveで正規化してからlstat/stageする最小修正を行う。
