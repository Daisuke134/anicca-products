import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APP_STORE_SHINDAN_URL,
  DISCLAIMER_JA,
  encodeScoreString,
  isValidScoreString,
  KOKORO_QUESTIONS,
  KOKORO_TYPE_ORDER,
  parseScoreString,
  scoreAnswers,
  shareText,
} from '../lib/kokoro-quiz.ts';
import {
  APP_STORE_QUIZ_EN_URL,
  DISCLAIMER_EN,
  KOKORO_PRICE_USD,
  KOKORO_PRICE_USD_CENTS,
  KOKORO_QUESTIONS_EN,
  KOKORO_TYPE_ORDER_EN,
  KOKORO_TYPES_EN,
  shareTextEn,
} from '../lib/kokoro-quiz-en.ts';
import {
  buildQuizEnAppStoreUrl,
  buildShindanAppStoreUrl,
  QUIZ_EN_APP_STORE_CT,
  SHINDAN_APP_STORE_CT,
} from '../lib/tools/app-store.ts';

test('quiz has 12 Likert questions mapped to 8 types', () => {
  assert.equal(KOKORO_QUESTIONS.length, 12);
  assert.equal(KOKORO_TYPE_ORDER.length, 8);
  for (const q of KOKORO_QUESTIONS) {
    assert.ok(KOKORO_TYPE_ORDER.includes(q.typeId), q.id);
  }
});

test('scoreAnswers encodes 8 digit 0-9 string and picks primary', () => {
  const answers = Array(12).fill(3);
  answers[0] = 5; // night-anxiety
  answers[8] = 5; // night-anxiety
  const result = scoreAnswers(answers);
  assert.equal(isValidScoreString(result.scoreString), true);
  assert.equal(result.scoreString.length, 8);
  assert.equal(result.primary, 'night-anxiety');
  assert.deepEqual(parseScoreString(result.scoreString), result.scores);
  assert.equal(encodeScoreString(result.scores), result.scoreString);
});

test('share text and App Store CTA match plan', () => {
  assert.match(shareText('夜ぐるぐるタイプ', 'https://aniccaai.com/x'), /#心のクセ診断/);
  assert.equal(
    APP_STORE_SHINDAN_URL,
    'https://apps.apple.com/jp/app/id6755129214?pt=93486075&ct=shindan&mt=8',
  );
  assert.equal(SHINDAN_APP_STORE_CT, 'shindan');
  assert.equal(buildShindanAppStoreUrl(), APP_STORE_SHINDAN_URL);
  assert.match(DISCLAIMER_JA, /医療的な診断ではありません/);
});

test('EN quiz has 12 questions, natural type names, USD price, ct=quiz_en', () => {
  assert.equal(KOKORO_QUESTIONS_EN.length, 12);
  assert.equal(Object.keys(KOKORO_TYPES_EN).length, 8);
  assert.equal(KOKORO_TYPES_EN['night-anxiety'].name, 'Midnight Spiral');
  assert.equal(KOKORO_TYPES_EN.burnout.name, 'Running on Fumes');
  assert.notEqual(KOKORO_TYPES_EN['night-anxiety'].name, '夜ぐるぐるタイプ');
  assert.equal(KOKORO_PRICE_USD, 4.99);
  assert.equal(KOKORO_PRICE_USD_CENTS, 499);
  assert.match(DISCLAIMER_EN, /Not a medical diagnosis/);
  assert.match(shareTextEn('Midnight Spiral', 'https://aniccaai.com/x'), /#MindHabitsQuiz/);
  assert.equal(QUIZ_EN_APP_STORE_CT, 'quiz_en');
  assert.equal(
    APP_STORE_QUIZ_EN_URL,
    'https://apps.apple.com/us/app/id6755129214?pt=93486075&ct=quiz_en&mt=8',
  );
  assert.equal(buildQuizEnAppStoreUrl(), APP_STORE_QUIZ_EN_URL);
  for (const q of KOKORO_QUESTIONS_EN) {
    assert.ok(KOKORO_TYPE_ORDER_EN.includes(q.typeId), q.id);
  }
});
