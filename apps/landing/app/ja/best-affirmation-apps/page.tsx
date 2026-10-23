import JsonLd from '../../../components/JsonLd';

const D = {
 "lang": "ja",
 "canonical": "https://aniccaai.com/ja/best-affirmation-apps",
 "title": "アファメーションアプリおすすめ6選【2026年・iPhone】正直に比較",
 "desc": "2026年のアファメーションアプリを比較。I am、Innertune、Mantra、Selfpause、ThinkUp、Anicca。無料でできること、向いている人、弱点まで正直にまとめました。",
 "h1": "アファメーションアプリおすすめ6選【2026年版】",
 "intro": [
  "アファメーションアプリの役割はほぼ同じです。前向きな言葉を、定着するまで何度も目に入れること。違いは、言葉の届き方（ウィジェット・音声・通知）、自分の声で録音できるか、どこまで無料かです。",
  "結論：迷ったら I am。聞き流したいなら Innertune。自分の声で唱えたいなら Selfpause か ThinkUp。アプリを入れても開かなくなる人は、つらい時間に一行だけ届く Anicca を試してください。"
 ],
 "apps": [
  {
   "name": "I am – Daily Affirmations",
   "url": "https://apps.apple.com/jp/app/id874656917",
   "best": "総合おすすめ",
   "why": "一番大きく実績のあるアプリ。毎日ロック画面とホーム画面のウィジェットに新しい言葉が出て、リマインダーやテーマ選択もあります。App Storeの評価は約73万件で4.8。",
   "note": "無料版でもウィジェットが使えます。有料プランの価格はApp Storeで確認してください。英語中心。"
  },
  {
   "name": "Innertune",
   "url": "https://apps.apple.com/jp/app/id6443625379",
   "best": "聞き流し派に",
   "why": "睡眠・集中・リラックス用のBGM付きでアファメーションを再生。自分の声の録音もできます。",
   "note": "無料で開始、有料で声やBGMが増えます。英語のみ。"
  },
  {
   "name": "Mantra – Daily Affirmations",
   "url": "https://apps.apple.com/jp/app/id1202851636",
   "best": "Apple製品で揃えたい人に",
   "why": "iPhone・iPad・Apple Watch対応。30以上のカテゴリ、昼と寝る前で別のリマインダー、自作の言葉と録音。",
   "note": "買い切りあり。録音は自分でもバックアップを。"
  },
  {
   "name": "Selfpause",
   "url": "https://www.selfpause.com/",
   "best": "自分の声＋ガイド",
   "why": "自分の声で録音し、音楽やバイノーラル音を重ねられます。ガイドセッションも1,000以上。",
   "note": "基本無料。英語。"
  },
  {
   "name": "ThinkUp",
   "url": "https://thinkup.me/",
   "best": "自分の声で唱える定番",
   "why": "自分で録音するタイプの古参アプリ。録音にBGMを重ね、リマインダーで再生。",
   "note": "基本無料。"
  },
  {
   "name": "Anicca（アニッチャ）",
   "url": "https://apps.apple.com/jp/app/id6755129214?pt=93486075&ct=seo_best_affirm_ja&mt=8",
   "best": "アプリを開かなくなる人に",
   "why": "開かれるのを待たず、最初に悩み（不安・自己否定・反芻・夜更かしなど13種類）を選ぶと、その時間に短い一行が通知で届きます。日本語対応。ストリークやフィードはありません。上の5つより規模はずっと小さいアプリです。",
   "note": "ダウンロード無料、基本機能は無料、有料プランあり。iPhoneのみ。開示：筆者が開発しています。"
  }
 ],
 "method": [
  "Googleと App Storeで「アファメーション アプリ」の上位に出るアプリから選び、App Storeのページ、料金画面、最近のレビューを読みました。評価件数は執筆時点の数字で、変わります。",
  "自分たちのアプリ Anicca は最後に置き、開発者であることを明記しています。一番大きいからではなく、「開くのを忘れる」という別の問題を解くアプリなので載せています。"
 ],
 "faq": [
  [
   "無料で使えるアファメーションアプリは？",
   "多くの人には I am がおすすめです。無料版でもウィジェットが使えます。日本語で使いたいなら Anicca も基本機能は無料です。"
  ],
  [
   "自分の声で録音できるアプリは？",
   "Selfpause、ThinkUp、Innertune、Mantra で録音できます。"
  ],
  [
   "アファメーションアプリは効果がある？",
   "治療ではなく習慣づくりの道具です。言葉が必要な瞬間に届くかどうかが大事なので、ライブラリの量より、ウィジェットや通知のタイミングで選ぶのがおすすめです。"
  ]
 ],
 "cta": [
  "App StoreでAniccaを見る",
  "https://apps.apple.com/jp/app/id6755129214?pt=93486075&ct=seo_best_affirm_ja&mt=8"
 ]
} as const;

export function generateMetadata() {
  return { title: D.title, description: D.desc, alternates: { canonical: D.canonical, languages: { en: 'https://aniccaai.com/best-affirmation-apps', ja: 'https://aniccaai.com/ja/best-affirmation-apps' } },
    openGraph: { title: D.title, description: D.desc, url: D.canonical, type: 'article' } };
}

const s = { main: { maxWidth: 760, margin: '0 auto', padding: '48px 20px', lineHeight: 1.75, fontFamily: 'system-ui, sans-serif', color: '#1f2328' }, card: { border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', margin: '16px 0' }, small: { color: '#57606a', fontSize: 14 } };

export default function Page() {
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: D.h1, inLanguage: D.lang, dateModified: '2026-10-23', author: { '@type': 'Person', name: 'Daisuke Narita' }, mainEntityOfPage: D.canonical },
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
