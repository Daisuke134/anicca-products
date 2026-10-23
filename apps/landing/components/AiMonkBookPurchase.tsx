"use client";

import { useEffect, useState } from 'react';

type Book = { product: string; language: string; unit_amount: number; currency: string };

export default function AiMonkBookPurchase({ book }: { book: Book }) {
  const japanese = book.language === 'ja';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('session_id');
    if (id && /^cs_(?:live|test)_[A-Za-z0-9_]{4,200}$/.test(id)) setSessionId(id);
  }, []);

  async function buy() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/.netlify/functions/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: book.product, lang: book.language, mode: 'payment' }),
      });
      if (!response.ok) throw new Error('checkout unavailable');
      const { url } = await response.json();
      if (new URL(url).hostname !== 'checkout.stripe.com') throw new Error('checkout unavailable');
      window.location.assign(url);
    } catch {
      setError(japanese ? '購入画面を開けませんでした。もう一度お試しください。' : 'Checkout is temporarily unavailable. Please try again.');
      setBusy(false);
    }
  }

  if (sessionId) return (
    <div className="rounded-2xl border border-[#c5d4be] bg-[#edf2e8] p-5">
      <h2 className="font-serif text-2xl text-[#20362c]">{japanese ? 'PDF・EPUBをダウンロード' : 'Download PDF + EPUB'}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#536351]">{japanese ? '支払い完了後、両形式を取得できます。再ダウンロード用にこのページを保存してください。' : 'Both formats are available after payment. Keep this page for later downloads.'}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {['pdf', 'epub'].map((format) => <a key={format}
          href={`/.netlify/functions/ebook-download?session_id=${encodeURIComponent(sessionId)}&format=${format}`}
          className="rounded-full bg-[#203b2e] px-6 py-3 text-sm font-semibold text-white hover:bg-[#31503d]">{japanese ? `${format.toUpperCase()}をダウンロード` : `Download ${format.toUpperCase()}`}</a>)}
      </div>
    </div>
  );

  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: book.currency.toUpperCase() }).format(book.unit_amount / 100);
  return <div>
    <button onClick={buy} disabled={busy} className="w-full rounded-full bg-[#203b2e] px-7 py-4 font-semibold text-white transition hover:bg-[#31503d] disabled:opacity-60 sm:w-auto">
      {busy ? (japanese ? '購入画面を開いています…' : 'Opening checkout…') : (japanese ? `PDF・EPUBを購入 · ${price}` : `Buy PDF + EPUB · ${price}`)}
    </button>
    <p className="mt-3 text-xs text-[#706c5d]">{japanese ? '一回払い・日本語版・支払い後にダウンロード・米ドル建て' : 'One payment · English edition · Download after checkout'}</p>
    <p role="status" aria-live="polite" className="mt-2 text-sm text-[#94442f]">{error}</p>
  </div>;
}
