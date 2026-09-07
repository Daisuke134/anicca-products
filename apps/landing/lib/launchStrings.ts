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
      metaTitle: 'Life Manager: Get started',
      metaDesc:
        'Connect your Google Calendar and get travel blocks and Telegram departure reminders. Calls are optional. Try it free for 3 days.',
      eyebrow: 'Life Manager · 3-day free trial',
      soonTitle: 'Start on Telegram',
      soonBody:
        'Open the Telegram bot, connect your own Google Calendar, set your home or base, and you are ready. Phone calls are optional.',
      soonCta: 'Start on Telegram',
      publicEyebrow: 'Calendar × Telegram',
      publicTitle: 'An AI manager that helps you leave on time.',
      publicBody:
        'Connect Google Calendar. Life Manager reserves travel time for physical events and sends the route on Telegram before you need to leave.',
      localSurface: 'Your own Google Calendar',
      cloudSurface: 'Always-on cloud · no Mac required',
      surfacesLabel: 'simple setup',
      organsTitle: 'The daily essentials, without extra setup.',
      organs: [
        { index: '01', title: 'Travel blocks', body: 'Physical events get a travel block based on the accepted route.' },
        { index: '02', title: 'Telegram reminders', body: 'Before departure, the route arrives in the Telegram chat you already use.' },
        { index: '03', title: 'Optional calls', body: 'Add a phone number and opt in only if you also want departure calls.' },
      ],
      wedgeEyebrow: 'Daily feature',
      wedgeTitle: 'Calendar events turn into a practical departure plan.',
      wedgeBody:
        'Start in Telegram, approve access to your own Calendar, and set a home or base. The cloud service keeps running without your Mac. Phone and calls stay off unless you choose them.',
      evidenceTitle: 'You stay in control.',
      proofLabel: 'privacy and control',
      evidenceBody:
        'Calendar access is requested through Google consent. You can disconnect it, stop using the bot, or contact support whenever you need help.',
      evidenceBoundary:
        'A one-time 3-day trial starts during onboarding. Calls require a phone number and explicit opt-in.',
      sourceCta: 'View the source code',
      heroTitle: 'Leave on time.',
      heroBody:
        'Start in Telegram, connect your Google Calendar, and set your base. Life Manager adds travel time and sends departure routes. Phone calls are optional.',
      stepAria: (i: number, n: number) => `step ${i} of ${n}`,
      login: {
        title: 'Start in Telegram',
        body: 'Connect your own Google Calendar through the secure consent screen.',
        button: 'Open Telegram',
      },
      name: {
        title: 'What should it call you?',
        placeholder: 'Your name',
        button: 'Continue',
        error: 'Please enter your name.',
        saveError: 'Could not save. Try again.',
      },
      connect: {
        title: 'Connect your Calendar',
        body: 'Connect your Google Calendar below. Life Manager reads your schedule, asks you on Telegram when something is unclear, and acts only with your approval.',
        calendar: 'Google Calendar',
        gmail: 'Gmail',
        button: 'Continue',
        stateConnected: 'connected ✓',
        stateConnecting: 'connecting…',
        stateConnect: 'connect →',
        error: 'Connection failed.',
      },
      phone: {
        title: 'Phone calls (optional)',
        body: 'Add a phone number only if you want departure calls. You can also skip this step.',
        placeholder: '8012345678',
        button: 'Continue',
        error: 'Enter a valid phone number for the selected country.',
        saveError: 'Could not save. Try again.',
      },
      pay: {
        titlePrefix: 'You’re set, ',
        titleFallback: 'friend',
        bodyPre: 'Your one-time free trial lasts ',
        bodyStrong: '3 days.',
        button: 'Continue to the current plan',
        notReady:
          'Checkout is temporarily unavailable. You can return to your dashboard.',
        seeDashboard: 'See my dashboard',
      },
      dashboard: {
        eyebrow: 'your life manager',
        connectedSuffix: ', connected',
        you: 'You',
        pills: { calendar: 'Calendar', gmail: 'Gmail', phone: 'Phone' },
        callBtn: { idle: '📞 Call me now (test)', calling: 'Calling you…', done: '✓ Calling — pick up!', error: 'Could not call. Check your number.' },
        skills: [
          { title: 'Travel blocks', desc: 'Travel time is added for physical events with an accepted route.' },
          { title: 'Optional calls', desc: 'Departure calls run only after you add a phone number and opt in.' },
          {
            title: 'Location asks',
            desc: 'No location? It asks you on Telegram, and your reply updates the event.',
          },
          {
            title: 'Late-notice',
            desc: 'Running late? It drafts a note to the attendees and sends once you approve.',
          },
        ],
        liveBadge: 'live',
        footnote: 'The cloud service runs without a Mac. You can disconnect Calendar or disable calls at any time.',
      },
    },

    lifeManager: {
      metaTitle: 'Life Manager',
      metaDesc:
        'Connect Google Calendar to reserve travel time and receive Telegram departure reminders. Calls are optional. Try Life Manager free for 3 days.',
      heroHeadline: 'Life Manager',
      heroSubtext:
        'Connect your Google Calendar and Life Manager reserves travel time for physical events, then sends the route on Telegram before you need to leave. Phone calls are optional. Your one-time trial is free for 3 days.',
      heroPrimary: 'Start on Telegram',
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
          restPre: 'You are ready with a one-time ',
          restStrong: '3-day free trial',
          restPost: '. The service continues in the cloud without your Mac.',
        },
      ],
      cardGetStartedEyebrow: 'get started',
      cardGetStartedTitle: 'Try Life Manager free for 3 days',
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
      metaTitle: 'ライフマネージャー：はじめる',
      metaDesc:
        'Google カレンダーをつなぐと、移動時間を確保し、出発前に Telegram で経路をお知らせ。電話は任意。3日間無料で試せます。',
      eyebrow: 'ライフマネージャー · 3日間無料',
      soonTitle: 'Telegram で始める',
      soonBody:
        'Telegram でボットを開き、自分の Google カレンダーを接続して、自宅または拠点を設定すれば準備完了。電話は任意です。',
      soonCta: 'Telegram で始める',
      publicEyebrow: 'カレンダー × Telegram',
      publicTitle: '次の予定に間に合うためのAIマネージャー。',
      publicBody:
        'Google カレンダーをつなぐと、予定に合わせて移動時間を確保し、出発前に Telegram で経路を知らせます。',
      localSurface: '自分の Google カレンダー',
      cloudSurface: 'クラウドで常時稼働 · Mac不要',
      surfacesLabel: 'かんたん設定',
      organsTitle: '毎日の移動に必要なことだけ。',
      organs: [
        { index: '01', title: '移動ブロック', body: '経路が確定した対面予定には、必要な移動時間を入れます。' },
        { index: '02', title: 'Telegram通知', body: '出発前に、いつものTelegramへ経路を知らせます。' },
        { index: '03', title: '任意の電話', body: '電話でも知らせてほしい人だけ、番号を登録して有効にできます。' },
      ],
      wedgeEyebrow: '毎日の機能',
      wedgeTitle: 'カレンダーの予定を、実際の出発計画に変えます。',
      wedgeBody:
        'Telegram から自分のカレンダーへのアクセスを許可し、自宅または拠点を設定します。クラウドで動くためMacは不要。電話は選んだ人だけに発信します。',
      evidenceTitle: '接続は自分で管理できます。',
      proofLabel: 'プライバシーと管理',
      evidenceBody:
        'カレンダーへのアクセスはGoogleの同意画面で許可します。接続解除、利用停止、サポートへの問い合わせはいつでもできます。',
      evidenceBoundary:
        '初回だけ3日間無料で試せます。電話は、番号を登録して明示的に有効にした場合だけ使います。',
      sourceCta: 'ソースコードを見る',
      heroTitle: '出発時刻に、間に合う。',
      heroBody:
        'Telegram で始めて、Google カレンダーと拠点を設定。移動時間の確保と出発前の経路通知を任せられます。電話は任意です。',
      stepAria: (i: number, n: number) => `ステップ ${i} / ${n}`,
      login: {
        title: 'Telegram で始める',
        body: '安全な同意画面から、自分の Google カレンダーを接続します。',
        button: 'Telegram を開く',
      },
      name: {
        title: 'あなたを何と呼べばいい？',
        placeholder: 'お名前',
        button: '続ける',
        error: 'お名前を入力してください。',
        saveError: '保存できませんでした。もう一度お試しください。',
      },
      connect: {
        title: 'カレンダーをつなぐ',
        body: 'Google カレンダーを接続。ライフマネージャーが予定を読み、不明点は Telegram で聞き、承認を得てから動く。',
        calendar: 'Google カレンダー',
        gmail: 'Gmail',
        button: '続ける',
        stateConnected: '接続済み ✓',
        stateConnecting: '接続中…',
        stateConnect: '接続する →',
        error: '接続に失敗しました。',
      },
      phone: {
        title: '電話通知（任意）',
        body: '電話でも出発を知らせてほしい場合だけ登録します。このステップはスキップできます。',
        placeholder: '09012345678',
        button: '続ける',
        error: '選択した国の有効な電話番号を入力してください。',
        saveError: '保存できませんでした。もう一度お試しください。',
      },
      pay: {
        titlePrefix: '準備完了です、',
        titleFallback: 'あなた',
        bodyPre: '初回の無料期間は',
        bodyStrong: '3日間です。',
        button: '現在のプランを確認する',
        notReady:
          '決済画面を開けませんでした。ダッシュボードへ戻れます。',
        seeDashboard: 'ダッシュボードを見る',
      },
      dashboard: {
        eyebrow: 'あなたのライフマネージャー',
        connectedSuffix: '、接続済み',
        you: 'あなた',
        pills: { calendar: 'カレンダー', gmail: 'Gmail', phone: '電話' },
        callBtn: { idle: '📞 今すぐ電話させる（テスト）', calling: '発信中…', done: '✓ 発信しました。出てください！', error: '発信できませんでした。番号を確認してください。' },
        skills: [
          { title: '移動時間の確保', desc: '経路が確定した対面予定に移動時間を入れる。' },
          { title: '任意の電話', desc: '番号を登録し、自分で有効にした場合だけ出発前に電話する。' },
          {
            title: '場所の確認',
            desc: '場所が未入力なら、Telegram で確認する。返信すれば予定を更新する。',
          },
          {
            title: '遅刻連絡',
            desc: '遅れそうなとき、出席者への一言を下書きする。あなたが承認すれば送る。',
          },
        ],
        liveBadge: '稼働中',
        footnote: 'クラウドで動くためMacは不要です。カレンダー接続や電話通知はいつでも解除できます。',
      },
    },

    lifeManager: {
      metaTitle: 'ライフマネージャー',
      metaDesc:
        'Google カレンダーをつなぐと、移動時間を確保し、出発前に Telegram で経路をお知らせ。電話は任意。3日間無料で試せます。',
      heroHeadline: 'Life Manager',
      heroSubtext:
        'Google カレンダーをつなぐと、対面予定に合わせて移動時間を確保し、出発前に Telegram で経路を知らせます。電話通知は任意。初回だけ3日間無料で試せます。',
      heroPrimary: 'Telegram で始める',
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
          restPre: 'これで準備完了。初回だけ',
          restStrong: '3日間無料',
          restPost: 'で、Macを起動していなくてもクラウドで動きます。',
        },
      ],
      cardGetStartedEyebrow: 'はじめる',
      cardGetStartedTitle: '3日間無料で試す',
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
