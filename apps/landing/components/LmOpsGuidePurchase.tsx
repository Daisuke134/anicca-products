"use client";

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/site-hit';

type Guide = { product: string; language: string; unit_amount: number; currency: string };

const downloads: Array<{ format: string; label: string }> = [
  { format: 'pdf', label: '運営本 PDF を取得' },
  { format: 'md', label: '運営本 Markdown を取得' },
  { format: 'epub', label: '実例書籍 EPUB を取得' },
  { format: 'json', label: 'データベース JSON を取得' },
];

export default function LmOpsGuidePurchase({ guide }: { guide: Guide }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('session_id');
    if (id && /^cs_(?:live|test)_[A-Za-z0-9_]{4,200}$/.test(id)) setSessionId(id);
  }, []);

  async function buy() {
    if (busy) return;
    trackEvent('checkout_click', { ct: 'lm_ops_guide_ja_checkout' });
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/.netlify/functions/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: guide.product, lang: guide.language, mode: 'payment' }),
      });
      if (!response.ok) throw new Error('checkout unavailable');
      const { url } = await response.json();
      if (new URL(url).hostname !== 'checkout.stripe.com') throw new Error('checkout unavailable');
      window.location.assign(url);
    } catch {
      setError('購入画面を開けませんでした。もう一度お試しください。');
      setBusy(false);
    }
  }

  if (sessionId) return (
    <div className="rounded-2xl border border-[#c5d4be] bg-[#edf2e8] p-5">
      <h2 className="font-serif text-2xl text-[#20362c]">購入後のダウンロード</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#536351]">支払いが完了しました。運営本と実例素材の4ファイルをここから取得できます。再ダウンロード用にこのページを保存してください。</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {downloads.map(({ format, label }) => <a key={format}
          href={`/.netlify/functions/ebook-download?session_id=${encodeURIComponent(sessionId)}&format=${format}`}
          className="rounded-full bg-[#203b2e] px-6 py-3 text-sm font-semibold text-white hover:bg-[#31503d]">{label}</a>)}
      </div>
    </div>
  );

  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: guide.currency.toUpperCase() }).format(guide.unit_amount / 100);
  return <div>
    <button onClick={buy} disabled={busy} className="w-full rounded-full bg-[#203b2e] px-7 py-4 font-semibold text-white transition hover:bg-[#31503d] disabled:opacity-60 sm:w-auto">
      {busy ? '購入画面を開いています…' : `運用ガイドを購入 · ${price}`}
    </button>
    <p className="mt-3 text-xs text-[#706c5d]">一回払い・米ドル建て・支払い後にダウンロード</p>
    <p role="status" aria-live="polite" className="mt-2 text-sm text-[#94442f]">{error}</p>
  </div>;
}
