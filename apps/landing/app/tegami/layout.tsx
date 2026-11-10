import type { ReactNode } from 'react';

export const metadata = {
  title: '毎日のアニッチャの手紙｜毎朝1通、2分で読める無常の手紙 | Anicca',
  description:
    '毎朝、1通の短い手紙を。無常をめぐる、2分で読める瞑想。365通、毎日1通ずつ。いつでも解約できます。',
  alternates: { canonical: 'https://aniccaai.com/tegami' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
