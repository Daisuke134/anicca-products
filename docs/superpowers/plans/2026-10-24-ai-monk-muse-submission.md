# AI Monk IndexのMuse正式提出

## 目的・範囲・完了条件
無料・読み取り専用の公開MCPをMuse Connector Platformへ提出し、正式な審査受付と掲載を別々に追跡する。既存の6tool、公開Database、公開ポリシー、既存アイコンを使用する。新たな動画生成、課金、投稿権限や新規accountを追加しない。認証情報はrepo外のcredentials.jsonだけに保存する。

正式portalはhttps://platform.muse.ai/submission。既存Meta accountの通常ログインを完了し、Overview/Technical specs/Reviewのフォームを確認する。実情報と実装済みの内容を入力し、最後のレビューで提出対象を照合してから1回送信する。フォーム表示、draft保存、審査受付、公開掲載を混同しない。新たな本人確認や法人審査が必要なら具体的な不足物を記録し、他作業を継続する。

## 提出契約
- 名前AI Monk Index、開発者Anicca、無料・決済なし。
- Website https://aniccaai.com/ai-monk-database、support/privacy/termsは同page配下の公開URLを使う。
- MCPはhttps://aniccaai.com/.netlify/functions/ai-monk-mcp、Streamable HTTP、認証なし。6toolすべてreadOnly、動画生成/投稿/個人収益の検証はできない。
- 利用価値は出典付きprofile検索、商品の比較、日付つき収益申告の区別、video formatsとscript playbooksの検索。売上や網羅性を保証しない。
- 連絡先と氏名は既存の本人profile/credential SSOTにある情報だけを使う。work emailは既存の公開窓口を使う。credential値や認証コードはrepo/log/chatへ記録しない。
- 既存アイコンのpayload/旧ZIPは変更しない。フォームの要求が合わない場合はその境界を記録する。

## TODO
- [x] 公開一次資料と正式portalを確認する。
- [x] 通常ログイン後、正式提出フォームが表示されることを確認する。
- [ ] Overview/Technical specs/Reviewへ実情報を入力して確認する。
- [ ] 審査提出を1回実行し、公式受付番号/状態をreadbackする。
- [ ] 審査結果と正式掲載URLを確認する。審査待ちは掲載済みと扱わない。

## 現在cursor
既存Meta account認証後、submissionのOverviewを表示する。まだdraft入力・提出・掲載は行っていない。Databaseの176出典更新とCLI v0.4.5公開readbackは別担当が進め、日次IG/TikTok運用は変更しない。
