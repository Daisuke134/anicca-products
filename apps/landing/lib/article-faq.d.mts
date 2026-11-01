type FaqPost = { slug?: string; title?: string; markdown?: string; lang?: string; access_model?: string | null };
export function articleFaq(post: FaqPost): { pairs: [string, string][]; visible: boolean };
export function isJapanese(post: FaqPost): boolean;
export function questionPairs(markdown: string): [string, string][];
export function sectionPairs(post: FaqPost): [string, string][];
export function clean(s: string): string;
