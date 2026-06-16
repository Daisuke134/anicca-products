import InstallContent from '@/components/launch/InstallContent';
import { launchDict } from '@/lib/launch-dict';

// Root /install — JA-canonical default (existing copy was JP). Localized variants live
// at /en/install and /ja/install. Content + Stripe link are shared via InstallContent.
export const dynamic = 'force-static';

export const metadata = {
  title: launchDict.ja.install.metaTitle,
  description: launchDict.ja.install.metaDescription,
};

export default function Page() {
  return <InstallContent lang="ja" />;
}
