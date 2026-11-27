import LaunchFrame from '@/components/site/LaunchFrame';
import JsonLd from '@/components/JsonLd';
import NewsletterBody from './NewsletterBody';

// /lm/newsletter — the Life Manager daily gig newsletter landing page and onboarding.
// It sits beside the existing /lm product page (which is untouched) and shares the
// launch shell, locale provider and design tokens. Static export: the form posts to
// the Netlify function `lm-newsletter-signup`, since a static export has no API routes.
//
// Sample-issue facts on this page were read from each platform's public page on
// 2026-11-27 (see app/lm/newsletter/content.ts). Nothing here is a made-up listing.

export const dynamic = 'force-static';

export const metadata = {
  title: 'Life Manager — the dollar gigs you can do on your phone, one email each morning',
  description:
    'One email a day with real gigs you can finish on your phone in 5–20 minutes: USD pay, time needed, phone-OK status and a direct link. Japanese, English and Spanish, nearest deadline first. Free to join.',
  alternates: {
    canonical: 'https://aniccaai.com/lm/newsletter',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'Life Manager — daily dollar gigs for your phone, sorted by deadline',
    description:
      'Stop doomscrolling X and Discord. One email every morning with real, phone-only gigs, USD pay, and the nearest deadline first.',
    url: 'https://aniccaai.com/lm/newsletter',
    siteName: 'Anicca',
    type: 'website',
  },
};

export default function Page() {
  return (
    <LaunchFrame active="/lm/newsletter">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Life Manager Newsletter',
          url: 'https://aniccaai.com/lm/newsletter',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description:
            'A daily email newsletter listing real remote gigs that can be completed on a phone, with USD pay, time required, phone-OK status and direct links, sorted by nearest deadline.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free weekly digest; Pro tier announced later' },
          publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
        }}
      />
      <NewsletterBody />
    </LaunchFrame>
  );
}
