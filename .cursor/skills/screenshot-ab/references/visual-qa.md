# Visual QA — App Store Screenshot Scoring

ソース: App Store optimization best practices / 核心の引用: 「First 3 Rule: 最初の3枚で install/skip が決まる」

---

## 採点プロンプト（vision model に投げる）

```
このApp Store用スクリーンショット3枚をベストプラクティスで採点してください。

【Critical checks（1項目でもFAILなら即FAIL）】
- 全3枚のフォントサイズが同一か（±10px以内）
- iPhoneフレームの背景が浮いていないか（白いboxが見えてはいけない）
- ヘッドラインとキャプションの両方が全枚に存在するか
- テキストが画像に被って読めない箇所はないか

【採点基準（各10点）】
1. ヘッドラインがペルソナのペインを直撃しているか（「6年間変われなかった」25〜35歳に刺さるか）
2. キャプションがベネフィット型で2行以内か
3. フォント100px Bold・全枚統一・コントラスト十分か
4. iPhoneフレームが背景と自然に溶け込んでいるか（白い箱が浮いていない）
5. 3枚見たときに統一感があるか（色・フォント・レイアウト一貫）

【参考: 業界標準（この水準を基準に採点）】
- Headspace: 暖色グラデ背景 + SF Pro Display Black 100px + Phone下にキャプション
- Calm: ブランドカラー背景 + Bold headline + 感情訴求キャプション
- Fabulous: グラデーション + Phone中央配置 + 上ヘッドライン + 下サポートテキスト

【判定】
- Critical check FAIL → 即FAIL（点数不問）
- 合計 40/50 以上 → PASS
- 39/50 以下 → FAIL（Critical Issueと改善点を出力）

出力形式:
Critical: PASS / FAIL（理由）
スコア: X/50
判定: PASS / FAIL
Critical Issues: [リスト]
改善点: [リスト]
```

---

## 判定基準

| 結果 | アクション |
|------|-----------|
| PASS（40/50+） | → PHASE 6 Slack 承認へ |
| FAIL（39/50以下） | → PHASE 3 ヘッドライン生成に戻る（最大3回） |
| 3回連続 FAIL | → Slack に警告送信 → EXIT |
