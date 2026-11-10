const book = require('../../../data/books/zero-human-company.json');

exports.OPS_PLAYBOOK_PRODUCT = book.product;
exports.getOpsPlaybook = (edition) => {
  const offer = Object.hasOwn(book.editions, edition || '') ? book.editions[edition] : null;
  return offer ? { ...offer, product: book.product, language: book.language } : null;
};
