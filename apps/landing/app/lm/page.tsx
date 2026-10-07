import LaunchFrame from '@/components/site/LaunchFrame';
import LmBody from './LmBody';

// /lm is the public Life Manager Cloud landing page. Its CTA enters the Railway Web app's
// Google identity and Calendar-permission flow. The Google callback starts Calendar consent,
// then the app scans events, writes travel blocks, and offers the seven-day trial.
// LaunchFrame owns only the localized site shell; the Web app owns onboarding and billing.

export const dynamic = 'force-static';

export const metadata = {
  title: 'Life Manager — Google Calendar travel time assistant',
  description:
    'Connect Google Calendar to add travel time and departure reminders before eligible in-person events. Seven-day free trial, then $29/month.',
  other: {
    'life-manager-context-version': '2026-10-02.1',
    'life-manager-context-digest': '113ddbade3174274888d408be0874286dd6c4d9fa8cff41d447bca744e74ceed',
  },
};

export default function Page() {
  return (
    <LaunchFrame active="/lm">
      <LmBody />
    </LaunchFrame>
  );
}
