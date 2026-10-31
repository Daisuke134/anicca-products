import type { ReactNode } from 'react';

export const metadata = {
  alternates: { canonical: 'https://aniccaai.com/letter' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
