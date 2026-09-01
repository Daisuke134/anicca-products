import LaunchFrame from '@/components/site/LaunchFrame';
import LmBody from './LmBody';

// /lm — the public Life Manager product surface. Local OSS and hosted cloud use the same core.
// Static export shell (force-static) + a client island (LmBody → product story + LmClient) that
// runs the Google→name→gcal(Composio)→phone→dashboard onboarding at runtime.
// $20/mo, no trial. spec29 + Dais 2026-06-16: fully localized EN/JA via LaunchFrame.
// COLLISION RULE: nav + footer come from LaunchFrame; the OAuth-survival flow is UNCHANGED.

export const dynamic = 'force-static';

export const metadata = {
  title: 'Life Manager — Proactive general agent for your life',
  description:
    'Life Manager manages your body, mind, and money, follows through on real-world actions, and runs locally as open source or as an always-on paid cloud service.',
  other: {
    'life-manager-context-version': '2026-09-01.1',
    'life-manager-context-digest': 'f61cbb3cd2878abfb67756de2b23e816070aa3d991c71f748b2dfe1dbd3180d6',
  },
};

export default function Page() {
  return (
    <LaunchFrame active="/life-manager">
      <LmBody />
    </LaunchFrame>
  );
}
