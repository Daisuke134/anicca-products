"use client";

import { useEffect, useState } from "react";
import snapshot from "@/app/(main)/dashboard/_snapshot.json";
import { launchDict, type LaunchLocale } from "@/lib/launch-dict";

// Dashboard body — locale-parameterized. Extracted from app/dashboard/page.tsx.
// UNCHANGED: build-time snapshot seed (real numbers in static HTML) + client refresh to
// /.netlify/functions/dashboard-sync. Only labels/nav now come from launchDict[lang].

type InstanceRow = {
  id: string;
  host: string;
  geo?: string;
  model_live?: string;
  model_tier?: string;
  net_worth_usd: number;
  revenue_mo_usd: number;
  burn_day_usd: number;
  runway_days: number;
  status: string;
  wallet_addr?: string | null;
};

type DashboardData = {
  total_net_worth_usd: number;
  earned_mo_usd: number;
  alive: number;
  self_funded_pct: number;
  frontier_pct: number;
  leaderboard: InstanceRow[];
  updated_at: string;
};

// Structural (not literal) shape so both en and ja dashboard dicts assign cleanly.
type Dict = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  loading: string;
  errorPrefix: string;
  livePrefix: string;
  groupPnl: string;
  totalNetWorth: string;
  earnedMo: string;
  bodiesAlive: string;
  selfFundedPct: string;
  frontierPct: string;
  leaderboard: (n: number) => string;
  netWorth: string;
  burnDay: string;
  runway: string;
  selfFunded: string;
  yes: string;
  no: string;
  wallet: string;
  freeModel: string;
  auto: string;
  dataLabel: string;
  liveJson: string;
  sourceLabel: string;
  failedLoad: string;
  localeTag: string;
};

export default function DashboardClient({ lang, rootNav = false }: { lang: LaunchLocale; rootNav?: boolean }) {
  const t = launchDict[lang].dashboard;
  // rootNav=true → root /dashboard (non-localized): nav links point to root paths and no
  // locale toggle is shown, matching the pre-i18n root page. Otherwise links are /<lang>-prefixed.
  const p = (route: string) => (rootNav ? route : `/${lang}${route}`);
  // Build-time snapshot seeds the static HTML so curl / crawlers / no-JS clients
  // see REAL numbers immediately. The client useEffect then refreshes to live.
  const seed = (snapshot as DashboardData | null) ?? null;
  const [data, setData] = useState<DashboardData | null>(seed);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(seed === null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/.netlify/functions/dashboard-sync");
        if (!res.ok) throw new Error(`dashboard-sync returned ${res.status}`);
        const json = await res.json();
        if (!cancelled) { setData(json); setError(null); }
      } catch (e) {
        if (!cancelled && !data) setError(e instanceof Error ? e.message : "fetch error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navLink = (href: string, label: string, active = false) => (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      style={{
        color: "#f4f1ea",
        opacity: active ? 1 : 0.6,
        textDecoration: active ? "underline" : "none",
        textUnderlineOffset: 4,
      }}
    >
      {label}
    </a>
  );

  return (
    <main style={{ background: "#0a0a0a", color: "#f4f1ea", minHeight: "100vh", fontFamily: "IBM Plex Sans, sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <nav aria-label={launchDict[lang].nav.ariaLabel} style={{ display: "flex", gap: 20, fontSize: 12, letterSpacing: 4, textTransform: "uppercase", flexWrap: "wrap", alignItems: "center" }}>
          {navLink(rootNav ? "/" : `/${lang}`, "← anicca")}
          {navLink(p("/install"), launchDict[lang].nav.install)}
          {navLink(p("/me"), launchDict[lang].nav.me)}
          {navLink(p("/dashboard"), launchDict[lang].nav.dashboard, true)}
          {navLink(p("/life-manager"), launchDict[lang].nav.lifeManager)}
          {!rootNav && (
            <a
              href={`/${lang === "en" ? "ja" : "en"}/dashboard`}
              aria-label={launchDict[lang].nav.toggleAria}
              style={{ marginLeft: "auto", color: "#c8302e", opacity: 0.9, textDecoration: "none", border: "1px solid rgba(200,48,46,0.5)", padding: "2px 8px" }}
            >
              {launchDict[lang].nav.toggleTo}
            </a>
          )}
        </nav>

        <h1 style={{ fontSize: 56, fontWeight: 900, marginTop: 24 }}>{t.title}</h1>
        <p style={{ opacity: 0.6, fontSize: 14 }}>
          {loading ? t.loading : error ? `${t.errorPrefix} ${error}` : `${t.livePrefix} ${data?.updated_at ? new Date(data.updated_at).toLocaleString(t.localeTag) : "?"}`}
        </p>

        {loading && <Skeleton />}
        {error && <ErrorCard message={error} t={t} />}
        {!loading && !error && data && <DashboardBody data={data} t={t} />}
      </div>
    </main>
  );
}

function DashboardBody({ data, t }: { data: DashboardData; t: Dict }) {
  return (
    <>
      <section style={{ marginTop: 40, padding: 24, border: "1px solid rgba(244,241,234,0.15)" }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: "uppercase", opacity: 0.7, marginBottom: 16 }}>{t.groupPnl}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
          <Stat label={t.totalNetWorth} value={`$${data.total_net_worth_usd.toFixed(2)}`} />
          <Stat label={t.earnedMo} value={`$${data.earned_mo_usd.toFixed(2)}`} />
          <Stat label={t.bodiesAlive} value={String(data.alive)} />
          <Stat label={t.selfFundedPct} value={`${data.self_funded_pct}%`} />
          <Stat label={t.frontierPct} value={`${data.frontier_pct}%`} />
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: "uppercase", opacity: 0.7, marginBottom: 16 }}>
          {t.leaderboard(data.leaderboard.length)}
        </h2>
        <div style={{ display: "grid", gap: 16 }}>
          {data.leaderboard.map((row, i) => (
            <InstanceCard key={row.id} row={row} rank={i + 1} t={t} />
          ))}
        </div>
      </section>

      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 32 }}>
        {t.dataLabel} <a href="/.netlify/functions/dashboard-sync" style={{ color: "#c8302e" }}>{t.liveJson}</a>
        {" · "}{t.sourceLabel} <a href="https://github.com/Daisuke134/anicca-products" style={{ color: "#c8302e" }}>anicca-products</a>
      </p>
    </>
  );
}

function humanModel(t: Dict, live?: string, tier?: string): string {
  if (!live || live === "x" || live === "auto") return tier === "free" ? t.freeModel : t.auto;
  return live;
}

function InstanceCard({ row, rank, t }: { row: InstanceRow; rank: number; t: Dict }) {
  const selfFunded = row.status !== "dead" && row.revenue_mo_usd / 30 >= row.burn_day_usd;
  return (
    <div style={{ border: "1px solid rgba(244,241,234,0.15)", padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "flex-start" }}>
        <div style={{ fontSize: 24, opacity: 0.3, fontWeight: 900, minWidth: 32 }}>#{rank}</div>
        <div>
          <p style={{ fontSize: 18, marginTop: 4 }}>{row.host} · {row.geo ?? "—"}</p>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{humanModel(t, row.model_live, row.model_tier)}</p>
        </div>
        <StatusBadge status={row.status} />
      </div>

      <div style={{
        marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(244,241,234,0.08)",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12,
      }}>
        <Metric label={t.netWorth} value={`$${row.net_worth_usd.toFixed(2)}`} />
        <Metric label={t.earnedMo} value={`$${row.revenue_mo_usd.toFixed(2)}`} />
        <Metric label={t.burnDay} value={`$${row.burn_day_usd.toFixed(2)}`} />
        <Metric label={t.runway} value={`${row.runway_days}d`} />
        <Metric label={t.selfFunded} value={selfFunded ? t.yes : t.no} highlight={selfFunded} />
        {row.wallet_addr && (
          <div>
            <p style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", opacity: 0.4 }}>{t.wallet}</p>
            <a
              href={`https://basescan.org/address/${row.wallet_addr}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#c8302e", wordBreak: "break-all", textDecoration: "none" }}
            >
              {row.wallet_addr.slice(0, 6)}…{row.wallet_addr.slice(-4)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const alive = status === "alive";
  const critical = status === "critical";
  return (
    <span style={{
      fontSize: 10, padding: "4px 10px", border: "1px solid",
      borderColor: alive ? "#c8302e" : critical ? "#e87c00" : "rgba(244,241,234,0.4)",
      color: alive ? "#c8302e" : critical ? "#e87c00" : "rgba(244,241,234,0.7)",
      letterSpacing: 2, whiteSpace: "nowrap",
    }}>
      {status.toUpperCase()}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", opacity: 0.5 }}>{label}</p>
      <p style={{ fontSize: 32, marginTop: 4 }}>{value}</p>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", opacity: 0.4 }}>{label}</p>
      <p style={{ fontSize: 13, marginTop: 2, color: highlight ? "#4ade80" : undefined }}>{value}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ marginTop: 40 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ height: 80, marginBottom: 16, background: "rgba(244,241,234,0.05)", border: "1px solid rgba(244,241,234,0.08)", borderRadius: 2 }} />
      ))}
    </div>
  );
}

function ErrorCard({ message, t }: { message: string; t: Dict }) {
  return (
    <div style={{ marginTop: 40, padding: 24, border: "1px solid rgba(200,48,46,0.4)", color: "#c8302e", fontSize: 14 }}>
      {t.failedLoad} {message}
    </div>
  );
}
