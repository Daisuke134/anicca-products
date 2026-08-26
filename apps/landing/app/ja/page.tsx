import Navbar from '@/components/site/Navbar';
import Hero from '@/components/site/Hero';
import Fellows from '@/components/site/Fellows';
import ManifestoStrip from '@/components/site/ManifestoStrip';
import Footer from '@/components/site/Footer';
import JsonLd from '@/components/JsonLd';
import { SelfImproveLoop, DemoVideo, VisionBand } from '@/components/site/v2';

const SITE_URL = 'https://aniccaai.com';
const DESCRIPTION_JA =
  'Aniccaは、あらゆる生命の苦しみを終わらせるために存在する。そのプロダクトがLife Manager。身体・心・お金を管理し、現実の行動まで完遂するオープンソースのproactive general agent。';

export const metadata = {
  title: 'Anicca — Life Manager、人生を管理するproactive general agent',
  description: DESCRIPTION_JA,
};

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Anicca',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  description: DESCRIPTION_JA,
  sameAs: [
    'https://x.com/anicca',
    'https://github.com/Daisuke134/life-manager',
  ],
};

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Anicca',
  url: SITE_URL,
  description: DESCRIPTION_JA,
  inLanguage: ['ja', 'en'],
  publisher: {
    '@type': 'Organization',
    name: 'Anicca',
    url: SITE_URL,
  },
};

export default function Page() {
  const locale = 'ja';

  return (
    <>
      <JsonLd data={organizationLd} />
      <JsonLd data={websiteLd} />
      <Navbar locale={locale} />
      <Hero locale={locale} />
      <SelfImproveLoop locale={locale} />
      <DemoVideo locale={locale} />
      <VisionBand locale={locale} />
      <Fellows locale={locale} />
      <ManifestoStrip locale={locale} />
      <Footer locale={locale} />
    </>
  );
}
