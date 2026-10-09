'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { APP_STORE_SHINDAN_URL, DISCLAIMER_JA } from '@/lib/kokoro-quiz';

type Report = {
  disclaimer: string;
  typeName: string;
  sections: {
    identity: { title: string; body: string; scenes: string[] };
    secondary: {
      title: string;
      second: { name: string; summary: string };
      third: { name: string; summary: string };
    };
    calm: { title: string; steps: string[] };
    affirmations30: { title: string; items: string[] };
    wallpapers: { title: string; items: { text: string; url: string }[] };
    chemistry: {
      title: string;
      compatible: { name: string }[];
      clash: { name: string }[];
    };
    app: { title: string; body: string; url: string };
  };
};

export default function KokoroReportClient() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'forbidden' | 'error'>('loading');
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) {
      setStatus('forbidden');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/.netlify/functions/kokoro-report?session_id=${encodeURIComponent(sessionId)}`,
        );
        if (cancelled) return;
        if (res.status === 403 || res.status === 400) {
          setStatus('forbidden');
          return;
        }
        if (!res.ok) {
          setStatus('error');
          return;
        }
        const data = (await res.json()) as Report;
        setReport(data);
        setStatus('ok');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return <p className="mt-10 text-[15px] text-[#898783]">レポートを確認しています…</p>;
  }

  if (status === 'forbidden') {
    return (
      <div className="mt-10 space-y-4">
        <h1 className="text-[28px] font-semibold">レポートを表示できません</h1>
        <p className="text-[15px] leading-relaxed text-[#5c5956]">
          お支払いが完了したセッションでのみ表示されます。診断結果ページから購入手続きを行ってください。
        </p>
        <Link
          href="/affirmation-app/ja/shindan"
          className="inline-flex rounded-full bg-[#222222] px-5 py-2.5 text-[14px] text-[#e1e1e1]"
        >
          診断トップへ
        </Link>
      </div>
    );
  }

  if (status === 'error' || !report) {
    return (
      <div className="mt-10 space-y-4">
        <h1 className="text-[28px] font-semibold">読み込みエラー</h1>
        <p className="text-[15px] text-[#5c5956]">時間をおいて、このページを再読み込みしてください。</p>
      </div>
    );
  }

  const s = report.sections;

  return (
    <article className="mt-6 print:mt-0">
      <p className="font-mono text-[11px] tracking-[0.14em] text-[#898783]">心のクセ・取扱説明書</p>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight sm:text-[36px]">
        {report.typeName}
      </h1>
      <p className="mt-4 rounded-[14px] border border-[#393634]/10 bg-[#f8f5ed] px-4 py-3 text-[13px] leading-relaxed text-[#5c5956]">
        {report.disclaimer || DISCLAIMER_JA}
      </p>

      <div className="mt-6 flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full border border-[#393634]/15 px-5 py-2.5 text-[13px]"
        >
          PDFで保存（印刷）
        </button>
        <a
          href={s.app.url || APP_STORE_SHINDAN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#222222] px-5 py-2.5 text-[13px] text-[#e1e1e1]"
        >
          アニッチャを開く
        </a>
      </div>

      <section className="mt-12">
        <h2 className="text-[22px] font-semibold">{s.identity.title}</h2>
        {s.identity.body.split('\n\n').map((para) => (
          <p key={para.slice(0, 24)} className="mt-4 text-[16px] leading-[1.9] text-[#5c5956]">
            {para}
          </p>
        ))}
        <h3 className="mt-8 text-[16px] font-semibold">クセが出やすい場面</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-[#5c5956]">
          {s.identity.scenes.map((scene) => (
            <li key={scene}>{scene}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-[22px] font-semibold">{s.secondary.title}</h2>
        <div className="mt-4 space-y-4">
          <div className="rounded-[18px] border border-[#393634]/10 bg-[#fdfcfc] px-4 py-4">
            <p className="text-[13px] text-[#898783]">2番目</p>
            <p className="mt-1 text-[17px] font-semibold">{s.secondary.second.name}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#5c5956]">
              {s.secondary.second.summary}
            </p>
          </div>
          <div className="rounded-[18px] border border-[#393634]/10 bg-[#fdfcfc] px-4 py-4">
            <p className="text-[13px] text-[#898783]">3番目</p>
            <p className="mt-1 text-[17px] font-semibold">{s.secondary.third.name}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#5c5956]">
              {s.secondary.third.summary}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-[22px] font-semibold">{s.calm.title}</h2>
        <ol className="mt-4 space-y-3">
          {s.calm.steps.map((step, i) => (
            <li
              key={step}
              className="rounded-[16px] border border-[#393634]/10 bg-[#fdfcfc] px-4 py-3 text-[15px] leading-relaxed"
            >
              <span className="mr-2 font-mono text-[12px] text-[#b8b6b0]">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-[22px] font-semibold">{s.affirmations30.title}</h2>
        <ol className="mt-4 space-y-2">
          {s.affirmations30.items.map((line, i) => (
            <li key={`${i}-${line}`} className="text-[15px] leading-relaxed text-[#5c5956]">
              <span className="mr-2 font-mono text-[11px] text-[#b8b6b0]">
                Day {String(i + 1).padStart(2, '0')}
              </span>
              {line}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 print:hidden">
        <h2 className="text-[22px] font-semibold">{s.wallpapers.title}</h2>
        <ul className="mt-4 space-y-3">
          {s.wallpapers.items.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                className="block rounded-[16px] border border-[#393634]/10 bg-[#fdfcfc] px-4 py-3 text-[14px] hover:border-[#393634]/30"
              >
                「{item.text}」の壁紙を開く →
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-[22px] font-semibold">{s.chemistry.title}</h2>
        <p className="mt-4 text-[14px] text-[#898783]">相性が良いタイプ</p>
        <p className="mt-1 text-[16px]">
          {s.chemistry.compatible.map((t) => t.name).join(' · ')}
        </p>
        <p className="mt-4 text-[14px] text-[#898783]">すれ違いやすいタイプ</p>
        <p className="mt-1 text-[16px]">{s.chemistry.clash.map((t) => t.name).join(' · ')}</p>
      </section>

      <section className="mt-12 rounded-[24px] border border-[#393634]/10 bg-[#fdfcfc] px-5 py-7 text-center">
        <h2 className="text-[20px] font-semibold">{s.app.title}</h2>
        <p className="mt-2 text-[15px] text-[#5c5956]">{s.app.body}</p>
        <a
          href={s.app.url || APP_STORE_SHINDAN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex rounded-full bg-[#222222] px-6 py-3 text-[14px] text-[#e1e1e1]"
        >
          App Store（ct=shindan）
        </a>
      </section>

      <p className="mt-10 text-[12px] leading-relaxed text-[#898783]">
        決済画面の成功URLに戻れば、いつでもこのレポートを見直せます。{DISCLAIMER_JA}
      </p>
    </article>
  );
}
