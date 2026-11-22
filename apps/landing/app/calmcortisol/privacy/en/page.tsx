import type { Metadata } from 'next';

// GEO parity (audit 2026-11-23: this page's live HTML had no
// rel="canonical" and no About link; page audit 73/100
// with G-CANONICAL fail 0/3). The canonical is this page's own
// real URL; the RSS type and og:image mirror app/layout.tsx
// (the real /feed.xml and the real app icon, 1024x1024, already
// the Organization logo in public/ai/summary.json). Title is
// unchanged; description is app/layout.tsx SITE_DESCRIPTION
// verbatim, the description already served via the layout, so
// nothing about the policy text or its facts changes.
export const metadata: Metadata = {
  title: 'Privacy Policy | CalmCortisol',
  description: 'Anicca is a company run entirely by AI agents. Its products quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.',
  alternates: {
    canonical: 'https://aniccaai.com/calmcortisol/privacy/en',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Privacy Policy | CalmCortisol',
    description: 'Anicca is a company run entirely by AI agents. Its products quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.',
    url: 'https://aniccaai.com/calmcortisol/privacy/en',
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

export default function CalmCortisolPrivacyEN() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-3xl font-bold text-foreground">Privacy Policy - CalmCortisol</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: February 25, 2026</p>

      <p className="mt-6 text-muted-foreground">
        This policy describes how CalmCortisol (the &quot;App&quot;) handles user data.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">1. Business Information</h2>
      <p className="mt-3 text-muted-foreground">Daisuke Narita (Individual Business Owner) / keiodaisuke@gmail.com</p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">2. Information We Collect</h2>
      <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
        <li>Device identifiers - used for analytics and fraud prevention</li>
        <li>App usage events - e.g., breathing sessions completed, paywall interactions</li>
        <li>Subscription status - managed via App Store / RevenueCat</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-foreground">3. Information We Do NOT Collect</h2>
      <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
        <li>Your breathing session content or personal journal entries</li>
        <li>Health data or biometric data</li>
        <li>Location data</li>
        <li>Contact lists, photos, or microphone recordings</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-foreground">4. Third-Party Services</h2>
      <ul className="mt-3 list-disc pl-6 text-muted-foreground space-y-2">
        <li><strong>RevenueCat</strong> - Subscription management (purchase history)</li>
        <li><strong>Mixpanel</strong> - Anonymous usage analytics</li>
        <li><strong>Apple App Store</strong> - Payment processing</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-foreground">5. Data Retention</h2>
      <p className="mt-3 text-muted-foreground">
        Analytics data is retained for up to 12 months. You may request deletion by contacting us.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">6. Children&apos;s Privacy</h2>
      <p className="mt-3 text-muted-foreground">
        CalmCortisol is not directed at children under 13. We do not knowingly collect data from children.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">7. Contact</h2>
      <p className="mt-3 text-muted-foreground">
        For privacy requests: keiodaisuke@gmail.com
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">8. Terms of Use</h2>
      <p className="mt-3 text-muted-foreground">
        Terms of Use are provided by Apple Standard EULA:{' '}
        <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" className="underline">
          https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
        </a>
      </p>
      <div className="mt-12 border-t pt-6">
        <a href="/about" className="underline">About Anicca →</a>
      </div>
    </main>
  );
}
