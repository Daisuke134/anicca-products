import { loadPublishedApps } from '../../lib/published-apps';
import JsonLd from '../../components/JsonLd';
import './thankful.css';

const CANONICAL = 'https://aniccaai.com/thankful';
const GUIDE = '/blog/gratitude-journal-repeating-yourself';
const TITLE = 'Thankful: Gratitude Journal for iPhone & iPad';
const DESCRIPTION = 'Keep small moments in Thankful, a gratitude journal with three writing spaces, daily affirmations, calendar history, and streak tracking for iPhone and iPad.';
function thankfulApp() {
  const app = loadPublishedApps().find(app => app.id === '6759514159');
  if (!app) throw new Error('Thankful is missing from the canonical published-app registry');
  return app;
}
export function generateMetadata() {
  return { title: TITLE, description: DESCRIPTION, alternates: { canonical: CANONICAL },
    openGraph: { title: TITLE, description: DESCRIPTION, url: CANONICAL, images: [{ url: new URL(thankfulApp().icon, CANONICAL).href, alt: 'Thankful app icon' }] } };
}
const EXAMPLES = [
  { title: 'A person', text: 'My friend checked in after a long day.' },
  { title: 'A small comfort', text: 'I had ten quiet minutes with my coffee.' },
  { title: 'Something you did', text: 'I started the task I’d been putting off.' },
];
const FEATURES = [
  { title: 'Three spaces for gratitude', text: 'Write something concrete instead of filling a whole page.' },
  { title: 'Daily affirmations', text: 'Read an encouraging line alongside your journal.' },
  { title: 'Calendar history and streaks', text: 'Return to earlier entries and see your journaling routine over time.' },
  { title: 'iPhone and iPad', text: 'Choose the screen that suits the moment.' },
];
const FAQS = [
  { question: 'What is Thankful?', answer: 'Thankful is a gratitude journal for iPhone and iPad. It combines three writing spaces, daily affirmations, a calendar history, and streak tracking in a simple daily practice.' },
  { question: 'What should I write in the three spaces?', answer: 'Start with a specific detail you noticed: something someone said, a small comfort, or something you did. You do not need a polished story or a perfectly positive day.' },
  { question: 'What if I keep being grateful for the same things?', answer: 'Repetition is okay. Try writing what was different about the moment today: what someone said, what you noticed, or why a familiar routine mattered.' },
  { question: 'Is Thankful free?', answer: 'It is free to download, with optional Thankful Pro subscriptions available as in-app purchases. Review the current purchase screen for pricing, included features, and trial eligibility. Free download is not a promise that every paid option is free.' },
  { question: 'Which devices does it support?', answer: 'Thankful is available for iPhone with iOS 17 or later and iPad with iPadOS 17 or later. The App Store lists current compatibility details.' },
  { question: 'Is this a mental-health treatment?', answer: 'Thankful is a journaling tool, not a substitute for professional care. You do not need to use gratitude to dismiss difficult feelings or make every entry positive.' },
];
export default function ThankfulLanding() {
  const app = thankfulApp();
  const download = (label = 'Download on the App Store') => <a className="thankful-download" href={app.store}>{label}</a>;
  return <main className="thankful-page" lang="en">
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Thankful', url: CANONICAL, description: DESCRIPTION, operatingSystem: 'iOS 17 or later; iPadOS 17 or later', applicationCategory: 'LifestyleApplication', downloadUrl: app.store }} />
    <nav className="thankful-wrap thankful-nav" aria-label="Thankful navigation">
      <a className="thankful-brand" href="/thankful"><img src={app.icon} alt="Thankful app icon" width="40" height="40" />Thankful</a>
      <div><a href="#how-it-works">How it works</a><a href="#what-to-write">What to write</a><a href="#questions">Questions</a><a href="/dais">Products</a></div>
    </nav>
    <section className="thankful-wrap thankful-hero" aria-labelledby="thankful-title">
      <div><p>Gratitude journal for iPhone &amp; iPad</p><h1 id="thankful-title">Keep the good in an ordinary day.</h1>
        <p className="thankful-lead">A kind message. A quiet cup of coffee. Something you finally finished. Thankful gives those small moments a place to stay, with three spaces to write, daily affirmations, and a view of your journaling streak.</p>
        <div className="thankful-actions">{download()}<a href="#how-it-works">See how Thankful works</a></div>
        <p className="thankful-note">Free to download. Optional in-app subscriptions. Requires iOS or iPadOS 17 or later.</p>
      </div>
      <figure className="thankful-home"><a href="/assets/thankful/home.png" aria-label="Enlarge Thankful Home screenshot"><img src="/assets/thankful/home.png" alt="Thankful Home screen with a daily affirmation, three gratitude writing spaces and a save button." width="1320" height="2868" loading="eager" /></a><figcaption>Thankful’s Home screen. Write your own moments in the three spaces. <a href="/assets/thankful/home.png">View full-size image</a></figcaption></figure>
    </section>
    <section className="thankful-section thankful-field" aria-labelledby="thankful-audience"><div className="thankful-wrap thankful-editorial"><h2 id="thankful-audience">Your day doesn’t have to be extraordinary.</h2><div>
      <p>If a blank journal page feels like too much, begin with something specific. <strong>A person who made time for you.</strong> A meal you enjoyed. A moment when the day felt a little easier.</p>
      <p>Thankful is for people who want a small, repeatable way to notice those details, whether you’re new to gratitude journaling or returning after a break. You don’t need a polished story or a perfectly positive day.</p>
    </div></div></section>
    <section className="thankful-section thankful-wrap" id="how-it-works" aria-labelledby="thankful-rhythm"><h2 id="thankful-rhythm">A simple rhythm, in your own words.</h2>
      <ol className="thankful-steps"><li><h3>Start with one thing you noticed.</h3><p>Open Thankful and write in the numbered spaces. There’s room for three things. A short, specific sentence is enough to begin.</p></li><li><h3>Pause with an affirmation.</h3><p>Read the affirmation on your Home screen. Keep the words that feel useful in mind as you write. This is a moment for reflection, not a test of how positive you can be.</p></li><li><h3>Return to the moments you saved.</h3><p>Use History’s calendar to revisit an entry by date. Your streak shows the days you’ve returned to the practice. The point is to make space for your life, not to turn a missed day into another thing to feel bad about.</p></li></ol>
      <div className="thankful-history"><div><h3>A place to return to.</h3><p>Find earlier entries by date in History. This example shows the calendar before the first entry.</p>{download('Start your gratitude journal')}</div><figure><a href="/assets/thankful/ipad-history.webp" aria-label="Enlarge Thankful iPad History screenshot"><img src="/assets/thankful/ipad-history.webp" alt="Thankful History screen on iPad with an April calendar and a No entries yet message." width="975" height="1300" loading="lazy" /></a><figcaption>The calendar in Thankful’s iPad app, shown before the first entry. <a href="/assets/thankful/ipad-history.webp">View full-size image</a></figcaption></figure></div>
    </section>
    <section className="thankful-section thankful-field" id="what-to-write" aria-labelledby="thankful-examples"><div className="thankful-wrap"><h2 id="thankful-examples">Not sure what to write? Make it smaller.</h2><p>Instead of finding a new thing every day, notice a new detail. These examples are ideas for your own journal, not preset entries in the app.</p>
      <div className="thankful-examples">{EXAMPLES.map(item => <div key={item.title}><h3>{item.title}</h3><blockquote>“{item.text}”</blockquote></div>)}</div>
      <p>You can appreciate the same person or routine more than once. What happened today is what makes the entry yours.</p><a href={GUIDE}>What to write when your gratitude journal feels repetitive</a>
    </div></section>
    <section className="thankful-section thankful-wrap" aria-labelledby="thankful-features"><h2 id="thankful-features">A few useful things. One small practice.</h2><dl className="thankful-features">{FEATURES.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.text}</dd></div>)}</dl>
      <div className="thankful-cost"><h3>Review any purchase before subscribing.</h3><p>Thankful is free to download and offers optional Thankful Pro subscriptions. Check the App Store and the in-app purchase screen for current prices, included features, and any trial eligibility before you subscribe.</p></div>
    </section>
    <section className="thankful-section thankful-field" id="questions" aria-labelledby="thankful-questions"><div className="thankful-wrap thankful-editorial"><h2 id="thankful-questions">A few things you might want to know.</h2><div className="thankful-faqs">
      {FAQS.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p>{item.question.startsWith('What if') && <a href={GUIDE}>Read the gratitude journaling guide</a>}</details>)}
      <details><summary>Where can I read about data and privacy?</summary><p>Read Thankful’s <a href="/thankful/privacy/en">Privacy Policy</a> for the app’s data-handling details, and contact support if you have a question before writing something personal.</p></details>
    </div></div></section>
    <section className="thankful-section thankful-closing" aria-labelledby="thankful-close"><div className="thankful-wrap"><h2 id="thankful-close">Start with one moment from today.</h2><p>Something small is enough to begin. Give it a place in Thankful.</p>{download()}<p className="thankful-note">Free download · Optional in-app subscriptions · iPhone &amp; iPad</p></div></section>
    <footer className="thankful-wrap thankful-footer"><p><strong>Thankful</strong> · Made by Daisuke Narita</p><nav aria-label="Thankful resources"><a href={GUIDE}>Gratitude journaling guide</a><a href="/blog/c/thankful">All Thankful articles</a><a href="/thankful/privacy/en">Privacy Policy</a><a href="/thankful/terms">Terms of Use</a><a href="mailto:keiodaisuke@gmail.com">Support</a><a href="/dais">More apps</a></nav></footer>
  </main>;
}
