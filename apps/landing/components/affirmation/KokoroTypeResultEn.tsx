'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import KokoroResultActionsEn from '@/components/affirmation/KokoroResultActionsEn';
import {
  DISCLAIMER_EN,
  isValidScoreString,
  KOKORO_TYPES_EN,
  rankedFromScoreStringEn,
  type KokoroTypeId,
} from '@/lib/kokoro-quiz-en';

type Props = {
  typeId: KokoroTypeId;
};

export default function KokoroTypeResultEn({ typeId }: Props) {
  const type = KOKORO_TYPES_EN[typeId];
  const [scoreString, setScoreString] = useState('');
  const [secondName, setSecondName] = useState<string | null>(null);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('s') || '';
    if (isValidScoreString(s)) {
      setScoreString(s);
      const ranked = rankedFromScoreStringEn(s);
      if (ranked) {
        const second = ranked.find((id) => id !== typeId);
        if (second) setSecondName(KOKORO_TYPES_EN[second].name);
      }
    }
  }, [typeId]);

  return (
    <article>
      <p className="font-mono text-[11px] tracking-[0.16em] text-[#898783]">
        Mind Habits Quiz · Result
      </p>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]">
        {type.name}
      </h1>
      <p className="mt-2 text-[15px] text-[#898783]">{type.shortDesc}</p>
      <p className="mt-5 text-[17px] leading-[1.85] text-[#5c5956]">{type.freeBlurb}</p>

      <section className="mt-8 rounded-[22px] border border-[#c9b382]/35 bg-[rgba(201,179,130,0.08)] px-5 py-6">
        <h2 className="text-[14px] font-semibold tracking-wide text-[#898783]">
          Tonight&apos;s one-liner
        </h2>
        <p className="mt-3 text-[22px] font-semibold leading-snug tracking-tight">
          {type.tonightAffirmation}
        </p>
      </section>

      {secondName ? (
        <p className="mt-6 text-[14px] leading-relaxed text-[#5c5956]">
          Nearby on your score: <strong>{secondName}</strong>
          {' '}(second and third patterns are in the Field Guide)
        </p>
      ) : null}

      <p className="mt-6 text-[13px] leading-relaxed text-[#898783]">{DISCLAIMER_EN}</p>

      <KokoroResultActionsEn typeId={typeId} scoreString={scoreString} />

      <p className="mt-10 text-[14px]">
        <Link href="/affirmation-app/en/quiz" className="underline underline-offset-2">
          Retake the quiz
        </Link>
      </p>
    </article>
  );
}
