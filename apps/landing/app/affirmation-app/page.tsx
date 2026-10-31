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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Daily Affirmations - Anicca',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'iOS 16.6+',
  url: 'https://aniccaai.com/affirmation-app',
  description: metadata.description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  downloadUrl: `${APP_STORE_URL}?pt=93486075&ct=affirmation_app_en&mt=8`,
  sameAs: [APP_STORE_URL],
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
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
      <AffirmationLanding locale="en" />
    </>
  );
}
