import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeEngineSendSlots, isEngineSendSlotDue } from '../engineSendSlots.js';

test('free accepts a nonuniform engine schedule of up to three canonical slots', () => {
  assert.deepEqual(normalizeEngineSendSlots(['18:07', '06:23', '12:45'], 'free'), ['06:23', '12:45', '18:07']);
});

test('pro permits four slots but free forbids four', () => {
  const slots = ['06:23', '11:15', '17:42', '21:10'];
  assert.deepEqual(normalizeEngineSendSlots(slots, 'pro'), slots);
  assert.equal(normalizeEngineSendSlots(slots, 'free'), null);
});

test('missing, null, wrong-type and unknown entitlement fail closed', () => {
  for (const slots of [undefined, null, false, '09:00', {}, 0]) {
    assert.equal(normalizeEngineSendSlots(slots, 'free'), null);
  }
  assert.equal(normalizeEngineSendSlots(['09:00'], 'enterprise'), null);
  assert.equal(normalizeEngineSendSlots(['09:00'], null), null);
});

test('an explicit empty engine schedule is different from missing data and authorizes no push', () => {
  assert.deepEqual(normalizeEngineSendSlots([], 'free'), []);
  assert.equal(isEngineSendSlotDue({ schedule: [], plan: 'free', localHHMM: '09:00' }), false);
  assert.equal(isEngineSendSlotDue({ schedule: undefined, plan: 'free', localHHMM: '09:00' }), false);
});

test('reject noncanonical or impossible local HH:MM, without coercion', () => {
  const invalid = ['9:00', '09:0', '09:00 ', ' 09:00', '24:00', '23:60', '99:99', '09:00Z', '09:00:00', '０９:００', 900, null, {}, [], ''];
  for (const entry of invalid) {
    assert.equal(normalizeEngineSendSlots([entry], 'free'), null, String(entry));
  }
  assert.deepEqual(normalizeEngineSendSlots(['00:00', '23:59'], 'free'), ['00:00', '23:59']);
});

test('reject duplicates rather than silently deduplicating and obscuring evidence', () => {
  assert.equal(normalizeEngineSendSlots(['09:00', '09:00'], 'free'), null);
  assert.equal(normalizeEngineSendSlots(['08:00', '08:00', '09:00', '20:00'], 'pro'), null);
});

test('old free and pro fixed slots are not implicit fallbacks', () => {
  const engine = ['06:23', '12:45', '18:07'];
  for (const oldFixedSlot of ['09:00', '14:00', '20:00', '08:00', '12:30', '17:30', '21:30']) {
    assert.equal(isEngineSendSlotDue({ schedule: engine, plan: 'free', localHHMM: oldFixedSlot }), false);
  }
  assert.equal(isEngineSendSlotDue({ schedule: engine, plan: 'free', localHHMM: '12:45' }), true);
});

test('invalid schedules never authorize a push even when the time matches', () => {
  assert.equal(isEngineSendSlotDue({ schedule: ['09:00', '09:00'], plan: 'free', localHHMM: '09:00' }), false);
  assert.equal(isEngineSendSlotDue({ schedule: ['09:00', '14:00', '20:00', '21:30'], plan: 'free', localHHMM: '09:00' }), false);
  assert.equal(isEngineSendSlotDue({ schedule: null, plan: 'free', localHHMM: '09:00' }), false);
  assert.equal(isEngineSendSlotDue({ schedule: ['09:00'], plan: 'free', localHHMM: '9:00' }), false);
});

test('normalization is immutable and does not mutate the engine response', () => {
  const input = ['20:00', '09:00'];
  const output = normalizeEngineSendSlots(input, 'free');
  assert.deepEqual(input, ['20:00', '09:00']);
  assert.deepEqual(output, ['09:00', '20:00']);
  assert.equal(Object.isFrozen(output), true);
});
