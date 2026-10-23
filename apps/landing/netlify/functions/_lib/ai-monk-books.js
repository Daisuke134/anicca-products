const books = [
  require('../../../data/books/the-art-of-ai-monks-en.json'),
  require('../../../data/books/the-art-of-ai-monks-ja.json'),
];

exports.AI_MONK_BOOK_PRODUCT = 'ai_monk_book';
exports.getAiMonkBook = (language) => books.find((book) => book.language === language);
