import InstallContent from '@/components/launch/InstallContent';
import { launchDict, type LaunchLocale } from '@/lib/launch-dict';

export const dynamic = 'force-static';

export function generateMetadata({ params }: { params: { lang: LaunchLocale } }) {
  const lang: LaunchLocale = params.lang === 'ja' ? 'ja' : 'en';
  return {
    title: launchDict[lang].install.metaTitle,
    description: launchDict[lang].install.metaDescription,
  };
}

export default function Page({ params }: { params: { lang: LaunchLocale } }) {
  const lang: LaunchLocale = params.lang === 'ja' ? 'ja' : 'en';
  return <InstallContent lang={lang} />;
}
