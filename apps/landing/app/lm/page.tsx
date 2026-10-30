import LaunchFrame from '@/components/site/LaunchFrame';
import LmBody from './LmBody';
import JsonLd from '@/components/JsonLd';

// /lm is the public Life Manager Cloud landing page. Its CTA enters the Railway Web app's
// Google identity and Calendar-permission flow. The Google callback starts Calendar consent,
// then the app scans events, writes travel blocks, and offers the seven-day trial.
// LaunchFrame owns only the localized site shell; the Web app owns onboarding and billing.

export const dynamic = 'force-static';

export const metadata = {
  title: 'Life Manager — never be late again: travel time and departure reminders in Google Calendar',
  description:
    'Connect Google Calendar to add travel time and departure reminders before eligible in-person events. Seven-day free trial, then $29/month.',
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
            'Adds travel time and departure reminders to Google Calendar before eligible in-person events.',
          offers: { '@type': 'Offer', price: '29', priceCurrency: 'USD', description: 'Seven-day free trial, then $29/month' },
          author: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
          publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
        }}
      />
      <LmBody />
    </LaunchFrame>
  );
}
