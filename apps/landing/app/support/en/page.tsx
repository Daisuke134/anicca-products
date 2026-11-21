import type { Metadata } from 'next';

// GEO parity (audit 2026-11-22: this support page scored 79/100 with
// meta has_canonical=false / canonical_url empty, brand_entity
// has_about_link=false and google_ai G-CANONICAL fail 0/3). The
// canonical is this page's own real URL; the RSS type and og:image
// mirror app/layout.tsx (the real /feed.xml and the real app icon,
// 1024x1024, already the Organization logo in public/ai/summary.json).
// Title and description are unchanged.
export const metadata: Metadata = {
  title: 'Support | Anicca',
  description: 'Get help with Anicca - your AI-powered behavior change coach',
  alternates: {
    canonical: 'https://aniccaai.com/support/en',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Support | Anicca',
    description: 'Get help with Anicca - your AI-powered behavior change coach',
    url: 'https://aniccaai.com/support/en',
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

export default function SupportEN() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-3xl font-bold text-foreground">Support</h1>
      <p className="mt-6 text-muted-foreground">
        Need help with Anicca? We're here to assist you.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
        <p className="mt-3 text-muted-foreground">
          For support inquiries, feature requests, or general questions, please contact us:
        </p>
        <p className="mt-4">
          <a 
            href="mailto:keiodaisuke@gmail.com" 
            className="text-primary hover:underline font-medium"
          >
            keiodaisuke@gmail.com
          </a>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          We typically respond within 2 business days.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-semibold text-foreground">How does Anicca work?</h3>
            <p className="mt-2 text-muted-foreground">
              Anicca is an AI-powered behavior change coach that sends proactive nudges based on your struggles.
              Select the habits you want to change, and Anicca will send personalized notifications
              at the right moments to help you build better habits and break bad ones.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">What permissions does Anicca need?</h3>
            <p className="mt-2 text-muted-foreground">
              Anicca requires notification permissions to send you nudges at the right times.
              Permissions are requested during onboarding.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Is my data private?</h3>
            <p className="mt-2 text-muted-foreground">
              Yes. Anicca follows a privacy-first approach. Voice data is processed in real-time and not permanently stored. 
              Your profile data is stored securely and only used to provide personalized guidance. 
              See our <a href="/privacy/en" className="text-primary hover:underline">Privacy Policy</a> for details.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Can I use Anicca on multiple devices?</h3>
            <p className="mt-2 text-muted-foreground">
              Yes. Your profile and preferences sync across devices via your account. 
              You can use Anicca on iOS devices with the same account.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Additional Resources</h2>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>
            <a href="/privacy/en" className="text-primary hover:underline">Privacy Policy</a>
          </li>
          <li>
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
          </li>
          <li>
            <a href="/faq" className="text-primary hover:underline">FAQ</a>
          </li>
          <li>
            <a href="https://github.com/Daisuke134/anicca.ai" className="text-primary hover:underline" target="_blank" rel="noreferrer">
              GitHub Repository
            </a>
          </li>
        </ul>
      </section>
      <p className="mt-10 text-muted-foreground">
        <a href="/about" className="underline">About Anicca →</a>
      </p>
    </main>
  )
}










