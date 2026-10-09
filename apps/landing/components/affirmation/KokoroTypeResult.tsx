'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import KokoroResultActions from '@/components/affirmation/KokoroResultActions';
import {
  DISCLAIMER_JA,
  isValidScoreString,
  KOKORO_TYPES,
  type KokoroTypeId,
  rankedFromScoreString,
} from '@/lib/kokoro-quiz';
import { trackEvent } from '@/lib/site-hit';

type Props = {
  typeId: KokoroTypeId;
};

export default function KokoroTypeResult({ typeId }: Props) {
  const type = KOKORO_TYPES[typeId];
  const [scoreString, setScoreString] = useState('');
  const [secondName, setSecondName] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('result_view', { type: typeId });
    const s = new URLSearchParams(window.location.search).get('s') || '';
    if (isValidScoreString(s)) {
      setScoreString(s);
      const ranked = rankedFromScoreString(s);
      if (ranked) {
        const second = ranked.find((id) => id !== typeId);
        if (second) setSecondName(KOKORO_TYPES[second].name);
      }
    }
  }, [typeId]);

  return (
    <article>
      <p className="font-mono text-[11px] tracking-[0.16em] text-[#898783]">心のクセ診断 · 結果</p>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]">
        {type.name}
      </h1>
      <p className="mt-2 text-[15px] text-[#898783]">{type.shortDesc}</p>
      <p className="mt-5 text-[17px] leading-[1.85] text-[#5c5956]">{type.freeBlurb}</p>

      <section className="mt-8 rounded-[22px] border border-[#c9b382]/35 bg-[rgba(201,179,130,0.08)] px-5 py-6">
        <h2 className="text-[14px] font-semibold tracking-wide text-[#898783]">今夜使えるアファメーション</h2>
        <p className="mt-3 text-[22px] font-semibold leading-snug tracking-tight">
          {type.tonightAffirmation}
        </p>
        <p className="mt-4 text-[13px]">
          <Link
            href={`/affirmation-app/ja/a/${type.problemSlug}`}
            className="underline underline-offset-2 hover:text-[#393634]"
          >
            同じ悩みのアファメーション一覧へ
          </Link>
        </p>
      </section>

      {secondName ? (
        <p className="mt-6 text-[14px] leading-relaxed text-[#5c5956]">
          スコア上、近くに見えたクセ：<strong>{secondName}</strong>
          （詳しい2番目・3番目は取扱説明書に掲載）
        </p>
      ) : null}

      <p className="mt-6 text-[13px] leading-relaxed text-[#898783]">{DISCLAIMER_JA}</p>

      <KokoroResultActions typeId={typeId} scoreString={scoreString} />

      <p className="mt-10 text-[14px]">
        <Link href="/affirmation-app/ja/shindan" className="underline underline-offset-2">
          もう一度診断する
        </Link>
      </p>
    </article>
  );
}
