# Daily Dhamma ペイウォールの実装契約

## 目的・範囲

年額の無料体験を、実際に対象となる利用者へ正しく案内し、購入への導線を改善する。業務上の配信・収益・実行順の正本は [Life Managerの課金スペック](https://github.com/Daisuke134/life-manager/blob/main/docs/team/specs/daily-dhamma-paywall.md) を参照する。

対象は既存PR #644の年額優先ペイウォールと表示契約の修正。価格・商品の追加・RevenueCat offering・ASCの導入オファー・配信loopは変更しない。過去案の7画面オンボーディング、3段階ペイウォール、未確認の利用者数、課金前通知の約束は実装対象にしない。

## 表示と購入

- 年額を初期選択し、価格は選択商品のストア値を使う。月換算と割引は取得価格から算出する。
- 無料体験のバッジ・CTA・開始後の請求時期は、年額商品の無料intro offerと、現在の顧客に対する `INTRO_ELIGIBILITY_STATUS_ELIGIBLE` の両方が確認できた場合だけ表示する。
- 資格の確認中・unknown・ineligible・offerなし・応答欠測・API失敗では無料体験を約束せず、通常の購入CTAと価格を表示する。顧客情報や商品が変わった場合、以前の資格を流用しない。
- 月額選択時は無料体験のCTA・請求時期を表示しない。
- 購入は選択中のpackageを渡す。商品欠測では購入を実行しない。購入・復元後のPro付与はactive `premium` entitlementに従う。
- 「無料で続ける」ボタンを置かず、閉じる操作を3秒後に表示する。購入しなくても閉じられる。
- 既存PRの入口（onboarding完了・skip、11句目、bookmark、4回以上の通知、3日連続起動）と計測を引き継ぐ。無料体験開始の計測は購入結果の `periodType` に従う。

## 根拠

[RevenueCat React Native SDK 9.6.15の実装・API契約](https://github.com/RevenueCat/react-native-purchases/blob/9.6.15/src/purchases.ts#L920-L941) は `checkTrialOrIntroductoryPriceEligibility` をtrial表示の判断に用い、unknownでは通常価格を表示するよう定める。依存lockと導入済みSDKはいずれも9.6.15を示す。

## 受け入れ条件

1. 対象外・unknown・欠測で無料表示が出る回帰テストを、修正前のコードで失敗させる。
2. eligible＋無料商品だけが無料表示に進むことと、API失敗・顧客切替時に以前の資格を使わないことを関連テストで確認する。appのJestとTypeScriptを実行する。
3. 修正を独立レビューし、必要なCIを通してmainへ統合する。
4. 確定main SHAから既存productionビルド経路を使い、EAS build UUID・source SHA・version・採番されたbuild番号とASC buildを対応付ける。build 42を修正版と扱わない。
5. 対象versionへ修正版buildを設定し、審査提出の公式readbackを確認する。利用・課金・収益の確認はLife Managerの残TODOで継続する。

進捗・提出済みbuild・現在cursor・残TODOの正本 → [Life Manager統合SSOT](https://github.com/Daisuke134/life-manager/blob/main/docs/superpowers/specs/2026-09-25-life-manager-unified-ssot.md#anicca旗艦公開6アプリの配信と継続課金)。この文書は実装契約を保持する。
