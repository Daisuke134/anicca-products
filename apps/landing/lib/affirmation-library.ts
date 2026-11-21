import { EN_AFFIRMATION_PROBLEMS } from '@/lib/en-affirmation-problems';
import { ES_AFFIRMATION_PROBLEMS } from '@/lib/es-affirmation-problems';
import { JA_AFFIRMATION_PROBLEMS } from '@/lib/ja-affirmation-problems';

/**
 * Library totals for the affirmation guides, computed from the guide data
 * itself at build time. The fact line on guide pages renders these values,
 * so the counts can never drift from what the pages actually contain and
 * no number is ever invented or hardcoded.
 */
function totals(problems: { affirmations: string[] }[]) {
  return {
    guides: problems.length,
    affirmations: problems.reduce((n, p) => n + p.affirmations.length, 0),
  };
}

const en = totals(EN_AFFIRMATION_PROBLEMS);
const ja = totals(JA_AFFIRMATION_PROBLEMS);
const es = totals(ES_AFFIRMATION_PROBLEMS);

export const AFFIRMATION_LIBRARY = {
  en,
  ja,
  es,
  totalGuides: en.guides + ja.guides + es.guides,
  totalAffirmations: en.affirmations + ja.affirmations + es.affirmations,
};
