import type { Metadata } from 'next';
import JaAffirmationSeoLayout from '@/components/affirmation/JaAffirmationSeoLayout';
import KokoroReportClient from '@/components/affirmation/KokoroReportClient';
import { DISCLAIMER_JA } from '@/lib/kokoro-quiz';

const CANONICAL = 'https://aniccaai.com/affirmation-app/ja/shindan/report';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '心のクセ・取扱説明書｜アニッチャ',
  description: `購入後のレポート表示ページ。${DISCLAIMER_JA}`,
  robots: { index: false, follow: false },
  alternates: { canonical: CANONICAL },
};

export default function KokoroReportPage() {
  return (
    <JaAffirmationSeoLayout
      breadcrumbMiddle={{ href: '/affirmation-app/ja/shindan', label: '心のクセ診断' }}
      breadcrumbCurrent="取扱説明書"
    >
      <KokoroReportClient />
    </JaAffirmationSeoLayout>
  );
}
