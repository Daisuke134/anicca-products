import type { ReactNode } from 'react';

export const metadata = {
  alternates: { canonical: 'https://aniccaai.com/tegami' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
