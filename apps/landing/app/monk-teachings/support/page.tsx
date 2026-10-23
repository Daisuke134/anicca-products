import Link from 'next/link';
import { MediaFooter, MediaNav } from '@/components/blog/OwnedMedia';

export const metadata = {
  title: 'Anicca Monk Teachings MCP: support | Anicca',
  description: 'Anicca Monk Teachings MCP: support.',
  alternates: { canonical: 'https://aniccaai.com/monk-teachings/support' },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f5f2eb] font-sans text-[#24251f]">
      <MediaNav />
      <article className="mx-auto max-w-3xl px-5 py-14 leading-relaxed sm:px-8">
        <h1 className="mb-6 text-3xl font-semibold">Anicca Monk Teachings MCP: support</h1>
        <p>For connection problems or corrections, open a <a className="underline" href="https://github.com/Daisuke134/anicca-products/issues/new?title=Monk%20Teachings%20MCP%20support">GitHub issue</a> (public; no private data) or email <a className="underline" href="mailto:contact@aniccaai.com">contact@aniccaai.com</a>.</p>
        <p className="mt-4">Remote MCP URL: <code>https://aniccaai.com/.netlify/functions/monk-teachings-mcp</code> (no auth). Tools: search_teachings, get_teaching, daily_dhamma.</p>
        <p className="mt-8"><Link className="underline" href="/monk-teachings">Back to Anicca Monk Teachings</Link></p>
      </article>
      <div className="mx-auto max-w-[1160px] px-5 pb-10 sm:px-8"><MediaFooter /></div>
    </main>
  );
}
