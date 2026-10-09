import AffirmationLanding from '@/components/affirmation/AffirmationLanding';
import JsonLd from '@/components/JsonLd';

export const metadata = {
  title: 'アニッチャ - あなたを見つける アファメーション アプリ',
  description:
    'アニッチャ は、心が崩れ始めた瞬間に、一行のやさしさを届ける iOS アプリ。AI でパーソナライズ、無常 (アニッチャ) を核にした、能動的に届くタイプ。ダウンロード無料。',
};

const APP_STORE_URL_JP = 'https://apps.apple.com/jp/app/id6755129214';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Daily Affirmations - Anicca',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'iOS',
  inLanguage: 'ja',
  url: 'https://aniccaai.com/affirmation-app/ja',
  description:
    'アニッチャは、心が崩れ始めた瞬間に一行のやさしさを届ける iOS アファメーションアプリ。ダウンロード無料（任意のアプリ内課金あり）。',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  downloadUrl: APP_STORE_URL_JP,
  sameAs: [APP_STORE_URL_JP],
  publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'アニッチャとは？', acceptedAnswer: { '@type': 'Answer', text: '心が崩れやすい瞬間に、あなた向けに一行のアファメーションを届ける iOS アプリ。フィードでも連続記録でもなく、一行だけ。' } },
    { '@type': 'Question', name: 'Calm や Headspace と何が違う？', acceptedAnswer: { '@type': 'Answer', text: 'Calm/Headspace は探して使うライブラリ。アニッチャは能動的に「向こうから」一行で届く。' } },
    { '@type': 'Question', name: '連続記録（ストリーク）はある？', acceptedAnswer: { '@type': 'Answer', text: 'ない。ストリークは休んだ日を罰する。アニッチャは維持するものが何もない。' } },
    { '@type': 'Question', name: '「アニッチャ」の意味は？', acceptedAnswer: { '@type': 'Answer', text: '仏教語で「無常」。すべての状態は過ぎ去るという観察そのものを核にしている。' } },
    { '@type': 'Question', name: '料金は？', acceptedAnswer: { '@type': 'Answer', text: 'ダウンロード無料。フル機能は月 $9.99 / 年 $49.99。iOS 16.6+。' } },
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
