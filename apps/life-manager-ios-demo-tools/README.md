# Life Manager iOS real Calendar demo tool

この隔離ツールは、Life Manager iOS の実デモに使う一時的な Google Calendar イベントを `gog` CLI で作成・追跡・削除する。iOS の結果、route、通知、または backend の状態を生成・偽装しない。

## Live demo contract

- Google Calendar は既存の認証済み `gog` profile を使う。OAuth、アカウント選択、credential の出力は行わない。
- `create --live` は primary calendar を read-only 検索し、現在進行中で title に `Shipathon`、location に `Roppongi`（または `六本木`）を含む実イベントを origin として再利用する。
- origin が無い場合だけ、現在時刻の30分前から20分後までの controlled `Shipathon` origin を real event として作成し、provider readback を検証する。
- その後、現在時刻から45分後に `Life Manager demo: Tokyo Tower` を30分間作成する。location は次の値に固定する。

  `Tokyo Tower, 4 Chome-2-8 Shibakoen, Minato City, Tokyo`

- 作成後に `gog calendar event <calendarId> <eventId>` で readback し、ID・summary・location・start・end が実値と一致したときだけ `verified:true` receipt を返す。
- cleanup は receipt の opaque event ID だけを delete する。tool が作った origin は削除し、再利用した origin は削除しない。

## Commands

```bash
cd apps/life-manager-ios-demo-tools
npm test

# Preview: gog は呼ばず、status=not_created を JSON で返す（exit 2）。
node bin/life-manager-demo-calendar.js create

# Primary integration/video run でだけ実行する。receipt は repo 外に置く。
node bin/life-manager-demo-calendar.js create --live \
  --receipt /tmp/life-manager-ios-demo-calendar-receipt.json

# Demo 完了後、receipt の対象だけを deterministic に削除する。
node bin/life-manager-demo-calendar.js cleanup \
  --receipt /tmp/life-manager-ios-demo-calendar-receipt.json
```

`--now` は固定時計のテスト用、`--gog-bin` は CLI 検証用であり、primary run では指定しない。`GOG_BIN` を指定しない場合の既定値は `/opt/homebrew/bin/gog`。receipt には Calendar account、access token、refresh token、keyring password、provider の organizer/attendee fields を含めない。

## Installed gog boundary

実機の `gog 0.17.0` help で次を確認済み。

```text
gog calendar create <calendarId>
  --summary --from RFC3339 --to RFC3339
  --start-timezone IANA --end-timezone IANA --location
gog calendar event <calendarId> <eventId>
gog calendar delete <calendarId> <eventId> -y
```

実装は JSON を機械処理するため `--json --results-only --no-input` を付ける。shell の文字列連結はせず、`spawnSync(binary, argv)` の argv 境界で実行する。
