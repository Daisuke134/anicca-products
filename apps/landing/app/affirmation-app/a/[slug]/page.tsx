import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import EnAffirmationSeoLayout from '@/components/affirmation/EnAffirmationSeoLayout';
import {
  EN_AFFIRMATION_PROBLEMS,
  allEnAffirmationSlugs,
  enAffirmationAppStoreUrl,
  getEnAffirmationProblem,
} from '@/lib/en-affirmation-problems';

type PageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return allEnAffirmationSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const problem = getEnAffirmationProblem(params.slug);
  if (!problem) {
    return { title: 'Page not found | Anicca' };
  }
  const url = `https://aniccaai.com/affirmation-app/a/${problem.slug}`;
  const jaUrl = `https://aniccaai.com/affirmation-app/ja/a/${problem.jaSlug}`;
  return {
    title: `${problem.title} | Anicca`,
    description: problem.metaDescription,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ja: jaUrl,
        'x-default': url,
      },
    },
    openGraph: {
      title: `${problem.title} | Anicca`,
      description: problem.metaDescription,
      url,
      locale: 'en_US',
      type: 'article',
    },
  };
}

export default function EnAffirmationProblemPage({ params }: PageProps) {
  const problem = getEnAffirmationProblem(params.slug);
  if (!problem) notFound();

  const pageUrl = `https://aniccaai.com/affirmation-app/a/${problem.slug}`;
  const jaUrl = `https://aniccaai.com/affirmation-app/ja/a/${problem.jaSlug}`;
  const storeUrl = enAffirmationAppStoreUrl(problem.slug);
  const published = '2026-10-09';

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: problem.title,
    description: problem.metaDescription,
    inLanguage: 'en',
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
        name: 'Affirmation app',
        item: 'https://aniccaai.com/affirmation-app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: problem.shortTitle,
        item: pageUrl,
      },
    ],
  };

  const others = EN_AFFIRMATION_PROBLEMS.filter((p) => p.slug !== problem.slug);

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      <EnAffirmationSeoLayout breadcrumbCurrent={problem.shortTitle}>
        <article>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]">
            {problem.title}
          </h1>

          {problem.whyItHappens.map((para) => (
            <p
              key={para.slice(0, 48)}
              className="mt-5 text-[17px] leading-[1.8] text-[#5c5956]"
            >
              {para}
            </p>
          ))}

          <p className="mt-4 rounded-[16px] border border-[#c9b382]/35 bg-[rgba(201,179,130,0.08)] px-4 py-3 text-[14px] leading-relaxed text-[#5c5956]">
            Save this page for the moment the spiral starts. Bookmark it or add it to your Home
            Screen so the words are one tap away.
          </p>

          <h2 className="mt-12 text-[20px] font-semibold tracking-tight">
            Affirmations to keep nearby
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
              One kind line, when the spiral starts
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#5c5956]">
              Anicca is an iPhone affirmation app that sends one kind line when your mind tends to
              spiral. Thirteen self-care topics. No streaks. Free to download, with an optional
              subscription for the full proactive experience.
            </p>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#222222] px-7 py-3.5 text-[15px] font-medium text-[#e1e1e1] transition hover:opacity-90"
            >
              Download on the App Store
            </a>
            <p className="mt-4 text-[12px] leading-relaxed text-[#898783]">
              iOS 15+ · A self-care app, not medical advice
            </p>
          </section>

          <p className="mt-8 text-[14px] leading-relaxed text-[#898783]">{problem.closing}</p>

          <p className="mt-6 text-[14px]">
            <Link
              href={jaUrl.replace('https://aniccaai.com', '')}
              className="underline underline-offset-2 hover:text-[#393634]"
            >
              日本語版を読む
            </Link>
          </p>

          <section className="mt-14">
            <h2 className="text-[18px] font-semibold">More guides</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {others.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/affirmation-app/a/${item.slug}`}
                    className="inline-block rounded-full border border-[#393634]/15 px-3 py-1.5 text-[13px] text-[#5c5956] hover:border-[#393634]/35 hover:text-[#393634]"
                  >
                    {item.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[14px]">
              <Link
                href="/affirmation-app"
                className="underline underline-offset-2 hover:text-[#393634]"
              >
                Back to Anicca
              </Link>
            </p>
          </section>
        </article>
      </EnAffirmationSeoLayout>
    </>
  );
}
