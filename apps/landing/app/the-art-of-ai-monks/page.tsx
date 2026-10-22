import type { Metadata } from 'next';
import Link from 'next/link';
import book from '@/data/books/the-art-of-ai-monks-en.json';
import AiMonkBookPurchase from '@/components/AiMonkBookPurchase';

const url = 'https://aniccaai.com/the-art-of-ai-monks';
const cover = 'https://aniccaai.com/assets/the-art-of-ai-monks-cover.png';
const manuscript = 'https://github.com/Daisuke134/anicca-products/blob/main/docs/books/the-art-of-ai-monks-en.md';
const edition = book as typeof book & { word_count?: number; chapters?: string[] };

export const metadata: Metadata = {
  title: `${book.title} — ${book.edition} | Anicca`,
  description: 'A sourced field guide to AI monk avatars: Yang Mun, the scripts, the storefronts, the unknowns, and a practical method for building an original character. PDF + EPUB, $9.99.',
  alternates: { canonical: url },
  openGraph: { title: book.title, description: book.subtitle, url, images: [{ url: cover }] },
  twitter: { card: 'summary_large_image', title: book.title, description: book.subtitle, images: [cover] },
};

export default function ArtOfAiMonksBook() {
  const structured = {
    '@context': 'https://schema.org', '@type': 'Book', name: book.title, description: book.subtitle,
    author: { '@type': 'Organization', name: book.author }, inLanguage: book.language,
    bookEdition: book.edition, bookFormat: 'https://schema.org/EBook', image: cover, url,
    offers: { '@type': 'Offer', price: (book.unit_amount / 100).toFixed(2), priceCurrency: book.currency.toUpperCase(), availability: 'https://schema.org/InStock', url },
  };
  return <main className="min-h-screen bg-[#f5f1e7] text-[#28352b]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\u003c') }} />
    <div className="mx-auto max-w-6xl px-6 py-9 sm:px-10">
      <nav className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <Link href="/" className="font-semibold tracking-[.2em]">ANICCA</Link>
        <Link href="/ai-monk-database" className="underline underline-offset-4">Explore the free database ↗</Link>
      </nav>
      <section className="grid items-center gap-12 py-14 md:grid-cols-[.8fr_1.2fr] md:py-20">
        <div className="mx-auto w-full max-w-sm md:pr-6">
          <img src="/assets/the-art-of-ai-monks-cover.png" alt="The Art of AI Monks book cover, featuring a monk, a phone, and a golden halo" width={1024} height={1536} className="h-auto w-full rounded-sm shadow-[18px_24px_50px_rgba(41,48,32,.2)]" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#7b6943]">A field guide to a very strange corner of the internet</p>
          <h1 className="mt-5 font-serif text-5xl leading-[1.03] tracking-[-.04em] sm:text-6xl">{book.title}</h1>
          <p className="mt-5 max-w-xl text-xl leading-relaxed text-[#63705d]">{book.subtitle}</p>
          <p className="mt-6 max-w-xl leading-7 text-[#4d594c]">Who makes the monk in your feed? What does the character say—and what waits behind the link in its bio? Follow the evidence from the first frame to the checkout page.</p>
          <div className="my-7 flex flex-wrap gap-2 text-xs font-medium text-[#57634f]">
            <span className="rounded-full border border-[#cbd0be] px-3 py-2">10 chapters</span>
            {edition.word_count && <span className="rounded-full border border-[#cbd0be] px-3 py-2">{edition.word_count.toLocaleString('en-US')} words</span>}
            <span className="rounded-full border border-[#cbd0be] px-3 py-2">Research + working sheets</span>
            <span className="rounded-full border border-[#cbd0be] px-3 py-2">English · PDF & EPUB</span>
          </div>
          <AiMonkBookPurchase book={book} />
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#6b715f]">The full manuscript and sources are <a href={manuscript} className="underline underline-offset-4">free on GitHub</a>. Buying the designed edition supports this research.</p>
        </div>
      </section>
      <section className="grid gap-8 border-y border-[#cbd0be] py-12 sm:grid-cols-3">
        <div><h2 className="font-serif text-2xl">Look behind the robe</h2><p className="mt-3 text-sm leading-7 text-[#64705f]">Yang Mun and Shalev Hani, earlier virtual monks, and the difference between a discovered account and a verified claim.</p></div>
        <div><h2 className="font-serif text-2xl">Read the business</h2><p className="mt-3 text-sm leading-7 text-[#64705f]">Hooks, pacing, visual cues, storefronts, product offers, and the measurements needed to connect attention with purchases.</p></div>
        <div><h2 className="font-serif text-2xl">Build your own character</h2><p className="mt-3 text-sm leading-7 text-[#64705f]">A practical pilot, original script exercises, production records, and worksheets for keeping creative choices and evidence together.</p></div>
      </section>
      <section className="grid gap-10 py-14 md:grid-cols-[.7fr_1.3fr]">
        <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#7b6943]">Inside the book</p><h2 className="mt-4 font-serif text-4xl">Curiosity, then practice.</h2><p className="mt-5 text-sm leading-7 text-[#64705f]">A research snapshot with dated sources, conflicting accounts, and visible gaps. The companion index opens up 75 records for further investigation.</p></div>
        <ol className="space-y-0 divide-y divide-[#d7d8c9]">{(edition.chapters ?? []).map((chapter, index) => <li key={chapter} className="flex gap-5 py-4"><span className="w-6 shrink-0 text-sm text-[#8a7955]">{String(index + 1).padStart(2, '0')}</span><span className="font-serif text-xl">{chapter}</span></li>)}</ol>
      </section>
      <section className="rounded-3xl bg-[#e7eadc] p-8 sm:p-10">
        <h2 className="font-serif text-3xl">Start with the free research.</h2>
        <div className="mt-6 flex flex-wrap gap-5 text-sm font-medium">
          <Link href="/ai-monk-database" className="underline underline-offset-4">AI Monk Index ↗</Link>
          <Link href="/blog/ebook-publishing-yang-mun-video-to-product" className="underline underline-offset-4">The Yang Mun Shock ↗</Link>
          <Link href="/blog/ebook-publishing-ai-monk-economy-2026" className="underline underline-offset-4">Read the field guide ↗</Link>
        </div>
      </section>
      <footer className="flex flex-wrap justify-between gap-4 py-10 text-xs leading-6 text-[#78806e]"><span>Original text and worksheets: CC BY 4.0. Referenced material remains with its owners.</span><Link href="/tokushoho" className="underline underline-offset-4">Seller information</Link></footer>
    </div>
  </main>;
}
