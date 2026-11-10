import AffirmationLanding from '@/components/affirmation/AffirmationLanding';
import JsonLd from '@/components/JsonLd';

export const metadata = {
  title: "Free Daily Affirmations App for iPhone, No Streaks | Anicca",
  description:
    "Anicca is a free daily affirmations app for iPhone: pick your topics (self-criticism, overthinking, anxiety) and get short, kind affirmation cards by notification. No streaks. Optional in-app subscription.",
  alternates: {
    canonical: 'https://aniccaai.com/affirmation-app',
    languages: {
      en: 'https://aniccaai.com/affirmation-app',
      ja: 'https://aniccaai.com/affirmation-app/ja',
    },
  },
};

const APP_STORE_URL = 'https://apps.apple.com/app/id6755129214';

const SAME_AS = [
  APP_STORE_URL,
  'https://www.saashub.com/anicca-ai',
  'https://www.youtube.com/@anicca-ai',
  'https://dev.to/aniccaapp',
];

const ANSWER_BLOCK =
  'Anicca – Daily Affirmations is a free iPhone app that puts one short, believable affirmation on your Lock Screen every day. You pick from 13 self-care topics, such as anxiety, self-doubt and overthinking, and the app sends gentle cards by notification and widget. There are no streaks and nothing to catch up on when you miss a day.';

const STATS_BLOCK =
  'Measured, not promised: App Store Connect recorded 930 impressions, 85 product-page views and 15 downloads for Anicca in the 28 days from 11 October to 7 November 2026 (published on our blog, dated 8 November 2026). The design follows Wood, Perunovic & Lee (2009), who found forced positive self-statements can backfire for people with low self-esteem — so Anicca\u2019s lines are written to be believable, not loud.';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Anicca – Daily Affirmations',
  alternateName: 'Daily Affirmations - Anicca',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'iOS 16.6+',
  url: 'https://aniccaai.com/affirmation-app',
  description: metadata.description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  downloadUrl: `${APP_STORE_URL}?pt=93486075&ct=affirmation_app_en&mt=8`,
  sameAs: SAME_AS,
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com', sameAs: SAME_AS },
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: "What is Anicca?", acceptedAnswer: { '@type': 'Answer', text: "Anicca is an iPhone affirmation app with short cards for difficult days. Choose the areas you want support with to get started." } },
    { '@type': 'Question', name: "How do I receive cards?", acceptedAnswer: { '@type': 'Answer', text: "Choose the topics you want support with, then allow notifications on your iPhone to receive cards. You can manage notification permission in iPhone Settings." } },
    { '@type': 'Question', name: "What does Anicca mean?", acceptedAnswer: { '@type': 'Answer', text: "Anicca is a Pāli word for impermanence: things change. It is the idea behind the app's gentle tone." } },
    { '@type': 'Question', name: "How much does it cost?", acceptedAnswer: { '@type': 'Answer', text: "Anicca is free to download with optional in-app subscriptions. Available plans, local prices, and renewal terms are shown on the purchase screen." } },
    { '@type': 'Question', name: "Which iPhones are supported?", acceptedAnswer: { '@type': 'Answer', text: "Anicca requires iOS 16.6 or later. Check the App Store listing for current compatibility." } },
    { '@type': 'Question', name: "Where can I read about privacy?", acceptedAnswer: { '@type': 'Answer', text: "The Privacy Policy is linked from the App Store listing. Read it for details about how your data is handled." } },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={faqLd} />
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px 0", lineHeight: 1.75 }}>
        <h2>What is Anicca – Daily Affirmations?</h2>
        <p>{ANSWER_BLOCK}</p>
        <p>{STATS_BLOCK}</p>
      </section>
      <AffirmationLanding locale="en" />
      <nav aria-label="Guides and FAQ" style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 48px" }}><h2>Guides and FAQ</h2><ul><li><a href="/blog/best-affirmation-apps-2026-11-05">Best affirmation apps for iPhone, tested and compared</a></li><li><a href="/affirmation-app-faq/">Anicca FAQ</a></li><li><a href="/guides/best-free-affirmation-app-iphone/">Best free daily affirmation app for iPhone</a></li><li><a href="/guides/affirmation-reminder-app/">How to set daily affirmation reminders on iPhone</a></li><li><a href="/ja/best-affirmation-apps">アファメーションアプリおすすめ比較（日本語）</a></li></ul></nav>
    </>
  );
}
