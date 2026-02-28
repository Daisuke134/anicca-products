# Spec: 起動ハング & 通知ゼロ 修正

## 開発環境

| 項目 | 値 |
|------|-----|
| **ブランチ** | `feature/startup-notification-fix` |
| **ベースブランチ** | `dev` |
| **作業状態** | Spec作成中 |
| **対象バージョン** | 1.6.3 |

---

## 1. 概要（What & Why）

### 症状

| 問題 | 症状 | 発生タイミング |
|------|------|--------------|
| 🔴 A: 起動ハング | App Store版がずっとローディング画面のまま | 今日（2026-02-28）急に発生 |
| 🔴 B: 通知ゼロ | 昨日は大量に届いた通知が今日は1件もない | 今日（2026-02-28）急に発生 |

### 根本原因

**問題A（起動ハング）: API応答待ちで最大30秒ブロックされる**

起動時に `bootstrapProfileFromServerIfAvailable()` がサーバーにGETリクエストを送る。
`NetworkSessionManager.timeoutIntervalForRequest = 30.0` かつ `httpMaximumConnectionsPerHost = 1` のため、
APIが遅い（Railwayコールドスタート等）と最大30秒 ProgressView が表示される。

```
App起動
  ↓
AppDelegate.didFinishLaunching
  ↓ Task（fire-and-forget × 4本）が並列に発火
     ├── Task1: ASA attribution + Mixpanel
     ├── Task2: PushTokenService.register + SubscriptionManager.refreshOfferings
     ├── Task3: AuthHealthCheck.warmBackend（3s timeout）
     └── AppState.init() → Task4: bootstrapProfileFromServerIfAvailable（30s timeout）
                                                ↓
                         isBootstrappingProfile = true
                         （ContentRouterView → ProgressView 表示）
                                                ↓
                              APIが遅い場合 → 最大30秒待つ
                                                ↓
                         defer { isBootstrappingProfile = false }
                         （ProgressView 解除、やっとアプリ表示）
```

**httpMaximumConnectionsPerHost = 1 の影響**: 4本の並列Taskが1本のコネクションを奪い合う。
最悪ケースで 30s × 4 = 120秒の直列化が発生する。

**問題B（通知ゼロ）: 2つの仮説（両方をIに実機で確認）**

| 仮説 | 根拠 | 確認方法 |
|------|------|---------|
| 仮説1: APNs送信ジョブが Production で無効 | `PROBLEM_NUDGE_APNS_SENDER_ENABLED=true` がない場合、毎分ジョブが起動しない（`src/server.js:36`） | Railway Production 環境変数確認 |
| 仮説2: 今日の通知が Local → APNs に移行して消えた | 昨日 `PushTokenService.isRegistered=false`（Local通知）→ 今日トークン登録されて `isRegistered=true`（Local通知キャンセル）→ APNs側が未設定 | Railwayログ確認 |
| 仮説3: generateNudges Cron 今日失敗 | 毎日5:00 JST（`0 20 * * *` UTC）に実行。DBエラー or OPENAI_API_KEY枯渇で失敗 | Railway Cron ログ確認 |
| 仮説4: NUDGE_SEND_KILL_SWITCH=true | 環境変数が誤って有効化 | Railway Production 環境変数確認 |

---

## 2. 受け入れ条件

| # | 条件 | テスト可能な形式 |
|---|------|----------------|
| AC-1 | 起動からメイン画面表示まで8秒以内 | 実機でタイマー計測（API無応答でも8秒でタイムアウト → 表示） |
| AC-2 | APIが遅くてもProgressViewは最大8秒で消える | `bootstrapProfileFromServerIfAvailable` のタイムアウトをUnit Testで確認 |
| AC-3 | 通知が本日中に1件以上届く | 実機で受信確認 |
| AC-4 | Production の `PROBLEM_NUDGE_APNS_SENDER_ENABLED=true` が設定されている | Railway Dashboardで確認 |
| AC-5 | `generateNudges` Cron が今日正常完了している | Railwayログで `[generateNudges] done` 確認 |

---

## 3. As-Is / To-Be

### 問題A: 起動ハング

**As-Is:**

```swift
// aniccaios/Services/NetworkSessionManager.swift:19-21
config.httpMaximumConnectionsPerHost = 1       // ← ボトルネック
config.timeoutIntervalForRequest = 30.0        // ← 30秒待つ
config.timeoutIntervalForResource = 30.0
```

```swift
// aniccaios/AppState.swift:438-470
func bootstrapProfileFromServerIfAvailable() async {
    isBootstrappingProfile = true
    defer { isBootstrappingProfile = false }

    var request = URLRequest(url: AppConfig.profileSyncURL)
    // タイムアウト設定なし → NetworkSessionManager の 30s を使用
    let (data, response) = try await NetworkSessionManager.shared.session.data(for: request)
    // ...
}
```

**To-Be (変更1): NetworkSessionManager の httpMaximumConnectionsPerHost を修正**

```swift
// aniccaios/Services/NetworkSessionManager.swift
config.httpMaximumConnectionsPerHost = 4   // 1 → 4（並列接続許可）
config.timeoutIntervalForRequest = 30.0    // そのまま（他のAPIは30sが適切）
```

**To-Be (変更2): bootstrap専用リクエストのタイムアウトを8秒に短縮**

```swift
// aniccaios/AppState.swift の bootstrapProfileFromServerIfAvailable()
var request = URLRequest(url: AppConfig.profileSyncURL)
request.httpMethod = "GET"
request.setValue(resolveDeviceId(), forHTTPHeaderField: "device-id")
request.setValue(userId, forHTTPHeaderField: "user-id")
request.timeoutInterval = 8.0              // ← 追加（30s → 8s）
```

**変更するファイル:**

| ファイル | 変更内容 | 行番号 |
|---------|---------|-------|
| `aniccaios/aniccaios/Services/NetworkSessionManager.swift` | `httpMaximumConnectionsPerHost = 1 → 4` | 19 |
| `aniccaios/aniccaios/AppState.swift` | `request.timeoutInterval = 8.0` 追加 | 453付近 |

---

### 問題B: 通知ゼロ

**事前調査（実装前に必ずRailwayで確認）:**

```bash
# 1. Railway Production 環境変数確認（CRITICAL）
# Railway Dashboard > Production > Variables > PROBLEM_NUDGE_APNS_SENDER_ENABLED が true か

# 2. generateNudges Cron ログ確認
# Railway Dashboard > nudge-cronp > Deployments > latest > Logs
# 「[generateNudges] done」があるか

# 3. NUDGE_SEND_KILL_SWITCH 確認
# Railway Dashboard > Production > Variables > NUDGE_SEND_KILL_SWITCH が存在しないか
```

**To-Be（仮説1が正の場合）: Railway Production に環境変数を設定**

```
PROBLEM_NUDGE_APNS_SENDER_ENABLED = true
```

**To-Be（仮説3が正の場合）: generateNudges 手動実行**

```bash
# Railway で一時的に CRON_MODE=nudges で手動実行
railway run --environment production --service nudge-cronp node src/server.js
```

**触らないファイル（APNs送信ジョブ自体は正常）:**
- `apps/api/src/jobs/problemNudgeApnsSenderJob.js`（変更不要）
- `apps/api/src/services/apns/apnsClient.js`（変更不要）
- `apps/api/src/services/mobile/nudgeSendService.js`（変更不要）

---

## 4. テストマトリックス

| # | To-Be | テスト名 | 種別 | カバー |
|---|-------|---------|------|--------|
| 1 | bootstrap タイムアウトが8秒 | `test_bootstrapTimesOutIn8Seconds()` | Unit | OK |
| 2 | タイムアウト後 isBootstrappingProfile が false になる | `test_bootstrapFlagClearedAfterTimeout()` | Unit | OK |
| 3 | httpMaximumConnectionsPerHost = 4 | `test_networkSessionAllows4Connections()` | Unit | OK |
| 4 | APIエラー時もアプリが表示される（Crashしない） | `test_bootstrapAPIErrorDoesNotHang()` | Unit | OK |
| 5 | Railway Production 環境変数確認 | 手動確認（テスト不要） | Manual | - |
| 6 | generateNudges 今日ログ確認 | 手動確認（テスト不要） | Manual | - |

---

## 5. 境界（やらないこと）

| 項目 | 理由 |
|------|------|
| NetworkSessionManager の全タイムアウト変更 | 他のAPIエンドポイントへの影響リスク。bootstrap専用のみ変更 |
| AppDelegate の Task 並列化リアーキテクチャ | 影響範囲が広すぎる。httpMaximumConnectionsPerHost修正で十分 |
| APNs 送信コードの変更 | 環境変数で解決できる場合はコード変更不要 |
| ContentView のローディングUIの変更 | 根本原因（タイムアウト）を直せばUI変更不要 |
| `NUDGE_DAILY_QUOTA` の変更 | 通知ゼロの原因ではない（quota超過には複数回届いている必要がある） |

---

## 6. 実行手順

### Step 1: Railway Production 環境変数を即座に確認（コード変更前）

```
Railway Dashboard
  → Project: anicca
  → Environment: production
  → Service: API
  → Variables
  → PROBLEM_NUDGE_APNS_SENDER_ENABLED の値を確認
  → NUDGE_SEND_KILL_SWITCH が存在しないことを確認
```

### Step 2: PROBLEM_NUDGE_APNS_SENDER_ENABLED が未設定なら即座に設定

```
Railway Variables
  → PROBLEM_NUDGE_APNS_SENDER_ENABLED = true
  → Save → 自動再デプロイ
```

### Step 3: iOS コード変更

```bash
# 1. Worktree 作成
git worktree add ../anicca-startup-fix -b feature/startup-notification-fix

# 2. NetworkSessionManager 修正（httpMaximumConnectionsPerHost: 1 → 4）
# aniccaios/aniccaios/Services/NetworkSessionManager.swift:19

# 3. AppState bootstrap タイムアウト追加（8秒）
# aniccaios/aniccaios/AppState.swift:bootstrapProfileFromServerIfAvailable()

# 4. テスト実行
cd aniccaios && FASTLANE_SKIP_UPDATE_CHECK=1 fastlane test
```

### Step 4: 実機確認

```bash
cd aniccaios && FASTLANE_SKIP_UPDATE_CHECK=1 fastlane build_for_device
```

確認項目:
- [ ] 起動からメイン画面まで8秒以内
- [ ] 8秒後に ProgressView が消えてアプリが表示される（API遅くても）

### Step 5: 通知確認

- [ ] Railway のログで `[ProblemNudgeApnsSenderJob]` の実行ログ確認
- [ ] 実機でプッシュ通知受信確認（次の scheduled time まで待つ）

---

## E2E判定

| 項目 | 値 |
|------|-----|
| UI変更 | なし（ContentRouterView のロジックは変更しない） |
| 新画面 | なし |
| 新ボタン/操作 | なし |
| 結論 | Maestro E2Eシナリオ: **不要**（理由: UIの構造は変わらない。タイムアウト値の変更のみ。実機での起動時間計測で代替） |

---

## ユーザー作業（実装前）

| # | タスク | 手順 | 確認するもの |
|---|--------|------|------------|
| 1 | Railway Production 環境変数確認 | Railway Dashboard > production > Variables | `PROBLEM_NUDGE_APNS_SENDER_ENABLED` の値 |
| 2 | Railway Cron ログ確認 | Railway Dashboard > nudge-cronp > Deployments > Logs | `[generateNudges] done` が今日あるか |

---

*作成: 2026-02-28 | 調査済み: AppState.swift:438, NetworkSessionManager.swift:19, server.js:36, problemNudgeApnsSenderJob.js*
