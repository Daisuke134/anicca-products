# aniccaai.com real i18n — `[lang]` static routes for key pages

Date: 2026-06-16
Owner: BUILDER (worktree `agent-a6b4640b738380c1c`, branch `feature/landing-i18n-lang-routes`)
Repo: `anicca-products` → `apps/landing` (Next.js 14 App Router, `output: 'export'`)

## Problem (audit findings)

1. Root `app/layout.tsx` hardcodes `<html lang="en">`. Even the existing `/ja` home emits `<html lang="en">` over Japanese copy (verified: `out/ja.html` → `<html lang="en">`).
2. `/en/install`, `/ja/install` (and `/en/me`, `/ja/dashboard`, `/en/life-manager`, etc.) = 404. No real per-locale routes for the KEY pages.
3. `/install` is mixed-language (English hero + Japanese body). `/life-manager` is English-only; `/me` is Japanese-only; `/dashboard` is English-only.

## Goal

A real user visits `/en/<page>` or `/ja/<page>` and gets that page in the right language, with:
- a working language toggle (in LaunchNav),
- `<html lang>` in the **emitted static HTML** matching the content,
- no build break, no regression of: install CTA real Stripe link, dashboard real numbers (build-time snapshot), `/me` integrity badge + jargon-free framing, root routes still working.

## Scope (KEY pages only)

`/` , `/install` , `/me` , `/dashboard` , `/life-manager` — each available at `/en/<page>` and `/ja/<page>`.
ja is canonical for `/me` (existing copy is JP); EN translations written fresh. EN canonical for `/life-manager`; JA written fresh. `/install` cleaned to fully-EN and fully-JA. Home reuses existing locale-aware components.

## Architecture decision (verified empirically + via Next.js docs)

Next.js rule (ctx7 `/vercel/next.js`): *"Any layout without a `layout.js` above it is a root layout."* and the documented i18n pattern is `app/[lang]/layout.js` with `generateStaticParams()` + `<html lang={params.lang}>`.

**Empirical test in THIS repo (build verified):** a top-level `app/[lang]/layout.tsx` that renders its own `<html lang={params.lang}>`, with `generateStaticParams → [{lang:'en'},{lang:'ja'}]` and `export const dynamicParams = false`:
- builds clean (exit 0, no "two parallel"/"different slug"/double-`<html>` error),
- emits `/en/install` + `/ja/install` with **exactly one** `<html>` tag carrying the correct lang (`ja.html` → `lang="ja"`),
- **coexists** with the existing static `/install` route (both emit; static route wins for the bare path).

So: top-level `app/[lang]/` dynamic segment owns `<html lang>` for the localized subtree; the existing root `app/layout.tsx` keeps owning all other (non-localized) routes unchanged. This is the cleanest non-breaking option — no gut-refactor of 50+ root routes.

### Files

| File | Action |
|---|---|
| `app/[lang]/layout.tsx` | NEW — root layout for locale subtree. `generateStaticParams`→en/ja, `dynamicParams=false`, `<html lang={lang}>` + fonts + globals.css. Per-locale `metadata`. |
| `app/[lang]/page.tsx` | NEW — home, renders existing locale-aware site components with `locale={lang}` (mirror `app/en/page.tsx`). |
| `app/[lang]/install/page.tsx` | NEW — renders `<InstallContent lang>`. |
| `app/[lang]/me/page.tsx` | NEW — renders `<MeContent lang>`. |
| `app/[lang]/dashboard/page.tsx` + `dashboard/layout.tsx` | NEW — renders `<DashboardClient lang>` (snapshot preserved). |
| `app/[lang]/life-manager/page.tsx` | NEW — renders `<LifeManagerContent lang>`. |
| `lib/launch-dict.ts` | NEW — typed dictionary for install/me/dashboard/life-manager copy, keyed `en`/`ja`. |
| `components/launch/InstallContent.tsx` | NEW — extracted install JSX, copy from dict, **Stripe link unchanged**. |
| `components/launch/MeContent.tsx` | NEW — extracted me JSX, copy from dict, **GATE0 logic + MeClient + integrity badge unchanged**. |
| `components/launch/LifeManagerContent.tsx` | NEW — extracted life-manager JSX, copy from dict. |
| `components/launch/DashboardClient.tsx` | NEW — extracted dashboard `"use client"` body, labels from dict, **snapshot seed + live fetch unchanged**. |
| `components/site/LaunchNav.tsx` | EDIT — add optional `lang` prop, localize labels, prefix hrefs with `/${lang}` when given, render a EN⇄JA toggle that swaps the current locale on the same page. Root usage (no `lang`) stays byte-identical behavior (root hrefs, EN labels, no toggle). |
| `app/install/page.tsx` | EDIT — reduce to thin wrapper rendering `<InstallContent lang="ja" />` (root install stays JA-canonical default). |
| `app/me/page.tsx` | EDIT — thin wrapper `<MeContent lang="ja" />`. |
| `app/life-manager/page.tsx` | EDIT — thin wrapper `<LifeManagerContent lang="en" />` (keep current EN default). |
| `app/dashboard/page.tsx` | EDIT — render `<DashboardClient lang="en" />`. |

Root pages keep working (they render the same content component at a default locale), so no regression and zero duplicate copy.

## Non-regression invariants (MUST hold after change)

- Install Cloud CTA `href` === `https://buy.stripe.com/cNi7sL0dEdVI0iI7ki2880U` on `/install`, `/en/install`, `/ja/install`.
- Dashboard build-time snapshot seeds static HTML (`./_snapshot.json`) and client refresh to `/.netlify/functions/dashboard-sync` preserved on every dashboard route.
- `/me` integrity badge logic (`GATE0_MET` = external && 0x1 && net>0; swap ≠ external) unchanged; MeClient unchanged.
- `<html lang>` in emitted HTML: `out/en/install.html`→`en`, `out/ja/install.html`→`ja`, etc.

## Verification (LOCAL BUILD)

`cd apps/landing && npm run build` succeeds; then grep:
- `out/en/install.html` `<html lang="en"` + English copy + Stripe link
- `out/ja/install.html` `<html lang="ja"` + Japanese copy + Stripe link
- same for me/dashboard/life-manager + home
- `out/install.html` (root) still present + Stripe link.
Paste grep evidence in PR. Do NOT merge if any broken.
