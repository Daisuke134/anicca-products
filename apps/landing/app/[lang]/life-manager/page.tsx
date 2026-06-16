import LifeManagerContent from '@/components/launch/LifeManagerContent';
import { launchDict, type LaunchLocale } from '@/lib/launch-dict';

export const dynamic = 'force-static';

export function generateMetadata({ params }: { params: { lang: LaunchLocale } }) {
  const lang: LaunchLocale = params.lang === 'ja' ? 'ja' : 'en';
  return {
    title: launchDict[lang].lifeManager.metaTitle,
    description: launchDict[lang].lifeManager.metaDescription,
  };
}

export default function Page({ params }: { params: { lang: LaunchLocale } }) {
  const lang: LaunchLocale = params.lang === 'ja' ? 'ja' : 'en';
  return <LifeManagerContent lang={lang} />;
}
