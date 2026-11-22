// C Plus · team accounts. Only the admin can add people, change passwords or remove them.
// "bootstrap" creates the first admin once, with the one-time setup code.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const ROLES = ["admin", "manager", "contractor"];
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "method" }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let b: Record<string, string>;
  try { b = await req.json(); } catch { return reply({ error: "bad json" }, 400); }
  const name = String(b.name || "").trim().slice(0, 80);
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");

  async function makeUser(role: string) {
    if (!name) return reply({ error: "name" }, 400);
    if (!emailOk(email)) return reply({ error: "email" }, 400);
    if (password.length < 8) return reply({ error: "password" }, 400);
    if (!ROLES.includes(role)) return reply({ error: "role" }, 400);
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
    if (error) return reply({ error: /already/i.test(error.message) ? "exists" : error.message }, 400);
    const uid = data.user!.id;
    const t = await db.from("team").insert({ user_id: uid, name, email, role });
    if (t.error) { await db.auth.admin.deleteUser(uid); return reply({ error: t.error.message }, 400); }
    return uid;
  }

  // first admin, once
  if (b.action === "bootstrap") {
    const { count } = await db.from("team").select("user_id", { count: "exact", head: true });
    if ((count ?? 0) > 0) return reply({ error: "done" }, 403);
    const code = String(b.code || "").trim().toUpperCase();
    const { data: row } = await db.from("setup_code").select("code").eq("code", code).maybeSingle();
    if (!code || !row) return reply({ error: "code" }, 403);
    const uid = await makeUser("admin");
    if (uid instanceof Response) return uid;
    await db.from("settings").insert({ owner: uid, contact_name: name, email });
    await db.from("setup_code").delete().neq("code", "");
    return reply({ ok: true });
  }

  // everything else: the caller must be an active admin
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: me } = await db.auth.getUser(jwt);
  if (!me?.user) return reply({ error: "auth" }, 401);
  const { data: mine } = await db.from("team").select("role, active").eq("user_id", me.user.id).maybeSingle();
  if (!mine || !mine.active || mine.role !== "admin") return reply({ error: "forbidden" }, 403);

  if (b.action === "create") {
    const uid = await makeUser(String(b.role || ""));
    if (uid instanceof Response) return uid;
    return reply({ ok: true, user_id: uid });
  }
  const target = String(b.user_id || "");
  const { data: who } = await db.from("team").select("user_id").eq("user_id", target).maybeSingle();
  if (!who) return reply({ error: "not found" }, 404);
  if (b.action === "set_password") {
    if (password.length < 8) return reply({ error: "password" }, 400);
    const { error } = await db.auth.admin.updateUserById(target, { password });
    return error ? reply({ error: error.message }, 400) : reply({ ok: true });
  }
  if (b.action === "remove") {
    if (target === me.user.id) return reply({ error: "self" }, 400);
    await db.from("projects").update({ assigned_to: null }).eq("assigned_to", target);
    const { error } = await db.auth.admin.deleteUser(target);
    return error ? reply({ error: error.message }, 400) : reply({ ok: true });
  }
  return reply({ error: "action" }, 400);
});
