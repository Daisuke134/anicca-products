import MeContent from '@/components/launch/MeContent';
import { launchDict } from '@/lib/launch-dict';

// Root /me — JA-canonical default (existing copy was JP). Localized variants live at
// /en/me and /ja/me. GATE-0 integrity logic + MeClient live inside MeContent.
export const dynamic = 'force-static';

export const metadata = {
  title: launchDict.ja.me.metaTitle,
  description: launchDict.ja.me.metaDescription,
};

export default function Page() {
  return <MeContent lang="ja" />;
}
