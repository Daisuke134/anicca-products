// One hub per business on /blog/c/<key>. Every Life Manager business publishes to /blog, and
// the old shared `project` field lumped LINE stickers and eBook posts under capafy-distribute,
// so the blog read as one undifferentiated stream (2026-10-18). Post URLs never move; the hubs,
// breadcrumbs and same-business related links give each business its own topical cluster.
export const BUSINESSES = {
  research: { label: 'Research', intro: 'Papers, hypotheses and experiments on AI and behavior. Claims and measured results belong to their stated evidence.' },
  thankful: {
    label: 'Thankful',
    intro: 'Practical gratitude-journaling guides and the Thankful app.',
  },
  'ai-creator-tools': {
    label: 'Capafy Agents',
    intro: 'Hooks, short-form scripts and video ideas from the Capafy agents we build: Hook Lab, TikTok Script Pro and YouTube Script Writer.',
  },
  'line-stickers': {
    label: 'LINE Stickers',
    intro: 'Original LINE sticker sets, the story behind each set and where to get them.',
  },
  'ebook-publishing': {
    label: 'eBook Publishing',
    intro: 'Evidence-backed field notes on building, pricing, and distributing useful books.',
  },
  ebook: {
    label: 'The Anicca Reset (eBook)',
    intro: 'Short readings and practices from The Anicca Reset.',
  },
  'ai-voice-tools': {
    label: 'Labs · Voice & Audio',
    intro: 'Researched comparisons and documented experiments with voice and audio tools. Commercial disclosures remain with each article.',
  },
  anicca: {
    label: 'Anicca iOS',
    intro: 'The Anicca app, mindfulness and impermanence in everyday life.',
  },
  notes: {
    label: 'Build Notes',
    intro: 'How we build and run autonomous agents: engineering notes and experiments.',
  },
};

export function businessOf(slug, project) {
  const s = String(slug || '');
  const p = String(project || '').toLowerCase();
  if (['ai-mindfulness-2026-05-15', 'ai-responsibility-2026-05-08', 'ai-responsibility-2026-05-08-v2-bemo', 'good-agent-evals-measure-outcomes'].includes(s)) return 'research';
  if (p === 'thankful') return 'thankful';
  if (s.startsWith('line-sticker') || p.includes('line') && p.includes('スタンプ')) return 'line-stickers';
  if (s.startsWith('ebook-publishing-')) return 'ebook-publishing';
  if (s.startsWith('ebook-')) return 'ebook';
  if (/^(elevenlabs|elevenagents)|ai-voice/.test(s) || /affiliate|ai voice|ai customer support/.test(p)) return 'ai-voice-tools';
  if (p === 'anicca-ios' || ['anicca-ios-2026-05-19-en', 'anicca-ios-2026-05-19-ja'].includes(s)) return 'anicca';
  if (p === 'capafy-distribute' || s.startsWith('capafy-')) return 'ai-creator-tools';
  return 'notes';
}

// Editorial purpose is separate from a product identity; Manager keeps its existing overlay URL.
export function editorialOf(slug, project) {
  const business = businessOf(slug, project);
  if (business === 'research' || String(project).toLowerCase() === 'manager') return 'Research';
  if (business === 'ai-voice-tools') return 'Labs';
  if (business === 'notes') return 'Build Notes';
  return 'Product guides';
}
