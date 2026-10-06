import localFont from 'next/font/local';

export const ibmPlexSans = localFont({
  src: './assets/ibm-plex-sans-latin.woff2',
  display: 'swap',
  variable: '--font-body',
  weight: '300 600',
});

export const ibmPlexMono = localFont({
  src: [
    { path: './assets/ibm-plex-mono-300-latin.woff2', weight: '300' },
    { path: './assets/ibm-plex-mono-400-latin.woff2', weight: '400' },
    { path: './assets/ibm-plex-mono-500-latin.woff2', weight: '500' },
  ],
  display: 'swap',
  variable: '--font-mono',
});
