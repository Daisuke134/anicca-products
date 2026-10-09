// Launch-surface copy, fully localized EN + JA (spec29 + Dais 2026-06-16:
// "EN version all English, JA version all Japanese, completely separate/localized").
// Every visible string for /install, /me, /lm and /life-manager lives here so each
// page/component just reads strings[locale]. Copy is hand-written natural English and
// natural Japanese — NOT machine translation of one from the other. No fake numbers,
// no internal jargon. Keep the two dictionaries the SAME SHAPE.

import type { LaunchLocale } from './launchLocale';

export const launchStrings = {
  en: {
    nav: {
      install: 'Install',
      me: 'Me',
      dashboard: 'Dashboard',
      lifeManager: 'Life Manager',
      langLabel: 'Language',
      en: 'EN',
      ja: '日本語',
    },

    lm: {
      publicEyebrow: 'Google Calendar · 7-day free trial · $29/mo',
      publicTitle: 'Know when it is time to leave for your next event.',
      publicBody:
        'Connect Google Calendar once. Life Manager adds travel time before eligible in-person events and gives you a departure reminder in Calendar. Google account verification and Calendar permission are required.',
      primaryCta: 'Connect Google Calendar',
      localSurface: 'Your own Google Calendar',
      cloudSurface: 'Always-on cloud · no app to install',
      surfacesLabel: 'where you use it',
      organsTitle: 'Calendar handles the daily travel details.',
      organs: [
        { index: '01', title: 'Travel time', body: 'Eligible in-person events get a travel block based on the available route.' },
        { index: '02', title: 'Departure reminder', body: 'A Calendar reminder helps you leave at the right time.' },
        { index: '03', title: 'Automatic updates', body: 'After setup, Life Manager checks upcoming events and adds travel time where it can.' },
      ],
      wedgeEyebrow: 'Daily use',
      wedgeTitle: 'Your Calendar becomes a departure plan.',
      wedgeBody:
        'After connecting, open your Google Calendar as usual. Travel blocks and departure reminders appear there automatically. Events with missing location details are left unchanged rather than guessed.',
      evidenceTitle: 'You control Calendar access.',
      proofLabel: 'privacy and control',
      evidenceBody:
        'Choose your Google account and grant Calendar permission on Google’s consent screen. Life Manager does not read your Gmail inbox. Disconnect Calendar whenever you like.',
      evidenceBoundary:
        '7-day free trial. A card is required to start; then $29/mo. Cancel anytime.',
      sourceCta: 'View the source code',
    },

    lifeManager: {
      metaTitle: 'Life Manager',
      metaDesc:
        'Connect Google Calendar to reserve travel time and receive Telegram departure reminders. Calls are optional. The always-on cloud plan is $29/mo.',
      heroHeadline: 'Life Manager',
      heroSubtext:
        'Connect your Google Calendar and Life Manager reserves travel time for physical events, then sends the route on Telegram before you need to leave. Phone calls are optional. The cloud plan is $29/mo.',
      heroPrimary: 'Start on Telegram — $29/mo',
      heroSecondary: 'See how it works',
      asset: {
        wake: '09:35 · Telegram · route and departure time',
        travel1: '09:40 · leave home',
        sync: '09:40 · travel to Team Sync, 20 min',
        travel2: '10:00 · Team Sync',
        lunch: '12:30 · Online meeting · no route needed',
        caption: 'Travel blocks and reminders follow each event type ↑',
      },
      featuresTitle: 'Everything you need to leave on time',
      featuresIntro:
        'Life Manager focuses on your daily Calendar flow. It runs in the cloud, so friends can use it without a Mac or local server.',
      liveLabel: 'live',
      features: [
        {
          id: 'travel',
          label: 'Calendar',
          headline: 'It reserves your travel time',
          body: 'For a physical event with an accepted route, Life Manager adds a travel block that ends when the event begins. Online and locationless events do not get a fake route.',
        },
        {
          id: 'call',
          label: 'Telegram',
          headline: 'It sends the route before departure',
          body: 'Before you need to leave, Life Manager sends a Telegram reminder with the route. Online events get an online reminder instead of a route.',
        },
        {
          id: 'ask',
          label: 'Phone',
          headline: 'Calls are optional',
          body: 'You can use Calendar and Telegram without adding a phone number. Calls run only after you add a valid number and explicitly turn them on.',
        },
        {
          id: 'notify',
          label: 'Cloud',
          headline: 'No Mac is required',
          body: 'The daily service runs in the cloud. Your Calendar connection and settings belong to your own Telegram account and stay separate from other users.',
        },
      ],
      travelTitle: 'How travel blocks work',
      travelCols: { step: 'Step', what: 'What it does', api: 'API' },
      travelRows: [
        { what: 'Reads today’s timed calendar events', api: 'GCal REST v3' },
        { what: 'Finds the events with no travel block yet', api: 'Life Manager' },
        { what: 'Gets an accepted route for each physical event', api: 'Routing provider' },
        {
          what: 'Drops the [Travel] block so it ends right when the event starts',
          api: 'GCal REST v3',
        },
      ],
      travelNotePre: 'Travel blocks never duplicate. Run the skill again and it finds the existing block by its "[Travel]" prefix and the ',
      travelNoteCode: 'anicca_travel_block',
      travelNotePost: ' property.',
      onTimeTitle: 'One departure time, the right notification',
      onTimeBodyPre:
        'The route determines a door-departure time. Life Manager sends the Telegram reminder at ',
      onTimeBodyCode: 'departure time − 5 min',
      onTimeBodyPost: '. If you explicitly enable calls, the same departure time also drives the optional call schedule.',
      onTimeResult: 'One timing source keeps the travel block and notifications aligned.',
      gettingStartedTitle: 'Getting started',
      gettingStartedSteps: [
        { link: 'Open the Telegram bot', rest: ' and tap Start.' },
        { link: '', rest: 'Approve access to your own Google Calendar.' },
        { link: '', rest: 'Set your home or base. Skip phone, or add it and explicitly enable calls.' },
        {
          link: '',
          restPre: 'Subscribe for ',
          restStrong: '$29/mo',
          restPost: '. The service continues in the cloud without your Mac.',
        },
      ],
      cardGetStartedEyebrow: 'get started',
      cardGetStartedTitle: 'Life Manager, $29/mo',
      cardGetStartedDesc: 'Start in Telegram, connect Calendar, set your base, and choose whether to enable calls.',
      cardColonyEyebrow: 'privacy and support',
      cardColonyTitle: 'Your connection stays under your control',
      cardColonyDesc: 'You can disconnect Google Calendar or stop the bot. Use the privacy and support pages for data requests or help.',
      privacyCta: 'Privacy',
      supportCta: 'Support',
      startTitle: 'Scan or tap to start',
      startIntro: 'Open the Telegram bot, connect Calendar, and set your base. Phone and calls are optional.',
      startPhoneEyebrow: 'on your phone',
      startPhoneTitle: 'Scan to start on Telegram',
      startPhoneDesc: 'Opens @LifeManagerBotbot. Tap Start, approve Calendar access, and set your home or base.',
      startPhoneLink: 'Open the bot on this phone',
    },
  },

  ja: {
    nav: {
      install: 'インストール',
      me: 'マイページ',
      dashboard: 'ダッシュボード',
      lifeManager: 'ライフマネージャー',
      langLabel: '言語',
      en: 'EN',
      ja: '日本語',
    },

    lm: {
      publicEyebrow: 'Googleカレンダー · 7日間無料 · 月$29',
      publicTitle: '次の予定に、いつ出ればいいかを。',
      publicBody:
        'Googleカレンダーを一度接続すると、対象の対面予定の前に移動時間を追加し、出発時刻をカレンダーでお知らせします。予定や地図を何度も確認する手間を減らします。Googleアカウントの本人確認とカレンダー権限の許可が必要です。',
      primaryCta: 'Googleカレンダーに接続',
      localSurface: '自分の Google カレンダー',
      cloudSurface: 'クラウドで常時稼働 · アプリ不要',
      surfacesLabel: '毎日の表示先',
      organsTitle: '予定から出発までを、カレンダーで整える。',
      organs: [
        { index: '01', title: '移動時間', body: '経路がわかる対面予定の前に、必要な移動時間を追加します。' },
        { index: '02', title: '出発通知', body: '出発時刻のカレンダー通知で、出発のタイミングを確認できます。' },
        { index: '03', title: '自動更新', body: '接続後は、対象の予定を確認して移動時間を管理します。' },
      ],
      wedgeEyebrow: '毎日の使い方',
      wedgeTitle: 'Googleカレンダーが出発計画になります。',
      wedgeBody:
        '設定後は、いつものGoogleカレンダーを開くだけ。対象の予定には移動時間と出発通知が追加されます。情報が足りない予定には、誤った時間を作らず変更しません。',
      evidenceTitle: 'Calendarの接続はあなたが管理できます。',
      proofLabel: 'プライバシーと管理',
      evidenceBody:
        'Googleの同意画面でアカウントとカレンダー権限を確認して接続します。Gmailの受信箱は読みません。接続はいつでも解除できます。',
      evidenceBoundary:
        '7日間無料で試せます。開始にはカード登録が必要です。以降は月$29。いつでも解約できます。',
      sourceCta: 'ソースコードを見る',
    },

    lifeManager: {
      metaTitle: 'ライフマネージャー',
      metaDesc:
        'Google カレンダーをつなぐと、移動時間を確保し、出発前に Telegram で経路をお知らせ。電話は任意。常時稼働のcloud planは月 $29。',
      heroHeadline: 'Life Manager',
      heroSubtext:
        'Google カレンダーをつなぐと、対面予定に合わせて移動時間を確保し、出発前に Telegram で経路を知らせます。電話通知は任意。cloud planは月 $29です。',
      heroPrimary: 'Telegramで始める — 月 $29',
      heroSecondary: '仕組みを見る',
      asset: {
        wake: '09:35 · Telegram · 経路と出発時刻',
        travel1: '09:40 · 自宅を出発',
        sync: '09:40 · チーム会議へ移動 20 分',
        travel2: '10:00 · チーム会議',
        lunch: '12:30 · オンライン会議 · 経路は不要',
        caption: '予定の種類に合わせて移動と通知を切り替えます ↑',
      },
      featuresTitle: '出発に必要なことを、ひとつに',
      featuresIntro:
        'ライフマネージャーは、毎日のカレンダーと移動に集中します。クラウドで動くため、Macや自前サーバーは必要ありません。',
      liveLabel: '稼働中',
      features: [
        {
          id: 'travel',
          label: 'カレンダー',
          headline: '移動時間を確保する',
          body: '経路が確定した対面予定には、開始時刻に間に合う移動ブロックを入れます。オンライン予定や場所のない予定に、架空の経路は作りません。',
        },
        {
          id: 'call',
          label: 'Telegram',
          headline: '出発前に経路を知らせる',
          body: '出発時刻が近づくと、Telegram に経路を送ります。オンライン予定には、経路ではなくオンライン予定として通知します。',
        },
        {
          id: 'ask',
          label: '電話',
          headline: '電話通知は任意',
          body: '電話番号を登録しなくても、カレンダーと Telegram の機能は使えます。電話は、番号を登録して自分で有効にした場合だけ発信します。',
        },
        {
          id: 'notify',
          label: 'クラウド',
          headline: 'Macなしで動き続ける',
          body: '毎日の処理はクラウドで動きます。カレンダー接続と設定はTelegramアカウントごとに分かれ、ほかの利用者と混ざりません。',
        },
      ],
      travelTitle: '移動ブロックの仕組み',
      travelCols: { step: 'ステップ', what: 'やること', api: 'API' },
      travelRows: [
        { what: '今日の時刻つき予定を読む', api: 'GCal REST v3' },
        { what: '移動ブロックがまだ無い予定を探す', api: 'ライフマネージャー' },
        { what: '対面予定ごとに利用できる経路を取得する', api: '経路プロバイダー' },
        {
          what: '予定が始まる時刻ちょうどに終わるよう [移動] ブロックを入れる',
          api: 'GCal REST v3',
        },
      ],
      travelNotePre: '移動ブロックは重複しない。もう一度スキルを動かしても、「[移動]」のプレフィックスと ',
      travelNoteCode: 'anicca_travel_block',
      travelNotePost: ' プロパティで既存のブロックを見つける。',
      onTimeTitle: 'ひとつの出発時刻から、必要な通知だけ',
      onTimeBodyPre:
        '経路から、玄関を出る時刻を決めます。Telegramの通知は ',
      onTimeBodyCode: '出発時刻の5分前',
      onTimeBodyPost: '。電話を明示的に有効にした場合だけ、同じ出発時刻を基準に電話も予約します。',
      onTimeResult: '移動ブロックと通知が、同じ出発時刻にそろいます。',
      gettingStartedTitle: 'はじめかた',
      gettingStartedSteps: [
        { link: 'Telegram ボットを開く', rest: '。「開始」をタップします。' },
        { link: '', rest: '自分の Google カレンダーへのアクセスを許可します。' },
        { link: '', rest: '自宅または拠点を設定します。電話はスキップするか、番号を登録して明示的に有効にします。' },
        {
          link: '',
          restPre: 'これで準備完了。登録は',
          restStrong: '月 $29',
          restPost: 'で、Macを起動していなくてもクラウドで動きます。',
        },
      ],
      cardGetStartedEyebrow: 'はじめる',
      cardGetStartedTitle: 'ライフマネージャー（月 $29）',
      cardGetStartedDesc: 'Telegramで開始し、カレンダーと拠点を設定。電話を使うかは自分で選べます。',
      cardColonyEyebrow: 'プライバシーとサポート',
      cardColonyTitle: '接続は自分で管理できます',
      cardColonyDesc: 'Google カレンダーは解除でき、ボットの利用も停止できます。データに関する依頼や困ったときは、案内ページからお問い合わせください。',
      privacyCta: 'プライバシー',
      supportCta: 'サポート',
      startTitle: 'スキャンまたはタップで開始',
      startIntro: 'Telegramでボットを開き、カレンダーと拠点を設定します。電話と通話は任意です。',
      startPhoneEyebrow: 'スマホで',
      startPhoneTitle: 'スキャンして Telegram で開始',
      startPhoneDesc: '@LifeManagerBotbot が開きます。「開始」をタップし、カレンダーへのアクセスを許可して、自宅または拠点を設定します。',
      startPhoneLink: 'このスマホでボットを開く',
    },
  },
} as const;

export type LaunchStrings = (typeof launchStrings)[LaunchLocale];

export function getLaunchStrings(locale: LaunchLocale): LaunchStrings {
  return launchStrings[locale];
}
