import LaunchFrame from '@/components/site/LaunchFrame';
import LmBody from './LmBody';
import JsonLd from '@/components/JsonLd';

// /lm is the public Life Manager page. Life Manager Cloud ended 2026-11-28.
// The primary CTA goes to the live Anicca site. The open-source repo remains available.

export const dynamic = 'force-static';

export const metadata = {
  title: 'Life Manager — travel time and departure reminders (cloud service ended)',
  description:
    'The hosted Life Manager Cloud service has ended. The open-source project remains on GitHub. See Anicca for the app we are building now.',
  alternates: { canonical: 'https://aniccaai.com/lm', types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' } },
  other: {
    'life-manager-context-version': '2026-10-08.1',
    'life-manager-context-digest': '5b8e34cf01a7cf7589fc6049c080b3eb8458ec28b98103abc2ade395e8d0f90c',
  },
};

export default function Page() {
  return (
    <LaunchFrame active="/lm">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Life Manager',
          url: 'https://aniccaai.com/lm',
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Web',
          description:
            'Life Manager Cloud has ended. The open-source project remains available.',
          isAccessibleForFree: true,
          author: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
          publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
        }}
      />
      <LmBody />
    </LaunchFrame>
  );
}
