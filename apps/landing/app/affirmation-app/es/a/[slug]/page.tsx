import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import EsAffirmationSeoLayout from '@/components/affirmation/EsAffirmationSeoLayout';
import {
  alternatesFor,
  tripleForEsSlug,
} from '@/lib/affirmation-alternates';
import { EN_AFFIRMATION_PROBLEMS } from '@/lib/en-affirmation-problems';
import {
  ES_AFFIRMATION_PROBLEMS,
  allEsAffirmationSlugs,
  esAffirmationAppStoreUrl,
  getEsAffirmationProblem,
} from '@/lib/es-affirmation-problems';

type PageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return allEsAffirmationSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const problem = getEsAffirmationProblem(params.slug);
  if (!problem) {
    return { title: 'Página no encontrada | Anicca' };
  }
  const url = `https://aniccaai.com/affirmation-app/es/a/${problem.slug}`;
  const triple = tripleForEsSlug(problem.slug);
  const languages = triple
    ? alternatesFor(triple)
    : alternatesFor({
        es: problem.slug,
        en: problem.enSlug,
        ja: problem.jaSlug,
      });
  return {
    title: `${problem.title} | Anicca`,
    description: problem.metaDescription,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title: `${problem.title} | Anicca`,
      description: problem.metaDescription,
      url,
      locale: 'es_ES',
      type: 'article',
    },
  };
}

export default function EsAffirmationProblemPage({ params }: PageProps) {
  const problem = getEsAffirmationProblem(params.slug);
  if (!problem) notFound();

  const pageUrl = `https://aniccaai.com/affirmation-app/es/a/${problem.slug}`;
  const storeUrl = esAffirmationAppStoreUrl(problem.slug);
  const published = '2026-10-16';
  const heading = problem.h1 ?? problem.title;
  const hasAffirmations = problem.affirmations.length > 0;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: problem.title,
    description: problem.metaDescription,
    inLanguage: 'es',
    datePublished: published,
    dateModified: published,
    mainEntityOfPage: pageUrl,
    author: {
      '@type': 'Organization',
      name: 'Anicca',
      url: 'https://aniccaai.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Anicca',
      url: 'https://aniccaai.com',
    },
    about: {
      '@type': 'SoftwareApplication',
      name: 'Daily Affirmations - Anicca',
      operatingSystem: 'iOS',
      applicationCategory: 'HealthApplication',
      url: 'https://aniccaai.com/affirmation-app',
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'App de afirmaciones',
        item: 'https://aniccaai.com/affirmation-app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guías en español',
        item: 'https://aniccaai.com/affirmation-app/es/a',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: problem.shortTitle,
        item: pageUrl,
      },
    ],
  };

  const otherEs = ES_AFFIRMATION_PROBLEMS.filter((p) => p.slug !== problem.slug);
  const enGuides = EN_AFFIRMATION_PROBLEMS.filter((p) => p.slug !== problem.enSlug).slice(
    0,
    8,
  );

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      <EsAffirmationSeoLayout breadcrumbCurrent={problem.shortTitle}>
        <article>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]">
            {heading}
          </h1>

          {problem.directAnswer?.map((para) => (
            <p
              key={para.slice(0, 48)}
              className="mt-5 text-[17px] leading-[1.8] text-[#5c5956]"
            >
              {para}
            </p>
          ))}

          <h2 className="mt-12 text-[20px] font-semibold tracking-tight">Por qué pasa</h2>
          {problem.whyItHappens.map((para) => (
            <p
              key={para.slice(0, 48)}
              className="mt-5 text-[17px] leading-[1.8] text-[#5c5956]"
            >
              {para}
            </p>
          ))}

          <p className="mt-4 rounded-[16px] border border-[#c9b382]/35 bg-[rgba(201,179,130,0.08)] px-4 py-3 text-[14px] leading-relaxed text-[#5c5956]">
            Guarda esta página para el momento en que empiece el agobio. Márcala o añádela a
            la pantalla de inicio para tener las frases a un toque.
          </p>

          {hasAffirmations ? (
            <>
              <h2 className="mt-12 text-[20px] font-semibold tracking-tight">
                Afirmaciones
              </h2>
              <ol className="mt-6 space-y-3">
                {problem.affirmations.map((line, index) => (
                  <li
                    key={`${problem.slug}-${index}`}
                    className="rounded-[18px] border border-[#393634]/8 bg-[#fdfcfc] px-4 py-3.5 text-[16px] leading-relaxed"
                  >
                    <span className="mr-3 font-mono text-[11px] text-[#b8b6b0]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {line}
                  </li>
                ))}
              </ol>
            </>
          ) : null}

          <section className="mt-12">
            <h2 className="text-[20px] font-semibold tracking-tight">
              {problem.practice.heading}
            </h2>
            <ol className="mt-5 list-decimal space-y-3 pl-5 text-[16px] leading-[1.75] text-[#5c5956]">
              {problem.practice.steps.map((step) => (
                <li key={step.slice(0, 40)}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="mt-12 rounded-[24px] border border-[#393634]/10 bg-[#fdfcfc] px-5 py-8 text-center">
            <h2 className="text-[22px] font-semibold tracking-tight">
              Una frase amable, cuando empieza el agobio
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#5c5956]">
              Anicca es una app de afirmaciones para iPhone que envía una frase corta a la
              hora que elijas. Sin rachas. Gratis de descargar, con suscripción opcional.
              La app está disponible en español en la App Store.
            </p>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#222222] px-7 py-3.5 text-[15px] font-medium text-[#e1e1e1] transition hover:opacity-90"
            >
              Descargar en la App Store
            </a>
            <p className="mt-4 text-[12px] leading-relaxed text-[#898783]">
              iOS · Una app de autocuidado, no consejo médico
            </p>
          </section>

          <p className="mt-8 text-[14px] leading-relaxed text-[#898783]">{problem.closing}</p>

          <p className="mt-6 space-x-4 text-[14px]">
            <Link
              href={`/affirmation-app/a/${problem.enSlug}`}
              className="underline underline-offset-2 hover:text-[#393634]"
            >
              Read in English
            </Link>
            <Link
              href={`/affirmation-app/ja/a/${problem.jaSlug}`}
              className="underline underline-offset-2 hover:text-[#393634]"
            >
              日本語版を読む
            </Link>
          </p>

          {otherEs.length > 0 ? (
            <section className="mt-14">
              <h2 className="text-[18px] font-semibold">Más guías en español</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {otherEs.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/affirmation-app/es/a/${item.slug}`}
                      className="inline-block rounded-full border border-[#393634]/15 px-3 py-1.5 text-[13px] text-[#5c5956] hover:border-[#393634]/35 hover:text-[#393634]"
                    >
                      {item.shortTitle}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-14">
            <h2 className="text-[18px] font-semibold">Guías relacionadas</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {enGuides.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/affirmation-app/a/${item.slug}`}
                    className="inline-block rounded-full border border-[#393634]/15 px-3 py-1.5 text-[13px] text-[#5c5956] hover:border-[#393634]/35 hover:text-[#393634]"
                  >
                    {item.shortTitle} (en inglés)
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[14px]">
              <Link
                href="/affirmation-app/es/a"
                className="underline underline-offset-2 hover:text-[#393634]"
              >
                Volver al listado
              </Link>
            </p>
          </section>
        </article>
      </EsAffirmationSeoLayout>
    </>
  );
}
