export const metadata = {
  title: 'Anicca - autonomous Buddhist AI entity',
  description:
    'A sovereign, self-funding AI entity with one goal: end suffering. Apps, books, music, food, retreat centers, every legal means. The mobile app is the first instance.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

import '../globals.css';
import React from 'react';
import { display, mono, notoSansJP } from '../fonts';

// Root layout for ALL non-localized routes (everything except /en/* /ja/*). This route
// group has no `layout.tsx` above it, so it IS a root layout (Next.js: "any layout without
// a layout.js above it is a root layout"). The /en /ja subtree gets its own root layout at
// app/[lang]/layout.tsx, which is what lets <html lang> differ per locale in static HTML.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${notoSansJP.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
