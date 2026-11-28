import type { Metadata } from 'next';

// GEO parity (audit 2026-11-22: the EN support page scored 79/100 with
// meta has_canonical=false / canonical_url empty, brand_entity
// has_about_link=false and google_ai G-CANONICAL fail 0/3; this JA page
// shares the same template pattern). The canonical is this page's own
// real URL; the RSS type and og:image mirror app/layout.tsx (the real
// /feed.xml and the real app icon, 1024x1024). Title and description
// are unchanged.
export const metadata: Metadata = {
  title: 'サポート | Anicca',
  description: 'Aniccaのヘルプ - 音声で習慣を整えるコーチ',
  alternates: {
    canonical: 'https://aniccaai.com/support/ja',
    types: { 'application/rss+xml': 'https://aniccaai.com/feed.xml' },
  },
  openGraph: {
    title: 'サポート | Anicca',
    description: 'Aniccaのヘルプ - 音声で習慣を整えるコーチ',
    url: 'https://aniccaai.com/support/ja',
    type: 'website',
    images: [
      {
        url: 'https://aniccaai.com/anicca-app-icon.png',
        width: 1024,
        height: 1024,
        alt: 'Anicca app icon',
      },
    ],
  },
};


const FAQ_ITEMS = [
  {
    q: 'Aniccaはどのように動作しますか？',
    a: 'Aniccaは、リアルタイムの会話を通じてあなたを導く音声ベースの習慣形成コーチです。起床時刻、トレーニングスケジュール、就寝習慣を設定してください。Aniccaは設定した時刻にリマインドし、音声会話を通じて良い習慣を築き、悪い習慣を断つお手伝いをします。',
  },
  {
    q: 'Aniccaにはどのような権限が必要ですか？',
    a: 'Aniccaは音声会話のためにマイクアクセス、設定した時刻にリマインドを送信するために通知権限が必要です。すべての権限はオンボーディング中にリクエストされます。',
  },
  {
    q: 'データはプライベートですか？',
    a: 'はい。Aniccaはプライバシー第一のアプローチを採用しています。音声データはリアルタイムで処理され、恒久保存されません。プロフィールデータは安全に保存され、パーソナライズされたガイダンスを提供するためにのみ使用されます。詳細については、プライバシーポリシーをご覧ください。',
  },
  {
    q: '複数のデバイスでAniccaを使用できますか？',
    a: 'はい。プロフィールと設定はアカウントを通じてデバイス間で同期されます。同じアカウントでiOSとデスクトップ（Mac）の両方のデバイスでAniccaを使用できます。',
  },
];

// FAQPage JSON-LD text mirrors the visible FAQ below verbatim (same questions and answers).
const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function SupportJA() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <h1 className="text-3xl font-bold text-foreground">サポート</h1>
      <p className="mt-6 text-muted-foreground">
        Aniccaについてお困りですか？お手伝いします。
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">お問い合わせ</h2>
        <p className="mt-3 text-muted-foreground">
          サポートに関するお問い合わせ、機能リクエスト、または一般的な質問については、以下までご連絡ください：
        </p>
        <p className="mt-4">
          <a 
            href="mailto:keiodaisuke@gmail.com" 
            className="text-primary hover:underline font-medium"
          >
            keiodaisuke@gmail.com
          </a>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          通常、2営業日以内にご返信いたします。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">よくある質問</h2>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-semibold text-foreground">Aniccaはどのように動作しますか？</h3>
            <p className="mt-2 text-muted-foreground">
              Aniccaは、リアルタイムの会話を通じてあなたを導く音声ベースの習慣形成コーチです。
              起床時刻、トレーニングスケジュール、就寝習慣を設定してください。Aniccaは設定した時刻にリマインドし、
              音声会話を通じて良い習慣を築き、悪い習慣を断つお手伝いをします。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Aniccaにはどのような権限が必要ですか？</h3>
            <p className="mt-2 text-muted-foreground">
              Aniccaは音声会話のためにマイクアクセス、設定した時刻にリマインドを送信するために通知権限が必要です。
              すべての権限はオンボーディング中にリクエストされます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">データはプライベートですか？</h3>
            <p className="mt-2 text-muted-foreground">
              はい。Aniccaはプライバシー第一のアプローチを採用しています。音声データはリアルタイムで処理され、恒久保存されません。
              プロフィールデータは安全に保存され、パーソナライズされたガイダンスを提供するためにのみ使用されます。
              詳細については、<a href="/privacy/ja" className="text-primary hover:underline">プライバシーポリシー</a>をご覧ください。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">複数のデバイスでAniccaを使用できますか？</h3>
            <p className="mt-2 text-muted-foreground">
              はい。プロフィールと設定はアカウントを通じてデバイス間で同期されます。
              同じアカウントでiOSとデスクトップ（Mac）の両方のデバイスでAniccaを使用できます。
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">その他のリソース</h2>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>
            <a href="/privacy/ja" className="text-primary hover:underline">プライバシーポリシー</a>
          </li>
          <li>
            <a href="/terms" className="text-primary hover:underline">利用規約</a>
          </li>
          <li>
            <a href="/faq" className="text-primary hover:underline">FAQ</a>
          </li>
          <li>
            <a href="https://github.com/Daisuke134/anicca.ai" className="text-primary hover:underline" target="_blank" rel="noreferrer">
              GitHubリポジトリ
            </a>
          </li>
        </ul>
      </section>
      <p className="mt-10 text-muted-foreground">
        <a href="/about/ja" className="underline">Aniccaについて →</a>
      </p>
    </main>
  )
}










