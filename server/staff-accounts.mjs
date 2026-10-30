import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  password: z.string().min(14).max(128)
}).strict();

export function mountStaffAccounts(app, { requireStaff, requireAdmin }) {
  const limit = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10,
    keyGenerator: req => req.staff.user_id,
    standardHeaders: "draft-7", legacyHeaders: false,
    message: { error: "Too many account creation attempts. Try again later." }
  });
  app.post("/api/team-accounts", requireStaff, requireAdmin, limit, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({
      error: "Enter a full name, a valid email and a password between 14 and 128 characters.",
      requestId: req.requestId
    });
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return res.status(503).json({
      error: "Account creation is not configured on this server.", requestId: req.requestId
    });
    const authAdmin = createClient(process.env.SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    const { full_name, email, password } = parsed.data;
    const created = await authAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name }
    });
    if (created.error || !created.data?.user) {
      console.error(JSON.stringify({ event: "team_account_auth_failed", requestId: req.requestId,
        code: created.error?.code || "unknown" }));
      return res.status(400).json({
        error: "Account not created. The email may already exist, the password may not meet your Auth policy, or the server configuration may be invalid. Check Supabase Auth before retrying.",
        requestId: req.requestId
      });
    }
    const userId = created.data.user.id;
    const linked = await req.db.from("crm_staff").insert({
      user_id: userId, full_name, role: "collaborator", active: true
    }).select("user_id,full_name,role,active").single();
    if (linked.error) {
      console.error(JSON.stringify({ event: "team_account_link_failed", requestId: req.requestId,
        userId, code: linked.error.code }));
      return res.status(503).json({
        error: `The Auth account was created, but the team link could not be confirmed. Do not create this account again. Check Team and, if missing, use Link collaborator with UUID: ${userId}.`,
        requestId: req.requestId
      });
    }
    res.status(201).json({ data: linked.data, email: created.data.user.email,
      message: "Collaborator account created. Share the credentials through a secure channel." });
  });
}
