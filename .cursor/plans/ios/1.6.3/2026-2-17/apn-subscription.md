# 2026-02-17 APNs Problem Notifications + Subscription Sync + Cron Cleanup (SSOT)

## TL;DR
- **APNs Problem通知（1.6.3 spec）は prod/staging ともにコード反映済み**。
- **prodで通知が止まっていた原因はデータ不整合（mobile_profiles.user_idの紐付け）**で、prod DBはバックフィルで修復済み。
- **匿名課金ユーザーが server側でfree扱いになるバグが残っている可能性が高い**（iOSがRevenueCat→Backend同期をApple Sign-Inユーザーに限定しているため）。
- **LLM生成（generateNudges.js）は今も動き得る**: Railwayの `nudge-cronp` は `CRON_MODE=nudges` + `OPENAI_API_KEY` で実行される構成。

---

## 1. 何が起きたか（Incident）

### 症状
- 1.6.3（TestFlight/提出ビルド）で、ユーザーがアプリを開かないと通知が途切れる/届かない。

### 根因（prod）
- APNs送信ジョブは `push_tokens.profile_id(UUID)` を軸に、`mobile_profiles` から `struggles` を集める。
- ところが一部で `mobile_profiles.user_id` が UUID ではなく **device_id文字列**のまま残り、
  `profileId -> mobile_profiles(userId)` の参照が外れて `struggles` が空扱いになり送信スキップ。

### 実際の修復（prod）
- `push_tokens.device_id` と一致する `mobile_profiles.device_id` をjoinし、`mobile_profiles.user_id` を `push_tokens.profile_id` に同期（バックフィル）。

---

## 2. 1.6.3 APNs Problem通知の実装SSOT

### Backend（送信）
- `apps/api/src/jobs/problemNudgeApnsSenderJob.js`
  - `push_tokens`（env別）を読む
  - `user_settings` で timezone/lang を読む
  - `mobile_profiles.profile.struggles`（fallbackで `profile.problems`）を読む
  - free/pro を **server-side**で判定し、
    - free: 1日3枠
    - pro: 選択problemの全スロット
  - `nudge_deliveries` と `nudge_delivery_sends` にログを残し、APNsへ送る

### iOS（token登録）
- `aniccaios/aniccaios/Services/PushTokenService.swift`
  - `/api/mobile/push/token` に token を登録
  - serverが `remoteProblemNudgesEnabled=true` を返した時だけローカルProblem通知を止める

### iOS（ローカル通知）
- `aniccaios/aniccaios/Notifications/ProblemNotificationScheduler.swift`
  - entitled かつ remote enabled の場合はローカル通知をスキップ
  - free はローカルFree枠を維持

---

## 3. 2026-02-17 に入れた修正（コード）

### (A) APNs送信ジョブの耐障害化
- `apps/api/src/jobs/problemNudgeApnsSenderJob.js`
  - `mobile_profiles` の取得を `userId(profileId)` だけでなく `deviceId(in tokens)` でも拾う
  - `user_traits.struggles` を fallback として使用

### (B) token登録時のデータ整合（再発防止）
- `apps/api/src/routes/mobile/push.js`
  - `/api/mobile/push/token` で `mobile_profiles.user_id` を `profile_id(UUID)` に同期

### (C) profile保存時のUUID正規化
- `apps/api/src/services/mobile/profileService.js`
  - `resolveProfileId(userId)` が取れればUUIDに正規化
  - 取れなければ `ensureDeviceProfileId(deviceId)` でUUIDを作る

### デプロイ状況
- **production**: `main` 自動デプロイ（コミット: APNs修正）
- **staging**: `dev` 自動デプロイ（同コミットが staging にも反映済み）

---

## 4. 重要: 購読（RevenueCat）同期のバグ可能性

### 現状（iOS）
- `aniccaios/aniccaios/Services/SubscriptionManager.swift` の `syncNow()` に以下がある:
  - `guard case .signedIn(let credentials) = AppState.shared.authStatus else { return }`

意味:
- **匿名ユーザー（ほぼ全員）**は、RevenueCatの購入状態をBackendに同期しない。
- iOS UI上はRevenueCat SDKでPro表示できても、**Backendの `user_subscriptions` が更新されない**。

### なぜ 1.6.2 は大丈夫で、1.6.3 で問題化する？
- **1.6.2**: ローカル通知中心なので、Pro/Free判定は端末内RevenueCat SDKだけで完結しやすい。
- **1.6.3**: APNsの送信量をserverが決めるため、server側でPro/Free判定が必要。
  - そのSSOTが `user_subscriptions`。
  - 匿名ユーザーがsyncしないと `user_subscriptions` がfreeのままになり得る。

### Backend 側の同期エンドポイント
- `POST /api/billing/revenuecat/sync`
  - `apps/api/src/api/billing/revenuecatSync.js`
  - `user-id` ヘッダ（または auth.sub）を RevenueCat の `app_user_id` として問い合わせる。

重要:
- この設計のままだと、匿名ユーザーの正しい `app_user_id`（RevenueCatのanonymous ID）を Backend に送る必要がある。
- さらに、APNs送信ジョブは `profileId(UUID)` 単位で動くので、
  `user_subscriptions.user_id` は **UUID(profileId)** をSSOTにするのが自然。
  - つまり `app_user_id(text)` と `profile_id(uuid)` のマッピングが必要。

### 実施すべき修正（決定）
1) iOS: `syncNow()` の signedInガード撤去
- 匿名でも `billing/revenuecat/sync` を叩く
- `user-id` は `Purchases.shared.appUserID` を使う（匿名でも必ずある）

2) Backend: `revenuecat/sync` で取得した entitlement を、
- その `app_user_id` のまま `user_subscriptions.user_id` に保存しない
- **対応する profileId(UUID) を解決して、UUID側に保存**する
  - 例: `revenuecat_app_user_id_map` のようなテーブルを新設し、
    `app_user_id -> profile_id` を保持

---

## 5. `subscription_events` が0件の意味
- 現状の実装では、RevenueCat webhook処理（`webhookHandler.js`）は **`user_subscriptions` を更新するだけ**で、
  `subscription_events` に insert していない。
- そのため **`subscription_events` が0件 = webhookが来てない、とは断定できない**。

推奨:
- webhook到達確認のために、
  - `subscription_events` に必ず1行insertする
  - もしくは別の監査ログ（ops_events等）に記録

---

## 6. LLM生成 cron（generateNudges.js）を止めるべきか

### 事実
- `apps/api/src/jobs/generateNudges.js` は `OPENAI_API_KEY` 必須で実行され、LLM参照あり。
- `apps/api/railway.toml` の `startCommand`:
  - `CRON_MODE == nudges` のとき `node src/jobs/generateNudges.js`

### Railway サービス（production）
- `nudge-cronp`:
  - `CRON_MODE=nudges`
  - `OPENAI_API_KEY` 設定あり
  - => **LLM生成が走る構成**

- `nudge-cron`:
  - `CRON_MODE=true`（nudges ではない）
  - => `generateNudges.js` は起動しない（少なくともその条件分岐では）

### 手動起動経路
- `POST /api/admin/trigger-nudges` が存在（`apps/api/src/routes/admin/triggerNudges.js`）
- GitHub Actions で `workflow_dispatch` から叩ける（`.github/workflows/trigger-commander.yml`）

### 結論（決定）
- 「モバイル通知はAPNs+ルールベースでいく」方針なら、
  - **`nudge-cronp` を停止**（cron/サービス削除/スケール0 など）
  - **手動トリガー経路（/api/admin/trigger-nudges, trigger-commander.yml）も停止**

理由:
- cron停止だけだと、手動トリガーでLLM生成が起動できる状態が残る。

---

## 7. DBテーブル: 何を使っていて、何を使っていないか

### 7.1 1.6.3 APNs Problem通知 + 課金判定で必須（使っている）
- `profiles`
- `mobile_profiles`
- `user_settings`
- `push_tokens`
- `nudge_deliveries`
- `nudge_delivery_sends`
- `user_subscriptions`
- `user_traits`（fallback）

### 7.2 使っていない/未実装に近い（ただし「即削除」は禁止）
- `subscription_events`（現状0件、書き込み実装なし）

注意:
- DBには他にも多数のテーブルがあるが、それらは Ops / 投稿 / 研究 / 解析 / 過去機能のSSOT。
- **削除は“混乱解消”ではなく“本番破壊”になり得る**ため、別途「削除計画（参照調査→移行→drop）」として切り出す。

