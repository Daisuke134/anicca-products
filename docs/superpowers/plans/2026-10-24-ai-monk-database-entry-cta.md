# AI Monk Databaseの書籍・plugin入口

## 目的・範囲・完了条件
公開Databaseのheaderから販売中の書籍ページと無料Codex plugin導入へ進めるようにし、未課金Factoryだけが目立つ状態を直す。開始時main 2bbca3b5b4912a7e19b0efffdbc4eb50ee3120e3由来の専用branch feat/ai-monk-database-entry-cta-20261024を既存専用worktreeで使う。primaryがこのplan/master、components/AiMonkDatabase.tsxとapp/ai-monk-database/support/page.tsx、新規受入記録を所有する。外部調査agentは公開参考の取得だけを所有し、repoを編集しない。

book主ボタンは既存 /the-art-of-ai-monks へ「Get the book · $9.99」、次のボタンは /ai-monk-database/support#install-the-codex-plugin へ「Free Codex plugin」。既存supportのh2に同じidを付ける。Factoryは既存URLの通常リンクへ下げ、日英の既存footerリンクと73profile/191sourceを保持する。既存Link/色/styleとflex-wrapを使い、設定・component抽象化・依存・画像は追加しない。価格/Checkout/entitlement・UTM/analytics・plugin payload/CLI版・Factory/日次投稿・認証・支払は変更0。

完了は既存render/book検証とdiff、source commit/push/remote、必要な既存CI/main統合、main由来Deployと公開HTMLでheaderの3導線・plugin対象id・遷移先HTTP200・既存73cardを確認すること。Header変更の公開をclick/install/paid納品/注文・MRRや成約率改善へ換算しない。

## 判断・参考
page-croのCTA階層と最初の画面の可視性に絞る。Factoryの大きい案内を増やす案は現在の未提供状態に誘導するため採らず、73cardより下のfooterだけを維持する案は既存商品/導入を見つけにくいままなので採らない。primaryが書籍主導線＋無料plugin＋Factory通常リンクを選ぶ。

同対象の一次販売ページ https://www.yang-mun.com/pages/journey をcrwlで確認する。現商品は30日講座であり本と同一商品ではない。先頭/中段/末尾で商品CTAを反復する配置のみ近接参考とし、販売者掲載のrating/参加者/books soldを検証済み成約率としない。同じWeb/Database→制作ebook/pluginの成約成功指標は未取得のため、小さい導線試験とする。計測上の次の必要情報は実click/install/paid orderで、未測定はnullにする。一次取得のURL/時刻/hashと本unitのsource/公開結果は新receiptへ保存する。

## TODO
- [ ] SPEC: 本plan/master pointerを先行commit/pushしremote一致を確認する。
- [ ] SOURCE: 既存2ファイルのheaderリンク階層とheading idだけを変更する。node --test test/ai-monk-evidence-rendering.test.mjs test/ai-monk-book-page.test.mjs とdiff確認を行う。低影響の静的リンク変更には新規の恒久testや実装の鏡のtestを追加しない。
- [ ] PUBLIC: sourceをpushし、既存CI/PR/mainとmain由来Deploy/公開HTMLを受入する。JSON/CLI/plugin payloadを変更せず、不要な版上げやRelease/Registry再送をしない。
- [ ] RECORD: 結果・限界・次cursorを正本へ保存し、今回blob/main一致を確認する。

## 適用判断と実行順
using-superpowers→brainstorming/writing-plans→executing-plans、既存worktree、ponytail full、page-croを適用する。Daisの明示No-human-loopに従いskillの質問/承認停止・model強制・固定全suite/追加reviewを採らず、primaryが既存styleの限定変更を実装する。projectの固定3検索/自動memory保存より必要範囲検索とdeveloperのmemory更新制限を優先する。

旧の単独cursorはFactory専用課金preflight。Google本人端末確認とFactory初期予算の未回答が実測条件なので、それを保持したまま独立してAM-13/PL-1の公開入口を先に直す。全体のDatabase→CLI/plugin配布・販売→Factoryの優先順は維持する。既存OpenAI case/Muse提出とGoogle Promptを再送せず、課金/日次effectを中断・重複しない。現在cursorはSPEC。
