export const metadata = {
  title: 'Anicca — Life Manager and daily affirmation apps',
  description:
    "Anicca makes apps that quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.",
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${notoSansJP.variable}`}>
      <body className="font-sans">
        <SiteHitTracker />
        {children}
      </body>
    </html>
  );
}
