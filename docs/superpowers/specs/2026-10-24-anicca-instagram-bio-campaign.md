# Anicca.enプロフィールリンクのAppleキャンペーン計測

## 目的と範囲

Instagram `@anicca.en` のプロフィールにある `https://aniccaai.com/app` を、既存のAnicca App Storeページへ転送しつつ、Appleが必要とするprovider tokenとcampaign tokenを渡す。

実行順と全体状態の正本はLife Managerの `docs/superpowers/specs/2026-09-25-life-manager-unified-ssot.md`「Anicca旗艦・公開6アプリの配信と継続課金」を参照する。本書は当修正の契約であり、別のTODO正本を作らない。

## 原因と既存実装

本番 `/app` はHTTP 302で `https://apps.apple.com/us/app/daily-affirmations-anicca/id6755129214?ct=anicca-ios_ig_anicca-en_en` を返す。リンク先は正常だが、`pt` が欠ける。Appleの[Campaign links](https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links)は、キャンペーンにprovider tokenとcampaign tokenの両方を含めるよう求める。既存の本repoのApp Storeリンクはprovider token `93486075` とmedia type `8`を使うため、同じ値を再利用する。

対象はroot `netlify.toml`、`apps/landing/netlify.toml`、`apps/landing/app/app/page.tsx` の `/app` 転送と、既存 `apps/landing/test/anicca-app-store-routing.test.mjs`。新しいrouter・依存・SDK・campaign名・account設定は追加しない。

## 受入条件

- 3定義とも既存のApp Store host・app ID・`ct=anicca-ios_ig_anicca-en_en` を保持し、`pt=93486075` と `mt=8` を含める。
- 既存の内部サイト向けApp StoreリンクをInstagramの `/app` へ付け替えない。
- 既存テストに不足パラメータの検証を足し、現sourceで失敗を確認してから3定義を修正する。検証コマンドは `node --test apps/landing/test/anicca-app-store-routing.test.mjs`。
- PRの必要なCIを確認してmainへ統合し、既存のNetlify Deploy workflowによる公開を確認する。本番 `/app` の302 Locationと到達先のapp ID・全3パラメータを確認する。
- リンク修正や公開確認を、実インストール・キャンペーン表示・収益増として扱わない。Appleには時間・件数の表示閾値があり、実キャンペーン結果は全体正本の残TODOとする。

## 現在状態

本番の欠落と公式仕様、3つの既存転送定義、修正前の既存2テスト成功を確認する。既存テストへ不足パラメータの検証を足すと `null !== '93486075'` で1件が失敗する。3定義に既存のpt/mtを補う最小修正後は2件とも成功する。次はPR/CI/main、既存Netlify workflowの公開、公開Locationの照合である。実インストール増やキャンペーン指標の出現は未確認とする。
