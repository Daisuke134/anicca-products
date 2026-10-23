import book from '@/data/books/the-art-of-ai-monks-en.json';
import AiMonkBookPage, { aiMonkBookMetadata } from '@/components/AiMonkBookPage';

export const metadata = aiMonkBookMetadata(book);
export default function ArtOfAiMonksBook() { return <AiMonkBookPage book={book} />; }
