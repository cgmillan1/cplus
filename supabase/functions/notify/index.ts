// C Plus: sends Web Push notifications. Called only by database triggers (private.notify) with a shared
// secret kept in Supabase Vault. The VAPID keys are created here on first run and stored in Vault too,
// so no key ever has to be copied by hand.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
let cfg: { hook: string; pub: string | null; priv: string | null } | null = null;

async function config() {
  if (cfg && cfg.priv) return cfg;
  const { data, error } = await admin.rpc("push_config");
  if (error) throw error;
  cfg = data;
  if (!cfg!.priv) {
    const k = webpush.generateVAPIDKeys();
    const { error: e2 } = await admin.rpc("push_set_keys", { pub: k.publicKey, priv: k.privateKey });
    if (e2) throw e2;
    const { data: d2 } = await admin.rpc("push_config");
    cfg = d2;
  }
  webpush.setVapidDetails("mailto:cristian.gmillan@gmail.com", cfg!.pub!, cfg!.priv!);
  return cfg!;
}

const same = (a: string, b: string) => {
  if (!a || !b || a.length !== b.length) return false;
  let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  let c;
  try { c = await config(); } catch (e) { console.error("config", e); return new Response("config error", { status: 500 }); }
  if (!same(req.headers.get("x-hook") ?? "", c.hook)) return new Response("forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (body.init) return Response.json({ ok: true, pub: c.pub });
  const users: string[] = Array.isArray(body.users) ? body.users.slice(0, 50) : [];
  if (!users.length) return Response.json({ sent: 0 });

  const { data: subs, error } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth, lang").in("user_id", users);
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0, removed = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    const m = (s.lang === "en" ? body.en : body.es) || body.es || {};
    const payload = JSON.stringify({ title: m.title || "C Plus", body: m.body || "", url: body.url || "admin.html", tag: body.tag });
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: "high" });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { await admin.from("push_subscriptions").delete().eq("id", s.id); removed++; }
      else console.error("push", code, (e as Error).message);
    }
  }));
  return Response.json({ sent, removed });
});
