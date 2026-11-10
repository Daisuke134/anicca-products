import Image from 'next/image';
import JsonLd from '@/components/JsonLd';
import './honne.css';

export const metadata = {
  title: 'Honne: AI Chat Analysis & Reply Suggestions',
  description: 'Unsure how to reply to a message? Explore its possible tone with Honne, an AI chat analysis app for iPhone. Three free analyses per day.',
  alternates: {
    canonical: 'https://aniccaai.com/honne',
    languages: { en: 'https://aniccaai.com/honne', ja: 'https://aniccaai.com/honne/ja' },
  },
};

const APP_STORE_URL = 'https://apps.apple.com/app/honne/id6759667221?pt=93486075&ct=site_honne&mt=8';
const APP_STORE_DOWNLOAD = 'https://apps.apple.com/app/id6759667221';
const honneSoftwareLd = {
  '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Honne',
  operatingSystem: 'iOS', applicationCategory: 'UtilitiesApplication', url: 'https://aniccaai.com/honne',
  description: metadata.description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free download with optional in-app subscriptions.' },
  downloadUrl: APP_STORE_DOWNLOAD, sameAs: [APP_STORE_DOWNLOAD],
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
};
type ContentItem = { title: string; body: string };
const STEPS: ContentItem[] = [
  { title: 'Choose the relationship.', body: 'Start with the context: partner or couple, friend, family, or colleague or boss.' },
  { title: 'Paste the message.', body: 'Bring in the LINE or chat text you want to think through. Leave out names and other personal details that are not needed.' },
  { title: 'Review the interpretation and reply.', body: "Read Honne’s analysis, consider what fits the situation, and adapt the suggested response to your own voice." },
];
const CONTEXTS: ContentItem[] = [
  { title: 'Partner or couple', body: 'A brief message can mean something different inside a longer conversation. Consider the wider context before responding.' },
  { title: 'Friends', body: 'When a casual reply feels difficult to read, look at another possible interpretation before making an assumption.' },
  { title: 'Family', body: 'Think through the wording of your response while keeping your own history with the person in mind.' },
  { title: 'Colleagues or your boss', body: 'When a short work message leaves room for interpretation, decide what needs clarification and what needs a straightforward reply.' },
];
const PLANS: (ContentItem & { scope: string })[] = [
  { title: 'Free', scope: 'Three analyses per day.', body: 'Start with a message you are unsure how to answer.' },
  { title: 'Premium', scope: 'Unlimited analyses and full history.', body: 'For people who want to use Honne more often and revisit past analyses.' },
];
const FAQS: ContentItem[] = [
  { title: 'What does Honne do?', body: 'Honne analyzes text from a LINE or chat message and provides an AI interpretation and a suggested reply. You choose a relationship context to frame the analysis.' },
  { title: 'How do I use a LINE message?', body: 'Copy the message text you want to consider and paste it into Honne. Use the relationship context to frame the analysis, then review the interpretation and reply suggestion.' },
  { title: 'Can Honne tell me what someone really thinks?', body: 'No AI interpretation can confirm another person’s intentions. Use the result as one possible reading, not a factual conclusion.' },
  { title: 'Is it free?', body: 'The free version includes three analyses per day. Optional Premium includes unlimited analyses and full history. Current subscription options and prices are shown in the App Store and in the app.' },
  { title: 'Which devices can I use?', body: 'The App Store lists iPhone and iPad support, requiring iOS 18 or iPadOS 18 or later. Check the listing for compatibility with your device.' },
  { title: 'Is Honne available in English?', body: 'The App Store lists English, and the screenshots on this page come from the current English App Store listing. Check the listing for the latest language and device information.' },
];
const SHOTS = {
  input: { file: '3', alt: 'Honne Tone Translator screen with relationship context controls and a message text-entry field.' },
  context: { file: '2', alt: 'Honne onboarding asking who the user is trying to understand, with Partner, Friend, Coworker, and Family choices.' },
  result: { file: '4', alt: 'Honne analysis example showing an original message, AI interpretation, emotional-state text, and suggested reply.' },
} as const;
function ProductShot({ kind, caption, priority = false }: { kind: keyof typeof SHOTS; caption: string; priority?: boolean }) {
  const shot = SHOTS[kind];
  const src = `/honne/honne-store-en-${shot.file}.webp`;
  return <figure className="honne-shot">
    <a href={src} aria-label={`Enlarge ${kind} screenshot`}>
      <Image src={src} alt={shot.alt} width={1284} height={2778} sizes="(max-width: 900px) 240px, 280px" priority={priority} />
    </a>
    <figcaption>{caption} <a href={src}>View full-size image</a></figcaption>
  </figure>;
}
function Download() { return <a className="honne-download" href={APP_STORE_URL}>Download on the App Store</a>; }

export default function HonneLandingEn() {
  return <main className="honne-page" lang="en">
    <JsonLd data={honneSoftwareLd} />
    <nav className="honne-nav honne-wrap" aria-label="Honne navigation">
      <a href="/honne" className="honne-brand"><Image src="/honne/app-icon.png" alt="" width={36} height={36} />Honne</a>
      <div className="honne-nav-links"><a href="#how-it-works">How it works</a><a href="#inside">Inside the app</a><a href="#plans">Free &amp; Premium</a><a href="#questions">FAQs</a><a href="/honne/ja" lang="ja">日本語</a></div>
    </nav>
    <section className="honne-hero honne-wrap" aria-labelledby="honne-title">
      <div>
        <p>AI chat analysis for iPhone</p>
        <h1 id="honne-title">A second look before you reply.</h1>
        <p className="honne-lead">Paste a message into Honne for an AI interpretation of its tone and a suggested reply.</p>
        <div className="honne-actions"><Download /><a href="#how-it-works">See how it works</a></div>
        <p className="honne-note">Free download. Three analyses a day. Optional Premium.</p>
      </div>
      <ProductShot kind="input" priority caption="Choose the context and paste the message. Shown in Honne’s current App Store screenshots." />
    </section>
    <section className="honne-section honne-soft" aria-labelledby="honne-problem">
      <div className="honne-wrap honne-editorial"><h2 id="honne-problem">The words are clear. The tone isn’t.</h2><div>
        <p>A short reply can leave a lot unsaid. Is it a quick answer, a sign of frustration, or simply someone having a busy day? When you are deciding how to respond, another interpretation can be a useful starting point.</p>
        <p>Honne is for those everyday moments when you want to pause before answering a message from your partner, a friend, a family member, or someone at work.</p>
        <p>It offers a perspective, not proof of what someone means. You know the relationship and the conversation better than an AI does.</p>
      </div></div>
    </section>
    <section className="honne-section honne-wrap" id="how-it-works" aria-labelledby="honne-steps">
      <h2 id="honne-steps">From a message to a possible reply.</h2>
      <ol className="honne-steps">{STEPS.map(item => <li key={item.title}><h3>{item.title}</h3><p>{item.body}</p></li>)}</ol>
    </section>
    <section className="honne-section honne-soft" id="inside" aria-labelledby="honne-proof">
      <div className="honne-wrap honne-split"><div>
        <h2 id="honne-proof">Choose your words.</h2>
        <p className="honne-lead">See the message. Consider the interpretation.</p>
        <p>Honne brings the original message, an AI-generated interpretation, and a suggested response into its analysis view. You can compare the interpretation with the wording instead of treating the result as a verdict.</p>
        <h3>A starting point for your response</h3>
        <p>Use the reply suggestion to think about what you want to say next. Keep what feels accurate, change what does not, and ask the other person when the meaning matters.</p>
      </div><ProductShot kind="result" caption="An example from Honne’s App Store screenshots. The interpretation is generated by AI and may be wrong." /></div>
    </section>
    <section className="honne-section honne-wrap honne-split" aria-labelledby="honne-context">
      <div><h2 id="honne-context">Different relationships. Different context.</h2><div className="honne-contexts">{CONTEXTS.map(item => <div key={item.title}><h3>{item.title}</h3><p>{item.body}</p></div>)}</div></div>
      <ProductShot kind="context" caption="Choose a relationship context. An example from Honne’s current App Store listing." />
    </section>
    <section className="honne-section honne-soft" id="plans" aria-labelledby="honne-plans">
      <div className="honne-wrap"><h2 id="honne-plans">Try the core idea.</h2><p>Choose more if you need it.</p>
        <div className="honne-plans">{PLANS.map(plan => <div key={plan.title}><h3>{plan.title}</h3><p className="honne-lead">{plan.scope}</p><p>{plan.body}</p></div>)}</div>
        <p>Honne is free to download with optional in-app subscriptions. Check the App Store and the in-app purchase screen for current plans and local pricing.</p>
      </div>
    </section>
    <section className="honne-section honne-wrap" id="questions" aria-labelledby="honne-limits">
      <div className="honne-editorial"><div><h2 id="honne-limits">A useful perspective. Not a mind reader.</h2><p>AI can miss context, misunderstand sarcasm, or give a reply that does not fit your relationship. Treat Honne as a thinking aid, not a way to establish facts about another person. If the meaning matters, ask them.</p></div>
      <div className="honne-faqs">{FAQS.map(item => <details key={item.title}><summary>{item.title}</summary><p>{item.body}</p></details>)}
        <details><summary>What should I check before pasting a message?</summary><p>Avoid unnecessary personal or confidential details, and only share text you have permission to use. Read the <a href="/honne/privacy">Privacy Policy</a> before entering information you are not comfortable sharing.</p></details>
      </div></div>
    </section>
    <section className="honne-section honne-closing" aria-labelledby="honne-close"><div className="honne-wrap">
      <h2 id="honne-close">Have a message to think through?</h2><p>Take a second look with Honne, then choose a reply that sounds like you.</p><Download />
      <p className="honne-note">Three free analyses per day. Optional Premium. Requires iOS 18 or later.</p>
    </div></section>
    <footer className="honne-footer honne-wrap"><a href="/dais">More from Anicca</a><nav aria-label="Honne support"><a href="/honne/privacy">Privacy Policy</a><a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Terms of Use (EULA)</a><a href="/honne/support">Support</a><a href="/honne/ja" lang="ja">日本語</a></nav><p>© 2026 Anicca. All rights reserved.</p></footer>
  </main>;
}
