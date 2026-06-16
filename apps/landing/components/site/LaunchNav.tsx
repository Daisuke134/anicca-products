import Link from 'next/link';
import { launchDict, type LaunchLocale } from '@/lib/launch-dict';

// LaunchNav — the ONE shared top-level nav for the launch surfaces (/install /me
// /dashboard /life-manager). Foundation pre-wires EVERY launch route link here so
// each subsystem builder only adds its own route page and NEVER edits this nav
// (structural collision-prevention, spec26 §1.7 / spec27 §1).
//
// Server-component safe (no hooks). Two modes:
//   • Root mode (no `lang` prop): renders the original root hrefs (/install …) with
//     English labels and NO language toggle — behavior identical to the pre-i18n nav.
//   • Locale mode (`lang` given): hrefs are prefixed with /<lang>, labels localized,
//     and an EN⇄JA toggle that swaps the locale on the SAME page is shown.
//
// `active` is always a root path key (e.g. '/install'); locale prefix is added internally.

type NavItem = { key: string; label: (lang: LaunchLocale | null) => string };

const LAUNCH_ROUTES: readonly NavItem[] = [
  { key: '/install', label: (l) => (l ? launchDict[l].nav.install : 'Install') },
  { key: '/me', label: (l) => (l ? launchDict[l].nav.me : 'Me') },
  { key: '/dashboard', label: (l) => (l ? launchDict[l].nav.dashboard : 'Dashboard') },
  { key: '/life-manager', label: (l) => (l ? launchDict[l].nav.lifeManager : 'Life Manager') },
];

const LINK_CLASS =
  'text-sm text-[hsl(var(--text-secondary))] transition-colors hover:text-[hsl(var(--text-primary))] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--gold))]';

export default function LaunchNav({
  active,
  lang,
}: {
  active?: string;
  lang?: LaunchLocale;
}) {
  const localized = lang ?? null;
  const href = (key: string) => (localized ? `/${localized}${key}` : key);
  const homeHref = localized ? `/${localized}` : '/';
  const otherLang: LaunchLocale = localized === 'ja' ? 'en' : 'ja';
  // The toggle keeps the user on the same page (active route) in the other locale.
  const toggleHref = `/${otherLang}${active ?? ''}`;

  return (
    <nav
      aria-label={localized ? launchDict[localized].nav.ariaLabel : 'Anicca launch navigation'}
      className="sticky top-0 z-50 h-14 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/85 backdrop-blur"
    >
      <div className="container mx-auto flex h-full items-center justify-between gap-6 px-6 lg:px-8">
        <Link
          href={homeHref}
          className="text-lg font-bold text-[hsl(var(--text-primary))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--gold))]"
        >
          Anicca
        </Link>
        <div className="flex items-center gap-5">
          {LAUNCH_ROUTES.map((r) => {
            const isActive = active === r.key;
            return (
              <Link
                key={r.key}
                href={href(r.key)}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'text-sm font-semibold text-[hsl(var(--text-primary))] underline underline-offset-4 decoration-[hsl(var(--gold))]'
                    : LINK_CLASS
                }
              >
                {r.label(localized)}
              </Link>
            );
          })}
          {localized && (
            <Link
              href={toggleHref}
              aria-label={launchDict[localized].nav.toggleAria}
              className="rounded-pill border border-[hsl(var(--border))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--text-secondary))] transition-colors hover:text-[hsl(var(--text-primary))] hover:border-[hsl(var(--gold))]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--gold))]"
            >
              {launchDict[localized].nav.toggleTo}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
