export const metadata = {
  title: 'Creator Partners | Anicca Daily Affirmations App',
  description:
    'Wellness, self-love and mindset creators: get free premium access to Anicca, a daily affirmations app for iPhone, and a revenue share on subscriptions you refer.',
  alternates: { canonical: 'https://aniccaai.com/affirmation-app/creators' },
};

const APP_STORE_URL = 'https://apps.apple.com/app/id6755129214?pt=93486075&ct=creators_page&mt=8';
const MAILTO =
  'mailto:contact@aniccaai.com?subject=Anicca%20creator%20partner&body=Name%3A%0AChannel%20or%20newsletter%20link%3A%0A';

export default function Page() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 16px', lineHeight: 1.6 }}>
      <h1>Anicca creator partners</h1>
      <p>
        Anicca is a daily affirmations app for iPhone. A new affirmation appears on the Lock Screen each day, with short
        cards for self-love, confidence, overthinking and anxiety. No streaks. Free to download with an optional
        subscription.
      </p>
      <h2>What you get</h2>
      <ul>
        <li>Free premium access for you, with no obligation to post.</li>
        <li>A revenue share on subscriptions that come through your link, if you choose to feature Anicca.</li>
        <li>A direct line to the founder for feedback and feature requests.</li>
      </ul>
      <h2>Who it fits</h2>
      <p>
        Creators, coaches, podcasters and newsletter writers in affirmations, self-love, mindset, mental wellness and
        self-care. Small audiences are welcome.
      </p>
      <h2>How to join</h2>
      <p>
        Email <a href={MAILTO}>contact@aniccaai.com</a> with your name and a link to your channel or newsletter. I reply
        personally.
      </p>
      <p>
        <a href={APP_STORE_URL}>See Anicca on the App Store</a> · <a href="/affirmation-app">About the app</a>
      </p>
      <p style={{ fontSize: 14, opacity: 0.8 }}>Daisuke Narita, founder of Anicca</p>
    </main>
  );
}
