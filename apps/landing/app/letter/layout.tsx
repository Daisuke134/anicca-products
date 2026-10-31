import type { ReactNode } from 'react';

export const metadata = {
  title: 'The Daily Anicca Letter: one short letter on impermanence every morning | Anicca',
  description:
    'One short letter every morning on impermanence: a two-minute read in your inbox, pairing one Pali concept with a modern reframe and one breath practice. First 14 days free, cancel any time.',
  alternates: { canonical: 'https://aniccaai.com/letter' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
