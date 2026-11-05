// v20 · Staff presence rules (pure functions, shared by the API and its tests).
// A signed-in workspace sends a heartbeat every 45 s while it is open.
//   online  → heartbeat in the last 2 minutes from a visible tab
//   away    → heartbeat in the last 2 minutes from a hidden tab, or last activity 2–15 minutes ago
//   offline → nothing for 15 minutes (or never seen)
export const ONLINE_SECONDS = 120;
export const AWAY_SECONDS = 15 * 60;
export const HEARTBEAT_SECONDS = 45;
export const STATES = ['active', 'away'];

export function presenceStatus(row, now = Date.now()) {
  if (!row?.last_seen_at) return 'offline';
  const seen = new Date(row.last_seen_at).getTime();
  if (!Number.isFinite(seen)) return 'offline';
  const age = Math.max(0, (now - seen) / 1000);
  if (age <= ONLINE_SECONDS) return row.state === 'away' ? 'away' : 'online';
  if (age <= AWAY_SECONDS) return 'away';
  return 'offline';
}

export function normaliseState(value) {
  return value === 'away' ? 'away' : 'active';
}
