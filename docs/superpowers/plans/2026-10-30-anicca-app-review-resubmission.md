# Anicca 正式再提出

目的: App Store Connect app 6755129214 / ai.anicca.app.ios の最新リジェクトを解消し、正式ビルドを提出して WAITING_FOR_REVIEW を公式readbackで確認する。

範囲: Appleの指摘全文・履歴・添付の確認、関係するiOS実装とメタデータ修正、Maestro E2E、署名済みReleaseのarchive/upload、正式再提出。本人への質問は行わず、credential SSOTと既存sessionを利用する。別アプリ・既存loopは変更しない。

現在の証拠: version 1.9.6 (677ae249-da6e-4105-a469-cf0d0521ba92) は REJECTED。最新build 814 (c96db27f-9ae8-41d9-b9f8-19cea9355e6a) は VALID。submission 017984f9-8d67-429b-b92e-2b3e633d6275 は UNRESOLVED_ISSUES。ASC API認証は有効、Web sessionは期限切れ。

## TODO
- [ ] 指摘全文・添付・提出build/sourceを照合し原因を記録する（現在cursor）。
- [ ] Apple一次資料と実装契約を確認し、必要最小の仕様・回帰テスト・修正を行う。
- [ ] Maestroで初回起動・主要導線・指摘箇所を実行する。
- [ ] source検証・必要な独立read-only検証・CIを完了しmainへ統合する。
- [ ] main由来の正式Releaseを署名・uploadし、AppleのVALIDを確認する。
- [ ] 審査情報を整え正式再提出し、WAITING_FOR_REVIEWを確認する。

完了判定: テスト成功やuploadだけでは完了しない。ASC公式状態 WAITING_FOR_REVIEW が成果条件。審査承認そのものは今回の完了条件に加えない。
