import JsonLd from '../../components/JsonLd';

const D = {
 "lang": "en",
 "canonical": "https://aniccaai.com/best-affirmation-apps",
 "title": "Best Affirmation Apps for iPhone (2026): 6 Compared Honestly",
 "desc": "The best affirmation apps in 2026 compared: I am, Innertune, Mantra, Selfpause, ThinkUp and Anicca. Who each app is for, what is free, and the trade-offs.",
 "h1": "The best affirmation apps in 2026, compared honestly",
 "intro": [
  "Most affirmation apps do the same core job: put a kind sentence in front of you often enough that it starts to stick. They differ in how that sentence reaches you (widget, audio, notification), whether you can use your own voice, and how much is locked behind a subscription.",
  "Short answer: for most iPhone users, I am is the safe default. If you would rather listen than read, pick Innertune. If you want your own voice, pick Selfpause or ThinkUp. If you keep installing apps and forgetting to open them, try Anicca, which sends one short line at the time you usually struggle."
 ],
 "apps": [
  {
   "name": "I am – Daily Affirmations",
   "url": "https://apps.apple.com/us/app/i-am-daily-affirmations/id874656917",
   "best": "Best overall",
   "why": "The largest and most established library. A new affirmation on your Lock Screen and Home Screen widgets every day, reminders, and focus areas like self-esteem or confidence. Around 736,000 App Store ratings at 4.8.",
   "note": "Free version includes widgets. Premium is a subscription or one-time purchase; check the App Store for current prices."
  },
  {
   "name": "Innertune",
   "url": "https://apps.apple.com/us/app/innertune-daily-affirmations/id6443625379",
   "best": "Best for listening",
   "why": "Audio playlists of affirmations with background beats for sleep, focus or relaxation, plus recording in your own voice. Good if you prefer to press play and let it loop.",
   "note": "Free to start; premium unlocks voices, beats and offline downloads."
  },
  {
   "name": "Mantra – Daily Affirmations",
   "url": "https://apps.apple.com/us/app/id1202851636",
   "best": "Best Apple-only pick",
   "why": "iPhone, iPad and Apple Watch, more than 30 categories, separate daytime and bedtime reminders, and room to write and record your own lines.",
   "note": "Offers a lifetime option. Keep your own copies of recordings."
  },
  {
   "name": "Selfpause",
   "url": "https://www.selfpause.com/",
   "best": "Best for your own voice + guided sessions",
   "why": "Record your own affirmations, layer music and binaural sounds, and use 1,000+ guided sessions. Built around a three-minute daily habit.",
   "note": "Freemium."
  },
  {
   "name": "ThinkUp",
   "url": "https://thinkup.me/",
   "best": "Long-running own-voice app",
   "why": "One of the original record-it-yourself affirmation apps, with music under your recordings and reminders.",
   "note": "Freemium."
  },
  {
   "name": "Anicca",
   "url": "https://apps.apple.com/app/id6755129214?pt=93486075&ct=seo_best_affirm&mt=8",
   "best": "Best if you forget to open apps",
   "why": "Instead of waiting to be opened, Anicca asks what you are struggling with (13 types such as anxiety, self-doubt, rumination, late nights) and sends one short, specific line by notification at those moments. No streaks, no feed. Small and new compared with the apps above.",
   "note": "Free to download with optional subscription; basic features are free. iPhone only. Disclosure: we make it."
  }
 ],
 "method": [
  "We started from the apps that rank in Google and the App Store for \"affirmation app\", then read their App Store pages, pricing screens and recent reviews. Ratings counts come from the App Store pages at the time of writing and change over time.",
  "We list our own app, Anicca, last and say so clearly. It is far smaller than I am or Innertune; it is listed because it solves a different problem (forgetting to open the app), not because it is the biggest."
 ],
 "faq": [
  [
   "What is the best free affirmation app?",
   "I am has the most useful free tier for most people because the free version already includes Lock Screen and Home Screen widgets."
  ],
  [
   "Which affirmation app lets me use my own voice?",
   "Selfpause, ThinkUp, Innertune and Mantra all let you record your own affirmations."
  ],
  [
   "Do affirmation apps work?",
   "They are a habit tool, not therapy. They help most when the sentence reaches you at the moment you need it, which is why widgets and well-timed reminders matter more than library size."
  ]
 ],
 "cta": [
  "See Anicca on the App Store",
  "https://apps.apple.com/app/id6755129214?pt=93486075&ct=seo_best_affirm&mt=8"
 ]
} as const;

export function generateMetadata() {
  return { title: D.title, description: D.desc, alternates: { canonical: D.canonical, languages: { en: 'https://aniccaai.com/best-affirmation-apps', ja: 'https://aniccaai.com/ja/best-affirmation-apps' } },
    openGraph: { title: D.title, description: D.desc, url: D.canonical, type: 'article' } };
}

const s = { main: { maxWidth: 760, margin: '0 auto', padding: '48px 20px', lineHeight: 1.75, fontFamily: 'system-ui, sans-serif', color: '#1f2328' }, card: { border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', margin: '16px 0' }, small: { color: '#57606a', fontSize: 14 } };

export default function Page() {
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: D.h1, inLanguage: D.lang, dateModified: '2026-10-23', author: { '@type': 'Organization', name: 'Anicca' }, mainEntityOfPage: D.canonical },
    { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: D.apps.map((a, i) => ({ '@type': 'ListItem', position: i + 1, name: a.name, url: a.url })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: D.faq.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) },
  ];
  return <main style={s.main} lang={D.lang}>
    <JsonLd data={{ '@context': 'https://schema.org', '@graph': ld }} />
    <h1>{D.h1}</h1>
    <p style={s.small}>{(D.lang as string) === 'ja' ? '更新日: 2026年10月23日｜開示: 筆者はAniccaの開発者です。' : 'Updated October 23, 2026 · Disclosure: the author makes Anicca, one of the apps below.'}</p>
    {D.intro.map((p, i) => <p key={i}>{p}</p>)}
    <h2>{(D.lang as string) === 'ja' ? '比較一覧' : 'The shortlist'}</h2>
    {D.apps.map((a, i) => <section key={a.name} style={s.card}>
      <h3>{i + 1}. <a href={a.url} rel="nofollow noopener">{a.name}</a> — {a.best}</h3>
      <p>{a.why}</p>
      <p style={s.small}>{a.note}</p>
    </section>)}
    <h2>{(D.lang as string) === 'ja' ? '選び方と調べ方' : 'How we picked'}</h2>
    {D.method.map((p, i) => <p key={i}>{p}</p>)}
    <h2>FAQ</h2>
    {D.faq.map(f => <div key={f[0]}><h3>{f[0]}</h3><p>{f[1]}</p></div>)}
    <p><a href={D.cta[1]}>{D.cta[0]}</a></p>
  </main>;
}
