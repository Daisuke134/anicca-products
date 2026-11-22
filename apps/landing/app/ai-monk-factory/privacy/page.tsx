import type { Metadata } from 'next';
import '../factory.css';

// GEO parity (audit 2026-11-23: this page's live HTML had no
// rel="canonical" and no About link; page audit 66/100
// with G-CANONICAL fail 0/3). The canonical is this page's own
// real URL; the RSS type and og:image mirror app/layout.tsx
// (the real /feed.xml and the real app icon, 1024x1024, already
// the Organization logo in public/ai/summary.json). Title is
// unchanged; description is app/layout.tsx SITE_DESCRIPTION
// verbatim, the description already served via the layout, so
// nothing about the policy text or its facts changes. The
// page's deliberate robots noindex is kept verbatim.
export const metadata: Metadata = {
  title: 'AI Monk Factory — Privacy',
  description: 'Anicca is a company run entirely by AI agents. Its products quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: 'https://aniccaai.com/ai-monk-factory/privacy',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'AI Monk Factory — Privacy',
    description: 'Anicca is a company run entirely by AI agents. Its products quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.',
    url: 'https://aniccaai.com/ai-monk-factory/privacy',
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
export default function FactoryPrivacy() {
  return <main className="mf-shell"><article className="mf-legal"><a href="/ai-monk-factory">← Monk Factory</a><h1>Factory privacy</h1>
    <p>This product notice supplements our <a href="/privacy/en">general privacy policy</a>. The operator is Daisuke Narita, an individual business owner. Contact: <a href="mailto:keiodaisuke@gmail.com">keiodaisuke@gmail.com</a>.</p>
    <h2>What the studio uses</h2><p>We use your signed-in account ID and email to identify your studio. We store subscription and payment-provider identifiers, billing status, usage reservations, generation progress, provider job identifiers, generated scripts and captions, media references, and publishing results. We use the connected Instagram account identifier, handle, permission status, and available post metrics to publish to the correct account and display results.</p>
    <p>Payment card details are collected by Stripe. Instagram authorization uses Meta’s OAuth flow; the studio does not ask for your Instagram password. Connecting Instagram authorizes the Factory to start daily generation and publishing while your free allowance or subscription is active. You can stop daily posting in the studio. Your browser keeps its sign-in session and an identifier for an unfinished generation request so an interrupted request can be checked safely.</p>
    <h2>Service providers</h2><p>Supabase provides sign-in and database services. Netlify hosts the site, functions, and generated image storage. Stripe processes subscriptions. Google’s paid Gemini API generates the fictional avatar image and scripts. We request that these generation interactions are not stored for later API retrieval; this does not replace Google’s applicable processing and retention terms. HeyGen creates the voice, avatar, and videos. Meta’s Instagram API connects the account, publishes authorized content, and retrieves available post metrics. The information needed for each task is sent to that provider. These services may process information outside your country.</p>
    <p>Provider API keys and internal payment identifiers stay on the server. When you connect Instagram, your browser receives a connection link for that authorization flow; do not share the link. Public media and Instagram posts can be accessed by people with their URLs or through the platform’s sharing features; do not use this product for confidential content.</p>
    <h2>Keeping and deleting information</h2><p>We keep information needed to operate your studio, reconcile pending provider requests and billing, prevent duplicate charges or posts, and meet applicable recordkeeping duties. Cancelling a subscription stops new generation and publishing; it does not itself delete stored media, provider records, or published Instagram posts. Contact support to request access, correction, or deletion. Some billing and unresolved transaction records may need to be retained.</p>
    <h2>Your controls</h2><p>You can stop daily publishing, cancel the subscription, and sign out in the studio. You can revoke Instagram authorization through Instagram’s account settings. Previously published posts must be removed through the social platform. Contact support about a connection or deletion request; include your account email and never send a password or API key.</p>
  <p><a href="/about">About Anicca →</a></p>
  </article></main>;
}
