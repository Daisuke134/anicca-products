import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import EsAffirmationSeoLayout from '@/components/affirmation/EsAffirmationSeoLayout';
import { ES_AFFIRMATION_PROBLEMS } from '@/lib/es-affirmation-problems';

const PAGE_URL = 'https://aniccaai.com/affirmation-app/es/a';

export const metadata: Metadata = {
  title: 'Guías de afirmaciones en español | Anicca',
  description:
    'Afirmaciones cortas en español para la ansiedad del domingo, la ansiedad social en el trabajo y más. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Guías de afirmaciones en español | Anicca',
    description:
      'Afirmaciones cortas en español. Anicca envía una frase a la hora que elijas — sin rachas.',
    url: PAGE_URL,
    locale: 'es_ES',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Guías de afirmaciones en español',
  description:
    'Afirmaciones cortas en español para momentos difíciles. App disponible en español en la App Store.',
  url: PAGE_URL,
  inLanguage: 'es',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Anicca',
    url: 'https://aniccaai.com',
  },
  about: {
    '@type': 'SoftwareApplication',
    name: 'Anicca',
    operatingSystem: 'iOS',
    applicationCategory: 'HealthApplication',
    url: 'https://aniccaai.com/affirmation-app',
  },
};

export default function EsAffirmationIndexPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <EsAffirmationSeoLayout>
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight sm:text-[40px]">
          Guías de afirmaciones en español
        </h1>
        <p className="mt-5 text-[17px] leading-[1.75] text-[#5c5956]">
          Frases cortas y realistas para momentos difíciles. Puedes leerlas aquí gratis, o
          usar{' '}
          <Link href="/affirmation-app" className="underline underline-offset-2">
            Anicca
          </Link>
          , una app de afirmaciones para iPhone disponible en español en la App Store. Sin
          rachas.
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-[#898783]">
          Esta página no es consejo médico.
        </p>

        <ul className="mt-12 space-y-4">
          {ES_AFFIRMATION_PROBLEMS.map((problem) => (
            <li key={problem.slug}>
              <Link
                href={`/affirmation-app/es/a/${problem.slug}`}
                className="block rounded-[20px] border border-[#393634]/10 bg-[#fdfcfc] px-5 py-5 transition hover:border-[#393634]/25"
              >
                <span className="block text-[18px] font-semibold text-[#393634]">
                  {problem.shortTitle}
                </span>
                <span className="mt-1 block text-[14px] leading-relaxed text-[#898783]">
                  {problem.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </EsAffirmationSeoLayout>
    </>
  );
}
