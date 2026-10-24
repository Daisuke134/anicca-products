import Link from 'next/link';
import { MediaFooter, MediaNav } from '@/components/blog/OwnedMedia';

export const metadata = {
  title: "AI Monk Index: support | Anicca",
  description: "Help and research corrections for the AI Monk Database, CLI and read-only MCP plugin.",
  alternates: { canonical: 'https://aniccaai.com/ai-monk-database/support' },
};

export default function AiMonkSupportPage() {
  return (
    <main className="min-h-screen bg-[#f5f2eb] font-sans text-[#24251f]">
      <MediaNav />
      <article className="mx-auto max-w-3xl px-5 py-14 leading-relaxed sm:px-8">
        <h1 className="mb-6 text-3xl font-semibold">AI Monk Index: support</h1>
        <p>Anicca maintains the AI Monk Database, AI Monk Index CLI and read-only MCP endpoint. No account, API key or payment is required.</p>
        <h2 className="mb-2 mt-8 text-xl font-semibold">Help and corrections</h2>
        <p>For connection problems or research corrections, open an <a className="underline" href="https://github.com/Daisuke134/anicca-products/issues/new?title=AI%20Monk%20Index%20support" target="_blank" rel="noopener noreferrer">AI Monk Index issue</a>. Include the client name, error, record ID or public source URL. GitHub issues are public; leave out credentials and private information.</p>
        <p className="mt-4">For a private concern, email <a className="underline" href="mailto:contact@aniccaai.com">contact@aniccaai.com</a>. Do not email passwords, API keys or payment details.</p>
        <h2 className="mb-2 mt-8 text-xl font-semibold">Connection and coverage</h2>
        <p>The remote MCP URL is <code>https://aniccaai.com/.netlify/functions/ai-monk-mcp</code>. It offers profile search, exact lookup, coverage statistics, format and monetization research, and source-linked playbooks. It cannot create videos or post to social accounts. Check each result&apos;s source dates, candidate scope and uncertainty.</p>
        <p className="mt-4"><a className="underline" href="https://github.com/Daisuke134/anicca-products/tree/main/packages/ai-monk-index" target="_blank" rel="noopener noreferrer">Installation and tool reference</a></p>
        <h2 id="install-the-codex-plugin" className="mb-2 mt-8 text-xl font-semibold">Install the Codex plugin</h2>
        <p>Use a Codex CLI with <code>codex plugin marketplace</code> support (checked with 0.160.0):</p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-white/70 p-4 text-sm"><code>{`codex plugin marketplace add Daisuke134/anicca-products --sparse .agents/plugins --sparse packages/ai-monk-plugin
codex plugin add ai-monk-index@anicca
codex plugin list --marketplace anicca`}</code></pre>
        <p className="mt-4">This installs from Anicca&apos;s repository marketplace. <a className="underline" href="https://github.com/Daisuke134/anicca-products/tree/main/packages/ai-monk-plugin" target="_blank" rel="noopener noreferrer">Plugin package and portable ZIP guidance</a></p>
        <p className="mt-4">For a separate video project workspace, open <Link className="underline" href="/ai-monk-factory/">Monk Factory Web</Link>.</p>
        <p className="mt-8"><Link className="underline" href="/ai-monk-database">Return to the AI Monk Database</Link></p>
      </article>
      <div className="mx-auto max-w-[1160px] px-5 pb-10 sm:px-8"><MediaFooter /></div>
    </main>
  );
}
