import AffirmationLanding from '@/components/affirmation/AffirmationLanding';
import JsonLd from '@/components/JsonLd';

export const metadata = {
  title: "自分にやさしい言葉を。毎日のアファメーション | Anicca",
  description:
    "Aniccaは、自己否定や考えすぎ、難しい日に読む短いカードを届けるiPhoneのアファメーションアプリです。悩みを選び、通知を有効にして受け取ります。無料ダウンロード、任意のアプリ内サブスクリプション。",
  alternates: {
    canonical: 'https://aniccaai.com/affirmation-app/ja',
    languages: {
      en: 'https://aniccaai.com/affirmation-app',
      ja: 'https://aniccaai.com/affirmation-app/ja',
    },
  },
};

const APP_STORE_URL_JP = 'https://apps.apple.com/jp/app/id6755129214';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Daily Affirmations - Anicca',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'iOS 16.6+',
  inLanguage: 'ja',
  url: 'https://aniccaai.com/affirmation-app/ja',
  description: metadata.description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  downloadUrl: `${APP_STORE_URL_JP}?pt=93486075&ct=affirmation_app_ja&mt=8`,
  sameAs: [APP_STORE_URL_JP],
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: "Aniccaとは？", acceptedAnswer: { '@type': 'Answer', text: "Aniccaは、難しい日に読む短いカードを届けるiPhoneのアファメーションアプリです。気になる悩みを選ぶところから始めます。" } },
    { '@type': 'Question', name: "カードはどう受け取りますか？", acceptedAnswer: { '@type': 'Answer', text: "気になる悩みを選び、iPhoneで通知を許可するとカードを受け取れます。通知の許可はiPhoneの「設定」で管理できます。" } },
    { '@type': 'Question', name: "Aniccaの意味は？", acceptedAnswer: { '@type': 'Answer', text: "パーリ語で「無常」、物事は移り変わるという意味です。アプリのやさしい言葉の背景にある考え方です。" } },
    { '@type': 'Question', name: "料金は？", acceptedAnswer: { '@type': 'Answer', text: "ダウンロードは無料で、任意のアプリ内サブスクリプションがあります。利用できるプラン、地域ごとの料金、更新条件は購入画面で確認できます。" } },
    { '@type': 'Question', name: "対応するiPhoneは？", acceptedAnswer: { '@type': 'Answer', text: "iOS 16.6以降に対応しています。最新の対応条件はApp Storeの商品ページで確認できます。" } },
    { '@type': 'Question', name: "プライバシーについてはどこで確認できますか？", acceptedAnswer: { '@type': 'Answer', text: "App Storeの商品ページからプライバシーポリシーを開けます。データの取り扱いについて、そちらで確認できます。" } },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={faqLd} />
      <AffirmationLanding locale="ja" />
    </>
  );
}
