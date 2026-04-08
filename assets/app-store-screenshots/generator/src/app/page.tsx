"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";

// ─── Apple Required Sizes ───
const IPHONE_SIZES = [
  { label: '6.9"', w: 1320, h: 2868 },
  { label: '6.5"', w: 1284, h: 2778 },
  { label: '6.3"', w: 1206, h: 2622 },
  { label: '6.1"', w: 1125, h: 2436 },
] as const;

// ─── Design Canvas (largest size) ───
const W = 1320;
const H = 2868;

// ─── Phone Mockup Measurements ───
const MK_W = 1022;
const MK_H = 2082;
const SC_L = (52 / MK_W) * 100;
const SC_T = (46 / MK_H) * 100;
const SC_W = (918 / MK_W) * 100;
const SC_H = (1990 / MK_H) * 100;
const SC_RX = (126 / 918) * 100;
const SC_RY = (126 / 1990) * 100;

// ─── Locales ───
const LOCALES = ["en", "ja"] as const;
type Locale = (typeof LOCALES)[number];

// ─── Themes ───
const THEMES = {
  sumi: {
    bg: "#1A1918",
    fg: "#E5E4E2",
    sub: "#A0A09E",
    accent: "#C9B382",
    cta: "#4A90A4",
    invertBg: "#E5E4E2",
    invertFg: "#1A1918",
    style: "zen",
  },
  blue: {
    bg: "#0A1628",
    fg: "#FFFFFF",
    sub: "#8BA3C7",
    accent: "#4A90D9",
    cta: "#5B9FE6",
    invertBg: "#E8EDF4",
    invertFg: "#0A1628",
    style: "premium",
  },
} as const;

type ThemeId = keyof typeof THEMES;

// ─── Copy ───
const COPY = {
  en: {
    ss1: { headline: "Daily affirmation\ncards" },
    ss2: { headline: "Be kind\nto yourself" },
    ss3: { headline: "Small steps,\nbig change" },
    ss4: { headline: "Built around\nyour struggles" },
    ss5: { headline: "Made for\nwhat you feel" },
  },
  ja: {
    ss1: { headline: "気分を変える、\n毎日の一言" },
    ss2: { headline: "自分に\nやさしくなれる" },
    ss3: { headline: "小さな一歩が、\n大きな変化に" },
    ss4: { headline: "あなたの悩みに\n合わせて" },
    ss5: { headline: "あなたのために\n作られた" },
  },
} satisfies Record<Locale, Record<string, { headline: string }>>;

// ─── Phone Component ───
function Phone({
  src,
  alt,
  style,
  className = "",
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{ aspectRatio: `${MK_W}/${MK_H}`, ...style }}
    >
      <img
        src="/mockup.png"
        alt=""
        className="block w-full h-full"
        draggable={false}
      />
      <div
        className="absolute z-10 overflow-hidden"
        style={{
          left: `${SC_L}%`,
          top: `${SC_T}%`,
          width: `${SC_W}%`,
          height: `${SC_H}%`,
          borderRadius: `${SC_RX}% / ${SC_RY}%`,
        }}
      >
        <img
          src={src}
          alt={alt}
          className="block w-full h-full object-cover object-top"
          draggable={false}
        />
      </div>
    </div>
  );
}

// ─── Headline Component ───
function Headline({
  text,
  color,
  fontSize,
  style,
}: {
  text: string;
  color: string;
  fontSize: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        color,
        fontSize,
        fontWeight: 700,
        lineHeight: 1.0,
        letterSpacing: "-0.02em",
        whiteSpace: "pre-line",
        ...style,
      }}
    >
      {text}
    </div>
  );
}

// ─── Slide Wrapper ───
function SlideCanvas({
  bg,
  children,
  refEl,
}: {
  bg: string;
  children: React.ReactNode;
  refEl?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={refEl}
      style={{
        width: W,
        height: H,
        background: bg,
        position: "relative",
        overflow: "hidden",
        fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      {children}
    </div>
  );
}

// ─── SS1: Hero — centered phone, headline top ───
function Slide1({
  locale,
  theme,
  refEl,
}: {
  locale: Locale;
  theme: (typeof THEMES)[ThemeId];
  refEl?: React.Ref<HTMLDivElement>;
}) {
  const base = `/screenshots/${locale}`;
  return (
    <SlideCanvas bg={theme.bg} refEl={refEl}>
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 80,
          right: 80,
        }}
      >
        <Headline
          text={COPY[locale].ss1.headline}
          color={theme.fg}
          fontSize={W * 0.09}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%) translateY(12%)",
          width: "84%",
        }}
      >
        <Phone src={`${base}/ss1-selfhatred.png`} alt="SS1" />
      </div>
    </SlideCanvas>
  );
}

// ─── SS2: Phone left-rotated, headline bottom ───
function Slide2({
  locale,
  theme,
  refEl,
}: {
  locale: Locale;
  theme: (typeof THEMES)[ThemeId];
  refEl?: React.Ref<HTMLDivElement>;
}) {
  const base = `/screenshots/${locale}`;
  return (
    <SlideCanvas bg={theme.bg} refEl={refEl}>
      <div
        style={{
          position: "absolute",
          top: 120,
          left: "-2%",
          width: "82%",
          transform: "rotate(-3deg)",
        }}
      >
        <Phone src={`${base}/ss2-selfcompassion.png`} alt="SS2" />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 80,
          right: 80,
        }}
      >
        <Headline
          text={COPY[locale].ss2.headline}
          color={theme.fg}
          fontSize={W * 0.09}
        />
      </div>
    </SlideCanvas>
  );
}

// ─── SS3: Phone right, headline top in accent ───
function Slide3({
  locale,
  theme,
  refEl,
}: {
  locale: Locale;
  theme: (typeof THEMES)[ThemeId];
  refEl?: React.Ref<HTMLDivElement>;
}) {
  const base = `/screenshots/${locale}`;
  return (
    <SlideCanvas bg={theme.bg} refEl={refEl}>
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 80,
          right: 80,
        }}
      >
        <Headline
          text={COPY[locale].ss3.headline}
          color={theme.accent}
          fontSize={W * 0.09}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 520,
          right: "-4%",
          width: "82%",
        }}
      >
        <Phone src={`${base}/ss3-procrastination.png`} alt="SS3" />
      </div>
    </SlideCanvas>
  );
}

// ─── SS4: Inverted bg, centered phone ───
function Slide4({
  locale,
  theme,
  refEl,
}: {
  locale: Locale;
  theme: (typeof THEMES)[ThemeId];
  refEl?: React.Ref<HTMLDivElement>;
}) {
  const base = `/screenshots/${locale}`;
  return (
    <SlideCanvas bg={theme.invertBg} refEl={refEl}>
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 80,
          right: 80,
        }}
      >
        <Headline
          text={COPY[locale].ss4.headline}
          color={theme.invertFg}
          fontSize={W * 0.09}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%) translateY(10%)",
          width: "84%",
        }}
      >
        <Phone src={`${base}/ss4-mypath.png`} alt="SS4" />
      </div>
    </SlideCanvas>
  );
}

// ─── SS5: CTA slide, centered phone ───
function Slide5({
  locale,
  theme,
  refEl,
}: {
  locale: Locale;
  theme: (typeof THEMES)[ThemeId];
  refEl?: React.Ref<HTMLDivElement>;
}) {
  const base = `/screenshots/${locale}`;
  return (
    <SlideCanvas bg={theme.bg} refEl={refEl}>
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 80,
          right: 80,
        }}
      >
        <Headline
          text={COPY[locale].ss5.headline}
          color={theme.fg}
          fontSize={W * 0.09}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%) translateY(14%)",
          width: "82%",
        }}
      >
        <Phone src={`${base}/ss5-struggle.png`} alt="SS5" />
      </div>
    </SlideCanvas>
  );
}

// ─── Slide Registry ───
const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5];
const SLIDE_NAMES = ["ss1-hero", "ss2-compassion", "ss3-action", "ss4-path", "ss5-struggle"];

// ─── Preview with ResizeObserver scaling ───
function ScreenshotPreview({
  locale,
  theme,
  themeId,
  slideIndex,
  exportRef,
}: {
  locale: Locale;
  theme: (typeof THEMES)[ThemeId];
  themeId: ThemeId;
  slideIndex: number;
  exportRef: React.RefObject<HTMLDivElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const s = entry.contentRect.width / W;
        setScale(s);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const SlideComponent = SLIDES[slideIndex];

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <div style={{ paddingBottom: `${(H / W) * 100}%`, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <SlideComponent locale={locale} theme={theme} />
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          textAlign: "center",
          fontSize: 12,
          color: "#666",
        }}
      >
        {SLIDE_NAMES[slideIndex]} / {locale.toUpperCase()} / {themeId}
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function ScreenshotsPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [themeId, setThemeId] = useState<ThemeId>("sumi");
  const [sizeIndex, setSizeIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("");

  const exportContainerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const theme = THEMES[themeId];
  const size = IPHONE_SIZES[sizeIndex];

  const exportAll = useCallback(async () => {
    setExporting(true);
    setExportStatus("Exporting...");

    const container = exportContainerRef.current;
    if (!container) return;

    container.style.display = "block";

    // Wait for render
    await new Promise((r) => setTimeout(r, 500));

    for (let i = 0; i < SLIDES.length; i++) {
      const el = slideRefs.current[i];
      if (!el) continue;

      setExportStatus(`Exporting ${i + 1}/${SLIDES.length}...`);

      const opts = { width: W, height: H, pixelRatio: 1, cacheBust: true };

      // Double-call trick
      await toPng(el, opts);
      const dataUrl = await toPng(el, opts);

      // If we need a different size, resize via canvas
      if (size.w !== W || size.h !== H) {
        const img = new Image();
        img.src = dataUrl;
        await new Promise((r) => { img.onload = r; });
        const canvas = document.createElement("canvas");
        canvas.width = size.w;
        canvas.height = size.h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, size.w, size.h);
        const resizedUrl = canvas.toDataURL("image/png");
        downloadPng(resizedUrl, `${String(i + 1).padStart(2, "0")}-${SLIDE_NAMES[i]}-${locale}-${themeId}-${size.w}x${size.h}.png`);
      } else {
        downloadPng(dataUrl, `${String(i + 1).padStart(2, "0")}-${SLIDE_NAMES[i]}-${locale}-${themeId}-${size.w}x${size.h}.png`);
      }

      await new Promise((r) => setTimeout(r, 300));
    }

    container.style.display = "none";
    setExporting(false);
    setExportStatus(`Exported ${SLIDES.length} screenshots!`);
  }, [locale, themeId, sizeIndex, size]);

  const exportFullMatrix = useCallback(async () => {
    setExporting(true);

    const container = exportContainerRef.current;
    if (!container) return;

    let count = 0;
    const total = LOCALES.length * Object.keys(THEMES).length * SLIDES.length;

    for (const loc of LOCALES) {
      for (const tid of Object.keys(THEMES) as ThemeId[]) {
        // We need to re-render with different locale/theme
        // For simplicity, we update state and wait
        // This is handled by rendering all combos in the export container
      }
    }

    // For full matrix export, render everything at once
    container.style.display = "block";
    await new Promise((r) => setTimeout(r, 1000));

    // Export all currently rendered slides
    for (let i = 0; i < slideRefs.current.length; i++) {
      const el = slideRefs.current[i];
      if (!el) continue;
      count++;
      setExportStatus(`Exporting ${count}/${slideRefs.current.length}...`);

      const opts = { width: W, height: H, pixelRatio: 1, cacheBust: true };
      await toPng(el, opts);
      const dataUrl = await toPng(el, opts);
      downloadPng(dataUrl, `${String(i + 1).padStart(2, "0")}-${SLIDE_NAMES[i % 5]}-${locale}-${themeId}-${W}x${H}.png`);
      await new Promise((r) => setTimeout(r, 300));
    }

    container.style.display = "none";
    setExporting(false);
    setExportStatus(`Exported ${count} screenshots!`);
  }, [locale, themeId]);

  return (
    <div style={{ padding: 24, background: "#111", minHeight: "100vh", color: "#fff" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {/* Locale */}
        <div style={{ display: "flex", gap: 4 }}>
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                background: locale === l ? "#fff" : "#333",
                color: locale === l ? "#000" : "#aaa",
                fontWeight: locale === l ? 700 : 400,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Theme */}
        <div style={{ display: "flex", gap: 4 }}>
          {(Object.keys(THEMES) as ThemeId[]).map((t) => (
            <button
              key={t}
              onClick={() => setThemeId(t)}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                background: themeId === t ? THEMES[t].accent : "#333",
                color: themeId === t ? "#000" : "#aaa",
                fontWeight: themeId === t ? 700 : 400,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Size */}
        <select
          value={sizeIndex}
          onChange={(e) => setSizeIndex(Number(e.target.value))}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid #555",
            background: "#222",
            color: "#fff",
            fontSize: 14,
          }}
        >
          {IPHONE_SIZES.map((s, i) => (
            <option key={i} value={i}>
              {s.label} ({s.w}x{s.h})
            </option>
          ))}
        </select>

        {/* Export */}
        <button
          onClick={exportAll}
          disabled={exporting}
          style={{
            padding: "8px 24px",
            borderRadius: 8,
            border: "none",
            background: exporting ? "#555" : "#C9B382",
            color: "#000",
            fontWeight: 700,
            cursor: exporting ? "not-allowed" : "pointer",
            fontSize: 14,
          }}
        >
          {exporting ? "Exporting..." : `Export All (${locale.toUpperCase()} / ${themeId} / ${size.label})`}
        </button>

        {exportStatus && (
          <span style={{ fontSize: 13, color: "#8f8" }}>{exportStatus}</span>
        )}
      </div>

      {/* Preview Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 16,
        }}
      >
        {SLIDES.map((_, i) => (
          <ScreenshotPreview
            key={`${locale}-${themeId}-${i}`}
            locale={locale}
            theme={theme}
            themeId={themeId}
            slideIndex={i}
            exportRef={exportContainerRef}
          />
        ))}
      </div>

      {/* Offscreen Export Container */}
      <div
        ref={exportContainerRef}
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          display: "none",
        }}
      >
        {SLIDES.map((SlideComponent, i) => (
          <SlideComponent
            key={`export-${i}`}
            locale={locale}
            theme={theme}
            refEl={(el: HTMLDivElement | null) => {
              slideRefs.current[i] = el;
            }}
          />
        ))}
      </div>
    </div>
  );
}

function downloadPng(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
