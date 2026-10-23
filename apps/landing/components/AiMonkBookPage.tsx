import type { Metadata } from 'next';
import Link from 'next/link';
import AiMonkBookPurchase from './AiMonkBookPurchase';

type Book = {
  product: string; title: string; author: string; language: string; edition: string;
  slug: string; unit_amount: number; currency: string; pages: number; chapters: string[];
};
const cover = 'https://aniccaai.com/assets/the-art-of-ai-monks-cover.png';
const copy = {
  en: {
    label: 'AI monk avatar research',
    description: 'A sourced book about AI monk avatars, Yang Mun, video scripts, digital products, and building an original character.',
    language: '日本語版', languagePath: '/the-art-of-ai-monks/ja',
    stats: ['10 chapters', '4 worksheets', 'English · PDF + EPUB'],
    free: 'The full manuscript and sources are free on GitHub. Buying the formatted PDF and EPUB supports this research.',
    freeLink: 'Read the full book for free',
    features: [
      ['Yang Mun and other AI monks', 'Profiles, creators, public sources, and the distinction between observed facts and unverified claims.'],
      ['Video scripts and digital products', 'Hooks, pacing, storefronts, product offers, and how to measure purchases.'],
      ['Create an original character', 'Script exercises, a production pilot, and four practical worksheets.'],
    ],
    contents: 'Contents', contentsDescription: 'Ten chapters cover the accounts, their content, their business models, and practical production methods.',
    research: 'Free research and database', yangMun: 'Yang Mun case study', overview: 'AI monk research article',
    rights: 'Original text and worksheets: CC BY 4.0. Referenced material remains with its owners.', seller: 'Seller information',
  },
  ja: {
    label: 'AI僧侶アバターの調査書籍',
    description: 'AI僧侶アバターとYang Munを、出典とともに解説。動画の台本、デジタル商品の販売、独自キャラクターの制作を学べます。',
    language: 'English edition', languagePath: '/the-art-of-ai-monks',
    stats: ['全10章', 'ワークシート4点', '日本語 · PDF + EPUB'],
    free: '原稿全文と出典はGitHubで無料公開しています。有料の整形済みPDF・EPUBの購入は、この調査活動の支援になります。',
    freeLink: '全文を無料で読む',
    features: [
      ['Yang MunとAI僧侶の事例', 'アカウント、制作者、公開情報を整理。確認できた事実と未確認の主張を区別します。'],
      ['動画の台本とデジタル商品', '導入、テンポ、ストア、商品構成、購入を測る方法を解説します。'],
      ['独自キャラクターの制作', '台本の練習、小規模な制作実験、4つの実用ワークシートを収録します。'],
    ],
    contents: '目次', contentsDescription: 'アカウントの調査から、コンテンツ、ビジネスモデル、制作方法までを全10章で解説します。',
    research: '無料の調査記事とデータベース', yangMun: 'Yang Munの事例記事（日本語）', overview: 'AI僧侶の調査記事（英語）',
    rights: '本書の独自本文・ワークシート：CC BY 4.0。引用・参照資料の権利は各権利者に帰属します。', seller: '特定商取引法に基づく表記',
  },
};

export function aiMonkBookMetadata(book: Book): Metadata {
  const text = book.language === 'ja' ? copy.ja : copy.en;
  const url = `https://aniccaai.com/${book.slug}`;
  return {
    title: `${book.title} — ${book.edition} | Anicca`, description: text.description,
    alternates: { canonical: url, languages: { en: 'https://aniccaai.com/the-art-of-ai-monks', ja: 'https://aniccaai.com/the-art-of-ai-monks/ja', 'x-default': 'https://aniccaai.com/the-art-of-ai-monks' } },
    openGraph: { title: `${book.title} — ${book.edition}`, description: text.description, url, images: [{ url: cover }] },
    twitter: { card: 'summary_large_image', title: `${book.title} — ${book.edition}`, description: text.description, images: [cover] },
  };
}

export default function AiMonkBookPage({ book }: { book: Book }) {
  const japanese = book.language === 'ja';
  const text = japanese ? copy.ja : copy.en;
  const manuscript = `https://github.com/Daisuke134/anicca-products/blob/main/docs/books/the-art-of-ai-monks-${book.language}.md`;
  const url = `https://aniccaai.com/${book.slug}`;
  const structured = {
    '@context': 'https://schema.org', '@type': 'Book', name: book.title, description: text.description,
    author: { '@type': 'Organization', name: book.author }, inLanguage: book.language,
    bookEdition: book.edition, bookFormat: 'https://schema.org/EBook', image: cover, url,
    offers: { '@type': 'Offer', price: (book.unit_amount / 100).toFixed(2), priceCurrency: book.currency.toUpperCase(), availability: 'https://schema.org/InStock', url },
  };
  return <main lang={book.language} className="min-h-screen bg-[#f5f1e7] text-[#28352b]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
    <div className="mx-auto max-w-6xl px-6 py-9 sm:px-10">
      <nav className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <Link href="/" className="font-semibold tracking-[.2em]">ANICCA</Link>
        <div className="flex flex-wrap gap-5"><Link href="/ai-monk-database" className="underline underline-offset-4">AI Monk Database</Link><Link href={text.languagePath} className="underline underline-offset-4">{text.language}</Link></div>
      </nav>
      <section className="grid items-center gap-12 py-14 md:grid-cols-[.8fr_1.2fr] md:py-20">
        <div className="mx-auto w-full max-w-sm md:pr-6">
          <img src="/assets/the-art-of-ai-monks-cover.png" alt={japanese ? 'The Art of AI Monksの表紙' : 'The Art of AI Monks book cover'} width={1024} height={1536} className="h-auto w-full rounded-sm shadow-[18px_24px_50px_rgba(41,48,32,.2)]" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#7b6943]">{text.label}</p>
          <h1 className="mt-5 font-serif text-5xl leading-[1.03] tracking-[-.04em] sm:text-6xl">{book.title}</h1>
          <p className="mt-4 font-medium text-[#7b6943]">{book.edition}</p>
          <p className="mt-5 max-w-xl text-xl leading-relaxed text-[#63705d]">{text.description}</p>
          <div className="my-7 flex flex-wrap gap-2 text-xs font-medium text-[#57634f]">
            {[japanese ? `PDF全${book.pages}ページ` : `${book.pages}-page PDF`, ...text.stats].map((stat) => <span key={stat} className="rounded-full border border-[#cbd0be] px-3 py-2">{stat}</span>)}
          </div>
          <AiMonkBookPurchase book={book} />
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#6b715f]">{text.free}</p>
          <a href={manuscript} className="mt-3 inline-block text-sm font-medium underline underline-offset-4">{text.freeLink}</a>
        </div>
      </section>
      <section className="grid gap-8 border-y border-[#cbd0be] py-12 sm:grid-cols-3">
        {text.features.map(([title, description]) => <div key={title}><h2 className="font-serif text-2xl">{title}</h2><p className="mt-3 text-sm leading-7 text-[#64705f]">{description}</p></div>)}
      </section>
      <section className="grid gap-10 py-14 md:grid-cols-[.7fr_1.3fr]">
        <div><h2 className="font-serif text-4xl">{text.contents}</h2><p className="mt-5 text-sm leading-7 text-[#64705f]">{text.contentsDescription}</p></div>
        <ol className="divide-y divide-[#d7d8c9]">{book.chapters.map((chapter, index) => <li key={chapter} className="flex gap-5 py-4"><span className="w-6 shrink-0 text-sm text-[#8a7955]">{String(index + 1).padStart(2, '0')}</span><span className="font-serif text-xl">{chapter}</span></li>)}</ol>
      </section>
      <section className="rounded-3xl bg-[#e7eadc] p-8 sm:p-10">
        <h2 className="font-serif text-3xl">{text.research}</h2>
        <div className="mt-6 flex flex-wrap gap-5 text-sm font-medium">
          <Link href="/ai-monk-database" className="underline underline-offset-4">AI Monk Database</Link>
          <Link href={japanese ? '/blog/ebook-publishing-yang-mun-case-study-ja' : '/blog/ebook-publishing-yang-mun-video-to-product'} className="underline underline-offset-4">{text.yangMun}</Link>
          <Link href="/blog/ebook-publishing-ai-monk-economy-2026" className="underline underline-offset-4">{text.overview}</Link>
        </div>
      </section>
      <footer className="flex flex-wrap justify-between gap-4 py-10 text-xs leading-6 text-[#78806e]"><span>{text.rights}</span><Link href="/tokushoho" className="underline underline-offset-4">{text.seller}</Link></footer>
    </div>
  </main>;
}
