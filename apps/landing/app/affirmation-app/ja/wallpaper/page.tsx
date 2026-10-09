import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import WallpaperTool from '@/components/tools/WallpaperTool';

const CANONICAL = 'https://aniccaai.com/affirmation-app/ja/wallpaper';
const TITLE = '無料｜ロック画面のアファメーション壁紙メーカー（iPhone用・登録不要）｜アニッチャ';
const DESCRIPTION =
  'アファメーション壁紙を無料で作成。自己肯定感や寝る前の不安向けの言葉を選び、iPhoneロック画面用PNG（1179×2556）を書き出せます。登録不要・入力は送信されません。';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['アファメーション 壁紙', '自己肯定感 待ち受け', 'ロック画面 言葉 壁紙', 'iPhone 壁紙 名言 シンプル'],
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
    images: [{ url: 'https://aniccaai.com/og/wallpaper-ja.png', width: 1200, height: 630, alt: 'アファメーション壁紙メーカー' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://aniccaai.com/og/wallpaper-ja.png'],
  },
  other: {
    'apple-itunes-app': 'app-id=6755129214',
  },
};

const webAppLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ロック画面のアファメーション壁紙メーカー',
  applicationCategory: 'LifestyleApplication',
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
      name: 'データは送信されますか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'いいえ。入力内容は送信されません。すべてブラウザ内で完結します。',
      },
    },
    {
      '@type': 'Question',
      name: 'どのサイズで書き出されますか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '1179×2556 px（iPhone向けロック画面向け）のPNGです。',
      },
    },
    {
      '@type': 'Question',
      name: '時計に文字が被りませんか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '上部約30%を避けて配置します。プレビューの時計ガイドで確認できます。',
      },
    },
  ],
};

export default function Page() {
  return (
    <main lang="ja">
      <JsonLd data={webAppLd} />
      <JsonLd data={faqLd} />
      <WallpaperTool />
    </main>
  );
}
