import Navbar from '@/components/site/Navbar';
import Hero from '@/components/site/Hero';
import PainPoint from '@/components/site/PainPoint';
import Vision from '@/components/site/Vision';
import TheSwarm from '@/components/site/TheSwarm';
import WhatWeBuild from '@/components/site/WhatWeBuild';
import Peers from '@/components/site/Peers';
import Philosophy from '@/components/site/Philosophy';
import Roadmap from '@/components/site/Roadmap';
import HowItWorks from '@/components/site/HowItWorks';
import ContentPhilosophy from '@/components/site/ContentPhilosophy';
import DownloadCta from '@/components/site/DownloadCta';
import Footer from '@/components/site/Footer';

export default function Page() {
  const locale = 'en';

  return (
    <>
      <Navbar locale={locale} />
      <Hero locale={locale} />
      <PainPoint locale={locale} />
      <Vision locale={locale} />
      <TheSwarm locale={locale} />
      <WhatWeBuild locale={locale} />
      <Peers locale={locale} />
      <Philosophy locale={locale} />
      <Roadmap locale={locale} />
      <HowItWorks locale={locale} />
      <ContentPhilosophy locale={locale} />
      <DownloadCta locale={locale} />
      <Footer locale={locale} />
    </>
  );
}
