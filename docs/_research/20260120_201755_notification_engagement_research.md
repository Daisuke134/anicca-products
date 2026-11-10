# 通知エンゲージメント追跡とパーソナライゼーション - 技術調査レポート

**調査日時**: 2026年1月20日 20:17:55
**調査者**: tech-spec-researcher agent
**対象**: プッシュ通知のエンゲージメント追跡、適応的通知システム、フィードバックループ

---

## エグゼクティブサマリー

本調査では、Duolingo、Headspace、Calm等の行動変容アプリが採用する通知パーソナライゼーション技術を分析。小規模ユーザーベース（初期段階）ではルールベース、中規模以降でMulti-Armed Bandit（MAB）、大規模ではDeep RLを推奨。

**重要な発見**:
- 行動ベース通知は一般通知より**800%高い開封率**を達成
- Duolingoは34日間で2億件の通知を送信してアルゴリズムを訓練
- Headspaceは通知最適化で**セッション完了率32%向上**
- iOS平均開封率3.4%、Android平均10.7%（トランザクショナル通知は69%）

---

## 1. 通知エンゲージメント追跡

### 1.1 追跡すべき主要メトリクス

| メトリクス | 定義 | 業界平均 | 出典 |
|----------|------|---------|------|
| **配信率 (Delivery Rate)** | 正常配信された通知の割合 | 95%+ | [MoEngage](https://www.moengage.com/blog/push-notification-metrics/) |
| **開封率 (Open Rate)** | タップされた通知の割合 | iOS: 3.4%<br>Android: 10.7% | [Business of Apps](https://www.businessofapps.com/marketplace/push-notifications/research/push-notifications-statistics/) |
| **クリックスルー率 (CTR)** | 開封後にアクション完了した割合 | 4.6% (Android)<br>3.4% (iOS) | [CleverTap](https://clevertap.com/blog/push-notification-metrics-ctr-open-rate/) |
| **コンバージョン率** | 目標アクション（セッション完了等）達成率 | アプリ依存 | [EngageLab](https://www.engagelab.com/blog/tracking-push-notifications) |
| **却下率 (Dismissal Rate)** | スワイプ削除された通知の割合 | - | - |
| **アプリ滞在時間** | 通知起因の平均セッション時間 | - | [Headspace研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC8981020/) |

**行動変容アプリ特有の発見**:
- **行動ベース通知**: 8%開封率
- **一般通知**: 0.9%開封率
- **パーソナライゼーションで800%改善** ([Marketing Dive](https://www.marketingdive.com/ex/mobilemarketer/cms/news/research/22881.html))

### 1.2 iOS特有の制限と対策

#### APNsの制限
Apple Push Notification Services (APNs)は高度な分析機能を持たず、配信に関する基本情報のみ提供。詳細なインサイトには**サードパーティプラットフォーム統合が必須**。

**出典**: [iOS Notifications Guide 2026](https://medium.com/@thakurneeshu280/the-complete-guide-to-ios-notifications-from-basics-to-advanced-2026-edition-48cdcba8c18c)

#### プライバシー考慮事項
- 2023年、米国上院議員Ron Wydenが通知データへの政府アクセス懸念を指摘
- Apple Developer Consoleで配信メトリクスが提供されるが、個人特定情報は制限
- UNNotificationResponseで取得可能な情報: `actionIdentifier`, `notification.request.identifier`, `notification.request.content.userInfo`

**出典**: [Apple Developer - Viewing Push Notification Metrics](https://developer.apple.com/documentation/usernotifications/viewing-the-status-of-push-notifications-using-metrics-and-apns)

#### 実装ベストプラクティス
```swift
// AppDelegate.swift
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
) {
    let identifier = response.actionIdentifier
    let notificationId = response.notification.request.identifier
    let userInfo = response.notification.request.content.userInfo

    // 追跡すべきイベント
    switch identifier {
    case UNNotificationDefaultActionIdentifier:
        analytics.track("notification_opened", properties: [
            "notification_id": notificationId,
            "notification_type": userInfo["type"] as? String ?? "unknown",
            "problem_type": userInfo["problem_type"] as? String,
            "timestamp": Date().iso8601String
        ])
    case UNNotificationDismissActionIdentifier:
        analytics.track("notification_dismissed", properties: [
            "notification_id": notificationId,
            "notification_type": userInfo["type"] as? String ?? "unknown"
        ])
    default:
        analytics.track("notification_action", properties: [
            "notification_id": notificationId,
            "action": identifier
        ])
    }

    completionHandler()
}
```

### 1.3 推奨イベント命名規則

| イベント名 | トリガータイミング | 必須プロパティ |
|----------|------------------|---------------|
| `notification_scheduled` | 通知スケジュール時 | `notification_id`, `notification_type`, `problem_type`, `scheduled_time` |
| `notification_delivered` | APNs配信成功時（サーバー側） | `notification_id`, `user_id`, `device_token` |
| `notification_opened` | ユーザーがタップ | `notification_id`, `notification_type`, `problem_type`, `time_to_open` |
| `notification_dismissed` | スワイプ削除 | `notification_id`, `notification_type` |
| `notification_action_taken` | カスタムアクションボタン押下 | `notification_id`, `action_id`, `action_result` |
| `notification_feedback_positive` | 👍ボタン（アプリ内） | `notification_id`, `feedback_type` |
| `notification_feedback_negative` | 👎ボタン（アプリ内） | `notification_id`, `feedback_type`, `feedback_reason` |

**出典**: [MessageGears - Push Notification Analytics](https://messagegears.com/resources/blog/push-notification-analytics/)

---

## 2. 適応的通知システムの設計

### 2.1 Duolingoのアプローチ

#### 2.1.1 Banditアルゴリズムの詳細

**問題定義**:
- **Challenge 1**: メッセージの新鮮さ（Novelty） - 同じメッセージの繰り返しは効果が減衰
- **Challenge 2**: 条件付き適格性（Conditional Eligibility） - 一部の通知は特定条件でのみ送信可能

**アルゴリズム特性**:
- **Exploration（探索）**: 新しい通知は初期段階で優先的に試行
- **Exploitation（活用）**: 高パフォーマンス通知を選択
- **Novelty Penalty**: 最近送信された通知はランクダウン

**訓練データ規模**:
- **34日間で2億件の通知送信**
- 言語、使用頻度、インタラクション率を学習

**出典**:
- [Duolingo Blog - AI Behind the Meme](https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/)
- [Likeminds - Bandit Algorithm](https://www.likeminds.community/blog/bandit-algorithm-of-duolingos-notifications)

#### 2.1.2 パーソナライゼーション要素

| 要素 | 説明 | 例 |
|-----|------|-----|
| **言語** | 学習中の言語に応じたメッセージ | 「Spanish練習しよう」 vs 「Japanese練習しよう」 |
| **使用頻度** | アクティブユーザーvs休眠ユーザー | 「今日も続けよう」 vs 「久しぶり！」 |
| **Streak状態** | 連続日数の維持 | 「7日連続達成中！」 |
| **時間帯** | ユーザーの過去の活動時間 | 午前派 vs 夜型 |

### 2.2 Headspaceのアプローチ

#### 2.2.1 タイミング最適化

**研究結果** ([PMC研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC8981020/)):
- プロンプトありの日: 平均566秒
- プロンプトなしの日: 平均225秒
- **2.5倍のエンゲージメント向上**

**コンテキスト最適化の重要性**:
「Sleepコンテンツを推奨する場合、たとえユーザーが通常午前9時にアプリを開くとしても、**夕方に送信する方が効果的**」

**出典**: [Headspace Engineering - ML Push Notifications](https://medium.com/headspace-engineering/explainable-and-accessible-ai-using-push-notifications-to-broaden-the-reach-of-ml-at-headspace-a03c7c2bbf06)

#### 2.2.2 成果

- **セッション完了率**: 32%向上
- **デイリーアクティブユーザー**: 15%増加

**出典**: [NGrow - Headspace Case Study](https://www.ngrow.ai/blog/how-headspace-increased-engagement-by-32-with-strategic-push-notifications)

### 2.3 Multi-Armed Bandit vs A/Bテスト

#### 比較表

| 観点 | Multi-Armed Bandit | A/Bテスト |
|-----|-------------------|----------|
| **最適化速度** | リアルタイム適応 | 固定期間後 |
| **トラフィック配分** | 動的（パフォーマンスに応じて） | 固定（例: 50/50） |
| **最適シナリオ** | パーソナライゼーション、多変数 | シンプルな比較 |
| **無駄な露出** | 最小化（低パフォーマンスは早期除外） | テスト期間中は継続 |
| **規制対応** | 複雑 | 容易 |

**出典**:
- [Shaped Blog - Multi-Armed Bandits](https://www.shaped.ai/blog/multi-armed-bandits)
- [Braze - Multi-Armed Bandit](https://www.braze.com/resources/articles/multi-armed-bandit)

#### アルゴリズム選択

##### 1. Epsilon-Greedy
```
- Exploitation: 90%の確率でベスト選択肢を使用
- Exploration: 10%の確率でランダム選択
- 長所: シンプル、実装容易
- 短所: 探索率が固定
```

##### 2. Upper Confidence Bound (UCB)
```
- 平均パフォーマンス + 不確実性を考慮
- 自動的に探索/活用バランス調整
- 長所: 適応的探索
- 短所: パラメータチューニングが必要
```

##### 3. Thompson Sampling（推奨）
```
- 確率的モデリングでベスト選択肢を推定
- 実践で優れたパフォーマンス
- 長所: 信頼度に基づく動的探索
- 短所: 実装がやや複雑
```

**実装例（Braze）**:
Brazeの「Intelligent Selection」機能は**12時間ごとにA/Bテスト結果を分析**し、ユーザー割り当てを自動調整。低パフォーマンスバリアントを早期に除外。

**成功事例**: Pizza Hutは、MABで**取引30%増、収益21%増、利益10%増**を達成。

**出典**: [Braze Multi-Armed Bandit](https://www.braze.com/resources/articles/multi-armed-bandit)

---

## 3. フィードバックループと自己改善

### 3.1 アーキテクチャパターン

#### 3.1.1 ルールベースシステム（推奨: 初期フェーズ）

**適用条件**:
- ユーザー数 < 1,000
- 十分な履歴データなし
- Cold Start問題

**実装例**:
```swift
struct NotificationRuleEngine {
    func selectNotification(for user: User, problemType: ProblemType) -> NotificationTemplate {
        // Rule 1: 時間帯ベース
        let hour = Calendar.current.component(.hour, from: Date())

        // Rule 2: 最終開封からの経過時間
        let daysSinceLastOpen = user.daysSinceLastNotificationOpen(for: problemType)

        // Rule 3: 過去の開封率
        let historicalOpenRate = user.openRate(for: problemType)

        // Decision Tree
        if daysSinceLastOpen > 7 {
            return .reengagement
        } else if historicalOpenRate > 0.5 {
            return .highEngagement
        } else if hour >= 6 && hour < 9 {
            return .morningMotivation
        } else {
            return .defaultNudge
        }
    }
}
```

**根拠**:
- **機械学習は大量データが必要**: 教師あり学習には十分な失敗例を含むデータセットが必要
- **小規模データセットではルールベースが優位**: MLは膨大なデータセットを要求、ルールベースAIは不要

**出典**:
- [TechTarget - Rule-Based vs ML](https://www.techtarget.com/searchenterpriseai/feature/How-to-choose-between-a-rules-based-vs-machine-learning-system)
- [GeeksforGeeks - Rule-Based vs ML](https://www.geeksforgeeks.org/machine-learning/rule-based-system-vs-machine-learning-system/)
- [arXiv - Industrial Monitoring Study](https://arxiv.org/html/2509.15848v1)

#### 3.1.2 ハイブリッドシステム（推奨: 成長フェーズ）

**適用条件**:
- ユーザー数 1,000 - 100,000
- 数ヶ月分の履歴データあり
- リアルタイム適応が必要

**アーキテクチャ**:
```
┌─────────────────────────────────────────┐
│  Rule Engine (Fallback & Constraints)  │
│  - 時間帯フィルター                      │
│  - 頻度制限                             │
│  - 適格性チェック                        │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Bandit Algorithm (Content Selection)   │
│  - Thompson Sampling                    │
│  - Contextual Features                  │
│  - Reward: Open Rate, Session Duration  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Feedback Collection                    │
│  - notification_opened                  │
│  - notification_dismissed               │
│  - thumbs_up / thumbs_down              │
└─────────────────────────────────────────┘
```

**推奨プラットフォーム**:
- **Braze**: Intelligent Selection (12時間ごとに最適化)
- **CleverTap**: Smart Delivery
- **OneSignal**: Intelligent Delivery

**出典**: [Unit21 - Hybrid Approach](https://www.unit21.ai/blog/rules-vs-machine-learning-finding-the-best-of-both-worlds)

#### 3.1.3 Deep RL システム（推奨: 大規模フェーズ）

**適用条件**:
- ユーザー数 > 100,000
- 複雑な状態空間（多次元特徴量）
- リソース（データサイエンティスト、計算資源）あり

**実装詳細（Words with Friends事例）**:

| 要素 | 内容 |
|-----|------|
| **State** | 14日間の通知インタラクション履歴（時系列データ） |
| **Action** | 24時間のうちどの時間帯に送信するか |
| **Reward** | バイナリエンゲージメントシグナル（開封/未開封） |
| **アルゴリズム** | DQN (Deep Q-Network) |
| **フレームワーク** | TF-Agents |

**データパイプライン** (2日ラグ):
```
Day T-2: Historical State + Action
Day T-1: Resulting State + Reward
→ (State, Action, Next State, Reward) tuple
→ Neural Network Training
```

**ハイパーパラメータ**:
- Neural network architecture (hidden layers, nodes)
- Learning rate
- Optimizer (ADAM / SGD)
- Epsilon-greedy exploration rate (減衰)

**検証方法**:
既存の3タイムゾーンセグメンテーションをRLエージェントで再現し、**オフライン検証**を実施。ライブユーザー実験なしで有効性を確認。

**成果**:
- **CTR 10%相対改善**
- 数百万人の日次プレイヤーにデプロイ

**出典**: [Towards Data Science - Deep RL Notifications](https://towardsdatascience.com/deep-reinforcement-learning-in-production-part-2-personalizing-user-notifications-812a68ce2355/)

### 3.2 小規模ユーザーベースへの対応

#### Cold Start戦略

**1. コホートベース学習**:
個人レベルではなく**ユーザーグループ単位**で最適化。集約データで学習を加速。

**実装例**:
```swift
enum UserCohort {
    case newUser              // 登録後7日以内
    case activeUser           // 週3回以上利用
    case atRiskUser          // 7-14日未使用
    case dormantUser         // 14日以上未使用

    func defaultNotificationStrategy() -> NotificationStrategy {
        switch self {
        case .newUser:
            return .onboardingFocus
        case .activeUser:
            return .streakMaintenance
        case .atRiskUser:
            return .reengagementGentle
        case .dormantUser:
            return .reengagementStrong
        }
    }
}
```

**2. Meta学習（Sparse Engagement対応）**:
Metaの2026年研究では、エンゲージメント履歴の少ないユーザーへの対応が**重要な課題**として認識。大規模言語モデル（LLM）の活用を検討中。

**出典**: [Meta Engineering - Reels RecSys](https://engineering.fb.com/2026/01/14/ml-applications/adapting-the-facebook-reels-recsys-ai-model-based-on-user-feedback/)

**3. Transfer Learning**:
類似アプリ（例: 他の行動変容アプリ）のデータを活用し、初期モデルを構築。

#### Feedback収集戦略

**明示的フィードバック**:
```swift
struct NudgeCardView: View {
    @State private var feedbackSubmitted = false

    var body: some View {
        VStack {
            // Nudge Content

            HStack {
                Button(action: {
                    submitFeedback(.positive)
                }) {
                    Image(systemName: "hand.thumbsup")
                }

                Button(action: {
                    submitFeedback(.negative)
                }) {
                    Image(systemName: "hand.thumbsdown")
                }
            }
        }
    }

    func submitFeedback(_ type: FeedbackType) {
        analytics.track("notification_feedback", properties: [
            "notification_id": nudge.id,
            "feedback_type": type.rawValue,
            "problem_type": nudge.problemType.rawValue,
            "timestamp": Date().iso8601String
        ])
        feedbackSubmitted = true
    }
}
```

**暗黙的フィードバック**:
- セッション時間（通知経由 vs 自発的起動）
- アクション完了率
- 次回通知までの時間

**フィードバックループの頻度**:
| フェーズ | データ量 | 更新頻度 | 手法 |
|---------|---------|---------|------|
| 初期（< 1,000ユーザー） | 少ない | 週次 | ルールベース調整 |
| 成長（1,000-100,000） | 中程度 | 日次 | Bandit更新 |
| 成熟（> 100,000） | 豊富 | リアルタイム | Deep RL継続学習 |

---

## 4. 実装パターンとベストプラクティス

### 4.1 データストレージ設計

#### 4.1.1 イベントスキーマ（Mixpanel/Amplitude）

**notification_scheduled**:
```json
{
  "event": "notification_scheduled",
  "properties": {
    "notification_id": "nudge_cant_wake_up_1234567890",
    "notification_type": "problem_nudge",
    "problem_type": "cant_wake_up",
    "scheduled_time": "2026-01-21T06:00:00Z",
    "template_id": "morning_struggle_template_v2",
    "user_cohort": "active_user",
    "day_of_week": "monday",
    "is_personalized": true
  },
  "timestamp": "2026-01-20T20:00:00Z",
  "user_id": "user_abc123"
}
```

**notification_opened**:
```json
{
  "event": "notification_opened",
  "properties": {
    "notification_id": "nudge_cant_wake_up_1234567890",
    "notification_type": "problem_nudge",
    "problem_type": "cant_wake_up",
    "template_id": "morning_struggle_template_v2",
    "time_to_open_seconds": 120,
    "open_method": "direct_tap",
    "device_state": "locked_screen",
    "hour_of_day": 6,
    "day_of_week": "monday"
  },
  "timestamp": "2026-01-21T06:02:00Z",
  "user_id": "user_abc123"
}
```

**notification_feedback**:
```json
{
  "event": "notification_feedback",
  "properties": {
    "notification_id": "nudge_cant_wake_up_1234567890",
    "feedback_type": "positive",
    "feedback_reason": null,
    "session_duration_seconds": 180,
    "action_completed": "started_deepdive"
  },
  "timestamp": "2026-01-21T06:05:00Z",
  "user_id": "user_abc123"
}
```

#### 4.1.2 ローカルストレージ（Core Data / Realm）

**NotificationLog Entity**:
```swift
@objc(NotificationLog)
public class NotificationLog: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var notificationType: String
    @NSManaged public var problemType: String?
    @NSManaged public var scheduledTime: Date
    @NSManaged public var deliveredTime: Date?
    @NSManaged public var openedTime: Date?
    @NSManaged public var dismissedTime: Date?
    @NSManaged public var feedbackType: String?
    @NSManaged public var templateId: String
    @NSManaged public var templateVersion: String
}
```

### 4.2 通知頻度最適化

#### 4.2.1 業界標準

**推奨頻度**（行動変容アプリ）:
- **新規ユーザー（0-7日）**: 1-2回/日（オンボーディング重視）
- **アクティブユーザー**: 1回/日
- **At-Riskユーザー**: 1回/2-3日（過度な通知は逆効果）
- **休眠ユーザー**: 1回/週

**根拠**:
- 研究によると、90日以内に**1回でも通知受信したユーザーは3倍リテンション向上**
- 過度な通知は却下率上昇とopt-out増加につながる

**出典**: [Business of Apps - Push Statistics](https://www.businessofapps.com/marketplace/push-notifications/research/push-notifications-statistics/)

#### 4.2.2 Quiet Hours（配信時間制限）

```swift
struct NotificationTimingManager {
    let quietHoursStart = 22  // 22:00
    let quietHoursEnd = 7     // 07:00

    func isWithinAllowedTime(_ date: Date = Date()) -> Bool {
        let hour = Calendar.current.component(.hour, from: date)
        if quietHoursStart < quietHoursEnd {
            return hour >= quietHoursStart || hour < quietHoursEnd
        } else {
            return hour >= quietHoursStart && hour < quietHoursEnd
        }
    }

    func nextAllowedTime(after date: Date = Date()) -> Date {
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: date)

        if hour >= quietHoursStart || hour < quietHoursEnd {
            // Quiet hours中 → 次の朝まで延期
            var components = calendar.dateComponents([.year, .month, .day], from: date)
            components.hour = quietHoursEnd
            components.minute = 0

            if hour >= quietHoursStart {
                // 翌日の朝
                components.day! += 1
            }

            return calendar.date(from: components)!
        } else {
            return date
        }
    }
}
```

### 4.3 パーソナライゼーション実装例

#### 4.3.1 コンテキスト特徴量

```swift
struct NotificationContext {
    // Temporal Features
    let hourOfDay: Int
    let dayOfWeek: String
    let isWeekend: Bool
    let isHoliday: Bool

    // User State Features
    let daysSinceLastSession: Int
    let currentStreak: Int
    let totalSessions: Int
    let averageSessionDuration: TimeInterval

    // Problem-Specific Features
    let problemType: ProblemType
    let problemSeverity: Int  // 1-5
    let problemDuration: Int  // days since selected

    // Engagement History
    let historicalOpenRate: Double
    let historicalFeedbackScore: Double  // -1 to 1
    let preferredNotificationTime: Int?

    // Device State
    let lastSeenLocation: String?  // "home", "work", "other"
    let isHealthKitConnected: Bool
}
```

#### 4.3.2 テンプレート選択ロジック

```swift
class NotificationTemplateSelector {
    let templates: [ProblemType: [NotificationTemplate]]
    let userPreferences: UserPreferences

    func selectTemplate(
        for problemType: ProblemType,
        context: NotificationContext,
        excludeRecentTemplates: [String] = []
    ) -> NotificationTemplate {
        let eligibleTemplates = templates[problemType]?
            .filter { !excludeRecentTemplates.contains($0.id) }
            .filter { $0.isEligible(for: context) }
            ?? []

        guard !eligibleTemplates.isEmpty else {
            return fallbackTemplate(for: problemType)
        }

        // Thompson Sampling（簡易実装）
        let sampledScores = eligibleTemplates.map { template -> (NotificationTemplate, Double) in
            let stats = getTemplateStats(template.id)
            let alpha = stats.successes + 1
            let beta = stats.failures + 1
            let sample = BetaDistribution.sample(alpha: alpha, beta: beta)
            return (template, sample)
        }

        return sampledScores.max(by: { $0.1 < $1.1 })!.0
    }

    func getTemplateStats(_ templateId: String) -> (successes: Double, failures: Double) {
        // Retrieve from local cache or analytics
        let logs = NotificationLog.fetch(templateId: templateId, limit: 100)
        let opened = logs.filter { $0.openedTime != nil }.count
        let total = logs.count
        return (Double(opened), Double(total - opened))
    }
}
```

### 4.4 A/Bテストとバリアント管理

#### 4.4.1 バリアント構造

```swift
struct NotificationVariant: Codable {
    let id: String
    let templateId: String
    let title: String
    let body: String
    let emoji: String?
    let actionButtons: [ActionButton]

    // Experiment metadata
    let experimentId: String
    let variantName: String  // "control", "variant_a", "variant_b"
    let allocatedPercentage: Double  // 0.0 - 1.0

    struct ActionButton: Codable {
        let id: String
        let title: String
        let action: String  // "open_app", "deeplink", "dismiss"
    }
}
```

#### 4.4.2 統計的有意性チェック

```swift
class ExperimentAnalyzer {
    func analyzeExperiment(_ experimentId: String) -> ExperimentResults {
        let variants = getVariants(experimentId)

        let results = variants.map { variant -> VariantResult in
            let logs = NotificationLog.fetch(variantId: variant.id)
            let impressions = logs.count
            let opens = logs.filter { $0.openedTime != nil }.count
            let openRate = Double(opens) / Double(impressions)
            let standardError = sqrt(openRate * (1 - openRate) / Double(impressions))

            return VariantResult(
                variantId: variant.id,
                impressions: impressions,
                opens: opens,
                openRate: openRate,
                standardError: standardError
            )
        }

        // Chi-squared test for significance
        let pValue = chiSquaredTest(results)
        let isSignificant = pValue < 0.05

        return ExperimentResults(
            experimentId: experimentId,
            variants: results,
            pValue: pValue,
            isSignificant: isSignificant,
            recommendedWinner: results.max(by: { $0.openRate < $1.openRate })
        )
    }
}
```

**推奨サンプルサイズ**:
- Minimum: 100 impressions per variant
- Recommended: 1,000+ impressions per variant for 80% statistical power

---

## 5. プラットフォームとツール

### 5.1 プッシュ通知プラットフォーム比較（2026年）

| プラットフォーム | Multi-Armed Bandit | Intelligent Timing | 価格（月額） | iOS/Android |
|--------------|-------------------|-------------------|-------------|-------------|
| **Braze** | ✅ Intelligent Selection | ✅ Intelligent Delivery | $$$$ | ✅/✅ |
| **CleverTap** | ✅ Smart Campaigns | ✅ Smart Delivery | $$$ | ✅/✅ |
| **OneSignal** | ❌ | ✅ Intelligent Delivery | $-$$ | ✅/✅ |
| **Airship** | ✅ AI Optimization | ✅ Send Time Optimization | $$$$ | ✅/✅ |
| **Firebase (FCM)** | ❌ | ❌ | $ (基本無料) | ✅/✅ |
| **APNs (Native)** | ❌ | ❌ | 無料 | ✅/❌ |

**推奨**:
- **初期フェーズ（<10k users）**: Firebase + カスタムルールエンジン
- **成長フェーズ（10k-100k）**: OneSignal or CleverTap
- **成熟フェーズ（>100k）**: Braze or Airship（MAB機能活用）

### 5.2 分析プラットフォーム

| プラットフォーム | リアルタイム分析 | コホート分析 | Funnel | 価格 |
|-------------|---------------|------------|--------|------|
| **Mixpanel** | ✅ | ✅ | ✅ | $$-$$$ |
| **Amplitude** | ✅ | ✅ | ✅ | $$-$$$ |
| **Firebase Analytics** | ✅ | ✅ | ⚠️ 限定的 | 無料 |
| **PostHog** | ✅ | ✅ | ✅ | $-$$ |

**Aniccaプロジェクト現状**: Mixpanel使用中（適切な選択）

### 5.3 実装チェックリスト

#### Phase 1: 基本追跡（Week 1-2）
- [ ] `notification_scheduled` イベント実装
- [x] `notification_opened` イベント実装（AppDelegate）— 実装済み（2026-11-10 確認）: 正本は Daisuke134/life-manager の `apps/mobile/anicca-ios`（AppDelegate.didReceive で送信、AnalyticsManager の `notificationOpened`）。PR #9318 で Anicca iOS 1.9.9（build 821）に同梱され出荷済み。プロパティは現行のリモート配信に合わせ `quote_id` と `notification_id`（値 = サーバ payload の messageId = nudge_deliveries.id）で、サーバ送信行と join 可能。本リポジトリ（anicca-products）の aniccaios は旧エクスポートのため未実装に見えるが、出荷物には存在する。詳細: 診断ファイル notification-open-tracking-diagnosis-2026-11-10.md の訂正節
- [ ] `notification_dismissed` イベント実装
- [ ] 基本プロパティ（notification_id, problem_type, template_id）付与
- [ ] Mixpanelでダッシュボード作成

#### Phase 2: フィードバック収集（Week 3-4）
- [ ] NudgeCardViewに👍👎ボタン追加
- [ ] `notification_feedback` イベント実装
- [ ] セッション時間追跡（通知経由 vs 自然起動）
- [ ] Core Dataにローカルログ保存

#### Phase 3: ルールベース最適化（Week 5-8）
- [ ] ユーザーコホート定義（新規/アクティブ/リスク/休眠）
- [ ] 時間帯別ルール実装（朝/夜/週末）
- [ ] 頻度制限ロジック（1日1回上限）
- [ ] Quiet Hours実装（22:00-07:00）
- [ ] テンプレートバリエーション追加（各Problem Typeに3-5種類）

#### Phase 4: A/Bテスト（Week 9-12）
- [ ] バリアント管理システム構築
- [ ] 50/50 トラフィック分割
- [ ] 統計的有意性チェック実装
- [ ] 勝者決定とロールアウトプロセス

#### Phase 5: Banditアルゴリズム（Month 4-6）
- [ ] Thompson Sampling実装
- [ ] Novelty Penalty実装（同一テンプレート7日間制限）
- [ ] Contextual Features統合
- [ ] 日次バッチ更新プロセス
- [ ] パフォーマンスモニタリングダッシュボード

---

## 6. セキュリティとプライバシー

### 6.1 プライバシー保護のベストプラクティス

#### 6.1.1 データ最小化
- **サーバーに送信すべきでないデータ**:
  - 通知本文の詳細（problem_typeは可、具体的内容は不可）
  - ユーザーの位置情報（都市レベルまで）
  - デバイスの詳細情報（OSバージョンまで、デバイスIDは不可）

#### 6.1.2 ローカルファースト設計
```swift
class PrivacyPreservingAnalytics {
    func trackNotificationEvent(
        _ eventName: String,
        notificationId: String,
        problemType: ProblemType,
        additionalProperties: [String: Any] = [:]
    ) {
        // ローカルログに詳細情報保存
        LocalNotificationLog.save(
            eventName: eventName,
            notificationId: notificationId,
            problemType: problemType,
            fullContext: additionalProperties,
            timestamp: Date()
        )

        // サーバーには最小限の情報のみ送信
        let sanitizedProperties: [String: Any] = [
            "notification_type": "problem_nudge",
            "problem_type": problemType.rawValue,
            "template_category": additionalProperties["template_category"] as? String ?? "default",
            "hour_of_day": Calendar.current.component(.hour, from: Date()),
            "day_of_week": Calendar.current.component(.weekday, from: Date())
        ]

        AnalyticsManager.shared.track(eventName, properties: sanitizedProperties)
    }
}
```

#### 6.1.3 GDPR/CCPA対応
- **データ保持期間**: 90日間（通知ログ）
- **ユーザー削除リクエスト**: サーバー側で完全削除
- **Opt-out メカニズム**: 通知設定でProblem Type別に無効化可能

### 6.2 通知内容のセキュリティ

**機密情報を含めない**:
```swift
// ❌ NG Example
let notification = UNMutableNotificationContent()
notification.body = "Your therapy session about depression is at 3pm"

// ✅ Good Example
notification.body = "Time for your scheduled check-in"
notification.userInfo = [
    "type": "problem_nudge",
    "problem_type": "anxiety",  // ローカルで使用、画面外には表示しない
    "action": "open_nudge_card"
]
```

---

## 7. パフォーマンス最適化

### 7.1 通知配信の最適化

#### 7.1.1 バッチ処理
```swift
class NotificationScheduleOptimizer {
    func scheduleOptimizedNotifications(for date: Date) {
        // 1日分の通知を一括スケジュール（個別配信より効率的）
        let users = AppState.shared.eligibleUsers(for: date)

        let notificationRequests = users.compactMap { user -> UNNotificationRequest? in
            guard let optimalTime = calculateOptimalTime(for: user, on: date) else {
                return nil
            }

            let content = generateContent(for: user)
            let trigger = UNCalendarNotificationTrigger(
                dateMatching: Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: optimalTime),
                repeats: false
            )

            return UNNotificationRequest(
                identifier: "nudge_\(user.id)_\(date.timeIntervalSince1970)",
                content: content,
                trigger: trigger
            )
        }

        // iOS 15+: Batch scheduling for performance
        if #available(iOS 15.0, *) {
            UNUserNotificationCenter.current().addNotificationRequests(notificationRequests) { error in
                if let error = error {
                    Logger.error("Batch notification scheduling failed: \(error)")
                }
            }
        }
    }
}
```

#### 7.1.2 キャッシング戦略
```swift
class NotificationTemplateCache {
    private var cache: [String: NotificationTemplate] = [:]
    private let cacheExpirationInterval: TimeInterval = 3600  // 1 hour
    private var lastUpdated: Date?

    func getTemplate(id: String) -> NotificationTemplate? {
        if shouldRefreshCache() {
            refreshCache()
        }
        return cache[id]
    }

    private func shouldRefreshCache() -> Bool {
        guard let lastUpdated = lastUpdated else { return true }
        return Date().timeIntervalSince(lastUpdated) > cacheExpirationInterval
    }

    private func refreshCache() {
        // Fetch from server or local database
        cache = NotificationTemplateManager.shared.fetchAllTemplates()
            .reduce(into: [:]) { result, template in
                result[template.id] = template
            }
        lastUpdated = Date()
    }
}
```

### 7.2 分析イベント送信の最適化

#### 7.2.1 バッチ送信
```swift
class AnalyticsEventQueue {
    private var eventQueue: [AnalyticsEvent] = []
    private let batchSize = 50
    private let flushInterval: TimeInterval = 300  // 5 minutes
    private var lastFlush: Date = Date()

    func enqueue(_ event: AnalyticsEvent) {
        eventQueue.append(event)

        if eventQueue.count >= batchSize || shouldFlush() {
            flush()
        }
    }

    private func shouldFlush() -> Bool {
        return Date().timeIntervalSince(lastFlush) > flushInterval
    }

    private func flush() {
        guard !eventQueue.isEmpty else { return }

        let eventsToSend = eventQueue
        eventQueue.removeAll()
        lastFlush = Date()

        AnalyticsManager.shared.sendBatch(eventsToSend)
    }
}
```

---

## 8. 推奨実装ロードマップ（Aniccaプロジェクト）

### Phase 1: 基盤構築（Week 1-2）

**目標**: 現在の実装を強化し、包括的な追跡を実現

**タスク**:
1. `NotificationScheduler.swift`にイベント追跡を追加
   - `notification_scheduled` を `scheduleNotification()` 内で送信
   - `notification_id`, `problem_type`, `scheduled_time` を記録

2. `AppDelegate.swift`の`didReceive response`を拡張
   - 現在の`recordOpened()`/`recordDismissed()`に加え、ローカルログも保存
   - `time_to_open`（スケジュール時刻からの経過時間）を計算

3. `NudgeCardView.swift`に明示的フィードバック追加
   - 👍👎ボタンUI実装
   - `notification_feedback`イベント送信
   - フィードバック後はボタン非表示

4. Core Dataに`NotificationLog` entityを追加
   - 過去90日分のログ保存
   - サーバー障害時のフォールバック

**成果物**:
- ダッシュボードで開封率/却下率可視化
- Problem Type別のエンゲージメント比較

### Phase 2: ルールベース最適化（Week 3-6）

**目標**: データ駆動の通知戦略を確立

**タスク**:
1. ユーザーコホート分類システム
   - `UserCohort` enum実装
   - `AppState.swift`に`currentCohort()`メソッド追加

2. 時間帯別ルールエンジン
   - `NotificationTimingManager`実装
   - Problem Typeごとの最適時間帯設定
   - 例: `cant_wake_up` → 前夜21:00-22:00

3. 頻度制限ロジック
   - 1日1回上限（Problem Type別）
   - At-Riskユーザーは2-3日に1回
   - Quiet Hours（22:00-07:00）実装

4. テンプレートバリエーション拡充
   - 各Problem Typeに5種類のテンプレート作成
   - `NotificationTemplate` struct定義
   - JSONファイルで管理（動的更新可能）

**成果物**:
- 開封率の段階的向上（目標: 5% → 8%）
- ユーザークレーム減少（過度な通知）

### Phase 3: A/Bテスト基盤（Week 7-10）

**目標**: データに基づくテンプレート最適化

**タスク**:
1. バリアント管理システム
   - `NotificationVariant` struct実装
   - Remote Config統合（Firebase or カスタムAPI）

2. トラフィック分割
   - 50/50または70/30でバリアント配信
   - ユーザーIDベースの一貫性のあるハッシング

3. 統計分析ツール
   - `ExperimentAnalyzer`クラス実装
   - Chi-squared test for significance
   - 1,000 impressions/variantで評価

4. 最初の実験: 通知文言テスト
   - Control: 「今日のチェックインはどうですか？」
   - Variant A: 「[Problem]について話しませんか？」
   - Variant B: 「[User Name]さん、今日の調子は？」

**成果物**:
- 勝者バリアントの特定
- 開封率10%以上改善

### Phase 4: Multi-Armed Bandit（Month 4-6）

**目標**: リアルタイム適応によるパーソナライゼーション

**前提条件**:
- 最低5,000ユーザー
- Problem Type別に最低1,000 impressions/template
- 3ヶ月分の履歴データ

**タスク**:
1. Thompson Sampling実装
   - `BanditAlgorithm`クラス
   - Beta分布サンプリング

2. Contextual Features統合
   - `NotificationContext` struct
   - 時間帯、曜日、ユーザーコホート、過去の開封率

3. Novelty Penalty
   - 同一テンプレートは7日間再送しない
   - `RecentTemplateTracker`実装

4. 日次バッチ更新
   - Background Task（BGAppRefreshTask）で統計更新
   - サーバーから最新テンプレート取得

**成果物**:
- パーソナライゼーションによる開封率15%向上
- ユーザーごとに最適化された通知体験

### Phase 5: Deep RL（Future: >100k users）

**条件**: 100,000+ ユーザー、専任データサイエンティスト、サーバーインフラ

**アプローチ**:
- DQNまたはPPOアルゴリズム
- 14日間の状態履歴
- 24時間の送信時刻最適化
- AWS SageMaker or Google AI Platform

---

## 9. 重要な注意事項とリスク

### 9.1 過度な最適化の罠

**Warning**: 開封率のみを最適化すると、**長期的なユーザー疲弊**を招く可能性。

**推奨指標バランス**:
- 開封率: 30%
- セッション完了率: 40%
- 7日リテンション: 20%
- ユーザー満足度（サーベイ）: 10%

### 9.2 Novelty Decay

Duolingoの教訓: 「新しい通知ほど効果的。繰り返しは急速に効果減衰」

**対策**:
- 最低20-30種類のテンプレートバリエーション
- 月次での新テンプレート追加
- 季節イベント・時事ネタの活用

### 9.3 Cold Start Problem

**初日〜7日のユーザー**:
- 履歴データなし → デフォルトルールを適用
- コホート平均値を使用
- A/Bテストに含めない（ノイズ源）

### 9.4 Platform-Specific Limitations

**iOS Challenges**:
- Silent Notificationは保証されない（"opportunities, not guarantees"）
- Background Refreshは電池状態に依存
- ATT（App Tracking Transparency）でデバイスIDが制限

**出典**: [Medium - Silent Push Notifications](https://mohsinkhan845.medium.com/silent-push-notifications-in-ios-opportunities-not-guarantees-2f18f645b5d5)

---

## 10. 参考リソース

### 10.1 技術ドキュメント

#### Apple公式
- [UNUserNotificationCenter Documentation](https://developer.apple.com/documentation/usernotifications/unusernotificationcenter)
- [Viewing Push Notification Metrics](https://developer.apple.com/documentation/usernotifications/viewing-the-status-of-push-notifications-using-metrics-and-apns)
- [UNNotificationResponse](https://developer.apple.com/documentation/usernotifications/unnotificationresponse)

#### プラットフォーム
- [Braze Multi-Armed Bandit](https://www.braze.com/resources/articles/multi-armed-bandit)
- [Firebase Cloud Messaging iOS](https://firebase.google.com/docs/cloud-messaging/ios/receive-messages)
- [CleverTap Push Metrics](https://clevertap.com/blog/push-notification-metrics-ctr-open-rate/)

### 10.2 ケーススタディ

- [Duolingo: AI Behind the Meme](https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/)
- [Likeminds: Duolingo's Bandit Algorithm](https://www.likeminds.community/blog/bandit-algorithm-of-duolingos-notifications)
- [Headspace Engineering: ML Push Notifications](https://medium.com/headspace-engineering/explainable-and-accessible-ai-using-push-notifications-to-broaden-the-reach-of-ml-at-headspace-a03c7c2bbf06)
- [NGrow: Headspace Case Study](https://www.ngrow.ai/blog/how-headspace-increased-engagement-by-32-with-strategic-push-notifications)
- [Towards Data Science: Deep RL for Notifications](https://towardsdatascience.com/deep-reinforcement-learning-in-production-part-2-personalizing-user-notifications-812a68ce2355/)

### 10.3 学術研究

- [PMC: Digital Prompts for Headspace](https://pmc.ncbi.nlm.nih.gov/articles/PMC8981020/)
- [PubMed: Micro-Randomized Trial on Notifications](https://pubmed.ncbi.nlm.nih.gov/37294612/)
- [arXiv: Rule-Based vs Data-Driven Monitoring](https://arxiv.org/html/2509.15848v1)
- [Meta Engineering: Reels RecSys with Sparse Data](https://engineering.fb.com/2026/01/14/ml-applications/adapting-the-facebook-reels-recsys-ai-model-based-on-user-feedback/)

### 10.4 業界統計

- [Business of Apps: Push Notification Statistics 2025](https://www.businessofapps.com/marketplace/push-notifications/research/push-notifications-statistics/)
- [MobilOud: 50+ Push Notification Statistics 2025](https://www.mobiloud.com/blog/push-notification-statistics)
- [Marketing Charts: Opt-In and Open Rate Benchmarks](https://www.marketingcharts.com/industries/education-71677)

---

## 11. まとめと推奨事項

### 11.1 即座に実装すべき項目（High Priority）

1. **包括的イベント追跡**: `notification_scheduled`, `notification_opened`, `notification_dismissed`, `notification_feedback`
2. **ローカルログストレージ**: Core Data with 90-day retention
3. **NudgeCardViewのフィードバックボタン**: 👍👎UI
4. **Quiet Hours**: 22:00-07:00の配信制限
5. **Mixpanelダッシュボード**: Problem Type別の開封率・却下率

### 11.2 中期的実装（Medium Priority）

1. **ルールベース最適化**: ユーザーコホート、時間帯別ルール、頻度制限
2. **テンプレートバリエーション**: 各Problem Typeに5-10種類
3. **A/Bテストフレームワーク**: バリアント管理、統計分析
4. **コンテキスト特徴量**: 曜日、時間帯、過去の開封率

### 11.3 長期的実装（Low Priority / Future）

1. **Multi-Armed Bandit**: Thompson Sampling、Novelty Penalty
2. **Deep Reinforcement Learning**: DQN、状態履歴、送信時刻最適化
3. **サーバー側パーソナライゼーション**: APIでリアルタイム通知生成

### 11.4 重要な推奨事項

**DO**:
- ✅ 小さく始める（ルールベース → Bandit → Deep RL）
- ✅ ユーザープライバシーを最優先
- ✅ 複数指標をバランスよく追跡（開封率だけでなく、リテンション、満足度）
- ✅ 新鮮なコンテンツを定期的に追加
- ✅ コホート単位で学習（Cold Start対策）

**DON'T**:
- ❌ 開封率のみを最適化（ユーザー疲弊のリスク）
- ❌ 初日から複雑なMLを導入（データ不足）
- ❌ 通知本文に機密情報を含める
- ❌ Quiet Hoursを無視
- ❌ 過度な頻度（1日3回以上は逆効果）

### 11.5 成功の指標（KPI）

| 指標 | 現状（推定） | 3ヶ月目標 | 6ヶ月目標 |
|-----|------------|----------|----------|
| 通知開封率 | 3-5% | 8% | 12% |
| 7日リテンション | - | 40% | 50% |
| 通知経由セッション時間 | - | 3分 | 5分 |
| ユーザー満足度（NPS） | - | 30 | 40 |
| Opt-out率 | - | <5% | <3% |

---

**調査完了日**: 2026年1月20日
**次回レビュー推奨日**: 2026年4月（3ヶ月後）
**関連ドキュメント**: `.cursor/plans/ios/proactive/`, `CLAUDE.md`

---

## Appendix A: コード例集

### A.1 完全なAppDelegate実装例

```swift
import UIKit
import UserNotifications
import OSLog

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    private let logger = Logger(subsystem: "com.anicca.ios", category: "Notifications")

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        NotificationScheduler.shared.registerCategories()

        // Configure analytics
        AnalyticsManager.shared.configure()

        return true
    }

    // MARK: - UNUserNotificationCenterDelegate

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .list, .sound])
        } else {
            completionHandler([.alert, .sound])
        }
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        defer { completionHandler() }

        let identifier = response.actionIdentifier
        let notificationIdentifier = response.notification.request.identifier
        let content = response.notification.request.content
        let userInfo = content.userInfo

        logger.info("Received notification response: \(identifier) for \(notificationIdentifier)")

        // Extract common properties
        let notificationType = userInfo["type"] as? String ?? "unknown"
        let problemType = userInfo["problem_type"] as? String
        let scheduledTime = userInfo["scheduled_time"] as? String

        // Calculate time to open
        var timeToOpen: TimeInterval?
        if let scheduledTimeString = scheduledTime,
           let scheduledDate = ISO8601DateFormatter().date(from: scheduledTimeString) {
            timeToOpen = Date().timeIntervalSince(scheduledDate)
        }

        // Handle different actions
        switch identifier {
        case UNNotificationDefaultActionIdentifier:
            // User tapped notification
            trackNotificationEvent(
                "notification_opened",
                notificationId: notificationIdentifier,
                notificationType: notificationType,
                problemType: problemType,
                additionalProperties: [
                    "open_method": "direct_tap",
                    "time_to_open_seconds": timeToOpen ?? 0
                ]
            )

            // Show NudgeCardView if applicable
            if let nudgeContent = extractNudgeContent(from: userInfo) {
                Task { @MainActor in
                    AppState.shared.showNudgeCard(nudgeContent)
                }
            }

        case UNNotificationDismissActionIdentifier:
            // User dismissed notification
            trackNotificationEvent(
                "notification_dismissed",
                notificationId: notificationIdentifier,
                notificationType: notificationType,
                problemType: problemType,
                additionalProperties: [:]
            )

        default:
            // Custom action button
            trackNotificationEvent(
                "notification_action",
                notificationId: notificationIdentifier,
                notificationType: notificationType,
                problemType: problemType,
                additionalProperties: [
                    "action": identifier
                ]
            )
        }
    }

    // MARK: - Helper Methods

    private func trackNotificationEvent(
        _ eventName: String,
        notificationId: String,
        notificationType: String,
        problemType: String?,
        additionalProperties: [String: Any]
    ) {
        var properties: [String: Any] = [
            "notification_id": notificationId,
            "notification_type": notificationType,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "platform": "ios",
            "app_version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
        ]

        if let problemType = problemType {
            properties["problem_type"] = problemType
        }

        properties.merge(additionalProperties) { (_, new) in new }

        // Send to analytics
        AnalyticsManager.shared.track(eventName, properties: properties)

        // Save to local log
        LocalNotificationLog.save(
            eventName: eventName,
            notificationId: notificationId,
            properties: properties
        )
    }

    private func extractNudgeContent(from userInfo: [AnyHashable: Any]) -> NudgeContent? {
        guard let typeString = userInfo["type"] as? String,
              typeString == "problem_nudge",
              let problemTypeString = userInfo["problem_type"] as? String,
              let problemType = ProblemType(rawValue: problemTypeString) else {
            return nil
        }

        return NudgeContent(
            id: userInfo["notification_id"] as? String ?? UUID().uuidString,
            problemType: problemType,
            title: userInfo["title"] as? String ?? "",
            message: userInfo["message"] as? String ?? "",
            primaryAction: userInfo["primary_action"] as? String,
            secondaryAction: userInfo["secondary_action"] as? String
        )
    }
}
```

### A.2 NotificationScheduler拡張

```swift
extension NotificationScheduler {
    func scheduleProblemNudge(
        for problemType: ProblemType,
        at scheduledTime: Date
    ) async -> Bool {
        let notificationId = "nudge_\(problemType.rawValue)_\(Int(scheduledTime.timeIntervalSince1970))"

        // Select template
        let template = NotificationTemplateSelector.shared.selectTemplate(
            for: problemType,
            context: NotificationContext.current(),
            excludeRecentTemplates: getRecentTemplateIds(for: problemType, days: 7)
        )

        // Create notification content
        let content = UNMutableNotificationContent()
        content.title = template.title
        content.body = template.body
        content.sound = .default
        content.categoryIdentifier = "PROBLEM_NUDGE"
        content.userInfo = [
            "type": "problem_nudge",
            "notification_id": notificationId,
            "problem_type": problemType.rawValue,
            "template_id": template.id,
            "scheduled_time": ISO8601DateFormatter().string(from: scheduledTime)
        ]

        // Create trigger
        let triggerDate = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: scheduledTime
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: triggerDate, repeats: false)

        // Create request
        let request = UNNotificationRequest(
            identifier: notificationId,
            content: content,
            trigger: trigger
        )

        // Schedule
        do {
            try await UNUserNotificationCenter.current().add(request)

            // Track scheduling event
            AnalyticsManager.shared.track("notification_scheduled", properties: [
                "notification_id": notificationId,
                "notification_type": "problem_nudge",
                "problem_type": problemType.rawValue,
                "template_id": template.id,
                "scheduled_time": ISO8601DateFormatter().string(from: scheduledTime),
                "hour_of_day": Calendar.current.component(.hour, from: scheduledTime),
                "day_of_week": Calendar.current.component(.weekday, from: scheduledTime)
            ])

            return true
        } catch {
            logger.error("Failed to schedule notification: \(error.localizedDescription)")
            return false
        }
    }
}
```

---

**End of Document**
