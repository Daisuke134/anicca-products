import type { Metadata } from 'next';

// GEO parity (audit 2026-11-22: this page's live HTML had no
// rel="canonical" and no About link; live baseline 22,186 bytes,
// canonical x0, About x0 via pinned-DNS fetch). The canonical is
// this page's own real URL; the RSS type and og:image mirror
// app/layout.tsx (the real /feed.xml and the real app icon,
// 1024x1024, already the Organization logo in public/ai/summary.json).
// Title and description are unchanged, so nothing about the policy
// text or its facts changes. Mirrors the EN counterpart (run 79).
export const metadata: Metadata = {
  title: "プライバシーポリシー - BreathReset",
  description: "BreathReset プライバシーポリシー",
  alternates: {
    canonical: 'https://aniccaai.com/breath-reset/privacy/ja',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: "プライバシーポリシー - BreathReset",
    description: "BreathReset プライバシーポリシー",
    url: 'https://aniccaai.com/breath-reset/privacy/ja',
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

export default function BreathResetPrivacyJA() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">プライバシーポリシー</h1>
      <p className="text-sm text-gray-500 mb-8">最終更新日：2026年3月1日</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. 収集する情報</h2>
        <p className="mb-3">BreathResetは、サービスの提供と改善のために以下の情報を収集します：</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>利用データ：</strong>セッション数、連続日数、好みの呼吸法 - お使いのデバイスのUserDefaultsにローカル保存されます。</li>
          <li><strong>分析データ：</strong>Mixpanelに送信される匿名のイベントデータ（セッション開始、ペイウォール表示など）。デバイスIDは分析目的のみで収集され、個人の特定には使用されません。</li>
          <li><strong>購入データ：</strong>RevenueCatが管理するサブスクリプションの状態。お支払い情報は保存しません。</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. 情報の利用目的</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>進捗状況の表示（連続日数、セッション履歴）</li>
          <li>毎日の呼吸リマインダーの送信（任意のプッシュ通知）</li>
          <li>プレミアムサブスクリプションの管理</li>
          <li>集計した利用パターンに基づくアプリの改善</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. 情報の共有</h2>
        <p>個人データを販売することはありません。匿名の分析データを以下と共有します：</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li><strong>Mixpanel</strong> - プロダクト分析</li>
          <li><strong>RevenueCat</strong> - サブスクリプション管理</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. データ保持</h2>
        <p>利用データはデバイスにローカル保存されます。アプリをアンインストールすることですべてのデータをリセットできます。Mixpanelは最大5年間、匿名のイベントデータを保持します。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. トラッキング</h2>
        <p>BreathResetは他のアプリやウェブサイトをまたいでお客様を追跡することは<strong>ありません</strong>。IDFAやクロスアプリトラッキング技術は使用していません。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. 子どものプライバシー</h2>
        <p>BreathResetは13歳未満の子どもを対象としていません。子どものデータを意図的に収集することはありません。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. お問い合わせ</h2>
        <p>ご質問は <a href="mailto:support@anicca.app" className="text-blue-600 underline">support@anicca.app</a> までメールでご連絡ください。</p>
      </section>

      <div className="mt-10 border-t pt-6 text-sm">
        <a href="/about/ja" className="text-blue-600 underline">Aniccaについて →</a>
      </div>
    </main>
  );
}
