# iOS シミュレータ ワークフロー（確定）

## Bundle ID
- **Anicca iOS**: `ai.anicca.app.ios`（`com.daisuke134.aniccaios` ではない）

## ビルド→シミュレータ表示の正しい手順

```bash
# 1. fastlane でシミュレータ用ビルド（xcodebuild直接禁止）
cd aniccaios && fastlane build_for_simulator

# 2. .app パスの確認
ls aniccaios/build/DerivedData/Build/Products/Debug-iphonesimulator/*.app

# 3. アプリ削除→再インストール→起動（オンボーディングを最初から見たい場合）
xcrun simctl terminate <UDID> ai.anicca.app.ios
xcrun simctl uninstall <UDID> ai.anicca.app.ios
xcrun simctl install <UDID> <.app path>
xcrun simctl launch <UDID> ai.anicca.app.ios
```

## よくあるミス（絶対やるな）
1. **App Store用IPA（`/tmp/aniccaios-export/aniccaios.ipa`）をシミュレータにインストール** → ARM device向けなので起動しない
2. **Bundle ID を間違える** → `com.daisuke134.aniccaios` は旧ID。正しくは `ai.anicca.app.ios`
3. **xcodebuild を直接実行** → fastlane 必須ルール違反

## 現在の iPhone 17 Pro UDID
`D5822106-E149-46E4-B7B7-50101D59B6D7`（iOS 26.2）
