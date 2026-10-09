import type { Metadata } from 'next';
import EnAffirmationSeoLayout from '@/components/affirmation/EnAffirmationSeoLayout';
import KokoroReportClientEn from '@/components/affirmation/KokoroReportClientEn';
import { DISCLAIMER_EN } from '@/lib/kokoro-quiz-en';

const CANONICAL = 'https://aniccaai.com/affirmation-app/en/quiz/report';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Mind Habits Field Guide | Anicca',
  description: `Paid report view after checkout. ${DISCLAIMER_EN}`,
  robots: { index: false, follow: false },
  alternates: { canonical: CANONICAL },
};

export default function MindHabitsReportPage() {
  return (
    <EnAffirmationSeoLayout
      breadcrumbMiddle={{ href: '/affirmation-app/en/quiz', label: 'Mind Habits Quiz' }}
      breadcrumbCurrent="Field Guide"
    >
      <KokoroReportClientEn />
    </EnAffirmationSeoLayout>
  );
}
