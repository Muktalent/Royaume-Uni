import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {validDob, cleanStrokes, needsAdmin, stampSignature} from './team-hr.mjs';

test('validDob accepts adults and rejects future or too-young dates', () => {
  const today = new Date('2026-11-02T12:00:00Z');
  assert.equal(validDob('1996-04-03', today), true);
  assert.equal(validDob('2015-01-01', today), false);
  assert.equal(validDob('2030-01-01', today), false);
  assert.equal(validDob('1996-02-30', today), false);
});
test('cleanStrokes clamps and drops junk', () => {
  assert.equal(cleanStrokes([[[10, 10], [2000, -5]]]), null);
  assert.equal(cleanStrokes('bad'), null);
  assert.equal(cleanStrokes([[[1, 1], [2, 2]]]), null);
  const good = [Array.from({length: 12}, (_, i) => [i * 20, 100 + i])];
  assert.deepEqual(cleanStrokes(good), good);
});
test('needsAdmin flags submitted uploads and unseen signatures', () => {
  assert.equal(needsAdmin({direction: 'from_employee', status: 'submitted'}), true);
  assert.equal(needsAdmin({direction: 'to_employee', status: 'signed', admin_seen_at: null}), true);
  assert.equal(needsAdmin({direction: 'to_employee', status: 'signed', admin_seen_at: '2026-01-01'}), false);
  assert.equal(needsAdmin({direction: 'to_employee', status: 'sent'}), false);
});
test('stampSignature adds a certificate page to a PDF', async () => {
  const doc = await PDFDocument.create(); doc.addPage([595, 842]); doc.addPage([595, 842]);
  const original = await doc.save();
  for (const method of ['drawn', 'typed']) {
    const out = await stampSignature(original, {signerName: 'Salma Bennani', signerEmail: 's@muktalent.com', employeeCode: 'UK-000001', method, strokes: method === 'drawn' ? [Array.from({length: 12}, (_, i) => [i * 60, 100 + i * 10])] : [], signedAt: new Date('2026-11-02T10:00:00Z'), title: 'Contrato 2027 · Firmado', ip: '1.2.3.4', documentId: '00000000-0000-0000-0000-000000000000', originalHash: 'ab'.repeat(32), originalName: 'contrato.pdf'});
    const signed = await PDFDocument.load(out);
    assert.equal(signed.getPageCount(), 3);
    if (method === 'drawn') (await import('node:fs')).writeFileSync('/home/user/workspace/out/signed-test.pdf', out);
  }
});
