'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  buildDepartureIcs,
  buildGoogleCalendarUrl,
  buildLmToolHref,
  computeDeparture,
  formatDepartureHeadline,
  formatHm,
  parseQuery,
  serializeQuery,
  todayYmd,
  validateDepartureInput,
  type DepartureInput,
} from '@/lib/tools/departure';
import { inboundUtmSource } from '@/lib/tools/app-store';

const TRAVEL_PRESETS = [15, 30, 45, 60];
const BUFFER_PRESETS = [5, 10, 15, 30];

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function DepartureCalculator() {
  const [title, setTitle] = useState('予定');
  const [date, setDate] = useState(todayYmd());
  const [startTime, setStartTime] = useState('09:30');
  const [travelMinutes, setTravelMinutes] = useState(40);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [prepMinutes, setPrepMinutes] = useState(0);
  const [inbound, setInbound] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInbound(inboundUtmSource());
    const fromUrl = parseQuery(window.location.search);
    if (fromUrl.date) setDate(fromUrl.date);
    if (fromUrl.startTime) setStartTime(fromUrl.startTime);
    if (fromUrl.travelMinutes != null) setTravelMinutes(fromUrl.travelMinutes);
    if (fromUrl.bufferMinutes != null) setBufferMinutes(fromUrl.bufferMinutes);
    if (fromUrl.prepMinutes != null) setPrepMinutes(fromUrl.prepMinutes);
    setHydrated(true);
  }, []);

  const input: DepartureInput = useMemo(
    () => ({ title, date, startTime, travelMinutes, bufferMinutes, prepMinutes }),
    [title, date, startTime, travelMinutes, bufferMinutes, prepMinutes],
  );

  const error = validateDepartureInput(input);
  const result = useMemo(() => (error ? null : computeDeparture(input)), [error, input]);

  useEffect(() => {
    if (!hydrated || error) return;
    const qs = serializeQuery(input);
    const url = `${window.location.pathname}?${qs}`;
    window.history.replaceState(null, '', url);
  }, [hydrated, error, input]);

  const onIcs = useCallback(() => {
    if (!result || error) return;
    const ics = buildDepartureIcs({ input, result });
    const stamp = `${date.replace(/-/g, '')}-${startTime.replace(':', '')}`;
    downloadText(`departure-${stamp}.ics`, ics, 'text/calendar;charset=utf-8');
  }, [result, error, input, date, startTime]);

  const resultCta = buildLmToolHref('result_cta', inbound);
  const footerCta = buildLmToolHref('footer', inbound);
  const gcal = result ? buildGoogleCalendarUrl(input, result) : '#';

  const tzLabel = result
    ? result.timezoneName === 'Asia/Tokyo'
      ? '日本時間（JST）'
      : result.timezoneName
    : '';

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-10">
      <nav className="mb-8 flex flex-wrap gap-3 text-sm text-[hsl(var(--text-secondary))]">
        <Link href="/lm/ja" className="underline-offset-4 hover:text-[hsl(var(--gold))] hover:underline">
          ← Life Manager
        </Link>
        <span aria-hidden>·</span>
        <Link href="/lm/guide/travel-time-calculator-app" className="underline-offset-4 hover:text-[hsl(var(--gold))] hover:underline">
          移動時間ガイド
        </Link>
      </nav>

      <header className="mb-10">
        <p className="text-xs font-semibold tracking-[0.18em] text-[hsl(var(--gold))]">無料ツール · 登録不要</p>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-[hsl(var(--text-primary))] md:text-4xl">
          出発時刻計算機
        </h1>
        <p className="mt-4 text-sm leading-7 text-[hsl(var(--text-secondary))]">
          何時に家を出ればいい？移動時間と余裕から逆算します。入力内容は送信されません。
        </p>
      </header>

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          onIcs();
        }}
      >
        <label className="block text-xs text-[hsl(var(--text-secondary))]">
          予定名（任意）
          <input
            type="text"
            value={title}
            maxLength={60}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-input)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-sm text-[hsl(var(--text-primary))]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs text-[hsl(var(--text-secondary))]">
            日付
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 w-full rounded-[var(--radius-input)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-sm text-[hsl(var(--text-primary))]"
            />
          </label>
          <label className="block text-xs text-[hsl(var(--text-secondary))]">
            開始時刻
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="mt-1 w-full rounded-[var(--radius-input)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-sm text-[hsl(var(--text-primary))]"
            />
          </label>
        </div>

        <div>
          <label className="block text-xs text-[hsl(var(--text-secondary))]">
            移動時間（分）
            <input
              type="number"
              min={1}
              max={600}
              value={travelMinutes}
              onChange={(e) => setTravelMinutes(Number(e.target.value))}
              className="mt-1 w-full rounded-[var(--radius-input)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-sm text-[hsl(var(--text-primary))]"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TRAVEL_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTravelMinutes(n)}
                className={`rounded-pill px-3 py-1 text-xs ${travelMinutes === n ? 'bg-[hsl(var(--text-primary))] text-[hsl(var(--background))]' : 'border border-[hsl(var(--border))]'}`}
              >
                {n}分
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-[hsl(var(--text-secondary))]">
            余裕（バッファ・分）
            <input
              type="number"
              min={0}
              max={120}
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(Number(e.target.value))}
              className="mt-1 w-full rounded-[var(--radius-input)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-sm text-[hsl(var(--text-primary))]"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {BUFFER_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setBufferMinutes(n)}
                className={`rounded-pill px-3 py-1 text-xs ${bufferMinutes === n ? 'bg-[hsl(var(--text-primary))] text-[hsl(var(--background))]' : 'border border-[hsl(var(--border))]'}`}
              >
                {n}分
              </button>
            ))}
          </div>
        </div>

        <label className="block text-xs text-[hsl(var(--text-secondary))]">
          準備時間（任意・分）
          <input
            type="number"
            min={0}
            max={180}
            value={prepMinutes}
            onChange={(e) => setPrepMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-[var(--radius-input)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-sm text-[hsl(var(--text-primary))]"
          />
        </label>
      </form>

      {error ? (
        <p className="mt-6 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : result ? (
        <section className="mt-8 rounded-card border border-[hsl(var(--border))] bg-[hsl(var(--surface,var(--card)))] p-6">
          <p className="text-xs text-[hsl(var(--text-secondary))]">{tzLabel}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] text-[hsl(var(--text-primary))] md:text-4xl">
            {formatDepartureHeadline(result)}
          </p>

          <ol className="mt-6 space-y-3 border-t border-[hsl(var(--border))] pt-5 text-sm text-[hsl(var(--text-secondary))]">
            {result.prepStart && (
              <li className="flex justify-between gap-4">
                <span>準備開始</span>
                <span className="font-medium text-[hsl(var(--text-primary))]">
                  {result.crossesPrevDay && result.prepStart.getDate() !== result.start.getDate() ? '前日 ' : ''}
                  {formatHm(result.prepStart)}
                </span>
              </li>
            )}
            <li className="flex justify-between gap-4">
              <span>出発</span>
              <span className="font-medium text-[hsl(var(--text-primary))]">
                {result.crossesPrevDay ? '前日 ' : ''}
                {formatHm(result.departure)}
              </span>
            </li>
            <li className="flex justify-between gap-4">
              <span>到着予定</span>
              <span className="font-medium text-[hsl(var(--text-primary))]">{formatHm(result.arrival)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>開始</span>
              <span className="font-medium text-[hsl(var(--text-primary))]">{formatHm(result.start)}</span>
            </li>
          </ol>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={!!error}
              onClick={onIcs}
              className="inline-flex items-center justify-center rounded-pill bg-[hsl(var(--gold))] px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
            >
              カレンダーに追加（.ics）
            </button>
            <a
              href={gcal}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-pill border border-[hsl(var(--border))] px-6 py-3 text-sm font-semibold text-[hsl(var(--text-primary))]"
            >
              Googleカレンダーで作成
            </a>
          </div>

          <aside className="mt-6 rounded-card border border-[hsl(var(--gold)/0.45)] bg-[hsl(var(--gold)/0.08)] p-5">
            <p className="text-sm leading-7 text-[hsl(var(--text-primary))]">
              毎回この計算、もうしなくていい。Life Manager は Google カレンダーの予定に移動時間を自動で入れます。
            </p>
            <p className="mt-2 text-xs text-[hsl(var(--text-secondary))]">
              7日間無料で試せます。開始にはカード登録が必要です。以降は月$29。いつでも解約できます。
            </p>
            <Link
              href={resultCta}
              className="mt-4 inline-flex items-center justify-center rounded-pill bg-[hsl(var(--text-primary))] px-6 py-3 text-sm font-semibold text-[hsl(var(--background))]"
            >
              Life Manager を見る
            </Link>
          </aside>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">よくある質問</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-[hsl(var(--text-primary))]">計算式は？</dt>
            <dd className="mt-1 text-[hsl(var(--text-secondary))]">出発時刻＝開始時刻−移動時間−余裕。準備がある場合は、出発からさらに準備時間を引きます。</dd>
          </div>
          <div>
            <dt className="font-medium text-[hsl(var(--text-primary))]">.ics はどのカレンダーで使えますか？</dt>
            <dd className="mt-1 text-[hsl(var(--text-secondary))]">iOS / Google / macOS / Outlook などでインポートできます。時刻はUTCで書き出します。</dd>
          </div>
          <div>
            <dt className="font-medium text-[hsl(var(--text-primary))]">入力は送信されますか？</dt>
            <dd className="mt-1 text-[hsl(var(--text-secondary))]">いいえ。入力内容は送信されません。URLクエリは共有用にブラウザ内だけで反映されます。</dd>
          </div>
        </dl>
      </section>

      <p className="mt-10 text-xs leading-6 text-[hsl(var(--text-secondary))]">
        関連：
        <Link href="/lm/ja" className="ml-1 underline underline-offset-2">
          Life Manager（日本語）
        </Link>
        <Link href="/lm/guide/decide-departure-time-night-before" className="ml-3 underline underline-offset-2">
          前夜に出発時刻を決める
        </Link>
        <Link href="/lm/guide/how-to-stop-being-late-calendar" className="ml-3 underline underline-offset-2">
          遅刻しない方法
        </Link>
        <Link href="/affirmation-app/ja" className="ml-3 underline underline-offset-2">
          アファメーションアプリ
        </Link>
      </p>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.92)] px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <p className="hidden text-xs text-[hsl(var(--text-secondary))] sm:block">月$29 · 7日間無料</p>
          <Link
            href={footerCta}
            className="inline-flex flex-1 items-center justify-center rounded-pill bg-[hsl(var(--gold))] px-5 py-2.5 text-sm font-semibold text-black sm:flex-none"
          >
            Life Manager を見る
          </Link>
        </div>
      </footer>
    </div>
  );
}
