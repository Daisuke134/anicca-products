import localFont from 'next/font/local';
export { ibmPlexMono as mono, ibmPlexSans as body } from './shared';

export const display = localFont({
  src: [
    { path: './assets/cormorant-garamond-latin.woff2', weight: '300 700', style: 'normal' },
    { path: './assets/cormorant-garamond-italic-latin.woff2', weight: '300 700', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-display',
});
