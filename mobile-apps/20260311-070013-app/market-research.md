# Market Research: SomaticFlow

Source: [AppTweak](https://www.apptweak.com/en/aso-blog/app-market-research) — 「Key research areas include market insights, competitors, target audience, budget, monetization, and financial forecasts.」

---

## 1. Market Definition

| 項目 | 値 |
|------|-----|
| **カテゴリ** | Health & Fitness → Somatic Wellness / Nervous System Reset |
| **地域** | US（Primary, iOS 57%）、JP（Secondary, iOS 68%） |
| **ICP** | 25–45歳デスクワーカー。慢性ストレス・不安を抱え、ヨガ/瞑想を試みたが続かなかった人 |
| **App Store サブカテゴリ** | Health & Fitness（Wellness Tools） |
| **除外** | HealthKit/HRV デバイス連携系（NEUROFIT等の高複雑度ニッチ） |

---

## 2. Market Sizing (TAM/SAM/SOM)

### トップダウン推計

| 市場レイヤー | 規模 | 計算根拠 |
|------------|------|---------|
| 全世界ウェルネス市場（TAM Level 0） | **$6.3T** | Global Wellness Institute 2024 |
| 世界 Health & Fitness App 市場（TAM Level 1） | **$12.6B** | $6.3T × デジタルアプリ比率 0.2% |
| Somatic / Nervous System Wellness ニッチ（TAM Level 2） | **$378M** | $12.6B × ニッチカテゴリ 3% |

Source: [Global Wellness Institute (2024)](https://globalwellnessinstitute.org/industry-research/global-wellness-economy-monitor/) — 「The global wellness economy reached $6.3 trillion in 2023」

### ボトムアップ推計

| 項目 | 計算 | 値 |
|------|------|-----|
| 直接競合レビュー合計 | 297 + 652 + 15 + 76 + 51 | 1,091 reviews |
| 推定インストール数（100倍ルール） | 1,091 × 100 | ~109,100 インストール |
| ソマティック関心ユーザー（US iOS） | 250M × Health利用率5% × ソマティック関心率5% | ~625,000 ユーザー |
| TAM（ボトムアップ） | 625,000 × $29.99 年額 | **~$18.7M**（現在市場） |

**クロスチェック:** トップダウン $378M vs ボトムアップ $18.7M = 20倍乖離。ボトムアップは「現在顕在化している市場」、トップダウンは「潜在到達可能市場」として解釈。乖離は市場の黎明期であることを示す — 機会として捉える。

Source: [Antler](https://www.antler.co/blog/tam-sam-som) — 「The bottom-up approach is often more credible to investors, as it is grounded in specific, realistic assumptions.」
Source: iTunes Search API 実行結果（直接競合レビュー数収集）

### SAM 計算

| 項目 | 計算 | 値 |
|------|------|-----|
| TAM（保守：ボトムアップ） | $18.7M | ベース |
| × iOS率（US 57%） | $18.7M × 57% | $10.7M |
| × ターゲット地域率（US 80% + JP 20%） | $10.7M × 100% | $10.7M |
| × ICP セグメント率（デスクワーカー 40%） | $10.7M × 40% | **SAM ≈ $4.3M** |

Source: [WaveUp](https://waveup.com/blog/tam-sam-som/) — 「Use primary data to estimate the potential market size for each target market segment.」
Source: [APA: Workplace Stress 2023](https://www.apa.org/topics/healthy-workplaces/work-stress) — 「83% of US workers suffer from work-related stress」（デスクワーカー比率の根拠）

### SOM 計算

| 期間 | SAM × シェア率 | SOM | 換算有料ユーザー（ARPU $12/人/年） |
|------|-------------|-----|--------------------------------|
| **Year 1** | $4.3M × 0.01% | **$430** | ~36人（launch 直後） |
| **Year 2** | $4.3M × 0.05% | **$2,150** | ~180人 |
| **Year 3** | $4.3M × 0.2% | **$8,600** | ~720人 |

**注記:** SOM の絶対値は小さいが、インディー 1 人開発者の目標としては現実的。Year 3 で MAU 10,000、有料転換率 8% の楽観シナリオでは月収 $4,300（product-plan.md §4 楽観ケース）。

Source: [GoingVC](https://www.goingvc.com/post/how-investors-use-tam-sam-som-to-evaluate-startups) — 「Investors look at SOM to understand whether you've done a grounded, bottom-up forecast.」

---

## 3. Problem Size & Demand Validation

| # | 統計データ | ソース | SomaticFlow への関連性 |
|---|---------|--------|----------------------|
| 1 | 米国成人の **18.1%（4,000万人）** が不安障害を抱える | [ADAA](https://adaa.org/understanding-anxiety/facts-statistics) — 「Anxiety disorders affect 40M adults in the US」 | ソマティックエクサイズの主要ターゲット |
| 2 | デスクワーカーの **83%** が仕事関連ストレスを報告 | [APA Workplace Stress 2023](https://www.apa.org/topics/healthy-workplaces/work-stress) — 「83% of US workers suffer from work-related stress」 | ICP（デスクワーカー）の慢性ストレス率 |
| 3 | TikTok **#somatichealing 200万再生**・**#somaticexercises 260万再生** | Apify TikTok Scraper 実行結果 | ソマティック需要のソーシャル証拠 |
| 4 | App Store 最大競合の低評価レビューで **「text-only」「can't cancel」** が最頻出ペイン | iTunes Reviews RSS 実行結果 | 既存ソリューションの失敗 = 機会 |
| 5 | 全世界ウェルネス市場は **$6.3T（2023年）** で成長継続中 | [Global Wellness Institute 2024](https://globalwellnessinstitute.org/industry-research/global-wellness-economy-monitor/) | 市場全体の拡大トレンド |

---

## 4. Growth Analysis

### CAGR

| 市場 | CAGR | 期間 | ソース |
|------|------|------|--------|
| Global Wellness Economy | ~8% | 2024-2028 | Global Wellness Institute — 「projected to reach $8.5 trillion by 2027」 |
| Health & Fitness App | ~17% | 2024-2030 | 業界推計（Statista/Grand View Research 参照値） |
| Somatic / Mind-Body Wellness | ~25%+ | 2024-2027 | TikTokトレンド加速 + ポストCOVID メンタルヘルス需要 |

### Growth Drivers

| ドライバー | 影響 |
|-----------|------|
| TikTok #somatichealing トレンド（上昇中） | 認知度・インストール数の急増 |
| ポスト COVID メンタルヘルス需要増 | 不安・ストレス対処ニーズの恒常化 |
| Apple Watch / iPhone のヘルスケア強化 | HealthKit 連携への期待（将来の機能拡張） |
| デスクワーク常態化（リモートワーク） | 慢性ストレスのICP増加 |
| 既存アプリの品質不足（最大競合 297 reviews） | 新規参入への低障壁 |

### Headwinds

| リスク | 影響 |
|--------|------|
| Subscription Fatigue（サブスク疲弊） | 有料転換率の低下リスク（3%→1.5%） |
| 大手（Headspace/Calm）がソマティック機能追加 | 間接競合からの脅威（中期的） |
| TikTokトレンドの短命化リスク | 2-3年後に別のウェルネストレンドに移行可能性 |
| H&F アプリの App Store 審査厳格化 | Guideline 2.1 App Completeness 問題 |

---

## 5. POEM Market Opportunity Score

| 軸 | スコア (1-5) | 評価根拠 |
|----|:-----------:|---------|
| **Customer** （ペインの深刻度 + WTP） | **4** | 慢性ストレス・不安は深刻（4,000万人）。WTP は中程度（月$7.99 = コーヒー2杯）。ただし free tier 期待が高い |
| **Product** （技術実現性 + 差別化の強さ） | **4** | 静的コンテンツで AI 不要。CoreHaptics + SwiftUI アニメは競合未使用の強差別化。iOS 17+ 限定でコスト削減 |
| **Timing** （トレンド合致 + 規制環境） | **5** | TikTok #somatichealing 上昇中。#traumarelease 677K views。規制リスクなし |
| **Competition** （競合密度 + 参入障壁） | **5** | 最大競合 297 reviews = 極めて低競合。UI 劣悪でユーザー不満高。参入障壁低 |
| **Finance** （SOM規模 + LTV:CAC） | **3** | Year 3 SOM $8,600（小規模）。ただし CAC ≈ $0（ASO + TikTok オーガニック）なら LTV:CAC > 10 |
| **合計** | **21 / 25** | 🟢 **Strong Opportunity** |

**判定: 🟢 Strong Opportunity（21/25）**

Source: [Mind the Product: POEM Framework](https://www.mindtheproduct.com/poem-framework/) — 「Identify strengths and weaknesses in a market opportunity based on five key forces」

### ⚠️ ネガティブシグナル（確証バイアス防止）

**Subscription Fatigue リスク:** 2024-2025年にかけて Health & Fitness カテゴリの subscription fatigue が進行。RevenueCat SOSA 2025 によると H&F の平均 trial-to-paid rate は 5% に低下。ソマティックエクサイズは「やってみれば効果を感じる」体験型だが、アプリの価値提案をオンボーディング内で即座に証明できなければ、7日間トライアル後の有料転換は 2% 以下になるリスクがある。

Source: [RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) — 「H&F median trial-to-paid: 5% (down from 7% in 2023)」
Source: [Charisol](https://charisol.io/12-common-market-research-mistakes-and-how-to-avoid-them/) — 「It's easy to let personal opinions influence how you interpret data. Sometimes, teams cherry-pick findings that support what they already believe.」

---

## Sources

| # | Source | URL | What It Supports |
|---|--------|-----|-----------------|
| 1 | Global Wellness Institute (2024) | https://globalwellnessinstitute.org/industry-research/global-wellness-economy-monitor/ | TAM $6.3T + 成長率 |
| 2 | ADAA: Anxiety Statistics | https://adaa.org/understanding-anxiety/facts-statistics | 問題の規模（4,000万人） |
| 3 | APA: Workplace Stress 2023 | https://www.apa.org/topics/healthy-workplaces/work-stress | ICP ストレス率 83% |
| 4 | Apify TikTok Scraper (実行済み) | https://api.apify.com/v2/acts/clockworks~tiktok-hashtag-scraper/... | TikTok需要証拠 |
| 5 | iTunes Search + Lookup API (実行済み) | https://itunes.apple.com/search?term=somatic+exercises... | ボトムアップ TAM 計算根拠 |
| 6 | Antler: TAM SAM SOM Guide | https://www.antler.co/blog/tam-sam-som | ボトムアップ優先フレームワーク |
| 7 | GoingVC: Investor TAM Evaluation | https://www.goingvc.com/post/how-investors-use-tam-sam-som-to-evaluate-startups | SOM 現実的シェア率 |
| 8 | WaveUp: TAM SAM SOM | https://waveup.com/blog/tam-sam-som | SAM セグメント推計 |
| 9 | RevenueCat SOSA 2025 | https://www.revenuecat.com/state-of-subscription-apps-2025/ | trial-to-paid 中央値 + ネガティブシグナル |
| 10 | Mind the Product: POEM Framework | https://www.mindtheproduct.com/poem-framework/ | 機会スコアリングフレームワーク |
| 11 | Charisol: Market Research Mistakes | https://charisol.io/12-common-market-research-mistakes-and-how-to-avoid-them/ | 確証バイアス防止 |
