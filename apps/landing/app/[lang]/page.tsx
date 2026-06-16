import Navbar from '@/components/site/Navbar';
import Hero from '@/components/site/Hero';
import TheEmpireProducts from '@/components/site/TheEmpireProducts';
import Fellows from '@/components/site/Fellows';
import ManifestoStrip from '@/components/site/ManifestoStrip';
import Footer from '@/components/site/Footer';
import JsonLd from '@/components/JsonLd';
import {
  SelfFundingTriad,
  LiveLedgerStrip,
  SelfImproveLoop,
  InstallSplit,
  DemoVideo,
  BasicIncomeNote,
  VisionBand,
} from '@/components/site/v2';
import type { LaunchLocale } from '@/lib/launch-dict';

// Localized home at /en and /ja. Mirrors the existing app/en/page.tsx + app/ja/page.tsx
// (which stay as-is for backward compat), but driven by the [lang] route param so the
// surrounding [lang]/layout sets <html lang> correctly.

const SITE_URL = 'https://aniccaai.com';

const DESCRIPTION: Record<LaunchLocale, string> = {
  en: 'Anicca is a proactive behavior-change agent — an autonomous "digital Buddha" AI entity that reaches out with the right card at the right moment instead of waiting to be opened. No streaks, no guilt. One of the SAOs — Safe Autonomous Organizations — built fully in public.',
  ja: 'Anicca（アニッチャ）は、開かれるのを待つのではなく、必要なタイミングで一言のやさしさを届けるプロアクティブな行動変容エージェント。連続記録も罪悪感もなし。すべて公開で運営される自律AIエンティティ（SAO）。',
};

function buildLd(locale: LaunchLocale) {
  const description = DESCRIPTION[locale];
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Anicca',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    description,
    sameAs: ['https://x.com/anicca', 'https://github.com/Conway-Research/automaton'],
  };
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Anicca',
    url: SITE_URL,
    description,
    inLanguage: locale === 'ja' ? ['ja', 'en'] : ['en', 'ja'],
    publisher: { '@type': 'Organization', name: 'Anicca', url: SITE_URL },
  };
  return { organizationLd, websiteLd };
}

export default function Page({ params }: { params: { lang: LaunchLocale } }) {
  const locale: LaunchLocale = params.lang === 'ja' ? 'ja' : 'en';
  const { organizationLd, websiteLd } = buildLd(locale);

  return (
    <>
      <JsonLd data={organizationLd} />
      <JsonLd data={websiteLd} />
      <Navbar locale={locale} />
      <Hero locale={locale} />
      <SelfFundingTriad locale={locale} />
      <LiveLedgerStrip locale={locale} />
      <SelfImproveLoop locale={locale} />
      <InstallSplit locale={locale} />
      <DemoVideo locale={locale} />
      <BasicIncomeNote locale={locale} />
      <TheEmpireProducts locale={locale} />
      <VisionBand locale={locale} />
      <Fellows locale={locale} />
      <ManifestoStrip locale={locale} />
      <Footer locale={locale} />
    </>
  );
}
