import localFont from 'next/font/local';

// The latin WOFF2 subsets and their OFL notices are checked in under ./local-fonts.
export const display = localFont({
  src: './local-fonts/assets/outfit-latin.woff2',
  display: 'swap',
  variable: '--font-display',
  weight: '100 900',
});

export const mono = localFont({
  src: './local-fonts/assets/jetbrains-mono-latin.woff2',
  display: 'swap',
  variable: '--font-mono',
  weight: '100 800',
});

export const notoSansJP = localFont({
  src: './local-fonts/assets/noto-sans-jp-latin.woff2',
  display: 'swap',
  variable: '--font-noto-sans-jp',
  weight: '100 900',
});
