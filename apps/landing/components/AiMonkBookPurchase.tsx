"use client";

import { useEffect, useState } from 'react';

type Book = { product: string; language: string; unit_amount: number; currency: string };

export default function AiMonkBookPurchase({ book }: { book: Book }) {
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
      setError('Checkout is temporarily unavailable. Please try again.');
      setBusy(false);
    }
  }

  if (sessionId) return (
    <div className="rounded-2xl border border-[#c5d4be] bg-[#edf2e8] p-5">
      <h2 className="font-serif text-2xl text-[#20362c]">Get your files</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#536351]">Both formats are included. Keep this page for later downloads.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {['pdf', 'epub'].map((format) => <a key={format}
          href={`/.netlify/functions/ebook-download?session_id=${encodeURIComponent(sessionId)}&format=${format}`}
          className="rounded-full bg-[#203b2e] px-6 py-3 text-sm font-semibold text-white hover:bg-[#31503d]">Download {format.toUpperCase()}</a>)}
      </div>
    </div>
  );

  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: book.currency.toUpperCase() }).format(book.unit_amount / 100);
  return <div>
    <button onClick={buy} disabled={busy} className="w-full rounded-full bg-[#203b2e] px-7 py-4 font-semibold text-white transition hover:bg-[#31503d] disabled:opacity-60 sm:w-auto">
      {busy ? 'Opening checkout…' : `Get PDF + EPUB · ${price}`}
    </button>
    <p className="mt-3 text-xs text-[#706c5d]">One payment · English edition · Download after checkout</p>
    <p role="status" aria-live="polite" className="mt-2 text-sm text-[#94442f]">{error}</p>
  </div>;
}
