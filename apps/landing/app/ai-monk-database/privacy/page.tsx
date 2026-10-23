import Link from 'next/link';
import { MediaFooter, MediaNav } from '@/components/blog/OwnedMedia';

export const metadata = {
  title: 'AI Monk Index MCP — Privacy | Anicca',
  description: 'How the public AI Monk Index MCP endpoint handles research queries and connection data.',
  alternates: { canonical: 'https://aniccaai.com/ai-monk-database/privacy' },
};

export default function AiMonkMcpPrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f5f2eb] font-sans text-[#24251f]">
      <MediaNav />
      <article className="mx-auto max-w-3xl px-5 py-14 leading-relaxed sm:px-8">
        <h1 className="mb-6 text-3xl font-semibold">AI Monk Index MCP: privacy</h1>
        <p>The public AI Monk Index endpoint searches a bundled research snapshot. It does not require an account, login, API key, or payment.</p>
        <h2 className="mb-2 mt-8 text-xl font-semibold">Queries and results</h2>
        <p>We process the search text, filters, pagination, or account ID you send to return matching research records and their sources. The endpoint has no application database, query log, user profile, or analytics integration. It keeps no persistent MCP session and sets no cookies. Do not include private credentials or personal information in a research query.</p>
        <p className="mt-4">Results describe public monk-themed accounts and link to original evidence. Names, handles, metrics, claims, and uncertainties come from the public dataset. The service does not access your connected social accounts or publish on your behalf.</p>
        <h2 className="mb-2 mt-8 text-xl font-semibold">Hosting and your MCP client</h2>
        <p>Requests pass through Netlify. Hosting providers can process connection metadata and operational logs under their own policies; this notice does not promise a particular provider retention period. See <a className="underline" href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer">Netlify&apos;s privacy policy</a>. Your MCP client also handles the queries and results under its own privacy settings and policies.</p>
        <h2 className="mb-2 mt-8 text-xl font-semibold">Corrections and contact</h2>
        <p>For a research correction or privacy concern, open an <a className="underline" href="https://github.com/Daisuke134/anicca-products/issues/new?title=AI%20Monk%20Index%20privacy" target="_blank" rel="noopener noreferrer">AI Monk Index issue</a>. Issues are public, so include only the record ID, public URL, and a description that is safe to publish.</p>
        <p className="mt-8"><Link className="underline" href="/ai-monk-database">Return to the AI Monk Index</Link></p>
      </article>
      <div className="mx-auto max-w-[1160px] px-5 pb-10 sm:px-8"><MediaFooter /></div>
    </main>
  );
}
