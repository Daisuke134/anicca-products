/* eslint-disable react/no-unescaped-entities */
import Image from 'next/image';
import Link from 'next/link';
import PhoneFrame from './PhoneFrame';

type Locale = 'en' | 'ja';

const APP_STORE_URL_US =
  'https://apps.apple.com/us/app/daily-affirmations-anicca/id6755129214?pt=93486075&ct=affirmation_landing_en&mt=8';
const APP_STORE_URL_JP =
  'https://apps.apple.com/jp/app/id6755129214?pt=93486075&ct=affirmation_landing_ja&mt=8';

type Copy = {
  navBack: string;
  navLang: string;
  eyebrow: string;
  heroLine1: React.ReactNode;
  heroLine2: React.ReactNode;
  heroSub: string;
  ctaPrimary: string;
  platform: string;
  platformMeta: string;
  badges: string[];
  proofRow: string;

  storyEyebrow: string;
  storyHeading: React.ReactNode;
  storyBody: string;

  notesEyebrow: string;
  notesHeading: React.ReactNode;
  notesBody: string;
  notes: { time: string; text: string }[];

  showcaseEyebrow: string;
  showcaseHeading: React.ReactNode;
  showcase: { title: string; body: string; img: string }[];

  voicesEyebrow: string;
  voicesHeading: React.ReactNode;
  voicesBody: string;
  voices: { line: string; tag: string }[];

  vsEyebrow: string;
  vsHeading: React.ReactNode;
  vsThemHeader: string;
  vsRows: { label: string; them: string; us: string }[];

  pricingEyebrow: string;
  pricingHeading: React.ReactNode;
  free: { name: string; price: string; bullets: string[] };
  pro: { name: string; price: string; sub: string; bullets: string[]; cta: string };

  faqEyebrow: string;
  faqHeading: React.ReactNode;
  faq: { q: string; a: string }[];

  closeEyebrow: string;
  closeLine: React.ReactNode;
  closeBody: string;
  closeCta: string;
  closeMeta: string;
  closeBack: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    navBack: '← anicca.ai',
    navLang: 'JA',
    eyebrow: 'Anicca · Daily affirmations for iPhone',
    heroLine1: (
      <>
        Daily<br />affirmations
      </>
    ),
    heroLine2: <em className="not-italic text-gold/90">for a kinder<br />inner voice.</em>,
    heroSub:
      'When self-criticism gets loud, make room for a kinder thought. Anicca is an iPhone affirmation app: choose what you are struggling with, enable notifications, and receive short cards to read.',
    ctaPrimary: 'Download on the App Store',
    platform: 'iPhone',
    platformMeta: 'Daily affirmation cards',
    badges: [
      'iOS 16.6+',
      'Short cards',
      'Choose your topics',
      'Notifications',
      'Free download',
    ],
    proofRow: 'Choose your topics · Enable notifications · Read a short card',

    storyEyebrow: 'I. The premise',
    storyHeading: (
      <>
        A little less<br />
        <em className="text-mist">hard on yourself.</em>
      </>
    ),
    storyBody:
      'Some days your inner voice is harsher than you would be to a friend. Anicca offers short affirmation cards for those difficult days. Start by choosing the areas you want support with.',

    notesEyebrow: 'II. Everyday words',
    notesHeading: (
      <>
        A short card,<br />
        <em className="text-mist">a gentler thought.</em>
      </>
    ),
    notesBody:
      'A few examples of gentle words for difficult days.',
    notes: [
      {
        time: 'Example 01',
        text: 'You can be a work in progress and still speak to yourself with kindness.',
      },
      {
        time: 'Example 02',
        text: 'You do not have to solve every thought today. One breath is enough for this moment.',
      },
      {
        time: 'Example 03',
        text: 'Rest does not need to be earned. You can let today be enough.',
      },
    ],

    showcaseEyebrow: 'III. Three screens, three small steps',
    showcaseHeading: (
      <>
        Built like a <em className="text-mist">monastery</em>,<br />
        moves like an <em className="text-mist">app</em>.
      </>
    ),
    showcase: [
      {
        title: 'Choose what is on your mind',
        body: 'Choose the concerns that matter to you during setup.',
        img: '/screenshots/en/onboarding.png',
      },
      {
        title: 'Allow a little reminder',
        body: 'Enable notifications on your iPhone to receive affirmation cards. You can manage notification permission in iPhone Settings.',
        img: '/screenshots/en/notification.png',
      },
      {
        title: 'Read a short card',
        body: 'Open a card and take a moment with its words. A small reading pause, with no long session to work through.',
        img: '/screenshots/en/nudge-card.png',
      },
    ],

    voicesEyebrow: 'IV. Example words',
    voicesHeading: (
      <>
        A few words,<br />
        <em className="text-mist">shown as examples.</em>
      </>
    ),
    voicesBody:
      'Example affirmations for a kinder inner voice.',
    voices: [
      {
        line: 'You are allowed to disappoint people who never asked how you were.',
        tag: 'example · self-kindness',
      },
      {
        line: 'The version of you from a year ago would be proud you are still here.',
        tag: 'example · self-doubt',
      },
      {
        line: 'A storm is not a sign that you built the house wrong.',
        tag: 'example · overthinking',
      },
      {
        line: 'You can want the thing and not be ready for the thing on the same day.',
        tag: 'example · self-doubt',
      },
      {
        line: 'Rest is not the reward for finishing. It is the requirement for continuing.',
        tag: 'example · rest',
      },
      {
        line: 'Anicca means impermanence. The feeling you are in right now is also passing.',
        tag: 'example · impermanence',
      },
    ],

    vsEyebrow: 'V. For difficult days',
    vsHeading: (
      <>
        What is on your mind,<br />
        <em className="text-mist">and a small next step.</em>
      </>
    ),
    vsThemHeader: 'The situation',
    vsRows: [
      { label: 'Self-talk', them: 'Your inner critic is loud', us: 'Read a short affirmation card' },
      { label: 'Overthinking', them: 'Thoughts keep circling', us: 'Choose the concerns you want support with' },
      { label: 'Reminders', them: 'You want a moment to pause', us: 'Enable notifications to receive cards' },
      { label: 'Attention', them: 'A long session feels like too much', us: 'Read a short card' },
      { label: 'Next step', them: 'You are deciding whether it fits', us: 'Review Anicca on the App Store' },
    ],

    pricingEyebrow: 'VI. Pricing',
    pricingHeading: (
      <>
        Free to download.<br />
        <em className="text-mist">Choose what fits.</em>
      </>
    ),
    free: {
      name: 'Download',
      price: 'Free',
      bullets: [
        'Anicca for iPhone',
        'Compatibility listed on the App Store',
        'Optional in-app subscriptions',
      ],
    },
    pro: {
      name: 'Optional subscriptions',
      price: 'See in app',
      sub: 'Local prices are shown before you purchase.',
      bullets: [
        'Review available plans in the app',
        'Check the price and renewal terms',
        'Choose whether to subscribe',
      ],
      cta: 'Start with the App Store',
    },

    faqEyebrow: 'VII. Questions',
    faqHeading: <>Things people ask.</>,
    faq: [
      { q: "What is Anicca?", a: "Anicca is an iPhone affirmation app with short cards for difficult days. Choose the areas you want support with to get started." },
      { q: "How do I receive cards?", a: "Choose the topics you want support with, then allow notifications on your iPhone to receive cards. You can manage notification permission in iPhone Settings." },
      { q: "What does Anicca mean?", a: "Anicca is a Pāli word for impermanence: things change. It is the idea behind the app's gentle tone." },
      { q: "How much does it cost?", a: "Anicca is free to download with optional in-app subscriptions. Available plans, local prices, and renewal terms are shown on the purchase screen." },
      { q: "Which iPhones are supported?", a: "Anicca requires iOS 16.6 or later. Check the App Store listing for current compatibility." },
      { q: "Where can I read about privacy?", a: "The Privacy Policy is linked from the App Store listing. Read it for details about how your data is handled." },
    ],

    closeEyebrow: 'VIII. Take it with you',
    closeLine: (
      <>
        "Sabbe sankhārā aniccā."<br />
        <em className="text-mist">All conditioned things shall pass.</em>
      </>
    ),
    closeBody:
      'Carry a few kinder words into your day. Choose your topics, allow notifications, and open a short affirmation card for a moment to read.',
    closeCta: 'Download on the App Store',
    closeMeta: 'iPhone · Free download · Optional in-app subscriptions',
    closeBack: '← back to anicca.ai',
  },

  ja: {
    navBack: '← anicca.ai',
    navLang: 'EN',
    eyebrow: 'Anicca · iPhoneのアファメーションアプリ',
    heroLine1: (
      <>
        自分に<br />やさしい<br />言葉を。
      </>
    ),
    heroLine2: <em className="not-italic text-gold/90">毎日の<br />アファメーション。</em>,
    heroSub:
      '自分を責めてしまう日に、少しやさしい言葉を。Aniccaは、短いカードが届くiPhoneのアファメーションアプリです。気になる悩みを選び、通知を有効にして受け取ります。',
    ctaPrimary: 'App Store で入手',
    platform: 'iPhone',
    platformMeta: '短いアファメーションカード',
    badges: ['iOS 16.6+', '短いカード', '悩みを選ぶ', '通知で受け取る', '無料ダウンロード'],
    proofRow: '悩みを選ぶ · 通知を有効にする · 短いカードを読む',

    storyEyebrow: 'I. 前提',
    storyHeading: (
      <>
        自分にも、<br />
        <em className="text-mist">友達にかけるような言葉を。</em>
      </>
    ),
    storyBody:
      '友達には言わないような厳しい言葉を、自分には向けてしまう日がある。Aniccaは、そんな日に読む短いアファメーションカードを届けます。今気になっている悩みを選ぶところから始めます。',

    notesEyebrow: 'II. 日々の言葉',
    notesHeading: (
      <>
        短いカードで、<br />
        <em className="text-mist">少しやさしい言葉を。</em>
      </>
    ),
    notesBody:
      '難しい日に読む、やさしい言葉の例です。',
    notes: [
      { time: '文面例 01', text: 'まだ途中の自分にも、やさしい言葉をかけていい。' },
      { time: '文面例 02', text: '今日、すべての考えに答えを出さなくていい。今はひと呼吸で十分。' },
      { time: '文面例 03', text: '休むために、何かを成し遂げる必要はない。今日はここまででもいい。' },
    ],

    showcaseEyebrow: 'III. 3つの画面、小さな3歩',
    showcaseHeading: (
      <>
        作りは <em className="text-mist">寺院</em>、<br />
        動きは <em className="text-mist">アプリ</em>。
      </>
    ),
    showcase: [
      {
        title: '気になる悩みを選ぶ',
        body: '初期設定で、今の自分に合う悩みを選びます。',
        img: '/screenshots/ja/onboarding.png',
      },
      {
        title: '通知を有効にする',
        body: 'iPhoneで通知を許可すると、アファメーションカードを受け取れます。通知の許可はiPhoneの「設定」で管理できます。',
        img: '/screenshots/ja/notification.png',
      },
      {
        title: '短いカードを読む',
        body: 'カードを開いて、言葉を読むひとときを。長いセッションに取り組まず、短い文章に目を向けます。',
        img: '/screenshots/ja/nudge-card.png',
      },
    ],

    voicesEyebrow: 'IV. 言葉の例',
    voicesHeading: (
      <>
        自分に向ける、<br />
        <em className="text-mist">短い言葉の文面例。</em>
      </>
    ),
    voicesBody: '自分にやさしい言葉をかけるための文面例です。',
    voices: [
      { line: 'あなたの体調を一度も訊かなかった人を、がっかりさせていい。', tag: '文面例 · 自分へのやさしさ' },
      { line: '一年前のあなたは、今もここにいるあなたを誇りに思っている。', tag: '文面例 · 自信のない日' },
      { line: '嵐は、家の建て方を間違えたという証拠ではない。', tag: '文面例 · 考えすぎ' },
      { line: 'それを欲しがることと、まだその準備ができていないことは、同じ日に成立していい。', tag: '文面例 · 自信のない日' },
      { line: '休息は、終わらせたご褒美ではない。続けるための条件。', tag: '文面例 · 休息' },
      { line: 'アニッチャ は無常という意味。今あなたが感じているこの感覚も、過ぎていく。', tag: '文面例 · 無常' },
    ],

    vsEyebrow: 'V. 難しい日に',
    vsHeading: (
      <>
        今の気持ちと、<br />
        <em className="text-mist">小さな次の一歩。</em>
      </>
    ),
    vsThemHeader: 'こんなとき',
    vsRows: [
      { label: '自分への言葉', them: '自分を責める声が大きい', us: '短いアファメーションカードを読む' },
      { label: '考えすぎ', them: '同じ考えがぐるぐるする', us: '気になる悩みを選ぶ' },
      { label: 'きっかけ', them: '少し立ち止まるきっかけがほしい', us: '通知を有効にしてカードを受け取る' },
      { label: 'ひととき', them: '長いセッションに取り組む余裕がない', us: '短いカードに目を向ける' },
      { label: '次の一歩', them: '自分に合うか確かめたい', us: 'App StoreでAniccaを確認する' },
    ],

    pricingEyebrow: 'VI. 料金',
    pricingHeading: (
      <>
        ダウンロードは無料。<br />
        <em className="text-mist">自分に合うか確かめて。</em>
      </>
    ),
    free: {
      name: 'ダウンロード',
      price: '無料',
      bullets: ['iPhoneのAnicca', '対応条件はApp Storeで確認', '任意のアプリ内サブスクリプション'],
    },
    pro: {
      name: '任意のサブスクリプション',
      price: '購入画面で確認',
      sub: '地域ごとの料金は購入前に表示されます。',
      bullets: [
        'アプリで利用できるプランを確認',
        '料金と更新条件を確認',
        '登録するかを自分で選ぶ',
      ],
      cta: 'App Store で始める',
    },

    faqEyebrow: 'VII. よくある質問',
    faqHeading: <>聞かれること。</>,
    faq: [
      { q: "Aniccaとは？", a: "Aniccaは、難しい日に読む短いカードを届けるiPhoneのアファメーションアプリです。気になる悩みを選ぶところから始めます。" },
      { q: "カードはどう受け取りますか？", a: "気になる悩みを選び、iPhoneで通知を許可するとカードを受け取れます。通知の許可はiPhoneの「設定」で管理できます。" },
      { q: "Aniccaの意味は？", a: "パーリ語で「無常」、物事は移り変わるという意味です。アプリのやさしい言葉の背景にある考え方です。" },
      { q: "料金は？", a: "ダウンロードは無料で、任意のアプリ内サブスクリプションがあります。利用できるプラン、地域ごとの料金、更新条件は購入画面で確認できます。" },
      { q: "対応するiPhoneは？", a: "iOS 16.6以降に対応しています。最新の対応条件はApp Storeの商品ページで確認できます。" },
      { q: "プライバシーについてはどこで確認できますか？", a: "App Storeの商品ページからプライバシーポリシーを開けます。データの取り扱いについて、そちらで確認できます。" },
    ],

    closeEyebrow: 'VIII. 持ち帰る',
    closeLine: (
      <>
        「諸行無常。」<br />
        <em className="text-mist">構築されたすべては、移ろう。</em>
      </>
    ),
    closeBody:
      '毎日に、自分へ向けるやさしい言葉を。気になる悩みを選び、通知を許可して、届いた短いアファメーションカードを読むところから。',
    closeCta: 'App Store で入手',
    closeMeta: 'iPhone · 無料ダウンロード · 任意のアプリ内サブスクリプション',
    closeBack: '← anicca.ai に戻る',
  },
};

const SOFT_HEADING = '"opsz" 144, "SOFT" 100';
const SOFT_QUOTE = '"opsz" 96, "SOFT" 80';
const SOFT_BIG_NUM = '"opsz" 144';

export default function AffirmationLanding({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const otherLocale = locale === 'en' ? 'ja' : 'en';
  const otherPath = otherLocale === 'en' ? '/affirmation-app' : '/affirmation-app/ja';
  const appStoreUrl = locale === 'ja' ? APP_STORE_URL_JP : APP_STORE_URL_US;
  const badgeSrc = locale === 'en' ? '/app-store-badge-en.svg' : '/app-store-badge-ja.svg';
  const fontClass = locale === 'ja' ? 'font-serif-jp' : 'font-soft';

  return (
    <div lang={locale} className={fontClass}>
      <div className="relative min-h-dvh bg-[#fdf7ee] text-ink">
        {/* Mini-nav */}
        <header className="sticky top-0 z-40 border-b border-ink/5 bg-[#fdf7ee]/80 backdrop-blur">
          <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5">
            <Link
              href="/"
              className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-mist hover:text-ink"
            >
              {t.navBack}
            </Link>
            <p className="font-soft text-[14px] italic text-ink">anicca</p>
            <Link
              href={otherPath}
              className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-mist hover:text-ink"
            >
              {t.navLang}
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 -z-0 h-[120%]"
            style={{
              background:
                'radial-gradient(ellipse at 75% 0%, rgba(244, 196, 138, 0.55) 0%, rgba(247, 222, 196, 0.30) 25%, transparent 55%), radial-gradient(ellipse at 10% 30%, rgba(204, 178, 220, 0.18) 0%, transparent 45%)',
            }}
          />

          <div className="relative mx-auto grid min-h-[88dvh] max-w-6xl grid-cols-12 items-center gap-x-6 gap-y-12 px-5 py-16 md:py-24">
            <div className="col-span-12 md:col-span-7">
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-mist">
                {t.eyebrow}
              </p>

              <h1
                className="mt-7 font-soft text-[64px] leading-[0.92] tracking-[-0.04em] text-ink sm:text-[88px] md:text-[112px]"
                style={{ fontVariationSettings: SOFT_HEADING }}
              >
                {t.heroLine1}{' '}
                <span className="block">{t.heroLine2}</span>
              </h1>

              <p className="mt-9 max-w-xl text-[18px] leading-[1.6] text-ink-soft sm:text-[20px]">
                {t.heroSub}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-4">
                <a href={appStoreUrl} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={badgeSrc}
                    alt={t.ctaPrimary}
                    width={168}
                    height={56}
                    className="h-14 w-auto"
                  />
                </a>
                <div className="flex items-center gap-2">
                  <span
                    className="font-soft text-[22px] italic text-ink"
                    style={{ fontVariationSettings: '"opsz" 96' }}
                  >
                    {t.platform}
                  </span>
                  <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-mist">
                    {t.platformMeta}
                  </span>
                </div>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-3 gap-y-2 font-mono-ui text-[10px] uppercase tracking-[0.2em] text-mist">
                {t.badges.map((b) => (
                  <li key={b} className="rounded-full border border-ink/15 px-3 py-1.5">
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-12 flex justify-center md:col-span-5 md:justify-end">
              <div className="relative">
                <PhoneFrame
                  src={t.showcase[1].img}
                  alt="Anicca app - incoming notification"
                  variant="lockscreen"
                  width={280}
                  priority
                  tilt="right"
                />
                <div
                  className="pointer-events-none absolute -left-12 top-[18%] hidden w-[260px] rounded-2xl bg-white/90 p-3 shadow-2xl backdrop-blur md:block"
                  style={{ boxShadow: '0 18px 40px -12px rgba(20,20,30,0.35)' }}
                >
                  <div className="flex items-start gap-2.5">
                    <Image
                      src="/anicca-app-icon.png"
                      alt="Anicca app icon"
                      width={28}
                      height={28}
                      className="mt-0.5 h-7 w-7 shrink-0 rounded-md"
                    />
                    <div className="min-w-0">
                      <p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-mist">
                        anicca · {locale === 'ja' ? '文面例' : 'example'}
                      </p>
                      <p className="mt-0.5 truncate font-soft text-[13px] italic text-ink">
                        {t.notes[2].text.slice(0, 64)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl border-t border-ink/10 px-5 py-5">
            <p className="text-center font-mono-ui text-[10px] uppercase tracking-[0.28em] text-mist">
              {t.proofRow}
            </p>
          </div>
        </section>

        {/* STORY */}
        <section className="relative px-5 py-28 sm:py-36">
          <div className="mx-auto grid max-w-6xl grid-cols-12 gap-x-6 gap-y-10">
            <div className="col-span-12 md:col-span-4">
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.28em] text-mist">
                {t.storyEyebrow}
              </p>
            </div>
            <div className="col-span-12 md:col-span-8">
              <h2
                className="font-soft text-[42px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]"
                style={{ fontVariationSettings: SOFT_HEADING }}
              >
                {t.storyHeading}
              </h2>
              <p className="mt-8 max-w-2xl text-[19px] leading-[1.65] text-ink-soft sm:text-[21px]">
                {t.storyBody}
              </p>
            </div>
          </div>
        </section>

        {/* DAY-WITH */}
        <section className="relative bg-[#f6ecdc] px-5 py-28 sm:py-36">
          <div
            aria-hidden
            className="absolute inset-0 -z-0 opacity-50"
            style={{
              background:
                'radial-gradient(ellipse at 20% 20%, rgba(244, 196, 138, 0.25) 0%, transparent 50%)',
            }}
          />
          <div className="relative mx-auto grid max-w-6xl grid-cols-12 gap-x-6 gap-y-10">
            <div className="col-span-12 md:col-span-4">
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.28em] text-mist">
                {t.notesEyebrow}
              </p>
              <h2
                className="mt-3 font-soft text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[52px]"
                style={{ fontVariationSettings: SOFT_HEADING }}
              >
                {t.notesHeading}
              </h2>
              <p className="mt-6 max-w-sm text-[16px] leading-[1.65] text-ink-soft">
                {t.notesBody}
              </p>
            </div>
            <div className="col-span-12 md:col-span-8">
              <ul className="space-y-4">
                {t.notes.map((n, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-5 rounded-2xl border border-ink/8 bg-white/70 p-5 backdrop-blur sm:p-6"
                    style={{ boxShadow: '0 8px 24px -16px rgba(20,20,30,0.18)' }}
                  >
                    <div className="shrink-0">
                      <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mist">
                        {n.time}
                      </p>
                      <p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-gold">
                        anicca
                      </p>
                    </div>
                    <p
                      className="font-soft text-[18px] leading-[1.55] text-ink sm:text-[20px]"
                      style={{ fontVariationSettings: SOFT_QUOTE }}
                    >
                      "{n.text}"
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SHOWCASE */}
        <section className="relative px-5 py-28 sm:py-36">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-12 gap-x-6 gap-y-10">
              <div className="col-span-12 md:col-span-4">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.28em] text-mist">
                  {t.showcaseEyebrow}
                </p>
                <h2
                  className="mt-3 font-soft text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[52px]"
                  style={{ fontVariationSettings: SOFT_HEADING }}
                >
                  {t.showcaseHeading}
                </h2>
              </div>
              <div className="col-span-12 md:col-span-8" />
            </div>

            <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
              {t.showcase.map((s, i) => (
                <div key={s.title} className="flex flex-col items-center text-center">
                  <PhoneFrame
                    src={s.img}
                    alt={s.title}
                    width={220}
                    tilt={i === 0 ? 'left' : i === 2 ? 'right' : 'none'}
                  />
                  <p className="mt-7 font-mono-ui text-[11px] uppercase tracking-[0.22em] text-mist">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3
                    className="mt-2 font-soft text-[24px] italic text-ink"
                    style={{ fontVariationSettings: '"opsz" 96' }}
                  >
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-[15px] leading-[1.6] text-ink-soft">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VOICES */}
        <section className="relative bg-ink px-5 py-28 text-cream sm:py-36">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-12 gap-x-6 gap-y-10">
              <div className="col-span-12 md:col-span-4">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.28em] text-cream/55">
                  {t.voicesEyebrow}
                </p>
                <h2
                  className="mt-3 font-soft text-[40px] leading-[1.05] tracking-[-0.02em] text-cream sm:text-[52px]"
                  style={{ fontVariationSettings: SOFT_HEADING }}
                >
                  {t.voicesHeading}
                </h2>
                <p className="mt-6 max-w-sm text-[15px] leading-[1.65] text-cream/70">
                  {t.voicesBody}
                </p>
              </div>
              <div className="col-span-12 md:col-span-8">
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {t.voices.map((v, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-6 transition-colors hover:bg-cream/[0.07]"
                    >
                      <p
                        className="font-soft text-[19px] leading-[1.45] italic text-cream sm:text-[21px]"
                        style={{ fontVariationSettings: '"opsz" 96, "SOFT" 100' }}
                      >
                        "{v.line}"
                      </p>
                      <p className="mt-4 font-mono-ui text-[10px] uppercase tracking-[0.2em] text-cream/45">
                        {v.tag}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* VS */}
        <section className="relative px-5 py-28 sm:py-36">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-12 gap-x-6 gap-y-10">
              <div className="col-span-12 md:col-span-4">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.28em] text-mist">
                  {t.vsEyebrow}
                </p>
                <h2
                  className="mt-3 font-soft text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[52px]"
                  style={{ fontVariationSettings: SOFT_HEADING }}
                >
                  {t.vsHeading}
                </h2>
              </div>
              <div className="col-span-12 md:col-span-8">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-ink/15 font-mono-ui text-[10px] uppercase tracking-[0.2em] text-mist">
                      <th className="py-3 pr-3 font-normal"> </th>
                      <th className="py-3 pr-3 font-normal">{t.vsThemHeader}</th>
                      <th className="py-3 font-normal">{locale === 'ja' ? 'アニッチャ' : 'Anicca'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.vsRows.map((r, i) => (
                      <tr key={i} className="border-b border-ink/10">
                        <td className="py-5 pr-3 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-mist">
                          {r.label}
                        </td>
                        <td
                          className="py-5 pr-3 font-soft text-[16px] text-mist"
                          style={{ fontVariationSettings: '"opsz" 96' }}
                        >
                          {r.them}
                        </td>
                        <td
                          className="py-5 font-soft text-[18px] italic text-ink"
                          style={{ fontVariationSettings: SOFT_QUOTE }}
                        >
                          {r.us}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="relative bg-[#f6ecdc] px-5 py-28 sm:py-36">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-12 gap-x-6 gap-y-10">
              <div className="col-span-12 md:col-span-4">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.28em] text-mist">
                  {t.pricingEyebrow}
                </p>
                <h2
                  className="mt-3 font-soft text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[52px]"
                  style={{ fontVariationSettings: SOFT_HEADING }}
                >
                  {t.pricingHeading}
                </h2>
              </div>
              <div className="col-span-12 grid gap-5 md:col-span-8 md:grid-cols-2">
                <div className="rounded-3xl border border-ink/10 bg-white/60 p-7 backdrop-blur">
                  <p className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-mist">
                    {t.free.name}
                  </p>
                  <p
                    className="mt-4 font-soft text-[42px] tracking-tight text-ink"
                    style={{ fontVariationSettings: SOFT_BIG_NUM }}
                  >
                    {t.free.price}
                  </p>
                  <ul className="mt-6 space-y-2.5 text-[14px] text-ink-soft">
                    {t.free.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-ink/30" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="relative rounded-3xl bg-ink p-7 text-cream"
                  style={{ boxShadow: '0 24px 48px -16px rgba(20,20,30,0.4)' }}
                >
                  <p className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-gold">
                    {t.pro.name}
                  </p>
                  <p
                    className="mt-4 font-soft text-[42px] tracking-tight text-cream"
                    style={{ fontVariationSettings: SOFT_BIG_NUM }}
                  >
                    {t.pro.price}
                  </p>
                  <p className="mt-1 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-cream/55">
                    {t.pro.sub}
                  </p>
                  <ul className="mt-6 space-y-2.5 text-[14px] text-cream/85">
                    {t.pro.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-gold" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-mono-ui text-[11px] uppercase tracking-[0.2em] text-ink transition-opacity hover:opacity-90"
                  >
                    {t.pro.cta} →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative px-5 py-28 sm:py-36">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-12 gap-x-6 gap-y-10">
              <div className="col-span-12 md:col-span-4">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.28em] text-mist">
                  {t.faqEyebrow}
                </p>
                <h2
                  className="mt-3 font-soft text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[52px]"
                  style={{ fontVariationSettings: SOFT_HEADING }}
                >
                  {t.faqHeading}
                </h2>
              </div>
              <div className="col-span-12 md:col-span-8">
                <ul className="divide-y divide-ink/10 border-y border-ink/10">
                  {t.faq.map((f, i) => (
                    <li key={i} className="grid grid-cols-12 items-baseline gap-4 py-7">
                      <span className="col-span-1 font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mist">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="col-span-11">
                        <p
                          className="font-soft text-[20px] italic text-ink sm:text-[22px]"
                          style={{ fontVariationSettings: SOFT_QUOTE }}
                        >
                          {f.q}
                        </p>
                        <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-ink-soft sm:text-[16px]">
                          {f.a}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING */}
        <section className="relative overflow-hidden bg-ink px-5 py-32 text-cream sm:py-44">
          <div
            aria-hidden
            className="absolute inset-0 -z-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 100%, rgba(214, 167, 92, 0.18) 0%, transparent 60%)',
            }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-cream/55">
              {t.closeEyebrow}
            </p>
            <p
              className="mt-8 font-soft text-[40px] italic leading-[1.15] text-cream sm:text-[60px]"
              style={{ fontVariationSettings: SOFT_HEADING }}
            >
              {t.closeLine}
            </p>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-[1.65] text-cream/75 sm:text-[19px]">
              {t.closeBody}
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
              <a href={appStoreUrl} target="_blank" rel="noopener noreferrer">
                <Image
                  src={badgeSrc}
                  alt={t.closeCta}
                  width={180}
                  height={60}
                  className="h-14 w-auto"
                />
              </a>
              <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-cream/55">
                {t.closeMeta}
              </p>
            </div>
            {locale === 'ja' ? (
              <Link
                href="/affirmation-app/ja/a"
                className="mt-8 inline-block border-b border-cream/30 font-mono-ui text-[11px] tracking-[0.12em] text-cream/70 hover:border-gold hover:text-gold"
              >
                悩み別アファメーションを読む →
              </Link>
            ) : (
              <>
                <section className="mx-auto mt-14 max-w-lg text-left">
                  <h2 className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-cream/55">
                    Read
                  </h2>
                  <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-cream/80">
                    <li>
                      <Link
                        href="/affirmation-app/a/overthinking-at-night"
                        className="border-b border-cream/25 hover:border-gold hover:text-gold"
                      >
                        Overthinking at night
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/affirmation-app/a/self-doubt"
                        className="border-b border-cream/25 hover:border-gold hover:text-gold"
                      >
                        Affirmations for self-doubt
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/affirmation-app/a/comparing-yourself"
                        className="border-b border-cream/25 hover:border-gold hover:text-gold"
                      >
                        Stop comparing yourself
                      </Link>
                    </li>
                  </ul>
                </section>
                <Link
                  href="/affirmation-app/en/quiz"
                  className="mt-8 inline-block border-b border-cream/30 font-mono-ui text-[11px] tracking-[0.12em] text-cream/70 hover:border-gold hover:text-gold"
                >
                  Take the free Mind Habits Quiz →
                </Link>
              </>
            )}
            <Link
              href="/"
              className="mt-12 inline-block border-b border-cream/30 font-mono-ui text-[11px] uppercase tracking-[0.2em] text-cream/70 hover:border-gold hover:text-gold"
            >
              {t.closeBack}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
