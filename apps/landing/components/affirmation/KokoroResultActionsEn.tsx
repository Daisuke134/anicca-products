'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  APP_STORE_QUIZ_EN_URL,
  KOKORO_PRICE_USD,
  KOKORO_TYPES_EN,
  shareTextEn,
  type KokoroTypeId,
} from '@/lib/kokoro-quiz-en';

type Props = {
  typeId: KokoroTypeId;
  scoreString: string;
};

export default function KokoroResultActionsEn({ typeId, scoreString }: Props) {
  const type = KOKORO_TYPES_EN[typeId];
  const resultUrl = useMemo(() => {
    const base = `https://aniccaai.com/affirmation-app/en/quiz/${typeId}`;
    return scoreString ? `${base}?s=${encodeURIComponent(scoreString)}` : base;
  }, [scoreString, typeId]);
  const text = shareTextEn(type.name, resultUrl);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [copied, setCopied] = useState(false);

  const onShareX = useCallback(() => {
    const u = new URL('https://twitter.com/intent/tweet');
    u.searchParams.set('text', text);
    window.open(u.toString(), '_blank', 'noopener,noreferrer');
  }, [text]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  const onBuy = useCallback(async () => {
    if (!scoreString) {
      setCheckoutError('Missing quiz score. Please retake the quiz.');
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError('');
    try {
      const res = await fetch('/.netlify/functions/kokoro-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typeId, s: scoreString, lang: 'en' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setCheckoutError('Could not start checkout. Please try again in a moment.');
        setCheckoutBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError('Network error. Please try again in a moment.');
      setCheckoutBusy(false);
    }
  }, [scoreString, typeId]);

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-[24px] border border-[#393634]/10 bg-[#fdfcfc] px-5 py-6">
        <h2 className="text-[18px] font-semibold">Share your result</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#5c5956]">
          Card image + a ready-to-post line for social.
        </p>
        <div className="mt-4 overflow-hidden rounded-[18px] border border-[#393634]/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/quiz/og-${typeId}.png`}
            alt={`Share card for ${type.name}`}
            width={1200}
            height={630}
            className="h-auto w-full"
          />
        </div>
        <p className="mt-3 rounded-[12px] bg-[#f8f5ed] px-3 py-2 font-mono text-[12px] leading-relaxed text-[#5c5956]">
          {text}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onShareX}
            className="rounded-full bg-[#222222] px-5 py-2.5 text-[13px] font-medium text-[#e1e1e1]"
          >
            Share on X
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-full border border-[#393634]/15 px-5 py-2.5 text-[13px] text-[#5c5956]"
          >
            {copied ? 'Copied' : 'Copy text'}
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#c9b382]/40 bg-[rgba(201,179,130,0.08)] px-5 py-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#898783]">
          Paid · ${KOKORO_PRICE_USD.toFixed(2)} USD (one-time)
        </p>
        <h2 className="mt-2 text-[22px] font-semibold tracking-tight">Mind Habits Field Guide</h2>
        <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-[#5c5956]">
          <li>· What this habit actually is (~2,000 words) and when it shows up</li>
          <li>· Your second and third patterns (from your score)</li>
          <li>· A 3-minute settle when it hits</li>
          <li>· 30 days of one-line affirmations</li>
          <li>· Wallpaper links + type chemistry</li>
        </ul>
        <button
          type="button"
          disabled={checkoutBusy}
          onClick={onBuy}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#222222] px-6 py-3.5 text-[15px] font-medium text-[#e1e1e1] disabled:opacity-50 sm:w-auto"
        >
          {checkoutBusy ? 'Preparing…' : `Read the Field Guide · $${KOKORO_PRICE_USD.toFixed(2)}`}
        </button>
        {checkoutError ? (
          <p className="mt-3 text-[13px] text-[#a33]">{checkoutError}</p>
        ) : null}
        <p className="mt-3 text-[12px] leading-relaxed text-[#898783]">
          Checkout via Stripe. The guide appears on-screen right after payment. You can also print to
          PDF.
        </p>
      </section>

      <section className="text-center">
        <a
          href={APP_STORE_QUIZ_EN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-[#393634]/15 px-6 py-3 text-[14px] text-[#393634] hover:border-[#393634]/35"
        >
          Get Anicca on the App Store
        </a>
        <p className="mt-2 text-[12px] text-[#898783]">
          One line, delivered when you start to tip
        </p>
      </section>
    </div>
  );
}
