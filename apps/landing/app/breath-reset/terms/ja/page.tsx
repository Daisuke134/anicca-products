import type { Metadata } from 'next';

// GEO parity (audit 2026-11-23: this page's live HTML had no
// rel="canonical" and no About link; live baseline 18,396 bytes,
// canonical x0, About x0 via pinned-DNS fetch; page audit 77/100
// with google_ai 16/20, G-CANONICAL fail). The canonical is
// this page's own real URL; the RSS type and og:image mirror
// app/layout.tsx (the real /feed.xml and the real app icon,
// 1024x1024, already the Organization logo in public/ai/summary.json).
// Title and description are unchanged, so nothing about the terms
// text or its facts changes. Mirrors the EN sibling fixed earlier.
export const metadata: Metadata = {
  title: "利用規約 - BreathReset",
  description: "BreathReset 利用規約",
  alternates: {
    canonical: 'https://aniccaai.com/breath-reset/terms/ja',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: "利用規約 - BreathReset",
    description: "BreathReset 利用規約",
    url: 'https://aniccaai.com/breath-reset/terms/ja',
    type: 'website',
    images: [
      {
        url: 'https://aniccaai.com/anicca-app-icon.png',
        width: 1024,
        height: 1024,
        alt: 'Anicca app icon',
      },
    ],
  },
};

export default function BreathResetTermsJA() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">利用規約</h1>
      <p className="text-sm text-gray-500 mb-8">最終更新日：2026年3月1日</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. 同意</h2>
        <p>BreathResetをダウンロードまたは使用することにより、本利用規約に同意したものとみなします。同意されない場合は、アプリをアンインストールしてください。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. 医療免責事項</h2>
        <p>BreathResetは一般的なウェルネス目的のための呼吸エクササイズを提供します。医療機器では<strong>なく</strong>、いかなる疾患の診断、治療、治癒、予防もしません。医療上の問題がある場合は、呼吸プログラムを始める前に医療専門家に相談してください。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. サブスクリプション</h2>
        <p className="mb-3">BreathResetはAppleのアプリ内購入で管理されるプレミアムサブスクリプションを提供します：</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>月額プラン：¥750/月（3日間の無料トライアル付き）</li>
          <li>年額プラン：¥4,500/年（3日間の無料トライアル付き）</li>
          <li>サブスクリプションは、更新日の24時間前にキャンセルしない限り自動的に更新されます</li>
          <li>Apple IDの設定からいつでもキャンセルできます</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. 知的財産</h2>
        <p>BreathResetのすべてのコンテンツ、デザイン、コードはAniccaが所有し、著作権法により保護されています。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. 免責事項</h2>
        <p>法律で認められる最大限の範囲において、Aniccaはお客様のBreathReset使用に起因する間接的、偶発的、または結果的な損害について責任を負いません。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. お問い合わせ</h2>
        <p>ご質問は <a href="mailto:support@anicca.app" className="text-blue-600 underline">support@anicca.app</a> までご連絡ください。</p>
      </section>

      <div className="mt-10 border-t pt-6 text-sm">
        <a href="/about/ja" className="text-blue-600 underline">Aniccaについて →</a>
      </div>
    </main>
  );
}
