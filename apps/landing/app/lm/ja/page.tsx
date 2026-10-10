import Link from 'next/link';
import LaunchFrame from '@/components/site/LaunchFrame';
import LmJaCta from '@/components/lm/LmJaCta';
import { LM_JA_GUIDES, lmHref } from '@/lib/lm-ja-guides';

// /lm/ja — Japanese, server-rendered Life Manager landing page for Japanese search.
// /lm localizes on the client (SSG output is English), so search engines never see the
// Japanese copy there. This page renders the approved ja.lm copy statically.
// Claims: only those in lib/launchStrings.ts (ja.lm). No phone-call claims.

export const dynamic = 'force-static';

export const metadata = {
  title: 'Life Manager｜Googleカレンダーに移動時間と出発時刻を自動で追加',
  description:
    'Googleカレンダーを一度接続すると、対象の対面予定の前に移動時間を追加し、出発時刻をカレンダーでお知らせします。アプリ不要・Gmailは読みません。7日間無料、以降は月$29。',
  keywords: ['Googleカレンダー 移動時間 自動', '出発時刻 通知', '移動時間 計算', '遅刻しない 方法', 'Life Manager'],
  alternates: { canonical: 'https://aniccaai.com/lm/ja', languages: { en: 'https://aniccaai.com/lm', ja: 'https://aniccaai.com/lm/ja' } },
  openGraph: {
    title: 'Life Manager｜次の予定に、いつ出ればいいかを。',
    description: 'Googleカレンダーに移動時間と出発時刻の通知を自動で追加。アプリ不要。7日間無料。',
    url: 'https://aniccaai.com/lm/ja',
    locale: 'ja_JP',
    type: 'website',
  },
};

const CAMPAIGN = 'lm_ja_lp';

const STEPS = [
  { n: '01', title: '「Googleカレンダーに接続」を押す', body: 'このページのボタンから始めます。アプリのインストールは不要です。' },
  { n: '02', title: 'Googleアカウントを選ぶ', body: 'Googleアカウントの本人確認を行います。' },
  { n: '03', title: 'カレンダーの権限を許可する', body: 'Googleの同意画面で、アカウントとカレンダー権限を確認して接続します。' },
];

const FEATURES = [
  { n: '01', title: '移動時間', body: '経路がわかる対面予定の前に、必要な移動時間を追加します。' },
  { n: '02', title: '出発通知', body: '出発時刻のカレンダー通知で、出発のタイミングを確認できます。' },
  { n: '03', title: '自動更新', body: '接続後は、対象の予定を確認して移動時間を管理します。' },
];

const FAQS = [
  { q: '何をしてくれるサービスですか？', a: 'Googleカレンダーを一度接続すると、対象の対面予定の前に移動時間を追加し、出発時刻をカレンダーでお知らせします。' },
  { q: 'アプリを入れる必要はありますか？', a: 'ありません。クラウドで常時稼働します。設定後は、いつものGoogleカレンダーを開くだけです。' },
  { q: 'Gmailの内容は読まれますか？', a: 'Gmailの受信箱は読みません。' },
  { q: '場所が書かれていない予定はどうなりますか？', a: '情報が足りない予定には、誤った時間を作らず変更しません。' },
  { q: '料金は？', a: '7日間無料で試せます。開始にはカード登録が必要です。以降は月$29。いつでも解約できます。' },
  { q: '接続をやめたいときは？', a: 'カレンダーの接続はいつでも解除できます。' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Life Manager',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Web',
      url: 'https://aniccaai.com/lm/ja',
      inLanguage: 'ja',
      description: 'Googleカレンダーの対面予定の前に移動時間を追加し、出発時刻をカレンダーで通知するサービス。',
      offers: { '@type': 'Offer', price: '29', priceCurrency: 'USD', description: '7日間無料（カード登録が必要）、以降は月額' },
      publisher: { '@type': 'Organization', name: 'Anicca', url: 'https://aniccaai.com' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export default function Page() {
  return (
    <LaunchFrame active="/lm">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main lang="ja" className="w-full overflow-hidden px-4 pb-24 pt-12 font-noto-sans-jp md:pt-20">
        <div className="mx-auto max-w-6xl">
          <section className="relative border-y border-[hsl(var(--border))] py-10 md:py-16">
            <p className="text-xs font-semibold tracking-[0.2em] text-[hsl(var(--gold))]">
              Googleカレンダー · 7日間無料 · 月$29
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-[hsl(var(--text-primary))] md:text-6xl">
              次の予定に、いつ出ればいいかを。
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[hsl(var(--text-secondary))] md:text-lg">
              Googleカレンダーを一度接続すると、対象の対面予定の前に移動時間を追加し、出発時刻をカレンダーでお知らせします。予定や地図を何度も確認する手間を減らします。Googleアカウントの本人確認とカレンダー権限の許可が必要です。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LmJaCta campaign={CAMPAIGN} content="hero" />
              <Link
                href={lmHref(CAMPAIGN, 'hero_details')}
                className="inline-flex items-center justify-center rounded-pill border border-[hsl(var(--border))] px-7 py-3 text-sm font-semibold text-[hsl(var(--text-primary))] transition-all hover:border-[hsl(var(--gold))]"
              >
                製品ページを見る
              </Link>
            </div>
            <p className="mt-4 text-xs leading-6 text-[hsl(var(--text-secondary))]">
              7日間無料で試せます。開始にはカード登録が必要です。以降は月$29。いつでも解約できます。
            </p>
          </section>

          <section className="py-16 md:py-20">
            <h2 className="font-display text-3xl text-[hsl(var(--text-primary))] md:text-4xl">
              「何時に出れば間に合う？」を、毎回計算しなくていい。
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[hsl(var(--text-secondary))]">
              予定の場所を確認して、地図アプリで経路を調べて、開始時刻から逆算する。外出のたびにくり返すこの作業を、カレンダーに任せられます。
            </p>
            <div className="mt-10 grid border-y border-[hsl(var(--border))] md:grid-cols-3">
              {FEATURES.map((f) => (
                <article key={f.n} className="border-b border-[hsl(var(--border))] py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0">
                  <p className="font-mono text-xs text-[hsl(var(--gold))]">{f.n}</p>
                  <h3 className="mt-6 font-display text-2xl text-[hsl(var(--text-primary))]">{f.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[hsl(var(--text-secondary))]">{f.body}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-7 md:p-10">
              <p className="font-mono text-xs tracking-[0.2em] text-[hsl(var(--gold))]">毎日の使い方</p>
              <h2 className="mt-5 font-display text-3xl text-[hsl(var(--text-primary))]">Googleカレンダーが出発計画になります。</h2>
              <p className="mt-5 text-sm leading-7 text-[hsl(var(--text-secondary))]">
                設定後は、いつものGoogleカレンダーを開くだけ。対象の予定には移動時間と出発通知が追加されます。情報が足りない予定には、誤った時間を作らず変更しません。
              </p>
            </section>
            <section className="rounded-card border border-[hsl(var(--gold)/0.5)] bg-[hsl(var(--gold)/0.06)] p-7 md:p-10">
              <p className="font-mono text-xs tracking-[0.2em] text-[hsl(var(--gold))]">プライバシーと管理</p>
              <h2 className="mt-5 font-display text-3xl text-[hsl(var(--text-primary))]">Calendarの接続はあなたが管理できます。</h2>
              <p className="mt-5 text-sm leading-7 text-[hsl(var(--text-secondary))]">
                Googleの同意画面でアカウントとカレンダー権限を確認して接続します。Gmailの受信箱は読みません。接続はいつでも解除できます。
              </p>
            </section>
          </div>

          <section className="py-16 md:py-20">
            <h2 className="font-display text-3xl text-[hsl(var(--text-primary))]">設定は一度だけ</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-card border border-[hsl(var(--border))] p-6">
                  <p className="font-mono text-xs text-[hsl(var(--gold))]">{s.n}</p>
                  <h3 className="mt-4 text-lg font-semibold text-[hsl(var(--text-primary))]">{s.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[hsl(var(--text-secondary))]">{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10">
              <LmJaCta campaign={CAMPAIGN} content="steps" />
            </div>
          </section>

          <section className="border-t border-[hsl(var(--border))] py-16">
            <h2 className="font-display text-3xl text-[hsl(var(--text-primary))]">よくある質問</h2>
            <dl className="mt-8 space-y-6">
              {FAQS.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-[hsl(var(--text-primary))]">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-7 text-[hsl(var(--text-secondary))]">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border-t border-[hsl(var(--border))] py-16">
            <h2 className="font-display text-3xl text-[hsl(var(--text-primary))]">移動時間と遅刻対策のガイド</h2>
            <ul className="mt-8 space-y-4">
              {LM_JA_GUIDES.map((g) => (
                <li key={g.slug}>
                  <Link href={`/lm/guide/${g.slug}`} className="text-base text-[hsl(var(--text-primary))] underline-offset-4 hover:text-[hsl(var(--gold))] hover:underline">
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </LaunchFrame>
  );
}
