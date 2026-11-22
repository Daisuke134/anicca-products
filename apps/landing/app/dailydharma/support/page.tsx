import type { Metadata } from 'next';

// GEO parity (audit 2026-11-22: this page scored 74/100 with
// meta has_canonical=false / canonical_url empty, brand_entity
// has_about_link=false and google_ai G-CANONICAL fail 0/3). The
// canonical is this page's own real URL; the RSS type and og:image
// mirror app/layout.tsx (the real /feed.xml and the real app icon,
// 1024x1024, already the Organization logo in public/ai/summary.json).
// Title and description are unchanged — the description is this
// page's own, already served in its meta tags — so nothing about
// the support text or its facts changes.
const DD_SUPPORT_DESCRIPTION =
  'Get help with Daily Dharma - Buddhist Wisdom for Every Day';

export const metadata: Metadata = {
  title: 'Support | Daily Dharma',
  description: DD_SUPPORT_DESCRIPTION,
  alternates: {
    canonical: 'https://aniccaai.com/dailydharma/support',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Support | Daily Dharma',
    description: DD_SUPPORT_DESCRIPTION,
    url: 'https://aniccaai.com/dailydharma/support',
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

export default function DailyDharmaSupportEN() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-3xl font-bold text-foreground">Support</h1>
      <p className="mt-2 text-muted-foreground">Daily Dharma - Buddhist Wisdom App</p>

      <p className="mt-6 text-muted-foreground">
        Need help with Daily Dharma? We&apos;re here to assist you.
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
            <h3 className="font-semibold text-foreground">What is Daily Dharma?</h3>
            <p className="mt-2 text-muted-foreground">
              Daily Dharma is a mindfulness app that delivers authentic Buddhist wisdom from the Dhammapada.
              Start each day with timeless teachings that have guided seekers for over 2,500 years.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">What are Stay Present reminders?</h3>
            <p className="mt-2 text-muted-foreground">
              Stay Present reminders are gentle notifications throughout the day asking &quot;Are you present right now?&quot;
              They help bring you back to the present moment during your daily activities.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Is my data private?</h3>
            <p className="mt-2 text-muted-foreground">
              Yes. Daily Dharma is designed with privacy in mind. All your preferences and bookmarks are stored
              locally on your device. We do not collect personal information or usage analytics.
              See our <a href="/dailydharma/privacy" className="text-primary hover:underline">Privacy Policy</a> for details.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">What does Premium include?</h3>
            <p className="mt-2 text-muted-foreground">
              Premium subscribers get access to all curated Dhammapada verses, verse bookmarking,
              and up to 10 Stay Present reminders per day.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Additional Resources</h2>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>
            <a href="/dailydharma/privacy" className="text-primary hover:underline">Privacy Policy</a>
          </li>
          <li>
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
          </li>
        </ul>
      </section>

      <p className="mt-12"><a href="/about" className="underline">About Anicca →</a></p>
    </main>
  )
}
