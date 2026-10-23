import Link from 'next/link';
import { MediaFooter, MediaNav } from '@/components/blog/OwnedMedia';

export const metadata = {
  title: 'Anicca Monk Teachings: ask the Buddha’s words in ChatGPT, Claude or Muse | Anicca',
  description: 'Free read-only MCP server with the full Dhammapada (423 verses, CC0), source-linked. Search teachings, get a verse, or the daily dhamma.',
  alternates: { canonical: 'https://aniccaai.com/monk-teachings' },
};

export default function MonkTeachingsPage() {
  return (
    <main className="min-h-screen bg-[#f5f2eb] font-sans text-[#24251f]">
      <MediaNav />
      <article className="mx-auto max-w-3xl px-5 py-14 leading-relaxed sm:px-8">
        <h1 className="mb-6 text-3xl font-semibold">Anicca Monk Teachings</h1>
        <p>A free, read-only MCP server of Buddhist teachings. Every result is quoted verbatim with translator, license and source link. Phase 1: the full Dhammapada (423 verses), Bhikkhu Sujato’s CC0 translation from SuttaCentral. More suttas are being added.</p>
        <h2 className="mb-2 mt-8 text-xl font-semibold">Connect</h2>
        <p>Add this remote MCP URL as a custom connector in ChatGPT, Claude, Muse or any MCP client (no auth):</p>
        <pre className="mt-2 overflow-x-auto rounded bg-white p-3 text-sm">https://aniccaai.com/.netlify/functions/monk-teachings-mcp</pre>
        <h2 className="mb-2 mt-8 text-xl font-semibold">Tools</h2>
        <ul className="list-disc pl-6"><li><code>search_teachings</code>: search by words, topic tag, teacher or collection</li><li><code>get_teaching</code>: one teaching by ID, e.g. dhp1</li><li><code>daily_dhamma</code>: the verse of the day</li></ul>
        <p className="mt-8"><Link className="underline" href="/monk-teachings/privacy">Privacy</Link> · <Link className="underline" href="/monk-teachings/terms">Terms</Link> · <Link className="underline" href="/monk-teachings/support">Support</Link> · <a className="underline" href="https://github.com/Daisuke134/life-manager/tree/main/apps/monk-mcp">Source</a></p>
      </article>
      <div className="mx-auto max-w-[1160px] px-5 pb-10 sm:px-8"><MediaFooter /></div>
    </main>
  );
}
