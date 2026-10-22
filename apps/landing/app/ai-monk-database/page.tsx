import database from '../../public/data/ai-monk-avatar-database-2026.json';
import AiMonkDatabase from '@/components/AiMonkDatabase';
import { MediaFooter, MediaNav } from '@/components/blog/OwnedMedia';
import type { AiMonkAccount } from '@/lib/ai-monk-directory.mjs';

export const metadata = {
  title: 'The Art of AI Monks — Open Avatar Database | Anicca',
  description:
    'A source-linked directory of AI monk avatars: search by name, creator, language, platform, and what the public evidence actually says.',
  openGraph: { title: 'The Art of AI Monks', images: ['https://aniccaai.com/assets/the-art-of-ai-monks-cover.png'] },
  twitter: { card: 'summary_large_image', title: 'The Art of AI Monks', images: ['https://aniccaai.com/assets/the-art-of-ai-monks-cover.png'] },
  alternates: { canonical: 'https://aniccaai.com/ai-monk-database' },
};

export default function AiMonkDatabasePage() {
  return (
    <main className="min-h-screen bg-[#f5f2eb] pb-10 font-sans text-[#24251f]">
      <MediaNav />
      <AiMonkDatabase
        accounts={database.accounts as AiMonkAccount[]}
        sourceCount={database.sources.length}
        updatedAt={database.updated_at}
      />
      <div className="mx-auto max-w-[1160px] px-5 sm:px-8"><MediaFooter /></div>
    </main>
  );
}
