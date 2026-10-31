import type { Metadata } from 'next';
import Link from 'next/link';
import book from '@/data/books/zero-human-company.json';
import OpsPlaybookPurchase from '@/components/OpsPlaybookPurchase';

const description = 'Aniccaの運用から作った全12章・33ページの日本語実務ガイド。エージェントの役割、再開、重複防止、認証、予算、販売と納品を、一つの業務から設計する。本文版29ドル、編集用テンプレート版99ドル。';
export const metadata: Metadata = {
  title: 'ゼロヒューマン会社の運営本 | Anicca', description,
  alternates: { canonical: 'https://aniccaai.com/zero-human-company' },
  openGraph: { title: book.title, description, url: 'https://aniccaai.com/zero-human-company', type: 'book' },
  twitter: { card: 'summary', title: book.title, description },
};

export default function ZeroHumanCompanyBook() {
  const offers = Object.entries(book.editions);
  const structured = {
    '@context': 'https://schema.org', '@type': 'Book', name: book.title,
    author: { '@type': 'Organization', name: book.author }, inLanguage: 'ja',
    numberOfPages: book.pages, bookFormat: 'https://schema.org/EBook',
    offers: offers.map(([, offer]) => ({ '@type': 'Offer', name: offer.label,
      price: (offer.unit_amount / 100).toFixed(2), priceCurrency: 'USD',
      availability: 'https://schema.org/InStock', url: offer.payment_url })),
  };
  return <main lang="ja" className="min-h-screen bg-[#f5f1e7] text-[#28352b]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
    <div className="mx-auto max-w-6xl px-6 py-9 sm:px-10">
      <nav className="flex items-center justify-between gap-4 text-sm"><Link href="/" className="font-semibold tracking-[.2em]">ANICCA</Link><a href="#editions" className="underline underline-offset-4">二つの版を見る</a></nav>
      <OpsPlaybookPurchase />
      <section className="grid items-center gap-12 py-16 md:grid-cols-[.8fr_1.2fr] md:py-24">
        <div aria-hidden="true" className="mx-auto flex aspect-[.7] w-full max-w-xs flex-col justify-between bg-[#203b2e] px-8 py-11 text-[#f5f1e7] shadow-[18px_24px_50px_rgba(41,48,32,.2)]">
          <p className="text-xs tracking-[.22em] text-[#d3c39a]">ANICCA / OPERATIONS</p>
          <p className="font-serif text-4xl leading-relaxed">ゼロヒューマン<br />会社の<br />運営本</p>
          <p className="border-t border-[#82907d] pt-6 text-sm leading-7">仕事の続きを残す。<br />結果まで、引き継ぐ。</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[.2em] text-[#7b6943]">エージェント運用の実務ガイド</p>
          <h1 className="mt-5 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">エージェントに、<br />仕事の続きを残す。</h1>
          <p className="mt-6 max-w-xl text-lg leading-9 text-[#63705d]">ページはできた。でも買えない。送信した。でも結果が分からない。その「あと一歩」を閉じるための役割・権限・再開・確認を、一つの業務から設計します。</p>
          <div className="my-7 flex flex-wrap gap-2 text-xs font-medium text-[#57634f]">{[`日本語・全12章`, `PDF ${book.pages}ページ`, '一回払い・米ドル建て'].map((item) => <span key={item} className="rounded-full border border-[#cbd0be] px-3 py-2">{item}</span>)}</div>
          <a href="#editions" className="inline-block rounded-full bg-[#203b2e] px-8 py-4 font-semibold text-white hover:bg-[#31503d]">本文版 $29 / テンプレート版 $99</a>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#6b715f]">Aniccaの実際の運用資料から、公開できる実務の形へ書き直した本です。「ゼロヒューマン」は運営方針を指します。現在も故障や手動対応が残り、完全無人化・利益・稼働率を保証する商品ではありません。</p>
        </div>
      </section>
      <section className="grid gap-9 border-y border-[#cbd0be] py-12 sm:grid-cols-3">
        {[
          ['担当が変わっても、続けられる', '目的、所有者、現在地、公式記録、次の一手を残す。会話を最初から読まなくても再開できる形を作ります。'],
          ['外部操作を、二度しない', '応答が消えた送信・請求・公開を、すぐに繰り返さない。何を照合してから再実行するかを決めます。'],
          ['作業と、結果を分ける', 'テスト、公開URL、支払い、納品を別々に確認する。未確認を成功やゼロへ置き換えない運用を学びます。'],
        ].map(([title, text]) => <div key={title}><h2 className="font-serif text-2xl leading-relaxed">{title}</h2><p className="mt-3 text-sm leading-7 text-[#64705f]">{text}</p></div>)}
      </section>
      <section className="grid gap-10 py-16 md:grid-cols-[.7fr_1.3fr]">
        <div><h2 className="font-serif text-3xl">この本で作るもの</h2><p className="mt-5 text-sm leading-7 text-[#64705f]">巨大なエージェント組織より先に、一つの仕事が結果まで進む運用を。開発者、個人事業者、小さなチームで、すでにエージェントを使い始めている人へ。</p></div>
        <ol className="divide-y divide-[#d7d8c9]">{book.chapters.map((chapter, index) => <li key={chapter} className="flex gap-5 py-4"><span className="w-6 shrink-0 text-sm text-[#8a7955]">{String(index + 1).padStart(2, '0')}</span><span className="font-serif text-xl">{chapter}</span></li>)}</ol>
      </section>
      <section className="rounded-3xl bg-[#e7eadc] p-8 sm:p-10">
        <p className="text-xs font-semibold tracking-[.15em] text-[#7b6943]">本文の見本 / 第5章</p>
        <h2 className="mt-4 font-serif text-3xl">事実を残して再開する</h2>
        <p className="mt-6 max-w-3xl text-base leading-9">「直した」「公開した」「売れた」は、何をどこまで確かめたかが欠けます。HTTP 200は応答を得た事実です。購入者が正しいファイルを受け取れたかは、別の確認が要ります。ダッシュボードの売上表示と、銀行への入金も違う段階です。</p>
        <p className="mt-5 max-w-3xl text-sm leading-8 text-[#64705f]">実行ID、対象ID、現在の担当、外部の公式記録、未確認、次の一手を残す。次の担当が同じ判断を再現できる程度に、記録を具体的にします。</p>
      </section>
      <section id="editions" className="scroll-mt-8 py-16">
        <h2 className="font-serif text-4xl">必要な形で受け取る</h2>
        <p className="mt-4 text-sm leading-7 text-[#64705f]">同じ本文に、すぐ編集できる運用ファイルを付けるかを選べます。両方とも一回払いです。</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">{offers.map(([edition, offer]) => <article key={edition} className="flex flex-col rounded-2xl border border-[#cbd0be] bg-white/40 p-8">
          <h3 className="font-serif text-2xl">{offer.label}</h3><p className="mt-5 font-serif text-5xl">${offer.unit_amount / 100}<span className="ml-2 font-sans text-sm text-[#64705f]">USD・一回払い</span></p>
          <ul className="my-7 flex-1 space-y-3 text-sm leading-7"><li>本文PDF {book.pages}ページ・全12章</li><li>本文Markdown・付録の記入用シート</li>{edition === 'templates' && <><li>編集可能なテンプレート12ファイルのZIP</li><li>役割契約、タスク、所有権、実行記録、外部効果台帳</li><li>予算・商品設定、実行手順、失敗対応、引き継ぎ、日次報告</li></>}</ul>
          <a href={offer.payment_url} className="block rounded-full bg-[#203b2e] px-6 py-4 text-center text-sm font-semibold text-white hover:bg-[#31503d]">{offer.label}を購入 · ${offer.unit_amount / 100}</a>
        </article>)}</div>
        <p className="mt-5 text-sm leading-7 text-[#64705f]">支払い後、このページに戻ってダウンロードできます。テンプレートは文書・設定の雛形で、実行エンジン、認証機能、スケジューラ、決済機能、個別導入は含みません。自分の環境に合わせた設定が必要です。</p>
      </section>
      <section className="border-t border-[#cbd0be] py-10 text-sm leading-8 text-[#64705f]">
        <h2 className="font-serif text-2xl text-[#28352b]">ソースと受け取り方について</h2>
        <p className="mt-4">原稿・テンプレートのソースは公開リポジトリでも読めます。有料版は整形済みPDFとダウンロード用パッケージです。ソースへの独占アクセス、将来の機能、運用代行、売上の保証は含みません。</p>
        <div className="mt-4 flex flex-wrap gap-5"><a className="underline underline-offset-4" href="https://github.com/Daisuke134/anicca-products/tree/main/apps/landing/private/ebooks">原稿・テンプレートのソース</a><a className="underline underline-offset-4" href="mailto:contact@aniccaai.com">受け取りの問い合わせ</a></div>
      </section>
      <footer className="flex flex-wrap justify-between gap-4 border-t border-[#cbd0be] py-8 text-xs text-[#78806e]"><span>© Anicca</span><Link href="/tokushoho" className="underline underline-offset-4">特定商取引法に基づく表記・販売条件</Link></footer>
    </div>
  </main>;
}
