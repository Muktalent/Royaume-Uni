import test from 'node:test';
import assert from 'node:assert/strict';
import {englishIntake, englishText, englishRow} from './pipeline-english.mjs';
import {samplePipelineRows, SAMPLE_COUNT} from './pipeline-sample.mjs';
import {partnerRow, columnsFor} from './pipeline-workbook.mjs';

test('intakes are rendered in English', () => {
  assert.equal(englishIntake('Septiembre 2027'), 'September 2027');
  assert.equal(englishIntake('enero 2027'), 'January 2027');
  assert.equal(englishIntake('09/2027'), 'September 2027');
  assert.equal(englishIntake('September 2027'), 'September 2027');
});
test('common Spanish subjects are translated, English names untouched', () => {
  assert.equal(englishText('Grado en Derecho'), 'Undergraduate degree in Law');
  assert.equal(englishText('De Montfort University'), 'De Montfort University');
  assert.equal(englishText('MSc Data Science'), 'MSc Data Science');
});
test('declared readiness values are English', () => assert.deepEqual(englishRow({passport: 'En curso', funding: 'Parcial'}), {passport: 'In progress', funding: 'Partial'}));
test('no employee columns in any report mode', () => {
  for (const m of ['partners', 'internal']) assert.ok(!columnsFor(m).some(([k]) => /owner|staff|employee/.test(k)));
});
test('sample pipeline: 15 Maghreb students across stages', () => {
  const rows = samplePipelineRows('2026-11-02T10:00:00Z');
  assert.equal(rows.length, SAMPLE_COUNT); assert.equal(rows.length, 15);
  assert.ok(rows.every(r => ['MA', 'DZ', 'TN'].includes(r.residence_country_code)));
  assert.ok(new Set(rows.map(r => r.stage)).size >= 7);
  const p = JSON.stringify(rows.map(partnerRow));
  for (const r of rows) { assert.ok(!p.includes(r.email)); assert.ok(!p.includes(r.last_name)); }
});
