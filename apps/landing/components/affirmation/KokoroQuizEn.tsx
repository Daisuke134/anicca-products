'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { scoreAnswers } from '@/lib/kokoro-quiz';
import {
  DISCLAIMER_EN,
  KOKORO_QUESTIONS_EN,
  KOKORO_TYPES_EN,
  LIKERT_LABELS_EN,
} from '@/lib/kokoro-quiz-en';

export default function KokoroQuizEn() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => Array(KOKORO_QUESTIONS_EN.length).fill(null),
  );
  const [busy, setBusy] = useState(false);

  const progress = useMemo(
    () => Math.round(((step + (answers[step] ? 1 : 0)) / KOKORO_QUESTIONS_EN.length) * 100),
    [answers, step],
  );

  const current = KOKORO_QUESTIONS_EN[step];
  const selected = answers[step];

  function choose(value: number) {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
  }

  function goNext() {
    if (selected == null) return;
    if (step < KOKORO_QUESTIONS_EN.length - 1) {
      setStep(step + 1);
      return;
    }
    finish(answers.map((a) => a as number));
  }

  function finish(finalAnswers: number[]) {
    setBusy(true);
    try {
      const result = scoreAnswers(finalAnswers);
      const type = result.primary;
      router.push(
        `/affirmation-app/en/quiz/${type}?s=${encodeURIComponent(result.scoreString)}`,
      );
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-6">
        <div className="flex items-center justify-between text-[12px] text-[#898783]">
          <span>
            {step + 1} / {KOKORO_QUESTIONS_EN.length}
          </span>
          <span>~2 min</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e9e6e0]">
          <div
            className="h-full rounded-full bg-[#c9b382] transition-all"
            style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
          />
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-[#898783]">{DISCLAIMER_EN}</p>

      <h2 className="mt-6 text-[22px] font-semibold leading-snug tracking-tight sm:text-[26px]">
        {current.text}
      </h2>

      <fieldset className="mt-8 space-y-2" aria-label="Answer">
        {LIKERT_LABELS_EN.map((label, index) => {
          const value = index + 1;
          const active = selected === value;
          return (
            <button
              key={label}
              type="button"
              onClick={() => choose(value)}
              className={`flex w-full items-center gap-3 rounded-[16px] border px-4 py-3.5 text-left text-[15px] transition ${
                active
                  ? 'border-[#222222] bg-[#222222] text-[#e1e1e1]'
                  : 'border-[#393634]/12 bg-[#fdfcfc] text-[#393634] hover:border-[#393634]/30'
              }`}
            >
              <span className="font-mono text-[12px] opacity-70">{value}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </fieldset>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={step === 0 || busy}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="rounded-full border border-[#393634]/15 px-5 py-2.5 text-[14px] text-[#5c5956] disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          disabled={selected == null || busy}
          onClick={goNext}
          className="rounded-full bg-[#222222] px-6 py-2.5 text-[14px] font-medium text-[#e1e1e1] disabled:opacity-40"
        >
          {step === KOKORO_QUESTIONS_EN.length - 1 ? 'See my result' : 'Next'}
        </button>
      </div>

      <p className="mt-10 text-[12px] leading-relaxed text-[#b8b6b0]">
        Types include:{' '}
        {Object.values(KOKORO_TYPES_EN)
          .map((t) => t.name)
          .join(' · ')}
      </p>
    </div>
  );
}
