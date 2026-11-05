import type { Metadata } from 'next';
import Link from 'next/link';
import LmOpsGuidePurchase from './LmOpsGuidePurchase';

type Guide = {
  product: string; title: string; subtitle: string; author: string; language: string;
  slug: string; unit_amount: number; currency: string; chapters: string[];
  guide_book: { title: string; subtitle: string; pages: number };
};

// 実数スナップショット: 2026-11-05 の /open 公開値（11月）。最新値は /open で常時公開。
const snapshot = [
  ['今月の売上', '$31.81'],
  ['今月のコスト', '$313.70'],
  ['粗利', '−$281.89'],
  ['MRR', '$97.58'],
];

const description = 'Aniccaを実際に回している運用の仕組み（Life Manager）の実務ガイド。役割・所有権・再開・重複防止・認証と予算・販売と納品・日次の数字まで、全12章・33ページ。事業実例の素材つき。入口はこのガイド、本命はLife Manager Cloud。';

export function lmOpsGuideMetadata(guide: Guide): Metadata {
  const url = `https://aniccaai.com/${guide.slug}`;
  const title = `${guide.title} | Anicca — Life Manager`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

export default function LmOpsGuidePage({ guide }: { guide: Guide }) {
  const url = `https://aniccaai.com/${guide.slug}`;
  const structured = {
    '@context': 'https://schema.org', '@type': 'Product', name: guide.title, description, url,
    offers: { '@type': 'Offer', price: (guide.unit_amount / 100).toFixed(2), priceCurrency: guide.currency.toUpperCase(), availability: 'https://schema.org/InStock', url },
  };
  return <main lang="ja" className="min-h-screen bg-[#f5f1e7] text-[#28352b]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
    <div className="mx-auto max-w-6xl px-6 py-9 sm:px-10">
      <nav className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <Link href="/" className="font-semibold tracking-[.2em]">ANICCA</Link>
        <div className="flex flex-wrap gap-5">
          <a href="https://aniccaai.com/open/" className="underline underline-offset-4">実数ダッシュボード /open</a>
          <Link href="/life-manager" className="underline underline-offset-4">Life Manager Cloud</Link>
        </div>
      </nav>

      <section className="py-14 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#7b6943]">Life Manager — Aniccaを回している仕組み、そのもの</p>
        <h1 className="mt-5 font-serif text-5xl leading-[1.05] tracking-[-.03em] sm:text-6xl">{guide.title}</h1>
        <p className="mt-5 max-w-2xl text-xl leading-relaxed text-[#63705d]">{guide.subtitle}エージェントに仕事を渡し、結果を確かめ、担当が変わっても続けられる運用を、実際の運用資料から公開できる形に書き直した実務ガイドです。</p>
        <div className="my-7 flex flex-wrap gap-2 text-xs font-medium text-[#57634f]">
          {[`運営本 全${guide.chapters.length}章・${guide.guide_book.pages}ページ`, '本文PDF＋Markdown', '事業実例の素材つき', '一回払い・米ドル建て'].map((stat) => <span key={stat} className="rounded-full border border-[#cbd0be] px-3 py-2">{stat}</span>)}
        </div>
        <div className="max-w-2xl">
          <LmOpsGuidePurchase guide={guide} />
        </div>
        <div className="mt-10 max-w-2xl rounded-3xl bg-[#e7eadc] p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[.15em] text-[#7b6943]">この仕組みの現在の実数（2026-11-05・/open 公開値）</p>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {snapshot.map(([label, value]) => <div key={label}><dt className="text-xs text-[#64705f]">{label}</dt><dd className="mt-1 font-serif text-2xl">{value}</dd></div>)}
          </dl>
          <p className="mt-4 text-sm leading-7 text-[#64705f]">数字は隠さず公開しています。現時点では粗利はマイナスです。このガイドは「稼げる仕組みの保証」ではなく、実在する運用の設計と記録の仕方そのものです。最新の実数は <a href="https://aniccaai.com/open/" className="underline underline-offset-4">/open</a> で常時更新しています。</p>
        </div>
      </section>

      <section className="grid gap-8 border-y border-[#cbd0be] py-12 sm:grid-cols-3">
        {[
          ['担当が変わっても、続けられる', '目的、所有者、現在地、公式記録、次の一手を残す。会話を最初から読まなくても再開できる形を作ります。'],
          ['外部操作を、二度しない', '応答が消えた送信・請求・公開を、すぐに繰り返さない。何を照合してから再実行するかを決めます。'],
          ['作業と、結果を分ける', 'テスト、公開URL、支払い、納品を別々に確認する。未確認を成功やゼロへ置き換えない運用を学びます。'],
        ].map(([title, text]) => <div key={title}><h2 className="font-serif text-2xl">{title}</h2><p className="mt-3 text-sm leading-7 text-[#64705f]">{text}</p></div>)}
      </section>

      <section id="buy" className="scroll-mt-8 grid gap-10 py-14 md:grid-cols-[.7fr_1.3fr]">
        <div>
          <h2 className="font-serif text-4xl">入口は、このガイド</h2>
          <p className="mt-5 text-sm leading-7 text-[#64705f]">まず仕組みを理解し、自分の環境で小さく回すための一式です。巨大なエージェント組織より先に、一つの仕事が結果まで進む運用を。開発者、個人事業者、小さなチームで、すでにエージェントを使い始めている人へ。</p>
        </div>
        <div>
          <h3 className="font-serif text-2xl">含まれるもの</h3>
          <ul className="mt-5 space-y-3 text-sm leading-7">
            <li>運営本『{guide.guide_book.title}』本文PDF（{guide.guide_book.pages}ページ・全{guide.chapters.length}章）</li>
            <li>運営本の本文Markdown（編集・転用しやすい形）</li>
            <li>事業実例の素材: 書籍『The Art of AI Monks』EPUB（AI僧侶事業の実例研究）</li>
            <li>事業実例の素材: AI Monk Database フルデータ JSON（78件の記録・出典292件、2026-10-31時点）</li>
          </ul>
          <div className="mt-8 max-w-xl">
            <LmOpsGuidePurchase guide={guide} />
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#6b715f]">原稿のソースは公開リポジトリでも読めます。有料版は整形済みPDFと、実例素材まで一式にまとめたダウンロード用パッケージです。完全無人化・利益・稼働率の保証は含みません。</p>
        </div>
      </section>

      <section className="grid gap-10 py-14 md:grid-cols-[.7fr_1.3fr]">
        <div><h2 className="font-serif text-4xl">運営本の目次</h2><p className="mt-5 text-sm leading-7 text-[#64705f]">第1〜4章で仕事の単位と担当を決め、第5〜8章で再開・重複防止・権限・失敗対応を設計し、第9〜10章で販売と数字をつなぎ、第11章の一週間で小さく稼働させます。</p></div>
        <ol className="divide-y divide-[#d7d8c9]">{guide.chapters.map((chapter, index) => <li key={chapter} className="flex gap-5 py-4"><span className="w-6 shrink-0 text-sm text-[#8a7955]">{String(index + 1).padStart(2, '0')}</span><span className="font-serif text-xl">{chapter}</span></li>)}</ol>
      </section>

      <section className="rounded-3xl bg-[#203b2e] p-8 text-[#f5f1e7] sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#d3c39a]">本命は、仕組みそのものを使うこと</p>
        <h2 className="mt-4 font-serif text-4xl leading-tight">Life Manager Cloud</h2>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[#d8dcc9]">ガイドは「自分で回す」ための入口です。同じ仕組みを、環境構築なしでそのまま使いたい人には Life Manager Cloud があります。Life Manager はローカルでもクラウドでも走りますが、推奨はクラウドです。常時稼働、担当の引き継ぎ、数字の公開まで、運用そのものが手に入ります。</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/life-manager" className="rounded-full bg-[#f5f1e7] px-8 py-4 font-semibold text-[#203b2e] hover:bg-white">Life Manager Cloud を見る</Link>
          <a href="https://aniccaai.com/open/" className="rounded-full border border-[#82907d] px-8 py-4 font-semibold text-[#f5f1e7] hover:bg-[#31503d]">運用の実数を見る（/open）</a>
        </div>
        <p className="mt-6 text-sm leading-7 text-[#aeb69e]">順序は逆にしません。まず $29 のガイドで仕組みを掴み、必要なら Cloud へ。それが、この会社の売り方です。</p>
      </section>

      <footer className="flex flex-wrap justify-between gap-4 py-10 text-xs leading-6 text-[#78806e]"><span>© Anicca</span><Link href="/tokushoho" className="underline underline-offset-4">特定商取引法に基づく表記・販売条件</Link></footer>
    </div>
  </main>;
}
