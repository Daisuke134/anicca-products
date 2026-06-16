import MeContent from '@/components/launch/MeContent';
import { launchDict, type LaunchLocale } from '@/lib/launch-dict';

export const dynamic = 'force-static';

export function generateMetadata({ params }: { params: { lang: LaunchLocale } }) {
  const lang: LaunchLocale = params.lang === 'ja' ? 'ja' : 'en';
  return {
    title: launchDict[lang].me.metaTitle,
    description: launchDict[lang].me.metaDescription,
  };
}

export default function Page({ params }: { params: { lang: LaunchLocale } }) {
  const lang: LaunchLocale = params.lang === 'ja' ? 'ja' : 'en';
  return <MeContent lang={lang} />;
}
