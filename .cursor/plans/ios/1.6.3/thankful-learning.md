# Thankful Gratitude App — Factory Learning Log

**目的:** mobileapp-builder スキルを改善するための学習記録。
ここに書いたことは全てスキル・spec・iap-bible に反映する。

---

## セッション: 2026-02-24

### PHASE 1 — TASK 1: コード変更 → TestFlight upload

**✅ 完了**

| タスク | 内容 | 結果 |
|--------|------|------|
| TASK 1-A | AppViewModel.swift: 英語固定 | ✅ |
| TASK 1-B | SettingsView.swift: 言語Picker削除 | ✅ |
| TASK 1-C | PaywallView.swift: accessibilityIdentifier追加 | ✅ |
| TestFlight | fastlane build + upload | ✅ 1.0.0 アップロード完了 |

**学習:**
- スキルに `release` laneは定義されていなかった。実際は `build` + `upload` を分けて実行。
- SourceKitの「No such module 'RevenueCat'」エラーは false positive（コンパイルは通る）
- AppLanguage enumを `language: .english` に固定後、LanguagePickerを削除してもコンパイル通る

### PHASE 2 — TASK 3: IAPレビュースクリーンショット

**❌ APIでは完了不可 → ダイスが手動でやる必要あり**

| 試みた方法 | 結果 | 理由 |
|-----------|------|------|
| `asc subscriptions images create` | `FAILED` | S3マルチパートupload IDが即失効 |
| Python直接API（S3 PUT + PATCH commit） | `FAILED` | Apple側でimage処理失敗（width:0, height:0） |
| JPEG変換して再試み | `FAILED` | 同様 |
| S3 CompleteMultipartUpload | `403 Access Denied` | Apple S3バケットに直接CompleteMPUは禁止 |

**学習:**
- `asc subscriptions images create` はS3 URLを返すが、**PUTしてもApple側が処理できない**
  - Apple APIの`subscriptionImages`エンドポイントのS3アップロードは CLIが正しく動作していない
  - APIの `uploaded: true` PATCH後も `FAILED` になる
  - width:0 height:0 は「ファイルを受け取ったが画像として認識できない」状態
- **IAP レビュースクリーンショットはASC Webから手動アップロードが唯一の確実な方法**
  - URL: https://appstoreconnect.apple.com → Apps → Thankful → In-App Purchases → 各サブ → Edit → Review Information → Screenshot

**ダイスへのアクション指示:**
```
1. https://appstoreconnect.apple.com にアクセス
2. Thankful Gratitude App → In-App Purchases
3. "Thankful Pro Annual" → Edit → Review Information → Screenshot欄
   → 以下のファイルをアップロード: /tmp/paywall-iap.jpg (900x1956, 79KB)
4. "Thankful Pro Monthly" でも同じ操作
5. 両方Save後、状態がREADY_TO_SUBMITになることを確認
```

### スキルへの反映:
- `iap-bible.md` の「IAPレビュースクリーンショット」セクション追加: ASC Webから手動アップロード推奨
- `mobileapp-builder` PHASE 8 に「IAPレビュースクリーンショットはASC Webのみ（API不可）」を追記

---

## 記録フォーマット

```
### [PHASE X] 学習タイトル
- **スキルの記述:** スキルに何と書いてあったか
- **実際に起きたこと:** 何が違ったか / 何が足りなかったか
- **修正:** どう直したか
- **スキルへの反映:** SKILL.md / iap-bible.md / spec の何を直すべきか
```
