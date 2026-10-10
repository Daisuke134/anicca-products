'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  APP_STORE_SHINDAN_URL,
  KOKORO_PRICE_JPY,
  type KokoroTypeId,
  KOKORO_TYPES,
  shareText,
} from '@/lib/kokoro-quiz';
import { trackEvent } from '@/lib/site-hit';

type Props = {
  typeId: KokoroTypeId;
  scoreString: string;
};

export default function KokoroResultActions({ typeId, scoreString }: Props) {
  const type = KOKORO_TYPES[typeId];
  const resultUrl = useMemo(() => {
    const base = `https://aniccaai.com/affirmation-app/ja/shindan/${typeId}`;
    return scoreString ? `${base}?s=${encodeURIComponent(scoreString)}` : base;
  }, [scoreString, typeId]);
  const text = shareText(type.name, resultUrl);
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
      setCheckoutError('診断スコアがありません。もう一度診断してください。');
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError('');
    trackEvent('checkout_click', { type: typeId });
    try {
      const res = await fetch('/.netlify/functions/kokoro-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typeId, s: scoreString }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setCheckoutError('決済の準備に失敗しました。しばらくしてからお試しください。');
        setCheckoutBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError('通信エラーです。しばらくしてからお試しください。');
      setCheckoutBusy(false);
    }
  }, [scoreString, typeId]);

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-[24px] border border-[#393634]/10 bg-[#fdfcfc] px-5 py-6">
        <h2 className="text-[18px] font-semibold">結果をシェア</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#5c5956]">
          カード画像付きでsnsに送れます。定型文をそのまま使えます。
        </p>
        <div className="mt-4 overflow-hidden rounded-[18px] border border-[#393634]/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/shindan/og-${typeId}.png`}
            alt={`${type.name}のシェア用カード`}
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
            X でシェア
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-full border border-[#393634]/15 px-5 py-2.5 text-[13px] text-[#5c5956]"
          >
            {copied ? 'コピーしました' : '文面をコピー'}
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#c9b382]/40 bg-[rgba(201,179,130,0.08)] px-5 py-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#898783]">
          有料 · ¥{KOKORO_PRICE_JPY}（税込・買い切り）
        </p>
        <h2 className="mt-2 text-[22px] font-semibold tracking-tight">心のクセ・取扱説明書</h2>
        <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-[#5c5956]">
          <li>・クセの正体（約2,000字）と出やすい場面</li>
          <li>・2番目・3番目のクセ（回答スコアから個別算出）</li>
          <li>・3分で落ち着く3ステップ</li>
          <li>・30日分の日替わりアファメーション</li>
          <li>・壁紙リンク3本・相性タイプ</li>
        </ul>
        <button
          type="button"
          disabled={checkoutBusy}
          onClick={onBuy}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#222222] px-6 py-3.5 text-[15px] font-medium text-[#e1e1e1] disabled:opacity-50 sm:w-auto"
        >
          {checkoutBusy ? '準備中…' : `¥${KOKORO_PRICE_JPY}で取扱説明書を読む`}
        </button>
        {checkoutError ? (
          <p className="mt-3 text-[13px] text-[#a33]">{checkoutError}</p>
        ) : null}
        <p className="mt-3 text-[12px] leading-relaxed text-[#898783]">
          決済は Stripe。完了後すぐ画面に表示されます。PDF保存（印刷）もできます。
        </p>
      </section>

      <section className="text-center">
        <a
          href={APP_STORE_SHINDAN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-[#393634]/15 px-6 py-3 text-[14px] text-[#393634] hover:border-[#393634]/35"
        >
          アニッチャを App Store で見る
        </a>
        <p className="mt-2 text-[12px] text-[#898783]">
          この一行を、崩れそうな瞬間に届ける
        </p>
      </section>
    </div>
  );
}
