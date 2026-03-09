# iOS App Onboarding & Paywall Best Practices（収益最大化）

> **「オンボーディングは機能説明ではない。ユーザーを確信させ、支払わせるプロセスである」**

## Sources

| Source | 核心の引用 |
|--------|-----------|
| Vara（Twitter/X viral thread） | 「Personalize immediately → Slow them down on purpose → Max perceived value before the paywall」 |
| Purchasely Blog（Nicolas Tissier, CPO） | 「User onboarding is the process that takes people from on-the-fence evaluators to regular users of your product」 |
| Purchasely 2026 Playbook | TikTok, Wise, Nike, Flo 等8アプリ分析：「Teach in context, Defer friction, Personalize early, Show value fast」 |
| Fastic（26M users） | 長いオンボーディングでもパーソナライズすればコンバージョンは落ちない |
| Blinkist | ゴール設定→ソーシャルプルーフ→パーソナライズ推薦→paywall |
| PaywallScreens.com（10,229 paywalls） | $500K+/月のアプリはほぼ全て onboarding → personalized paywall パターン |
| Scott Belsky（Adobe CPO） | 「最初の15秒で人は lazy, vain, selfish」 |
| Ramli John（Appcues） | 「End goal of user onboarding is habit formation」 |

---

## 1. 三大原則（Vara Framework）

| # | 原則 | 目的 | 実装 |
|---|------|------|------|
| 1 | **Personalize immediately** | 投資感を作る | 質問スライド2-3枚で「あなた専用」を演出 |
| 2 | **Slow them down on purpose** | perceived value を積み上げる | progress bar + 間に value proposition スライドを挟む |
| 3 | **Max perceived value before paywall** | 「これは自分に必要」と確信させてから paywall | パーソナライズ結果を paywall の直前に表示 |

---

## 2. オンボーディングフロー設計（5-8スライド）

### フロー構成テーブル

| Step | 画面タイプ | 目的 | 秒数 | 必須要素 |
|------|-----------|------|------|----------|
| 1 | **Welcome + Hero** | 感情を掴む | 3-5s | アプリアイコン、1行のベネフィット、美しいビジュアル |
| 2 | **Personal Question 1** | パーソナライズ開始 | 5-10s | 「あなたの目的は？」タイプの選択肢（3-4個） |
| 3 | **Value Proposition** | 休憩＋価値強化 | 3-5s | ソーシャルプルーフ or 統計データ |
| 4 | **Personal Question 2** | 深いパーソナライズ | 5-10s | 「どのくらいの頻度？」「いつ？」 |
| 5 | **Building Your Plan** | anticipation を作る | 2-3s | ローディングアニメーション「あなた専用プランを作成中...」 |
| 6 | **Your Personalized Result** | perceived value MAX | 5-10s | パーソナライズ結果の要約 |
| 7 | **Notification Permission** | 通知許可 | 3-5s | ベネフィットを明示してから許可ダイアログ |
| 8 | **Paywall** | コンバージョン | - | 下記 Paywall BP 参照 |

### 重要ルール

| ルール | 詳細 |
|--------|------|
| Progress indicator 必須 | 全スライドにドット or プログレスバーを表示 |
| 質問は2-3問以内 | 多すぎると離脱。少なすぎると personalization が弱い |
| 「Skip」は表示する | Apple ガイドライン遵守 + 信頼構築。ただし目立たせない |
| アニメーション必須 | フェード・スライド遷移。突然切り替えは NG |
| コピーはベネフィット指向 | 機能ではなく「あなたにとっての価値」 |

---

## 3. Paywall 設計 Best Practices

### Hard vs Soft Paywall

| タイプ | いつ使う | コンバージョン率 | リスク |
|--------|---------|----------------|--------|
| **Soft paywall**（X ボタンあり、Free option） | v1、新規アプリ、レビュー用 | 2-8% | 低リスク、Apple 審査通りやすい |
| **Hard paywall**（閉じれない） | 十分な organic traffic + 実績後 | 10-30% | Apple 審査リスク、1-star レビューリスク |
| **Soft → Hard A/B** | 成長フェーズ | テストで判断 | A/B 基盤が必要 |

**Daily Dhamma の推奨: Soft paywall（現状維持）+ Personalized 化で CVR 向上**

### Paywall レイアウト BP

| 要素 | Best Practice | 現状の問題点 |
|------|--------------|-------------|
| **ヘッドライン** | パーソナライズ結果を反映（「Your daily practice is ready」） | 汎用的（「Deepen Your Practice」） |
| **Social proof** | 「Join 10,000+ mindful practitioners」 | なし |
| **Feature list** | チェックマーク3点、Free vs Premium 比較表 | あり（だが比較なし） |
| **Plan cards** | 年額を「推奨」+「Save X%」バッジ | あり（バッジなし） |
| **Free trial** | 「Start 3-day free trial」を CTA に | なし（「Subscribe Now」のみ） |
| **CTA ボタン** | 大きく、コントラスト強く、具体的テキスト | 小さめ、テキストが弱い |
| **閉じるボタン（X）** | 5秒遅延表示 or 小さく・薄く | 即表示、目立つ |
| **Legal footer** | Terms + Privacy + 「Cancel anytime」 | あり |
| **Timer/Urgency** | 「Limited time offer: 50% off」（optional） | なし |

### Paywall テキスト BP

| 要素 | 悪い例 | 良い例（EN） | 良い例（JA） |
|------|--------|-------------|-------------|
| Headline | "Deepen Your Practice" | "Your Mindful Journey Starts Today" | "あなたのマインドフルな旅が、今日始まる" |
| Subtitle | "Unlock more verses" | "Join 10,000+ who start each day with ancient wisdom" | "1万人以上が毎朝、古代の智慧で1日を始めています" |
| CTA | "Subscribe Now" | "Start Free Trial" | "無料トライアルを始める" |
| Skip | "Continue with Free" | "Maybe later" | "あとで" |

### Plan Card BP

| 要素 | Monthly | Yearly（推奨） |
|------|---------|---------------|
| ラベル | "Monthly" | "Yearly" + **「BEST VALUE」バッジ** |
| 価格表示 | "$X.XX/month" | "$X.XX/year" + **「$X.XX/month — Save 58%」** |
| ボーダー | 通常 | **ゴールド＋太い＋グロー効果** |
| デフォルト選択 | ❌ | ✅ |

---

## 4. パーソナライゼーション質問設計

### Daily Dhamma に最適な質問

| # | 質問（EN） | 質問（JA） | 選択肢 | 目的 |
|---|-----------|-----------|--------|------|
| 1 | "What brings you to Daily Dhamma?" | "Daily Dhamma を使う目的は？" | 🧘 Inner peace / 📚 Wisdom / 🌅 Daily routine / 💭 Mindfulness | ユーザー意図の把握 |
| 2 | "When would you like your daily wisdom?" | "毎日の智慧をいつ受け取りたいですか？" | 🌅 Morning / ☀️ Midday / 🌙 Evening / ⏰ Custom | 通知タイミングのパーソナライズ |

---

## 5. コンバージョン最適化テクニック

| テクニック | 実装方法 | 効果 |
|-----------|---------|------|
| **Anchoring** | 年額プランを先に見せ、月額の「高さ」を認識させる | CVR +15-30% |
| **Loss aversion** | 「Free users miss 80% of verses」 | CVR +10-20% |
| **Social proof** | 「10,000+ practitioners」 | 信頼+CVR +5-15% |
| **Scarcity** | X ボタン遅延表示（3-5秒） | 離脱防止 |
| **Endowment effect** | onboarding で質問→「あなた専用プラン」 | 投資感→CVR +20-40% |
| **Free trial framing** | CTA を「Subscribe」→「Start Free Trial」 | CVR +30-50% |

---

## 6. Apple 審査注意点

| ルール | 詳細 |
|--------|------|
| Skip/Close 必須 | paywall は必ず閉じられること（hard paywall は審査リスク大） |
| 価格表示 | 実際の価格を明確に表示（RevenueCat から取得） |
| Free trial 明記 | trial 期間と自動更新を明記 |
| Privacy Policy リンク | paywall に表示必須 |
| Restore Purchases | ボタン必須 |
| demoAccountRequired | 明示的に `false` に設定 |

---

## 7. メトリクス（KPI）

| メトリクス | 目標値 | 計測方法 |
|-----------|--------|---------|
| Onboarding completion rate | > 70% | スライドごとの離脱率を Mixpanel で計測 |
| Paywall view rate | > 80% | onboarding 完了 → paywall 表示 |
| Paywall CVR (soft) | > 5% | 課金完了 / paywall 表示 |
| Free trial start rate | > 15% | trial 開始 / paywall 表示 |
| Trial → Paid conversion | > 60% | 有料転換 / trial 開始 |
| D1 retention | > 40% | 翌日起動率 |

---

## 8. 参考アプリ（Paywall パターン）

| アプリ | 月間収益 | パターン | 学べること |
|--------|---------|---------|-----------|
| Balance: Meditation & Sleep | $500K+ | 長い personalization → result → soft paywall | 瞑想アプリの王道 |
| RISE: Sleep Tracker | $500K+ | 質問 → loading animation → personalized paywall | building your plan パターン |
| Opal: Screen Time | $500K+ | 問題提起 → 解決策 → paywall | 課題 → 解決フレーム |
| Bend: Stretching | $500K+ | 体験 → ベネフィット → paywall | フィットネス系の定番 |
| Nibble: Knowledge | $500K+ | Quiz形式 → 結果 → paywall | エデュテイメント系 |

---

最終更新: 2026-03-10
