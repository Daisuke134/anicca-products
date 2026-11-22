import type { Metadata } from 'next';

// GEO parity (audit 2026-11-22: this page's live HTML had no
// rel="canonical" and no About link; live baseline 19,465 bytes,
// canonical x0, About x0 via pinned-DNS fetch; page audit 74/100
// with google_ai 16/20, G-CANONICAL fail). The canonical is
// this page's own real URL; the RSS type and og:image mirror
// app/layout.tsx (the real /feed.xml and the real app icon,
// 1024x1024, already the Organization logo in public/ai/summary.json).
// Title and description are unchanged, so nothing about the terms
// text or its facts changes.
export const metadata: Metadata = {
  title: "Terms of Use - BreathReset",
  description: "BreathReset Terms of Use",
  alternates: {
    canonical: 'https://aniccaai.com/breath-reset/terms/en',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: "Terms of Use - BreathReset",
    description: "BreathReset Terms of Use",
    url: 'https://aniccaai.com/breath-reset/terms/en',
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

export default function BreathResetTermsEN() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 1, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Acceptance</h2>
        <p>By downloading or using BreathReset, you agree to these Terms of Use. If you disagree, please uninstall the app.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Medical Disclaimer</h2>
        <p>BreathReset provides breathing exercises for general wellness purposes only. It is <strong>not</strong> a medical device and does not diagnose, treat, cure, or prevent any condition. Consult a healthcare professional before starting any breathing program if you have a medical condition.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Subscriptions</h2>
        <p className="mb-3">BreathReset offers Premium subscriptions managed through Apple In-App Purchases:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Monthly plan: $4.99/month (includes 3-day free trial)</li>
          <li>Annual plan: $29.99/year (includes 3-day free trial)</li>
          <li>Subscriptions automatically renew unless cancelled 24 hours before the renewal date</li>
          <li>Cancel anytime in your Apple ID settings</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
        <p>All content, design, and code in BreathReset is owned by Anicca and protected by copyright law.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Anicca shall not be liable for any indirect, incidental, or consequential damages arising from your use of BreathReset.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Contact</h2>
        <p>Questions? Email <a href="mailto:support@anicca.app" className="text-blue-600 underline">support@anicca.app</a></p>
      </section>

      <div className="mt-10 border-t pt-6 text-sm">
        <a href="/about" className="text-blue-600 underline">About Anicca →</a>
      </div>
    </main>
  );
}
