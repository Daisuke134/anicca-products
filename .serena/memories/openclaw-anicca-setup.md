2026-02-09: iOS通知E2EをMaestroで安定化。
- 仕組み: DEBUG専用画面(E2ENotificationDebugView)で /api/mobile/nudge/trigger を叩き、UNUserNotificationCenterの pending + delivered を表示して自動検証（Notification Center UI操作は不要/不安定なので避ける）。
- Maestro: aniccaios/maestro/e2e/04-server-nudge-local-notification.yaml が "Scheduled: YES" をアサート。
- 注意: ローカル通知はtimeInterval=1sで即配信されpendingから消えるので、deliveredも見る。

同日: backend /api/mobile/nudge/trigger が署名なし（device-id/user-idヘッダ）でも動くように、device-idからUUID profileを自動確保するロジックを追加（ensureDeviceProfileId）。
- 目的: signed-out/anonymous でも nudge_events(user_id UUID必須) を記録できるようにする + iOS E2Eを通す。
- 実装: apps/api/src/services/mobile/userIdResolver.js に ensureDeviceProfileId()、resolveProfileId() に mobile_profiles.device_id fallback。