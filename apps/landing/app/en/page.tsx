import Navbar from '@/components/site/Navbar';
import Hero from '@/components/site/Hero';
import Fellows from '@/components/site/Fellows';
import ManifestoStrip from '@/components/site/ManifestoStrip';
import Footer from '@/components/site/Footer';
import JsonLd from '@/components/JsonLd';
import { SelfImproveLoop, DemoVideo, VisionBand } from '@/components/site/v2';

const SITE_URL = 'https://aniccaai.com';
const DESCRIPTION =
  'Anicca exists to end suffering. Its product is Life Manager, an open-source proactive general agent that manages body, mind, and money and follows through in the real world.';

export const metadata = {
  title: 'Anicca — Life Manager, a proactive general agent',
  description: DESCRIPTION,
};

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Anicca',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  description: DESCRIPTION,
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
  description: DESCRIPTION,
  inLanguage: ['en', 'ja'],
  publisher: {
    '@type': 'Organization',
    name: 'Anicca',
    url: SITE_URL,
  },
};

export default function Page() {
  const locale = 'en';

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
