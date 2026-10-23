import profileImages from '../../public/assets/ai-monk-profiles/profiles.json';
import database from '../../public/data/ai-monk-avatar-database-2026.json';
import AiMonkDatabase from '@/components/AiMonkDatabase';
import { MediaFooter, MediaNav } from '@/components/blog/OwnedMedia';
import type { AiMonkAccount } from '@/lib/ai-monk-directory.mjs';

export const metadata = {
  title: 'AI Monk Database | Anicca',
  description:
    'Find realistic AI monk video avatars like Yang Mun. Compare followers, languages, creators, and products, with sources and AI status.',
  openGraph: { title: 'AI Monk Database', images: ['https://aniccaai.com/assets/ai-monk-profiles/yang-mun-youtube.jpg'] },
  twitter: { card: 'summary_large_image', title: 'AI Monk Database', images: ['https://aniccaai.com/assets/ai-monk-profiles/yang-mun-youtube.jpg'] },
  alternates: { canonical: 'https://aniccaai.com/ai-monk-database' },
};

export default function AiMonkDatabasePage() {
  return (
    <main className="min-h-screen bg-stone-50 pb-10 font-sans text-[#24251f]">
      <MediaNav />
      <AiMonkDatabase
        accounts={database.accounts as AiMonkAccount[]}
        sources={database.sources}
        sourceCount={database.sources.length}
        updatedAt={database.updated_at}
        profileImages={Object.fromEntries(profileImages.profiles.filter((profile) => profile.local_asset).map((profile) => [profile.account_id, profile.local_asset!]))}
      />
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8"><MediaFooter /></div>
    </main>
  );
}
