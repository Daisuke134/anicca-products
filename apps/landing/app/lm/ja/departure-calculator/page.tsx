import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import DepartureCalculator from '@/components/tools/DepartureCalculator';

const CANONICAL = 'https://aniccaai.com/lm/ja/departure-calculator';
const TITLE = '出発時刻計算機｜何時に家を出ればいい？移動時間と余裕から逆算（無料）｜Life Manager';
const DESCRIPTION =
  '予定の開始時刻から移動時間と余裕を引いて、出発時刻を逆算。日付またぎにも対応。.icsでカレンダーに追加できます。登録不要・入力は送信されません。';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['出発時刻 計算', '何時に出ればいい', '逆算 時間 計算', '遅刻しない 方法', '移動時間 カレンダー'],
  alternates: {
    canonical: CANONICAL,
    languages: { ja: CANONICAL },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: 'https://aniccaai.com/og/departure-calculator-ja.png',
        width: 1200,
        height: 630,
        alt: '出発時刻計算機',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://aniccaai.com/og/departure-calculator-ja.png'],
  },
};

const webAppLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '出発時刻計算機',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Any',
  url: CANONICAL,
  inLanguage: 'ja',
  description: DESCRIPTION,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '計算式は？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '出発時刻＝開始時刻−移動時間−余裕。準備がある場合は、出発からさらに準備時間を引きます。',
      },
    },
    {
      '@type': 'Question',
      name: '.ics はどのカレンダーで使えますか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'iOS / Google / macOS / Outlook などでインポートできます。時刻はUTCで書き出します。',
      },
    },
    {
      '@type': 'Question',
      name: '入力は送信されますか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'いいえ。入力内容は送信されません。URLクエリは共有用にブラウザ内だけで反映されます。',
      },
    },
  ],
};

export default function Page() {
  return (
    <main lang="ja">
      <JsonLd data={webAppLd} />
      <JsonLd data={faqLd} />
      <DepartureCalculator />
    </main>
  );
}
