import Link from 'next/link';
import { MediaFooter, MediaNav } from '@/components/blog/OwnedMedia';

export const metadata = {
  title: 'Anicca Monk Teachings MCP: privacy | Anicca',
  description: 'Anicca Monk Teachings MCP: privacy.',
  alternates: { canonical: 'https://aniccaai.com/monk-teachings/privacy' },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f5f2eb] font-sans text-[#24251f]">
      <MediaNav />
      <article className="mx-auto max-w-3xl px-5 py-14 leading-relaxed sm:px-8">
        <h1 className="mb-6 text-3xl font-semibold">Anicca Monk Teachings MCP: privacy</h1>
        <p>The endpoint searches a bundled, read-only dataset of public-domain Buddhist teachings. No account, login, API key or payment is required.</p>
        <p className="mt-4">We process only the search text, filters, teaching ID or date you send, to return results. There is no application database, query log, user profile, cookie, persistent session or analytics. Do not put personal information in a query.</p>
        <p className="mt-4">Requests pass through Netlify, which may process connection metadata under <a className="underline" href="https://www.netlify.com/privacy/">its own privacy policy</a>. Your MCP client (ChatGPT, Claude, Muse, etc.) handles your conversation under its own policies.</p>
        <p className="mt-4">Questions: <a className="underline" href="mailto:contact@aniccaai.com">contact@aniccaai.com</a>.</p>
        <p className="mt-8"><Link className="underline" href="/monk-teachings">Back to Anicca Monk Teachings</Link></p>
      </article>
      <div className="mx-auto max-w-[1160px] px-5 pb-10 sm:px-8"><MediaFooter /></div>
    </main>
  );
}
