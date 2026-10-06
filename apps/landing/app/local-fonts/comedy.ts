import localFont from 'next/font/local';
export { ibmPlexMono as mono, ibmPlexSans as body } from './shared';

export const display = localFont({
  src: './assets/anton-latin.woff2',
  display: 'swap',
  variable: '--font-display',
  weight: '400',
});

export const kanji = localFont({
  src: './assets/noto-serif-jp-latin.woff2',
  display: 'swap',
  variable: '--font-kanji',
  weight: '100 900',
});
