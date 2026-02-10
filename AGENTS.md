# Anicca iOS 開発ガイド - エージェント向け

このドキュメントは、iOSプロアクティブエージェント開発のためのガイドです。

---

## 最重要ルール（必ず最初に読むこと）

### 1. 意思決定ルール
**「どちらがいいですか？」と聞くな。自分で決めろ。**

エージェントは以下の手順で意思決定を行うこと：
1. **ベストプラクティスを調査する**
2. **自分で決定する**
3. **理由を説明する**

**禁止事項:**
- 「AとBどちらがいいですか？」のような質問
- 複数の選択肢提示で選ばせること

### 2. メモリ使用ルール
**重要な情報は言われなくても自発的にメモリに保存すること。**

- 価格、設定、ユーザーの好みは即座に保存
- Cursorの`update_memory`ツールを使用

### 3. Anicca基本情報
- **サブスクリプション価格**: 月額$9.99、年額$49.99（デフォルト）
- **TikTok SKAN設定**: CV1=Launch App、CV2=月額$9-10、CV3=年額$49-50

---

## プロジェクト概要

### Aniccaとは
Aniccaは、iOSで動作するプロアクティブな行動変容エージェントです。  
通知とNudge Cardを中心に、ユーザーの「苦しみ」を小さくする設計です。

### リリース状況
| 項目 | 内容 |
|---|---|
| App Store承認 | 1.3.0（Phase 6） |
| 次回提出 | 1.4.0 |

### 技術スタック
| レイヤー | 技術 |
|---|---|
| iOS | Swift / SwiftUI / UserNotifications / StoreKit |
| 通知・Nudge | ProblemTypeベース通知、LLM Nudge（Phase 6） |
| Backend | Node.js / Express / PostgreSQL（Railway） |
| 課金 | RevenueCat / Superwall |
| 分析 | Mixpanel / Singular |

### 主要ディレクトリ
| パス | 役割 |
|---|---|
| `aniccaios/` | iOSアプリ本体 |
| `apps/api/` | バックエンドAPI |
| `maestro/` | iOS E2Eテスト |
| `docs/` | 設計・調査メモ |
| `.cursor/plans/ios/proactive/roadmap.md` | ロードマップ（仕様の基準） |

---

## iOSアプリの主要機能
| 機能 | 説明 |
|---|---|
| ProblemTypeベースのNudge | 13問題タイプに応じて通知をスケジュール |
| Nudge Card | 通知タップで1画面の介入、1択/2択 + 👍👎 |
| LLM生成Nudge（Phase 6） | `/api/mobile/nudge/today` から日次取得 |
| サーバー駆動Nudge | `/api/mobile/nudge/trigger` → 即時ローカル通知 |
| センサー連携 | ScreenTime / HealthKit 連携の許可同期 |
| 課金/ペイウォール | RevenueCat + Superwall |
| 分析 | Mixpanel / Singular / 自前メトリクス |

---

## オンボーディングフロー
| 順序 | ステップ | View | 説明 |
|---|---|---|---|
| 1 | welcome | `WelcomeStepView` | アプリ紹介 + 既存ユーザー復元用 Sign in with Apple |
| 2 | value | `ValueStepView` | 価値説明 |
| 3 | struggles | `StrugglesStepView` | 問題タイプ選択 |
| 4 | notifications | `NotificationPermissionStepView` | 通知許可 |
| 5 | att | `ATTPermissionStepView` | ATT許可 → 完了処理 |

---

## 通知・Nudgeフロー
| フェーズ | 役割 | 主なクラス |
|---|---|---|
| 予約通知 | ProblemTypeに基づきスケジュール | `ProblemNotificationScheduler` |
| 即時通知 | サーバーNudgeを即時表示 | `NotificationScheduler` |
| 表示 | Nudge Card UI | `NudgeCardView` |
| 選択/学習 | 反応を記録し次回に反映 | `NudgeStatsManager`, `NudgeContentSelector` |
| LLM Nudge | 日次取得・キャッシュ | `LLMNudgeService`, `LLMNudgeCache` |

---

## iOS主要コンポーネント
| コンポーネント | 役割 | パス |
|---|---|---|
| AppState | 認証/プロフィール/購読/オンボーディング/Nudge状態の中心 | `aniccaios/AppState.swift` |
| ProblemType | 13問題タイプ定義 | `aniccaios/Models/ProblemType.swift` |
| ProblemNotificationScheduler | ProblemType通知スケジュール | `aniccaios/Notifications/ProblemNotificationScheduler.swift` |
| NotificationScheduler | サーバーNudgeの即時通知 | `aniccaios/Notifications/NotificationScheduler.swift` |
| NudgeCardView | 介入UI | `aniccaios/Views/NudgeCardView.swift` |
| NudgeContentSelector | バリアント選択 | `aniccaios/Services/NudgeContentSelector.swift` |
| NudgeStatsManager | tapped/ignored/👍👎の集計 | `aniccaios/Services/NudgeStatsManager.swift` |
| LLMNudgeService / Cache | LLM Nudge取得・キャッシュ | `aniccaios/Services/LLMNudgeService.swift`, `LLMNudgeCache.swift` |
| NudgeTriggerService | `/mobile/nudge` API呼び出し | `aniccaios/Services/NudgeTriggerService.swift` |
| ProfileSyncService | プロフィール同期 | `aniccaios/Services/ProfileSyncService.swift` |
| SubscriptionManager | 購読状態同期 | `aniccaios/Services/SubscriptionManager.swift` |
| SensorAccessSyncService | センサー許可同期 | `aniccaios/Services/SensorAccessSyncService.swift` |

---

## バックエンドAPI（モバイル）
| ルート | 役割 | 実装 |
|---|---|---|
| `/api/mobile/profile` | プロフィール取得/更新 | `apps/api/src/routes/mobile/profile.js` |
| `/api/mobile/entitlement` | 購読/利用量 | `apps/api/src/routes/mobile/entitlement.js` |
| `/api/mobile/nudge` | トリガー/フィードバック/今日のLLM | `apps/api/src/routes/mobile/nudge.js` |
| `/api/mobile/behavior` | 行動イベント送信 | `apps/api/src/routes/mobile/behavior.js` |
| `/api/mobile/feeling` | 感情イベント送信 | `apps/api/src/routes/mobile/feeling.js` |
| `/api/mobile/daily_metrics` | デイリーメトリクス | `apps/api/src/routes/mobile/dailyMetrics.js` |
| `/api/mobile/sensors` | センサー権限/状態同期 | `apps/api/src/routes/mobile/sensors.js` |
| `/api/mobile/account` | アカウント管理 | `apps/api/src/routes/mobile/account.js` |

---

## 環境変数・設定（iOS）
| キー | 説明 |
|---|---|
| `ANICCA_PROXY_BASE_URL` | APIベースURL |
| `REVENUECAT_API_KEY` | RevenueCat APIキー |
| `REVENUECAT_ENTITLEMENT_ID` | エンタイトルメントID |
| `REVENUECAT_PAYWALL_ID` | Paywall ID |
| `REVENUECAT_CUSTOMER_CENTER_ID` | Customer Center ID |

---

## テスト
| 種別 | パス | コマンド例 |
|---|---|---|
| Unit/Integration | `aniccaios/aniccaiosTests/` | `xcodebuild test ... -only-testing:aniccaiosTests` |
| E2E | `maestro/` | `maestro test maestro/` |

---

## FAQ
| 質問 | 回答 |
|---|---|
| 新しいProblemTypeを追加するには？ | `Models/ProblemType.swift` にcase追加 → `Localizable.strings` の表示名/ボタン文言追加 → 必要に応じて `Resources/Prompts/` 更新 |
| 新しいAPIエンドポイントを追加するには？ | `apps/api/src/routes/mobile/` にルータ追加 → `mobile/index.js` に登録 |
| 通知文言を追加するには？ | `Localizable.strings` の `nudge_*` キーを追加し、`ProblemType.notificationVariantCount` と整合させる |

---

## プラットフォーム別ポリシー（1.6.2運用）

- `X`: **検出のみ**。返信しない。`/api/agent/nudge` は `202` + `policy=detect_only_no_reply` を返し、App Nudge導線へ回す。
- `Moltbook`: 検出後の通常返信を許可（opt-in必須）。
- SAFE-T: `severityScore >= 0.9`（または crisis 判定）で通常Nudge生成を中断し、`safe_t_interrupt` + Slackアラートを優先する。

---

**最終更新**: 2026-02-09
