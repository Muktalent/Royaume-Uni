import test from 'node:test';
import assert from 'node:assert/strict';
import { presenceStatus, normaliseState, ONLINE_SECONDS, AWAY_SECONDS } from './staff-presence-state.mjs';

const now = Date.parse('2026-11-05T18:00:00Z');
const ago = s => new Date(now - s * 1000).toISOString();

test('presence: recent heartbeat from a visible tab is online', () => {
  assert.equal(presenceStatus({ last_seen_at: ago(10), state: 'active' }, now), 'online');
  assert.equal(presenceStatus({ last_seen_at: ago(ONLINE_SECONDS), state: 'active' }, now), 'online');
});

test('presence: hidden tab or a few minutes without heartbeat is away', () => {
  assert.equal(presenceStatus({ last_seen_at: ago(20), state: 'away' }, now), 'away');
  assert.equal(presenceStatus({ last_seen_at: ago(ONLINE_SECONDS + 1), state: 'active' }, now), 'away');
  assert.equal(presenceStatus({ last_seen_at: ago(AWAY_SECONDS), state: 'active' }, now), 'away');
});

test('presence: long silence, missing or invalid data is offline', () => {
  assert.equal(presenceStatus({ last_seen_at: ago(AWAY_SECONDS + 1), state: 'active' }, now), 'offline');
  assert.equal(presenceStatus(null, now), 'offline');
  assert.equal(presenceStatus({ last_seen_at: 'not a date' }, now), 'offline');
});

test('presence: client clock ahead of the server never breaks the status', () => {
  assert.equal(presenceStatus({ last_seen_at: new Date(now + 60000).toISOString(), state: 'active' }, now), 'online');
});

test('presence: only "away" is accepted as a non-active state', () => {
  assert.equal(normaliseState('away'), 'away');
  assert.equal(normaliseState('online'), 'active');
  assert.equal(normaliseState({ evil: true }), 'active');
  assert.equal(normaliseState(undefined), 'active');
});
