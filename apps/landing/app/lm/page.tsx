import LaunchFrame from '@/components/site/LaunchFrame';
import LmBody from './LmBody';
import JsonLd from '@/components/JsonLd';

// /lm is the public page for the one Life Manager product. Cloud is the hosted mode;
// its same-origin entry is served through the Maritime proxy. Google is used for identity only.

export const dynamic = 'force-static';

export const metadata = {
  title: 'Life Manager — one manager for work, money, body, and mind',
  description:
    'One proactive manager for work, money, everyday responsibilities, body, and mind. Life Manager Cloud runs on a dedicated Maritime VM and starts with Google identity only. Capafy is its first earning workflow.',
  other: {
    'life-manager-context-version': '2026-10-20.1',
    'life-manager-context-digest': '45f79b184d1048bc643a0db1cf6f1d928f8a426077ac0e489fcaf5bcaa1435ea',
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
            'One proactive manager for work, money, everyday responsibilities, body, and mind. Life Manager Cloud runs on Maritime and begins with identity-only Google sign-in; Capafy is its first earning workflow.',
          author: { '@type': 'Person', name: 'Daisuke Narita', alternateName: '成田大祐', url: 'https://aniccaai.com/dais' },
          publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
        }}
      />
      <LmBody />
    </LaunchFrame>
  );
}
