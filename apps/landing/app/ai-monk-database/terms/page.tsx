import Link from 'next/link';
import { MediaFooter, MediaNav } from '@/components/blog/OwnedMedia';

export const metadata = {
  title: "AI Monk Index: service terms | Anicca",
  description: "Scope, attribution and usage terms for the free AI Monk Database research service.",
  alternates: { canonical: 'https://aniccaai.com/ai-monk-database/terms' },
};

export default function AiMonkTermsPage() {
  return (
    <main className="min-h-screen bg-[#f5f2eb] font-sans text-[#24251f]">
      <MediaNav />
      <article className="mx-auto max-w-3xl px-5 py-14 leading-relaxed sm:px-8">
        <h1 className="mb-6 text-3xl font-semibold">AI Monk Index: service terms</h1>
        <p>These terms cover Anicca&apos;s free AI Monk Database, AI Monk Index CLI and read-only MCP endpoint. They do not describe the separate video Factory or an agreement to generate, publish or sell content.</p>
        <h2 className="mb-2 mt-8 text-xl font-semibold">Research service</h2>
        <p>The service returns a dated research snapshot of public profiles and linked sources. Candidate inclusion, profile images and reported AI provenance do not establish verified AI production. Metrics can be rounded, incomplete, disputed or outdated. Creator revenue statements are attributed claims, not audited orders, profit, current MRR or a promise of your earnings. Verify material claims against the original sources.</p>
        <h2 className="mb-2 mt-8 text-xl font-semibold">Attribution and rights</h2>
        <p>The package code is <a className="underline" href="https://github.com/Daisuke134/anicca-products/blob/main/packages/ai-monk-index/LICENSE" target="_blank" rel="noopener noreferrer">MIT licensed</a>. Anicca-authored summaries and the compilation are <a className="underline" href="https://github.com/Daisuke134/anicca-products/blob/main/packages/ai-monk-index/DATA-LICENSE.md" target="_blank" rel="noopener noreferrer">CC BY 4.0 licensed</a>: attribute “Anicca AI Monk Index” and retain the relevant original source links. Third-party names, marks, profile information and media remain subject to their owners&apos; rights; inclusion does not grant permission to reuse their identity or media.</p>
        <h2 className="mb-2 mt-8 text-xl font-semibold">Access and contact</h2>
        <p>Use only the documented read-only tools and avoid submitting private data or credentials. Availability and snapshot completeness are not guaranteed. No payment or recurring subscription is collected by this research endpoint. Your MCP client and hosting providers have their own terms and privacy practices.</p>
        <p className="mt-4">For help or corrections, see <Link className="underline" href="/ai-monk-database/support">support</Link> and the <Link className="underline" href="/ai-monk-database/privacy">privacy notice</Link>.</p>
        <p className="mt-8"><Link className="underline" href="/ai-monk-database">Return to the AI Monk Database</Link></p>
      </article>
      <div className="mx-auto max-w-[1160px] px-5 pb-10 sm:px-8"><MediaFooter /></div>
    </main>
  );
}
