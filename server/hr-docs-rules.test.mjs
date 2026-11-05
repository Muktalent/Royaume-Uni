import test from 'node:test';
import assert from 'node:assert/strict';
import {isExpired, fileAccess, keepCopyKinds, V23_DEFAULTS} from './hr-docs-rules.mjs';

test('expiry hides documents after the date, but never a signed one', () => {
  const now = Date.parse('2026-11-05T12:00:00Z');
  assert.equal(isExpired({expires_at: null, status: 'sent'}, now), false);
  assert.equal(isExpired({expires_at: '2026-11-06T00:00:00Z', status: 'sent'}, now), false);
  assert.equal(isExpired({expires_at: '2026-11-05T11:59:00Z', status: 'viewed'}, now), true);
  assert.equal(isExpired({expires_at: '2026-11-01T00:00:00Z', status: 'signed'}, now), false);
});
test('read-only documents never get a download link and a short-lived view link', () => {
  assert.deepEqual(fileAccess({view_only: true}), {downloadable: false, url_seconds: 60});
  assert.deepEqual(fileAccess({view_only: false}), {downloadable: true, url_seconds: 300});
  assert.deepEqual(fileAccess({...V23_DEFAULTS}), {downloadable: true, url_seconds: 300});
});
test('contracts and payslips are the kinds an employee should keep a copy of', () => {
  assert.deepEqual(keepCopyKinds, ['contract', 'payslip']);
});
