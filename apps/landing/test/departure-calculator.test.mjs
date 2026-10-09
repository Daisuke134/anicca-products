import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDepartureIcs,
  computeDeparture,
  escapeIcsText,
  foldIcsLine,
  formatDepartureHeadline,
  toIcsUtcStamp,
  validateDepartureInput,
} from '../lib/tools/departure.ts';

test('09:30 start, 40 travel, 10 buffer → departure 08:40', () => {
  const r = computeDeparture({
    date: '2026-10-10',
    startTime: '09:30',
    travelMinutes: 40,
    bufferMinutes: 10,
    prepMinutes: 0,
  });
  assert.equal(r.departure.getHours(), 8);
  assert.equal(r.departure.getMinutes(), 40);
  assert.equal(r.crossesPrevDay, false);
  assert.equal(formatDepartureHeadline(r), '8:40 に家を出る');
});

test('00:20 start, 30 travel, 10 buffer → previous day 23:40', () => {
  const r = computeDeparture({
    date: '2026-10-10',
    startTime: '00:20',
    travelMinutes: 30,
    bufferMinutes: 10,
    prepMinutes: 0,
  });
  assert.equal(r.departure.getDate(), 9);
  assert.equal(r.departure.getHours(), 23);
  assert.equal(r.departure.getMinutes(), 40);
  assert.equal(r.crossesPrevDay, true);
  assert.equal(formatDepartureHeadline(r), '前日 23:40 に出発');
});

test('prep start is departure minus prep minutes', () => {
  const r = computeDeparture({
    date: '2026-10-10',
    startTime: '09:30',
    travelMinutes: 40,
    bufferMinutes: 10,
    prepMinutes: 20,
  });
  assert.ok(r.prepStart);
  assert.equal(r.prepStart.getHours(), 8);
  assert.equal(r.prepStart.getMinutes(), 20);
});

test('validateDepartureInput rejects empty and out-of-range', () => {
  assert.match(validateDepartureInput({}), /日付|開始/);
  assert.match(
    validateDepartureInput({ date: '2026-10-10', startTime: '09:30', travelMinutes: 0, bufferMinutes: 10, prepMinutes: 0 }),
    /移動時間/,
  );
  assert.equal(
    validateDepartureInput({ date: '2026-10-10', startTime: '09:30', travelMinutes: 40, bufferMinutes: 10, prepMinutes: 0 }),
    null,
  );
});

test('escapeIcsText escapes backslash, semicolon, comma, newline', () => {
  assert.equal(escapeIcsText('a\\b;c,d\ne'), 'a\\\\b\\;c\\,d\\ne');
});

test('foldIcsLine folds at 75 octets with CRLF+SPACE', () => {
  const long = 'DESCRIPTION:' + 'あ'.repeat(40) + 'x'.repeat(40);
  const folded = foldIcsLine(long);
  const lines = folded.split('\r\n');
  assert.ok(lines.length >= 2);
  for (const line of lines) {
    assert.ok(new TextEncoder().encode(line).length <= 75, `line too long: ${new TextEncoder().encode(line).length}`);
  }
  assert.ok(lines[1].startsWith(' '));
});

test('toIcsUtcStamp formats UTC Z timestamp', () => {
  const d = new Date(Date.UTC(2026, 9, 10, 0, 40, 0));
  assert.equal(toIcsUtcStamp(d), '20261010T004000Z');
});

test('buildDepartureIcs includes VEVENT, VALARM, UTC times, CRLF', () => {
  const input = {
    title: '会議, 重要; メモ',
    date: '2026-10-10',
    startTime: '09:30',
    travelMinutes: 40,
    bufferMinutes: 10,
    prepMinutes: 15,
  };
  const result = computeDeparture(input);
  const ics = buildDepartureIcs({
    input,
    result,
    now: new Date(Date.UTC(2026, 9, 9, 12, 0, 0)),
    uidSeed: 'testseed',
  });
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('PRODID:-//aniccaai.com//departure-calculator//JA'));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('VALARM'));
  assert.ok(ics.includes('そろそろ出発です') || ics.includes('\\u')); // may be escaped
  assert.ok(ics.includes('TRIGGER:-PT10M'));
  assert.ok(ics.includes('SUMMARY:'));
  assert.ok(ics.includes('\\,') || ics.includes('\\;'));
  assert.ok(ics.includes('DTSTART:'));
  assert.ok(/DTSTART:\d{8}T\d{6}Z/.test(ics));
  assert.ok(ics.includes('\r\n'));
  // prep event present
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
});
