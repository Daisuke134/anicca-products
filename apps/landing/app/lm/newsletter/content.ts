// /lm/newsletter — copy and sample-issue data for the Life Manager daily gig newsletter.
//
// Every number in SAMPLE_ISSUE was read from the platform's own public page on
// 2026-11-27 (the `source` field links to it, `checked` carries the date). Nothing
// here is invented: if a platform does not publish a deadline, the card says so.
// The live newsletter re-checks each listing before it is sent; this page is a
// dated snapshot, labelled as one.

export type Lang = 'ja' | 'en' | 'es';

export type SampleGig = {
  id: string;
  platform: string;
  title: Record<Lang, string>;
  pay: string;
  payNote: Record<Lang, string>;
  time: Record<Lang, string>;
  phone: Record<Lang, string>;
  steps: Record<Lang, string[]>;
  payout: Record<Lang, string>;
  deadline: Record<Lang, string>;
  source: string;
  checked: string;
};

// Ordered nearest-deadline first. Platforms that publish no deadline are marked
// "open until the listing closes" rather than given a made-up date.
export const SAMPLE_ISSUE: SampleGig[] = [
  {
    id: 'alignerr-ai-training',
    platform: 'Alignerr',
    title: {
      ja: 'AIトレーニング・スペシャリスト',
      en: 'AI Training Specialist',
      es: 'Especialista en entrenamiento de IA',
    },
    pay: '$40–120/hr',
    payNote: {
      ja: '公開求人ページの表示レンジ',
      en: 'range shown on the public job page',
      es: 'rango publicado en la oferta',
    },
    time: {
      ja: '自分のペース（案件単位・柔軟な時間）',
      en: 'Your own schedule (task by task)',
      es: 'A tu ritmo (por tarea)',
    },
    phone: {
      ja: 'スマホ可（ブラウザ）／一部はカメラ面接あり',
      en: 'Phone OK (browser) / some roles add a camera interview',
      es: 'Móvil OK (navegador) / algunas vacantes piden entrevista con cámara',
    },
    steps: {
      ja: ['サインアップ（Googleアカウント）', 'プロフィールとスキルを入力', '評価タスクに応募'],
      en: ['Sign up (Google account)', 'Fill in profile and skills', 'Apply to an evaluation task'],
      es: ['Regístrate (cuenta de Google)', 'Completa perfil y habilidades', 'Postúlate a una tarea'],
    },
    payout: {
      ja: 'Alignerr との時間契約（USD）',
      en: 'Hourly contract with Alignerr (USD)',
      es: 'Contrato por horas con Alignerr (USD)',
    },
    deadline: {
      ja: '常時募集（掲載終了まで）',
      en: 'Open until the listing closes',
      es: 'Abierta hasta que cierre la oferta',
    },
    source: 'https://www.alignerr.com/',
    checked: '2026-11-27',
  },
  {
    id: 'alignerr-finance-es',
    platform: 'Alignerr',
    title: {
      ja: 'Finance Analyst（スペイン語必須）',
      en: 'Finance Analyst (Spanish required)',
      es: 'Analista financiero (español obligatorio)',
    },
    pay: '$25–80/hr',
    payNote: {
      ja: '求人ページの表示レンジ',
      en: 'range on the job page',
      es: 'rango en la oferta',
    },
    time: {
      ja: '柔軟な時間（非同期・自分のペース）',
      en: 'Flexible hours (async, your own pace)',
      es: 'Horario flexible (asíncrono)',
    },
    phone: {
      ja: 'スマホ可（ブラウザ）',
      en: 'Phone OK (browser)',
      es: 'Móvil OK (navegador)',
    },
    steps: {
      ja: ['サインアップ', 'スペイン語＋財務の経歴を入力', '書類レビュー案件に応募'],
      en: ['Sign up', 'Add Spanish + finance background', 'Apply to document-review tasks'],
      es: ['Regístrate', 'Añade tu experiencia en español y finanzas', 'Postúlate a revisión de documentos'],
    },
    payout: {
      ja: 'Alignerr との時間契約（USD）',
      en: 'Hourly contract with Alignerr (USD)',
      es: 'Contrato por horas con Alignerr (USD)',
    },
    deadline: {
      ja: '常時募集（掲載終了まで）',
      en: 'Open until the listing closes',
      es: 'Abierta hasta que cierre la oferta',
    },
    source: 'https://www.alignerr.com/jobs/be0d99af-cca8-40d5-bf0f-3cbd8da8bce3',
    checked: '2026-11-27',
  },
  {
    id: 'usertesting-15min',
    platform: 'UserTesting',
    title: {
      ja: '15〜20分のユーザーテスト',
      en: '15–20 minute user test',
      es: 'Prueba de usuario de 15–20 minutos',
    },
    pay: '$10 / test',
    payNote: {
      ja: '5〜7分は$4、30分のモデレーテッドは$30（同社ヘルプ記載）',
      en: '$4 for 5–7 min, $30 for a 30-min moderated test (company help page)',
      es: '$4 por 5–7 min, $30 por prueba moderada de 30 min (centro de ayuda)',
    },
    time: {
      ja: '15〜20分（1回で完結）',
      en: '15–20 minutes (one sitting)',
      es: '15–20 minutos (una sesión)',
    },
    phone: {
      ja: 'スマホ可（iOS / Android アプリ）',
      en: 'Phone OK (iOS / Android app)',
      es: 'Móvil OK (app iOS / Android)',
    },
    steps: {
      ja: ['コントリビューター登録', 'スクリーナー（事前質問）に回答', '画面と音声を録画して提出'],
      en: ['Register as a contributor', 'Answer the screener', 'Record screen and voice, submit'],
      es: ['Regístrate como colaborador', 'Responde el filtro', 'Graba pantalla y voz y envía'],
    },
    payout: {
      ja: 'PayPal（完了の14日後）',
      en: 'PayPal (14 days after completion)',
      es: 'PayPal (14 días después)',
    },
    deadline: {
      ja: 'テストごとの募集枠（フィードに出た時点が期限）',
      en: 'Per-test slots — the feed shows what is open now',
      es: 'Cupos por prueba — el feed muestra lo disponible',
    },
    source:
      'https://help.usertesting.com/hc/en-us/articles/11880240002845-Participant-compensation',
    checked: '2026-11-27',
  },
  {
    id: 'questionpro-ux',
    platform: 'QuestionPro UX（旧 Trymata）',
    title: {
      ja: 'Webサイト・アプリのユーザビリティテスト',
      en: 'Website and app usability test',
      es: 'Prueba de usabilidad de webs y apps',
    },
    pay: '$5–30 / test',
    payNote: {
      ja: 'テスター登録ページの表示レンジ',
      en: 'range shown on the tester signup page',
      es: 'rango en la página de registro',
    },
    time: {
      ja: '15〜20分（+短い事後アンケート）',
      en: '15–20 minutes (+ short wrap-up survey)',
      es: '15–20 minutos (+ encuesta breve)',
    },
    phone: {
      ja: 'スマホ可（モバイルテスト）／PCテストはPC',
      en: 'Phone OK (mobile tests) / desktop tests need a PC',
      es: 'Móvil OK (pruebas móviles) / las de escritorio piden PC',
    },
    steps: {
      ja: ['テスター登録（PayPalメール）', 'プロフィールと端末を登録', '招待されたテストを録画'],
      en: ['Register as a tester (PayPal email)', 'Add profile and devices', 'Record an invited test'],
      es: ['Regístrate (correo de PayPal)', 'Completa perfil y dispositivos', 'Graba una prueba invitada'],
    },
    payout: {
      ja: 'PayPal（承認後の平日に送金）',
      en: 'PayPal (weekday payouts after grading)',
      es: 'PayPal (días laborables tras la revisión)',
    },
    deadline: {
      ja: '招待制（届いたテストの期限に従う）',
      en: 'Invitation-based — each test carries its own deadline',
      es: 'Por invitación — cada prueba trae su plazo',
    },
    source: 'https://www.trymata.com/testers',
    checked: '2026-11-27',
  },
  {
    id: 'dscout-studies',
    platform: 'dscout',
    title: {
      ja: 'スマホ完結の調査スタディ（日記型・インタビュー）',
      en: 'Phone-first research studies (diary and interviews)',
      es: 'Estudios de investigación en el móvil (diario y entrevistas)',
    },
    pay: '$25–150 / study',
    payNote: {
      ja: '同社ヘルプの「多くのスタディは$25〜$150」',
      en: 'the help centre says most studies pay $25–$150',
      es: 'el centro de ayuda indica $25–$150 en la mayoría',
    },
    time: {
      ja: '数日〜数週間（日記型）／単発セッション',
      en: 'Several days to weeks (diary) or a single session',
      es: 'Varios días o semanas (diario) o una sesión',
    },
    phone: {
      ja: 'スマホ必須（アプリで録画・投稿）',
      en: 'Phone required (record in the app)',
      es: 'Móvil obligatorio (graba en la app)',
    },
    steps: {
      ja: ['応募（スクリーナーは無報酬）', '選ばれたらスタディ参加', '期限内に全アクティビティを提出'],
      en: ['Apply (screeners are unpaid)', 'If selected, join the study', 'Finish every activity on time'],
      es: ['Postúlate (los filtros no se pagan)', 'Si te eligen, entra al estudio', 'Completa todo a tiempo'],
    },
    payout: {
      ja: 'PayPal（承認後、締切から10営業日以内）',
      en: 'PayPal (within 10 business days of closing)',
      es: 'PayPal (en 10 días hábiles tras el cierre)',
    },
    deadline: {
      ja: 'スタディごとの応募期限（アプリに表示）',
      en: 'Per-study deadline (shown in the app)',
      es: 'Plazo por estudio (visible en la app)',
    },
    source: 'https://participanthelp.dscout.com/getting-paid/frequently-asked-questions',
    checked: '2026-11-27',
  },
];

export const INTEREST_KEYS = ['voice', 'evaluation', 'testing', 'research', 'apps'] as const;
export type InterestKey = (typeof INTEREST_KEYS)[number];

type Copy = {
  metaTitle: string;
  metaDescription: string;
  navBack: string;
  eyebrow: string;
  h1: string;
  sub: string;
  cta: string;
  ctaSecondary: string;
  heroPoints: string[];
  howTitle: string;
  how: { index: string; title: string; body: string }[];
  issueEyebrow: string;
  issueTitle: string;
  issueSub: string;
  issueLabels: {
    pay: string;
    time: string;
    phone: string;
    steps: string;
    payout: string;
    deadline: string;
    source: string;
    checked: string;
  };
  issueNote: string;
  formEyebrow: string;
  formTitle: string;
  formBody: string;
  q1: string;
  q2: string;
  q2Hint: string;
  q3: string;
  q4: string;
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successBody: string;
  errorBody: string;
  consent: string;
  interests: Record<InterestKey, string>;
  devicePhone: string;
  deviceBoth: string;
  planTitle: string;
  plans: { name: string; price: string; lines: string[]; tag?: string }[];
  planNote: string;
  limitsTitle: string;
  limits: string[];
  faqTitle: string;
  faq: { q: string; a: string }[];
};

export const COPY: Record<Lang, Copy> = {
  ja: {
    metaTitle: 'Life Manager — スマホで稼げるドル案件を、毎朝1通・締切順で',
    metaDescription:
      'XやDiscordを毎日漁るのは終わり。スマホ5〜20分で終わる実在のドル案件を、報酬額（USD）・所要時間・スマホ可否・直リンク付きで毎日1通。日本語・English・Español、締切が近い順。無料で登録できます。',
    navBack: 'Life Manager に戻る',
    eyebrow: 'Life Manager · デイリーニュースレター',
    h1: '毎朝、スマホで稼げる案件だけを。締切が近い順に。',
    sub: 'XとDiscordを1時間スクロールして、結局なにも応募しない——その往復をなくします。スマホ5〜20分で終わる実在の案件を、報酬額（USD）・所要時間・スマホ可否・必要手順・直リンク付きで、毎日1通だけ。',
    cta: '明日の号を受け取る（無料）',
    ctaSecondary: '届く中身を見る',
    heroPoints: ['毎日1通・締切順', 'スマホ完結だけを抽出', '日本語 / English / Español'],
    howTitle: '登録から受取まで、3ステップ。',
    how: [
      { index: '01', title: '2分でオンボーディング', body: '言語・興味・使う端末・メールアドレス。それだけで、次の配信からあなた向けに絞られます。' },
      { index: '02', title: '毎朝、受信箱に1通', body: '10件以上の実在案件を、締切が近い順に。報酬額・所要時間・スマホ可否・手順・直リンク付き。' },
      { index: '03', title: 'タップして応募、USDで受取', body: '応募はあなたのアカウントで。報酬はプラットフォームから直接あなたへ支払われます。' },
    ],
    issueEyebrow: 'サンプル号 #000',
    issueTitle: '実際に届く中身（2026-11-27 時点で確認した公開条件）',
    issueSub:
      '報酬・所要時間・受取方法は各プラットフォームの公開ページで確認した値です。締切が表示されていない案件は「常時募集」と書きます。数字を盛りません。',
    issueLabels: {
      pay: '報酬',
      time: '所要時間',
      phone: 'スマホ',
      steps: '手順',
      payout: '受取',
      deadline: '締切',
      source: '出典',
      checked: '確認日',
    },
    issueNote:
      '実際の号では、送信の直前に各リンクと条件を再確認し、締切が近い順に並べます。掲載後の変更は各リンク先の表示が正です。当選や報酬を保証するものではありません。',
    formEyebrow: 'オンボーディング（約2分）',
    formTitle: '明日の号から、あなた向けに絞ります。',
    formBody: '4つ答えるだけ。カードは不要で、いつでも1クリックで解除できます。',
    q1: '① ネイティブ言語',
    q2: '② 興味のある作業（複数選択）',
    q2Hint: '近いものを選ぶほど、届く案件が絞られます。',
    q3: '③ 主に使う環境',
    q4: '④ メールアドレス',
    emailLabel: 'メールアドレス',
    emailPlaceholder: 'you@example.com',
    submit: '無料で登録する',
    submitting: '送信中…',
    successTitle: '登録できました。',
    successBody: '次の号から、選んだ言語と興味に合わせて届きます。解除はメール内のリンク1つで完了します。',
    errorBody: '送信できませんでした。通信環境を確認して、もう一度お試しください。',
    consent: '保存するのはメールアドレス・言語・興味・端末の種類だけです。第三者に販売しません。',
    interests: {
      voice: 'AI音声・会話収録',
      evaluation: 'AI評価・フィードバック',
      testing: 'ユーザーテスト',
      research: 'リサーチ・執筆',
      apps: 'アプリ検証',
    },
    devicePhone: 'スマホのみ',
    deviceBoth: 'スマホ＋PC',
    planTitle: '無料と Pro の違い',
    plans: [
      {
        name: 'Free',
        price: '¥0',
        lines: ['週1回のダイジェスト', '厳選3〜5件', '締切・報酬・スマホ可否つき', '言語別'],
      },
      {
        name: 'Pro',
        price: '価格は確定後に案内',
        tag: '先行登録受付中',
        lines: ['毎日1通・全件（10件以上）', '締切アラート', '言語別の最適化', 'スマホ完結フィルタ'],
      },
    ],
    planNote:
      'Pro の価格は現在確定していません。決まった時点で、登録者に最初に案内します。登録は無料で、カードは要りません。',
    limitsTitle: '私たちがやらないこと',
    limits: [
      'あなたの代わりに応募しない（応募はあなたのアカウントで）',
      'パスワードや本人確認書類を預からない',
      '存在しない案件・確認していない報酬額を載せない',
      '報酬を預からない（支払いは各プラットフォームから直接）',
    ],
    faqTitle: 'よくある質問',
    faq: [
      {
        q: '本当にPCなしで完結しますか？',
        a: '各案件に「スマホ可」「PC推奨」を明記します。カメラ面接やデスクトップ用テストのようにPCが要るものは、そう書きます。',
      },
      {
        q: '報酬はどこから支払われますか？',
        a: '案件を出しているプラットフォームから直接あなたへ支払われます。私たちは報酬を預かりません。金額はプラットフォームの公開条件のまま載せます。',
      },
      {
        q: 'どんな情報を保存しますか？',
        a: 'メールアドレス、言語、興味、端末の種類だけです。第三者に販売しません。解除はメール内のリンク1つで完了します。',
      },
      {
        q: '無料でいいのですか？',
        a: '無料のダイジェストは週1回です。毎日・全件・締切アラートは Pro になります。価格が決まったら登録者に先に案内します。',
      },
    ],
  },
  en: {
    metaTitle: 'Life Manager — the dollar gigs you can do on your phone, one email each morning',
    metaDescription:
      'Stop doomscrolling X and Discord. One email a day with real gigs you can finish on your phone in 5–20 minutes, each with USD pay, time needed, phone-OK status and a direct link. Japanese, English, Spanish — nearest deadline first. Free to join.',
    navBack: 'Back to Life Manager',
    eyebrow: 'Life Manager · daily newsletter',
    h1: 'Each morning: only the gigs you can do on your phone. Nearest deadline first.',
    sub: 'An hour of scrolling X and Discord, and nothing gets applied to. We send one email a day with real gigs that take 5–20 minutes on your phone, each with USD pay, time needed, phone-OK status, the exact steps and a direct link.',
    cta: "Get tomorrow's issue (free)",
    ctaSecondary: 'See what lands',
    heroPoints: ['One email a day, deadline order', 'Phone-only listings only', '日本語 / English / Español'],
    howTitle: 'From signup to payout, three steps.',
    how: [
      { index: '01', title: 'Two-minute onboarding', body: 'Language, interests, the device you use, your email. From the next issue, it is filtered for you.' },
      { index: '02', title: 'One email, every morning', body: 'Ten or more real listings, nearest deadline first, with pay, time, phone-OK status, steps and a direct link.' },
      { index: '03', title: 'Tap, apply, get paid in USD', body: 'You apply with your own account. Platforms pay you directly — we never hold your money.' },
    ],
    issueEyebrow: 'Sample issue #000',
    issueTitle: 'What actually lands (public terms as checked on 2026-11-27)',
    issueSub:
      'Pay, time and payout go as the platform publishes them. Where a platform publishes no deadline, we say "open until it closes" instead of inventing a date.',
    issueLabels: {
      pay: 'Pay',
      time: 'Time',
      phone: 'Phone',
      steps: 'Steps',
      payout: 'Payout',
      deadline: 'Deadline',
      source: 'Source',
      checked: 'Checked',
    },
    issueNote:
      'In the live issue we re-check every link and term right before sending and sort by nearest deadline. If a platform changes something later, its own page is the source of truth. No selection or payout is guaranteed.',
    formEyebrow: 'Onboarding (about 2 minutes)',
    formTitle: 'From tomorrow, it is filtered for you.',
    formBody: 'Four answers. No card, and one click to stop.',
    q1: '① Native language',
    q2: '② What work do you want? (pick any)',
    q2Hint: 'The closer you pick, the tighter the list.',
    q3: '③ Where you work',
    q4: '④ Email address',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    submit: 'Join free',
    submitting: 'Sending…',
    successTitle: "You're in.",
    successBody: 'From the next issue it arrives in the language and interests you picked. Unsubscribe with one link in any email.',
    errorBody: "That didn't go through. Check your connection and try again.",
    consent: 'We store only your email, language, interests and device type. We do not sell it.',
    interests: {
      voice: 'AI voice and conversation recording',
      evaluation: 'AI evaluation and feedback',
      testing: 'User testing',
      research: 'Research and writing',
      apps: 'App testing',
    },
    devicePhone: 'Phone only',
    deviceBoth: 'Phone + PC',
    planTitle: 'Free and Pro',
    plans: [
      {
        name: 'Free',
        price: '$0',
        lines: ['Weekly digest', '3–5 hand-picked gigs', 'Deadline, pay and phone-OK on each', 'By language'],
      },
      {
        name: 'Pro',
        price: 'Price announced after it is final',
        tag: 'Early list open',
        lines: ['Daily, every listing (10+)', 'Deadline alerts', 'Language-tuned picks', 'Phone-only filter'],
      },
    ],
    planNote:
      'Pro pricing is not final yet. When it is, subscribers hear first. Joining now is free and needs no card.',
    limitsTitle: "What we won't do",
    limits: [
      "Apply on your behalf — applications stay in your own account",
      'Hold your password or identity documents',
      'List a gig that does not exist, or a pay number we have not checked',
      'Hold your earnings — platforms pay you directly',
    ],
    faqTitle: 'Questions',
    faq: [
      {
        q: 'Is it really phone-only?',
        a: 'Every card says whether it works on a phone or needs a PC. Camera interviews and desktop tests are labelled as such.',
      },
      {
        q: 'Who pays me?',
        a: 'The platform that posted the gig pays you directly. We never hold the money, and we print the published rate as it is.',
      },
      {
        q: 'What do you store?',
        a: 'Your email, language, interests and device type. Nothing sold. One link unsubscribes you.',
      },
      {
        q: 'What is free?',
        a: 'The weekly digest is free. Daily delivery with every listing and deadline alerts is Pro; subscribers hear the price first.',
      },
    ],
  },
  es: {
    metaTitle: 'Life Manager — trabajos en dólares que puedes hacer desde el móvil, cada mañana',
    metaDescription:
      'Deja de perder tiempo en X y Discord. Un correo al día con trabajos reales que terminas en el móvil en 5–20 minutos: pago en USD, tiempo, si sirve el móvil y enlace directo. Japonés, inglés y español, por fecha límite.',
    navBack: 'Volver a Life Manager',
    eyebrow: 'Life Manager · boletín diario',
    h1: 'Cada mañana, solo los trabajos que puedes hacer desde el móvil. Por fecha límite.',
    sub: 'Una hora de scroll en X y Discord y no te postulas a nada. Nosotros enviamos un correo al día con trabajos reales de 5–20 minutos en el móvil: pago en USD, tiempo, si basta el móvil, los pasos y un enlace directo.',
    cta: 'Recibe el número de mañana (gratis)',
    ctaSecondary: 'Ver qué llega',
    heroPoints: ['Un correo al día, por plazo', 'Solo lo que se hace en el móvil', '日本語 / English / Español'],
    howTitle: 'De la suscripción al pago, tres pasos.',
    how: [
      { index: '01', title: 'Dos minutos de alta', body: 'Idioma, intereses, dispositivo y correo. Desde el siguiente número llega filtrado para ti.' },
      { index: '02', title: 'Un correo cada mañana', body: 'Diez o más ofertas reales, primero la fecha límite más cercana, con pago, tiempo, si sirve el móvil, pasos y enlace.' },
      { index: '03', title: 'Toca, postúlate, cobra en USD', body: 'Te postulas con tu cuenta. La plataforma te paga directamente: nunca retenemos tu dinero.' },
    ],
    issueEyebrow: 'Número de muestra #000',
    issueTitle: 'Lo que llega de verdad (condiciones públicas revisadas el 2026-11-27)',
    issueSub:
      'El pago, el tiempo y el cobro son los que publica cada plataforma. Si no publica fecha límite, escribimos "abierta hasta que cierre" en vez de inventar una fecha.',
    issueLabels: {
      pay: 'Pago',
      time: 'Tiempo',
      phone: 'Móvil',
      steps: 'Pasos',
      payout: 'Cobro',
      deadline: 'Plazo',
      source: 'Fuente',
      checked: 'Revisado',
    },
    issueNote:
      'En el número real revisamos cada enlace y condición justo antes de enviar y ordenamos por plazo. Si algo cambia después, manda la página de la plataforma. No garantizamos selección ni pago.',
    formEyebrow: 'Alta (unos 2 minutos)',
    formTitle: 'Desde mañana, filtrado para ti.',
    formBody: 'Cuatro respuestas. Sin tarjeta y con un clic para darte de baja.',
    q1: '① Idioma nativo',
    q2: '② ¿Qué trabajo quieres? (varias opciones)',
    q2Hint: 'Cuanto más concreto, más ajustada la lista.',
    q3: '③ Dónde trabajas',
    q4: '④ Correo electrónico',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@ejemplo.com',
    submit: 'Suscribirme gratis',
    submitting: 'Enviando…',
    successTitle: 'Ya estás dentro.',
    successBody: 'Desde el próximo número llega en el idioma e intereses que elegiste. Baja con un enlace en cualquier correo.',
    errorBody: 'No se pudo enviar. Revisa la conexión e inténtalo otra vez.',
    consent: 'Guardamos solo tu correo, idioma, intereses y tipo de dispositivo. No lo vendemos.',
    interests: {
      voice: 'Voz y conversación para IA',
      evaluation: 'Evaluación de IA',
      testing: 'Pruebas de usuario',
      research: 'Investigación y redacción',
      apps: 'Pruebas de apps',
    },
    devicePhone: 'Solo móvil',
    deviceBoth: 'Móvil + PC',
    planTitle: 'Gratis y Pro',
    plans: [
      {
        name: 'Free',
        price: '0 $',
        lines: ['Resumen semanal', '3–5 ofertas elegidas', 'Plazo, pago y móvil en cada una', 'Por idioma'],
      },
      {
        name: 'Pro',
        price: 'Precio cuando esté cerrado',
        tag: 'Lista anticipada abierta',
        lines: ['Diario, todas las ofertas (10+)', 'Avisos de plazo', 'Selección por idioma', 'Filtro solo móvil'],
      },
    ],
    planNote:
      'El precio de Pro aún no está cerrado. Cuando lo esté, los suscriptores lo sabrán primero. Ahora es gratis y sin tarjeta.',
    limitsTitle: 'Lo que no hacemos',
    limits: [
      'Postularme por ti: las postulaciones van con tu cuenta',
      'Guardar tu contraseña ni tus documentos',
      'Publicar ofertas que no existen ni pagos sin revisar',
      'Retener tu dinero: cada plataforma te paga directamente',
    ],
    faqTitle: 'Preguntas',
    faq: [
      {
        q: '¿De verdad todo es desde el móvil?',
        a: 'Cada tarjeta dice si sirve el móvil o hace falta PC. Las entrevistas con cámara y las pruebas de escritorio se indican.',
      },
      {
        q: '¿Quién me paga?',
        a: 'La plataforma que publica la oferta te paga directamente. Nunca retenemos el dinero y mostramos la tarifa publicada tal cual.',
      },
      {
        q: '¿Qué datos guardáis?',
        a: 'Correo, idioma, intereses y tipo de dispositivo. No se venden. Un enlace te da de baja.',
      },
      {
        q: '¿Qué es gratis?',
        a: 'El resumen semanal es gratis. El envío diario con todas las ofertas y avisos de plazo es Pro; los suscriptores conocen el precio antes.',
      },
    ],
  },
};

export const LANG_OPTIONS: { value: Lang; label: string; tag: string }[] = [
  { value: 'ja', label: '日本語', tag: 'JA' },
  { value: 'en', label: 'English', tag: 'EN' },
  { value: 'es', label: 'Español', tag: 'ES' },
];
