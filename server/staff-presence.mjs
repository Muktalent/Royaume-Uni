// v20 · Online status of the team (Admin → Equipo).
// Every signed-in staff member sends a small heartbeat; only administrators can read the team's status.
// Data lives in public.mt_staff_presence (RLS on, no policies → only this server, with the service key, can use it).
// If the migration has not been applied yet, the endpoints answer without error and the UI simply hides the status.
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from 'express-rate-limit';
import { presenceStatus, normaliseState, ONLINE_SECONDS, AWAY_SECONDS, HEARTBEAT_SECONDS } from './staff-presence-state.mjs';

const MISSING = new Set(['42P01', '42703', 'PGRST202', 'PGRST204', 'PGRST205']);

function serviceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export function mountStaffPresence(app, { requireStaff, requireAdmin }) {
  const beatLimit = rateLimit({ windowMs: 60 * 1000, limit: 12, keyGenerator: req => req.staff.user_id, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many presence updates.' } });

  // Heartbeat from any active staff member (admin or collaborator). The time is always the server's.
  app.post('/api/presence', requireStaff, beatLimit, async (req, res) => {
    const client = serviceClient();
    if (!client) return res.status(202).json({ ok: false, available: false });
    const state = normaliseState(req.body?.state);
    const now = new Date().toISOString();
    const { error } = await client.from('mt_staff_presence')
      .upsert({ user_id: req.staff.user_id, last_seen_at: now, state, updated_at: now }, { onConflict: 'user_id' });
    if (error) {
      if (!MISSING.has(error.code)) console.error(JSON.stringify({ event: 'presence_write_failed', requestId: req.requestId, code: error.code }));
      return res.status(202).json({ ok: false, available: !MISSING.has(error.code) });
    }
    res.json({ ok: true, state, heartbeat_seconds: HEARTBEAT_SECONDS });
  });

  // Team status for administrators.
  app.get('/api/admin/team/presence', requireStaff, requireAdmin, async (req, res) => {
    const client = serviceClient();
    const base = { now: new Date().toISOString(), online_seconds: ONLINE_SECONDS, away_seconds: AWAY_SECONDS };
    if (!client) return res.json({ ...base, available: false, data: [] });
    const { data, error } = await client.from('mt_staff_presence').select('user_id,last_seen_at,state').limit(1000);
    if (error) {
      if (!MISSING.has(error.code)) console.error(JSON.stringify({ event: 'presence_read_failed', requestId: req.requestId, code: error.code }));
      return res.json({ ...base, available: false, data: [] });
    }
    const now = Date.now();
    res.json({ ...base, available: true, data: (data || []).map(r => ({ user_id: r.user_id, last_seen_at: r.last_seen_at, status: presenceStatus(r, now) })) });
  });
}
