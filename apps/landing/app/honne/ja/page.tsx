import Image from 'next/image';
import Link from 'next/link';
import { SplitHero, Section, Reveal, CTA } from '@/components/site/taste';

export const metadata = {
  title: '本音翻訳 — AIがチャットの本音を読み解く',
  description:
    'LINEや会話文を貼るだけで、隠れた感情をAIが分析し、関係を壊さない返答を提案。無料は1日3回まで。',
  alternates: {
    languages: {
      en: 'https://aniccaai.com/honne',
      ja: 'https://aniccaai.com/honne/ja',
    },
  },
};

const APP_STORE_URL =
  'https://apps.apple.com/jp/app/honne/id6759667221?pt=93486075&ct=site_honne&mt=8';

const FEATURES = [
  'LINEや会話文を貼り付けるだけで、相手の本当の気持ちをAIが即分析',
  '怒り・不安・寂しさ・期待など、隠された感情を読み解く',
  '翻訳だけでなく、関係を壊さない最適な返答まで具体的に提案',
  '対応する関係性：恋人・カップル / 友人 / 家族 / 同僚・上司',
  '無料：1日3回まで · プレミアム：無制限分析 + 全履歴 + 優先高速分析 + 詳細な心理分析',
];

const SCREENSHOTS = [
  { src: '/honne/screenshot-1.jpg', alt: '本音翻訳のオンボーディング画面' },
  { src: '/honne/screenshot-2.jpg', alt: '本音翻訳の分析画面' },
  { src: '/honne/screenshot-3.jpg', alt: '本音翻訳の結果画面' },
  { src: '/honne/screenshot-4.jpg', alt: '本音翻訳の履歴画面' },
];

export default function HonneLandingJa() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      <SplitHero
        eyebrow="iOS · ユーティリティ · 成田大祐"
        headline={
          <>
            チャットの本音を、
            <br />
            AIが読み解く
          </>
        }
        subtext="LINEや会話文を貼るだけ。言葉の裏の感情と、関係を壊さない返し方まで提案します。"
        primary={<CTA href={APP_STORE_URL}>App Store で入手</CTA>}
        secondary={
          <Link
            href="/honne"
            className="text-sm text-[hsl(var(--text-secondary))] underline-offset-4 hover:underline"
          >
            English
          </Link>
        }
        asset={
          <Image
            src="/honne/app-icon.png"
            alt="本音翻訳アプリのアイコン"
            width={512}
            height={512}
            className="mx-auto h-auto w-full max-w-[280px] object-contain"
            priority
          />
        }
      />

      <Section>
        <Reveal>
          <h2 className="mb-8 text-2xl font-semibold text-[hsl(var(--text-primary))]">
            できること
          </h2>
        </Reveal>
        <ul className="space-y-3 text-lg text-[hsl(var(--text-primary))]">
          {FEATURES.map((item, i) => (
            <Reveal key={item} delay={i * 0.06}>
              <li className="ml-6 list-disc">{item}</li>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section>
        <Reveal>
          <h2 className="mb-8 text-2xl font-semibold text-[hsl(var(--text-primary))]">
            アプリの画面
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SCREENSHOTS.map((shot, i) => (
            <Reveal key={shot.src} delay={i * 0.06}>
              <Image
                src={shot.src}
                alt={shot.alt}
                width={320}
                height={693}
                className="h-auto w-full rounded-card border border-[hsl(var(--border))] object-cover"
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <Reveal>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-lg text-[hsl(var(--text-secondary))]">
              iOS 18 以降が必要です。ダウンロード無料。アプリ内課金あり。
            </p>
            <CTA href={APP_STORE_URL}>本音翻訳を入手</CTA>
          </div>
        </Reveal>
      </Section>

      <footer className="border-t border-[hsl(var(--border))] px-4 py-8 text-sm text-[hsl(var(--text-secondary))]">
        <div className="mx-auto max-w-[1400px] space-y-2">
          <p>
            <a href="/honne/privacy" className="underline hover:text-[hsl(var(--text-primary))]">
              プライバシーポリシー
            </a>
            {' · '}
            <a
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              className="underline hover:text-[hsl(var(--text-primary))]"
            >
              利用規約 (EULA)
            </a>
            {' · '}
            <a href="/honne/support" className="underline hover:text-[hsl(var(--text-primary))]">
              サポート
            </a>
            {' · '}
            <a href="/honne" className="underline hover:text-[hsl(var(--text-primary))]">
              English
            </a>
          </p>
          <p>© 2026 成田大祐. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
