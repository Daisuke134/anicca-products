const SITE_TITLE = 'Anicca — an AI lab to end suffering';
const SITE_DESCRIPTION =
  "Anicca is a company run entirely by AI agents. Its products quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.";

export const metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  // Authorship parity with the static homepage (GEO audit 2026-11-19:
  // G-BYLINE warn — no author declared). The author is the Anicca
  // organization itself, the site's publisher.
  authors: [{ name: 'Anicca', url: 'https://aniccaai.com' }],
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: 'https://aniccaai.com',
    type: 'website',
    siteName: 'Anicca',
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  // RSS feed discovery for AI crawlers and agents (GEO audit 2026-11-19:
  // signals has_rss=false because /feed.xml existed but was not linked).
  alternates: {
    types: {
      'application/rss+xml': 'https://aniccaai.com/feed.xml',
    },
  },
  other: {
    'impact-site-verification': '64d92097-aa50-42a8-bd89-a3f923217aa2',
  },
  // Google Search Console ownership (keiodaisuke@gmail.com, property https://aniccaai.com/, 2026-10-18).
  verification: {
    google: 'rkFlZtt8T7LSddGmljAz_BX9KAP36mSdHMrEdNwimyE',
  },
};

import './globals.css';
import 'lite-youtube-embed/src/lite-yt-embed.css';
import React from 'react';
import { display, mono, notoSansJP } from './fonts';
import SiteHitTracker from '@/components/SiteHitTracker';
import JsonLd from '@/components/JsonLd';
import Script from 'next/script';

const SITE_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Anicca',
      url: 'https://aniccaai.com',
      logo: 'https://aniccaai.com/anicca-app-icon.png',
      description: SITE_DESCRIPTION,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'contact@aniccaai.com',
      },
      knowsAbout: [
        'rumination and overthinking',
        'depression and low mood support',
        'OCD and intrusive thoughts support',
        'hard days and stress',
        'a hard life and suffering',
        'laziness, procrastination and motivation',
        'daily affirmations',
        'habit formation',
        'behavior-based nudges',
        'iOS apps',
      ],
      sameAs: [
        'https://github.com/Daisuke134/anicca',
        'https://apps.apple.com/app/id6755129214',
      ],
    },
    {
      '@type': 'WebSite',
      name: 'Anicca',
      url: 'https://aniccaai.com',
      publisher: { '@type': 'Organization', name: 'Anicca' },
      author: {
        '@type': 'Organization',
        name: 'Anicca',
        url: 'https://aniccaai.com',
      },
      // The site template (this layout) last changed on 2026-11-19
      // (GEO head parity: RSS alternate, knowsAbout, authorship).
      // Update only when the template actually changes.
      dateModified: '2026-11-19',
      inLanguage: ['en', 'ja'],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Anicca',
      operatingSystem: 'iOS',
      applicationCategory: 'HealthApplication',
      url: 'https://aniccaai.com',
      downloadUrl: 'https://apps.apple.com/app/id6755129214',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  ],
};

// GA4 (property "Anicca", web stream "Anicca Web"). The Measurement ID is injected at
// build time via NEXT_PUBLIC_GA_MEASUREMENT_ID (see .github/workflows/netlify-deploy.yml).
// Unset = no tag is rendered.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${notoSansJP.variable}`}>
      <body className="font-sans">
        <JsonLd data={SITE_JSONLD} />
        <SiteHitTracker />
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
