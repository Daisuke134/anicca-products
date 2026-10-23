import book from '@/data/books/the-art-of-ai-monks-ja.json';
import AiMonkBookPage, { aiMonkBookMetadata } from '@/components/AiMonkBookPage';

export const metadata = aiMonkBookMetadata(book);
export default function ArtOfAiMonksJapaneseBook() { return <AiMonkBookPage book={book} />; }
