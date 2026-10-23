import Link from 'next/link';
import { MediaFooter, MediaNav } from '@/components/blog/OwnedMedia';

export const metadata = {
  title: 'Anicca Monk Teachings MCP: terms | Anicca',
  description: 'Anicca Monk Teachings MCP: terms.',
  alternates: { canonical: 'https://aniccaai.com/monk-teachings/terms' },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f5f2eb] font-sans text-[#24251f]">
      <MediaNav />
      <article className="mx-auto max-w-3xl px-5 py-14 leading-relaxed sm:px-8">
        <h1 className="mb-6 text-3xl font-semibold">Anicca Monk Teachings MCP: terms</h1>
        <p>The service is free, read-only and provided as is, without warranty or uptime guarantee. It returns teachings with their translator, license and source link; please keep that attribution when you quote them.</p>
        <p className="mt-4">Texts: Dhammapada translated by Bhikkhu Sujato, dedicated to the public domain (CC0) via SuttaCentral. Our tags and compilation: CC BY 4.0. Code: MIT.</p>
        <p className="mt-4">Teachings are for reflection, not medical, legal or psychological advice. Do not abuse the endpoint (excessive automated load); we may rate-limit or change it.</p>
        <p className="mt-8"><Link className="underline" href="/monk-teachings">Back to Anicca Monk Teachings</Link></p>
      </article>
      <div className="mx-auto max-w-[1160px] px-5 pb-10 sm:px-8"><MediaFooter /></div>
    </main>
  );
}
