'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AFFIRMATION_PRESETS,
  AFFIRMATION_THEMES,
  BG_PRESETS,
  TEXT_COLORS,
  wrapAffirmationText,
  type BgPreset,
  type TextColor,
} from '@/lib/tools/wallpaper-presets';
import { buildWallpaperAppStoreUrl, inboundUtmSource } from '@/lib/tools/app-store';

const CANVAS_W = 1179;
const CANVAS_H = 2556;
const MAX_CHARS = 40;

type FontChoice = 'gothic' | 'mincho';
type SizeChoice = 'sm' | 'md' | 'lg';
type VPos = 'center' | 'lower';

const SIZE_PT: Record<SizeChoice, number> = { sm: 52, md: 68, lg: 86 };
const FONT_STACK: Record<FontChoice, string> = {
  gothic: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif',
  mincho: '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", "Songti SC", serif',
};

function ymd(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function fillBackground(ctx: CanvasRenderingContext2D, bg: BgPreset) {
  if (bg.kind === 'solid') {
    ctx.fillStyle = bg.colors[0];
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    return;
  }
  if (bg.kind === 'radial') {
    const g = ctx.createRadialGradient(CANVAS_W * 0.5, CANVAS_H * 0.3, 0, CANVAS_W * 0.5, CANVAS_H * 0.5, CANVAS_H * 0.7);
    bg.colors.forEach((c, i) => g.addColorStop(i / Math.max(1, bg.colors.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    return;
  }
  const angle = ((bg.angleDeg ?? 160) * Math.PI) / 180;
  const x2 = CANVAS_W / 2 + Math.cos(angle) * CANVAS_W;
  const y2 = CANVAS_H / 2 + Math.sin(angle) * CANVAS_H;
  const g = ctx.createLinearGradient(CANVAS_W / 2 - (x2 - CANVAS_W / 2), CANVAS_H / 2 - (y2 - CANVAS_H / 2), x2, y2);
  bg.colors.forEach((c, i) => g.addColorStop(i / Math.max(1, bg.colors.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

async function renderWallpaper(opts: {
  text: string;
  bg: BgPreset;
  font: FontChoice;
  size: SizeChoice;
  vPos: VPos;
  watermark: boolean;
}): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');

  await document.fonts.ready.catch(() => undefined);

  fillBackground(ctx, opts.bg);

  const textColor: TextColor = opts.bg.textColor;
  const fontSize = SIZE_PT[opts.size];
  ctx.fillStyle = TEXT_COLORS[textColor];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${fontSize}px ${FONT_STACK[opts.font]}`;

  const lines = wrapAffirmationText(opts.text, 12, 4);
  // Keep text below ~30% (clock/widget zone)
  const safeTop = CANVAS_H * 0.32;
  const centerY = opts.vPos === 'lower' ? CANVAS_H * 0.58 : CANVAS_H * 0.48;
  const startY = Math.max(safeTop + fontSize, centerY - ((lines.length - 1) * fontSize * 1.35) / 2);

  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_W / 2, startY + i * fontSize * 1.35, CANVAS_W * 0.82);
  });

  if (opts.watermark) {
    ctx.globalAlpha = 0.35;
    ctx.font = `400 ${Math.round(fontSize * 0.32)}px ${FONT_STACK.gothic}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('anicca', CANVAS_W - 48, CANVAS_H - 48);
    ctx.globalAlpha = 1;
  }

  return canvas;
}

export default function WallpaperTool() {
  const [theme, setTheme] = useState(AFFIRMATION_THEMES[0].id);
  const [presetId, setPresetId] = useState(AFFIRMATION_PRESETS[0].id);
  const [custom, setCustom] = useState('');
  const [bgId, setBgId] = useState(BG_PRESETS[0].id);
  const [size, setSize] = useState<SizeChoice>('md');
  const [vPos, setVPos] = useState<VPos>('lower');
  const [font, setFont] = useState<FontChoice>('gothic');
  const [watermark, setWatermark] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [storeAfter, setStoreAfter] = useState('');
  const [storeFooter, setStoreFooter] = useState('');

  useEffect(() => {
    const term = inboundUtmSource();
    setStoreAfter(buildWallpaperAppStoreUrl({ ct: 'lp_wallpaper_ja', utmContent: 'after_download', utmTerm: term }));
    setStoreFooter(buildWallpaperAppStoreUrl({ ct: 'lp_wallpaper_ja_footer', utmContent: 'footer', utmTerm: term }));
  }, []);

  const bg = useMemo(() => BG_PRESETS.find((b) => b.id === bgId) ?? BG_PRESETS[0], [bgId]);
  const themePresets = useMemo(() => AFFIRMATION_PRESETS.filter((p) => p.theme === theme), [theme]);
  const text = custom.trim() || (AFFIRMATION_PRESETS.find((p) => p.id === presetId)?.text ?? '');
  const overLimit = custom.length > MAX_CHARS;
  const previewColor = TEXT_COLORS[bg.textColor];
  const previewLines = wrapAffirmationText(text.slice(0, MAX_CHARS), 12, 4);

  const onExport = useCallback(async () => {
    if (!text || overLimit) return;
    setBusy(true);
    setIosHint(false);
    try {
      const canvas = await renderWallpaper({ text: text.slice(0, MAX_CHARS), bg, font, size, vPos, watermark });
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/png'));
      if (!blob) throw new Error('blob');
      const url = URL.createObjectURL(blob);
      const filename = `anicca-wallpaper-${ymd()}.png`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();

      // iOS Safari often ignores download — open image in new tab with save hint
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS) {
        window.open(url, '_blank', 'noopener');
        setIosHint(true);
      } else {
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
      setShowCta(true);
    } catch {
      /* keep UI calm */
    } finally {
      setBusy(false);
    }
  }, [text, overLimit, bg, font, size, vPos, watermark]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-10">
      <nav className="mb-8 flex flex-wrap gap-3 text-sm text-[hsl(var(--text-secondary))]">
        <Link href="/affirmation-app/ja" className="underline-offset-4 hover:text-[hsl(var(--gold))] hover:underline">
          ← アファメーションアプリ
        </Link>
        <span aria-hidden>·</span>
        <Link href="/lm/ja" className="underline-offset-4 hover:text-[hsl(var(--gold))] hover:underline">
          Life Manager
        </Link>
      </nav>

      <header className="mb-10">
        <p className="text-xs font-semibold tracking-[0.18em] text-[hsl(var(--gold))]">無料ツール · 登録不要</p>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-[hsl(var(--text-primary))] md:text-4xl">
          ロック画面のアファメーション壁紙メーカー
        </h1>
        <p className="mt-4 text-sm leading-7 text-[hsl(var(--text-secondary))]">
          iPhoneのロック画面に、やさしい一言を。入力内容は送信されません。ウェルネス目的のツールです（医療・治療効果をうたうものではありません）。
        </p>
        <p className="mt-2 text-xs text-[hsl(var(--text-secondary))]">★4.5（日本のApp Store・47件）</p>
      </header>

      <section className="space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">1. 言葉を選ぶ</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {AFFIRMATION_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  const first = AFFIRMATION_PRESETS.find((p) => p.theme === t.id);
                  if (first) {
                    setPresetId(first.id);
                    setCustom('');
                  }
                }}
                className={`rounded-pill px-3 py-1.5 text-xs font-medium transition ${
                  theme === t.id
                    ? 'bg-[hsl(var(--text-primary))] text-[hsl(var(--background))]'
                    : 'border border-[hsl(var(--border))] text-[hsl(var(--text-secondary))]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {themePresets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPresetId(p.id);
                  setCustom('');
                }}
                className={`rounded-card border px-3 py-2 text-left text-sm transition ${
                  !custom && presetId === p.id
                    ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--text-primary))]'
                    : 'border-[hsl(var(--border))] text-[hsl(var(--text-secondary))]'
                }`}
              >
                {p.text}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-xs text-[hsl(var(--text-secondary))]">
            自由入力（最大{MAX_CHARS}文字）
            <input
              type="text"
              value={custom}
              maxLength={MAX_CHARS + 5}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="自分の言葉を書く"
              className="mt-1 w-full rounded-[var(--radius-input)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-sm text-[hsl(var(--text-primary))]"
            />
          </label>
          {overLimit && <p className="mt-1 text-xs text-red-600">40文字以内にしてください</p>}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">2. 背景を選ぶ</h2>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {BG_PRESETS.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-label={b.label}
                title={b.label}
                onClick={() => setBgId(b.id)}
                className={`aspect-square rounded-lg border-2 ${bgId === b.id ? 'border-[hsl(var(--gold))]' : 'border-transparent'}`}
                style={{ background: b.css }}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">3. オプション</h2>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <fieldset className="flex items-center gap-2">
              <legend className="sr-only">文字サイズ</legend>
              {(['sm', 'md', 'lg'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`rounded-pill px-3 py-1 text-xs ${size === s ? 'bg-[hsl(var(--text-primary))] text-[hsl(var(--background))]' : 'border border-[hsl(var(--border))]'}`}
                >
                  {s === 'sm' ? '小' : s === 'md' ? '中' : '大'}
                </button>
              ))}
            </fieldset>
            <fieldset className="flex items-center gap-2">
              <legend className="sr-only">縦位置</legend>
              {([
                ['center', '中央'],
                ['lower', 'やや下'],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setVPos(k)}
                  className={`rounded-pill px-3 py-1 text-xs ${vPos === k ? 'bg-[hsl(var(--text-primary))] text-[hsl(var(--background))]' : 'border border-[hsl(var(--border))]'}`}
                >
                  {label}
                </button>
              ))}
            </fieldset>
            <fieldset className="flex items-center gap-2">
              <legend className="sr-only">フォント</legend>
              {([
                ['gothic', 'ゴシック'],
                ['mincho', '明朝'],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFont(k)}
                  className={`rounded-pill px-3 py-1 text-xs ${font === k ? 'bg-[hsl(var(--text-primary))] text-[hsl(var(--background))]' : 'border border-[hsl(var(--border))]'}`}
                >
                  {label}
                </button>
              ))}
            </fieldset>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-[hsl(var(--text-secondary))]">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} />
              透かし「anicca」（既定ON）
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={showGuide} onChange={(e) => setShowGuide(e.target.checked)} />
              時計ガイド（書き出しには含みません）
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">4. プレビュー</h2>
          <div className="mt-3 flex justify-center">
            <div
              className="relative w-[min(100%,220px)] overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] shadow-sm"
              style={{ aspectRatio: '9 / 19.5', background: bg.css }}
            >
              {showGuide && (
                <div className="pointer-events-none absolute inset-x-0 top-[8%] flex flex-col items-center opacity-40">
                  <span className="text-[10px] text-white drop-shadow" style={{ color: previewColor }}>
                    9:41
                  </span>
                  <span className="mt-1 text-[8px]" style={{ color: previewColor }}>
                    時計・ウィジェット領域
                  </span>
                </div>
              )}
              <div
                className={`absolute inset-x-4 flex flex-col items-center gap-1 text-center ${vPos === 'lower' ? 'top-[52%]' : 'top-[42%]'}`}
                style={{
                  color: previewColor,
                  fontFamily: FONT_STACK[font],
                  fontSize: size === 'sm' ? 12 : size === 'md' ? 14 : 16,
                  fontWeight: 600,
                }}
              >
                {previewLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
              {watermark && (
                <span className="absolute bottom-3 right-3 text-[8px] opacity-35" style={{ color: previewColor }}>
                  anicca
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={busy || !text || overLimit}
            onClick={onExport}
            className="inline-flex items-center justify-center rounded-pill bg-[hsl(var(--gold))] px-7 py-3 text-sm font-semibold text-black disabled:opacity-50"
          >
            {busy ? '書き出し中…' : 'PNGをダウンロード（1179×2556）'}
          </button>
        </div>
        {iosHint && (
          <p className="text-sm text-[hsl(var(--text-secondary))]">
            iPhoneの場合：開いた画像を長押しして「写真に追加」を選んでください。
          </p>
        )}

        {showCta && (
          <aside className="rounded-card border border-[hsl(var(--gold)/0.45)] bg-[hsl(var(--gold)/0.08)] p-5">
            <p className="text-sm leading-7 text-[hsl(var(--text-primary))]">
              毎日ちがう一言を、心が揺れた瞬間に通知で。
            </p>
            <a
              href={storeAfter || '#'}
              className="mt-4 inline-flex items-center justify-center rounded-pill bg-[hsl(var(--text-primary))] px-6 py-3 text-sm font-semibold text-[hsl(var(--background))]"
            >
              アニッチャを App Store で見る（無料・アプリ内課金あり）
            </a>
          </aside>
        )}

        <section className="rounded-card border border-[hsl(var(--border))] p-5 text-sm leading-7 text-[hsl(var(--text-secondary))]">
          <h2 className="font-semibold text-[hsl(var(--text-primary))]">設定手順</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>写真に保存</li>
            <li>設定 → 壁紙 → 新しい壁紙を追加 → 写真</li>
          </ol>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">よくある質問</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-[hsl(var(--text-primary))]">データは送信されますか？</dt>
              <dd className="mt-1 text-[hsl(var(--text-secondary))]">いいえ。入力内容は送信されません。すべてブラウザ内で完結します。</dd>
            </div>
            <div>
              <dt className="font-medium text-[hsl(var(--text-primary))]">どのサイズで書き出されますか？</dt>
              <dd className="mt-1 text-[hsl(var(--text-secondary))]">1179×2556 px（iPhone向けロック画面向け）のPNGです。</dd>
            </div>
            <div>
              <dt className="font-medium text-[hsl(var(--text-primary))]">時計に文字が被りませんか？</dt>
              <dd className="mt-1 text-[hsl(var(--text-secondary))]">上部約30%を避けて配置します。プレビューの時計ガイドで確認できます。</dd>
            </div>
          </dl>
        </section>

        <p className="text-xs leading-6 text-[hsl(var(--text-secondary))]">
          関連：
          <Link href="/affirmation-app/ja" className="ml-1 underline underline-offset-2">
            アニッチャ アファメーション
          </Link>
          <Link href="/lm/ja" className="ml-3 underline underline-offset-2">
            Life Manager
          </Link>
          <Link href="/lm/guide/how-to-stop-being-late-calendar" className="ml-3 underline underline-offset-2">
            遅刻しないカレンダー術
          </Link>
        </p>
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.92)] px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="hidden text-xs text-[hsl(var(--text-secondary))] sm:block">心が揺れた瞬間に、一行を。</p>
          <a
            href={storeFooter || '#'}
            className="inline-flex flex-1 items-center justify-center rounded-pill bg-[hsl(var(--gold))] px-5 py-2.5 text-sm font-semibold text-black sm:flex-none"
          >
            App Store で見る
          </a>
        </div>
      </footer>
    </div>
  );
}
