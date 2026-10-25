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
      publicEyebrow: 'LIFE MANAGER · PROACTIVE GENERAL AGENT',
      publicTitle: 'Your life. A manager that takes initiative.',
      publicBody:
        'One proactive manager for work, money, everyday responsibilities, body, and mind. Life Manager chooses useful priorities, takes authorized action, and verifies outcomes without daily instructions. Life Manager Cloud runs on a dedicated Maritime VM. Google sign-in verifies identity only; Calendar or Gmail inbox access, a task prompt, goals, budget, and payout details are not required at signup. The first earning workflow uses Capafy. The full Cloud-to-Capafy path is still being verified, and earnings are not guaranteed.',
      primaryCta: 'Start Life Manager Cloud',
      localSurface: 'Open-source core · run it yourself',
      cloudSurface: 'Cloud · dedicated Maritime VM',
      surfacesLabel: 'one manager, two ways to run it',
      organsTitle: 'One manager for the whole of life.',
      organs: [
        { index: '01', title: 'Money & business', body: 'Find suitable work, create and distribute it, then verify completion and earnings.' },
        { index: '02', title: 'Work & daily life', body: 'Coordinate priorities, schedules, applications, and follow-ups, with receipts for completed work.' },
        { index: '03', title: 'Body & mind', body: 'Bring routines, daily rhythms, and well-being into the same manager.' },
      ],
      wedgeEyebrow: 'First Cloud earning workflow',
      wedgeTitle: 'Life Manager starts with Capafy.',
      wedgeBody:
        'The Cloud is designed to prepare and distribute Capafy work, check provider receipts, and report verified progress. Capafy requires Publisher Certification and publisher confirmation of selected Skills and configuration before an Agent version can go live. The complete Cloud-to-Capafy path is still being verified end to end.',
      evidenceTitle: 'You control what gets connected.',
      proofLabel: 'identity and account access',
      evidenceBody:
        'Google sign-in verifies identity only. You can enter Life Manager Cloud without granting Calendar or Gmail inbox access, writing a task prompt, or adding goals, a budget, or payout details. Connect services only when an approved workflow needs them. Capafy may require payout setup before you withdraw an available balance.',
      evidenceBoundary:
        'Only provider-confirmed listings and earnings count as results. The complete workflow is still being tested; earnings are not guaranteed.',
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
      publicEyebrow: 'LIFE MANAGER · 先回りして動く総合エージェント',
      publicTitle: 'あなたの人生を、先回りして支えるマネージャー。',
      publicBody:
        '仕事、お金、日々の用事、体と心を一つに扱うマネージャーです。日々の指示を待たずに優先順位を選び、許可された作業を進め、結果を確認します。Life Manager Cloudは専用のMaritime VMで動きます。Googleログインは本人確認のみです。登録時にCalendarやGmail受信箱へのアクセス、作業指示、目標、予算、受取口座情報は必要ありません。最初の収益化ワークフローはCapafyです。CloudからCapafyまでの全行程は現在検証中で、収益は保証されません。',
      primaryCta: 'Life Manager Cloudを始める',
      localSurface: 'オープンソースのコア · 自分で実行',
      cloudSurface: 'Cloud · 専用Maritime VM',
      surfacesLabel: 'ひとつの製品、ふたつの実行方法',
      organsTitle: '人生全体を、ひとつのマネージャーで。',
      organs: [
        { index: '01', title: 'お金と仕事', body: '仕事の機会を探し、制作・配信を進め、完了と収益を確認します。' },
        { index: '02', title: '日々の仕事と用事', body: '優先順位、予定、応募、フォローアップを調整し、完了記録を残します。' },
        { index: '03', title: '体と心', body: '習慣や日々のリズム、ウェルビーイングも同じマネージャーで支えます。' },
      ],
      wedgeEyebrow: '最初のCloud収益ワークフロー',
      wedgeTitle: 'Life ManagerはCapafyから始めます。',
      wedgeBody:
        'CloudはCapafy向けの作業を準備・配信し、プロバイダーの記録を確認し、検証済みの進捗を報告する設計です。Agentの公開前にはCapafy Publisher Certificationと、選択したSkills・設定の発行者確認が必要です。CloudからCapafyまでの全行程は現在エンドツーエンドで検証中です。',
      evidenceTitle: '接続する情報はあなたが管理できます。',
      proofLabel: '本人確認とアカウント接続',
      evidenceBody:
        'Googleログインは本人確認だけに使います。CalendarやGmail受信箱へのアクセス、作業指示、目標、予算、受取口座情報を登録せずにCloudへ進めます。承認したワークフローで必要になったサービスだけ接続します。Capafy残高を引き出す際には、Capafy側で受取設定が必要になる場合があります。',
      evidenceBoundary:
        '結果として扱うのは、プロバイダーが確認した公開記録と収益だけです。全行程は検証中で、収益は保証されません。',
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
