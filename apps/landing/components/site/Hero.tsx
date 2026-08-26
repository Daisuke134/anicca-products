import { translations, type Locale } from '@/lib/i18n';
import { SplitHero, CTA } from '@/components/site/taste';

interface HeroProps {
  locale: Locale;
}

export default function Hero({ locale }: HeroProps) {
  const t = translations[locale].hero;
  const subtext =
    locale === 'ja'
      ? 'AniccaはLife Managerをつくる。身体・心・お金を管理し、助言で止まらず現実の行動まで完遂するproactive general agent。'
      : 'Anicca builds Life Manager, a proactive general agent that manages your body, mind, and money and follows through in the real world.';
  const primaryLabel = locale === 'ja' ? 'Life Managerを見る' : 'Meet Life Manager';
  const secondaryLabel = locale === 'ja' ? 'open-source coreを見る' : 'View the open-source core';
  const organs = locale === 'ja' ? ['身体', '心', 'お金'] : ['Body', 'Mind', 'Money'];

  return (
    <SplitHero
      headline={t.headline}
      subtext={subtext}
      primary={
        <CTA href="/lm" variant="primary">
          {primaryLabel}
        </CTA>
      }
      secondary={
        <CTA href="https://github.com/Daisuke134/life-manager" variant="link">
          {secondaryLabel}
        </CTA>
      }
      asset={
        <a href="/lm" className="group block border-y border-[hsl(var(--border))] py-6" aria-label="Life Manager">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
            {locale === 'ja' ? '使命からプロダクトへ' : 'Mission into product'}
          </p>
          <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">
            Life Manager
          </p>
          <div className="mt-6 grid grid-cols-3 border-y border-[hsl(var(--border))]">
            {organs.map((organ) => (
              <span key={organ} className="border-r border-[hsl(var(--border))] py-4 text-center text-sm last:border-r-0">
                {organ}
              </span>
            ))}
          </div>
          <span className="mt-5 inline-flex text-[13px] text-[hsl(var(--gold))] underline underline-offset-4">
            {locale === 'ja' ? '仕組みと証拠を見る →' : 'See how it works and what is proven →'}
          </span>
        </a>
      }
    />
  );
}
