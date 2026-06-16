import LifeManagerContent from '@/components/launch/LifeManagerContent';
import { launchDict } from '@/lib/launch-dict';

// Root /life-manager — EN-canonical default (existing copy was EN). Localized variants
// live at /en/life-manager and /ja/life-manager. Body lives inside LifeManagerContent.
export const dynamic = 'force-static';

export const metadata = {
  title: launchDict.en.lifeManager.metaTitle,
  description: launchDict.en.lifeManager.metaDescription,
};

export default function Page() {
  return <LifeManagerContent lang="en" />;
}
