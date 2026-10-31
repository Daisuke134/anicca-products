"use client";

import { useEffect, useState } from 'react';

export default function OpsPlaybookPurchase() {
  const [receipt, setReceipt] = useState<{ id: string; templates: boolean } | null>(null);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const id = query.get('session_id');
    if (id && /^cs_(?:live|test)_[A-Za-z0-9_]{4,200}$/.test(id)) {
      setReceipt({ id, templates: query.get('edition') === 'templates' });
    }
  }, []);
  if (!receipt) return null;
  const formats = receipt.templates ? ['pdf', 'md', 'zip'] : ['pdf', 'md'];
  return <section aria-label="購入後のダウンロード" className="my-8 rounded-2xl border border-[#bccdb7] bg-[#edf2e8] p-6">
    <h2 className="font-serif text-2xl">購入後のダウンロード</h2>
    <p className="mt-3 text-sm leading-7 text-[#536351]">決済事業者で支払い済みと確認できた注文だけ取得できます。テンプレートZIPはテンプレート版の購入が必要です。再取得用にこのページのURLを保存してください。</p>
    <div className="mt-5 flex flex-wrap gap-3">{formats.map((format) => <a key={format}
      href={`/.netlify/functions/ebook-download?session_id=${encodeURIComponent(receipt.id)}&format=${format}`}
      className="rounded-full bg-[#203b2e] px-6 py-3 text-sm font-semibold text-white hover:bg-[#31503d]">
      {format === 'zip' ? 'テンプレートZIP' : format === 'md' ? '本文Markdown' : '本文PDF'}を取得
    </a>)}</div>
  </section>;
}
