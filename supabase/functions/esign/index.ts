// C Plus: DocuSign e-signatures for project documents.
// App actions (staff only, with the user's Supabase session): status, send, refresh, remind, void.
// DocuSign Connect calls ?hook=<key> when an envelope changes; the signed PDF is then saved to storage.
// Secrets (Supabase > Edge Functions > Secrets): DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID,
// DOCUSIGN_PRIVATE_KEY (RSA key from the DocuSign app), DOCUSIGN_ENV = demo | prod, optional DOCUSIGN_ACCOUNT_ID.
import { createSign } from "node:crypto";
import { Buffer } from "node:buffer";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const ENV = (Deno.env.get("DOCUSIGN_ENV") ?? "demo").toLowerCase() === "prod" ? "prod" : "demo";
const OAUTH = ENV === "prod" ? "account.docusign.com" : "account-d.docusign.com";
const KEY = Deno.env.get("DOCUSIGN_INTEGRATION_KEY") ?? "";
const USER = Deno.env.get("DOCUSIGN_USER_ID") ?? "";
const PEM = (Deno.env.get("DOCUSIGN_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");
const APP_URL = Deno.env.get("APP_URL") ?? "https://cgmillan1.github.io/cplus/admin.html";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });
const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const configured = () => !!(KEY && USER && PEM.includes("PRIVATE KEY"));
const consentUrl = () => `https://${OAUTH}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${KEY}&redirect_uri=${encodeURIComponent(APP_URL)}`;

let tok: { at: string; exp: number; base: string; acct: string } | null = null;
async function ds() {
  if (tok && tok.exp > Date.now() + 60_000) return tok;
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64u(JSON.stringify({ iss: KEY, sub: USER, aud: OAUTH, iat: now, exp: now + 3600, scope: "signature impersonation" }));
  const sig = createSign("RSA-SHA256").update(`${head}.${body}`).sign(PEM);
  const r = await fetch(`https://${OAUTH}/oauth/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${body}.${b64u(sig)}` }) });
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(j.error || "token_failed"), { code: j.error });
  const ui = await (await fetch(`https://${OAUTH}/oauth/userinfo`, { headers: { authorization: `Bearer ${j.access_token}` } })).json();
  const want = Deno.env.get("DOCUSIGN_ACCOUNT_ID");
  const acc = (ui.accounts || []).find((a: { account_id: string; is_default: boolean }) => want ? a.account_id === want : a.is_default) || (ui.accounts || [])[0];
  if (!acc) throw new Error("no_account");
  tok = { at: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000, base: `${acc.base_uri}/restapi/v2.1/accounts/${acc.account_id}`, acct: acc.account_name };
  return tok;
}
async function api(path: string, init: RequestInit = {}) {
  const t = await ds();
  const r = await fetch(t.base + path, { ...init, headers: { authorization: `Bearer ${t.at}`, "content-type": "application/json", ...(init.headers || {}) } });
  if (!r.ok) { const e = await r.text(); throw new Error(`docusign ${r.status}: ${e.slice(0, 300)}`); }
  return r;
}

type Doc = { id: string; project_id: string; kind: string; envelope_id: string | null; signer_name: string | null; sign_status: string | null };
const MAP: Record<string, string> = { sent: "sent", delivered: "delivered", completed: "completed", declined: "declined", voided: "voided" };

async function sync(doc: Doc) {
  const env = await (await api(`/envelopes/${doc.envelope_id}`)).json();
  const st = MAP[env.status] ?? doc.sign_status;
  const patch: Record<string, unknown> = { sign_status: st, sign_error: null };
  if (st === "completed" && doc.sign_status !== "completed") {
    const pdf = new Uint8Array(await (await api(`/envelopes/${doc.envelope_id}/documents/combined`)).arrayBuffer());
    const path = `${doc.project_id}/${doc.id}-firmado.pdf`;
    const up = await admin.storage.from("docs").upload(path, pdf, { contentType: "application/pdf", upsert: true });
    if (up.error) throw up.error;
    Object.assign(patch, { file: path, status: "signed", signed_by: doc.signer_name, signed_on: (env.completedDateTime || new Date().toISOString()).slice(0, 10), sign_done_at: env.completedDateTime || new Date().toISOString() });
  }
  if (st === "voided" || st === "declined") patch.status = st === "voided" ? "void" : "sent";
  const { data } = await admin.from("documents").update(patch).eq("id", doc.id).select("*").single();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const u = new URL(req.url);

  // ---- DocuSign Connect webhook
  if (u.searchParams.has("hook")) {
    const { data: cfg } = await admin.rpc("esign_config");
    if (!cfg?.hook || u.searchParams.get("hook") !== cfg.hook) return new Response("forbidden", { status: 403 });
    const ev = await req.json().catch(() => ({}));
    const id = ev?.data?.envelopeId || ev?.envelopeId || ev?.data?.envelopeSummary?.envelopeId;
    if (!id) return new Response("ok");
    const { data: doc } = await admin.from("documents").select("id, project_id, kind, envelope_id, signer_name, sign_status").eq("envelope_id", id).maybeSingle();
    if (doc) { try { await sync(doc); } catch (e) { console.error("hook sync", e); await admin.from("documents").update({ sign_error: String(e).slice(0, 300) }).eq("id", doc.id); } }
    return new Response("ok");
  }

  // ---- App actions: signed-in staff only
  const auth = req.headers.get("Authorization") ?? "";
  const userClient = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  const { data: role } = await userClient.rpc("my_role");
  if (role !== "admin" && role !== "manager") return json({ error: "forbidden" }, 403);
  const b = await req.json().catch(() => ({}));

  try {
    if (b.action === "status") {
      if (!configured()) return json({ ok: false, state: "setup", env: ENV });
      try { const t = await ds(); return json({ ok: true, state: "ready", env: ENV, account: t.acct }); }
      catch (e) { const code = (e as { code?: string }).code; return json({ ok: false, state: code === "consent_required" ? "consent" : "error", consent: consentUrl(), env: ENV, error: String(e) }); }
    }
    if (!configured()) return json({ error: "not_configured" }, 409);
    const { data: doc } = await admin.from("documents").select("id, project_id, kind, envelope_id, signer_name, sign_status").eq("id", b.document_id).single();
    if (!doc) return json({ error: "not_found" }, 404);

    if (b.action === "send") {
      if (doc.envelope_id && ["sent", "delivered"].includes(doc.sign_status ?? "")) return json({ error: "already_sent" }, 409);
      const signer = { name: String(b.signer_name || "").slice(0, 100), email: String(b.signer_email || "").trim() };
      if (!signer.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(signer.email)) return json({ error: "bad_signer" }, 400);
      if (!b.pdf || typeof b.pdf !== "string" || b.pdf.length > 14_000_000) return json({ error: "bad_pdf" }, 400);
      const { data: cfg } = await admin.rpc("esign_config");
      const tabs = (n: number) => ({
        signHereTabs: [{ anchorString: `/sn${n}/`, anchorUnits: "pixels", anchorXOffset: "0", anchorYOffset: "-26", anchorIgnoreIfNotPresent: "false" }],
        dateSignedTabs: [{ anchorString: `/dt${n}/`, anchorUnits: "pixels", anchorXOffset: "6", anchorYOffset: "-4", anchorIgnoreIfNotPresent: "true" }],
      });
      const signers: unknown[] = [{ email: signer.email, name: signer.name, recipientId: "1", routingOrder: "1", tabs: tabs(2) }];
      if (b.cplus_name && b.cplus_email) signers.push({ email: String(b.cplus_email), name: String(b.cplus_name).slice(0, 100), recipientId: "2", routingOrder: "2", tabs: tabs(1) });
      const env = await (await api("/envelopes", { method: "POST", body: JSON.stringify({
        emailSubject: String(b.subject || "Documento para firmar · C Plus").slice(0, 100),
        emailBlurb: String(b.message || "").slice(0, 2000),
        documents: [{ documentBase64: b.pdf, name: String(b.file_name || "documento.pdf").slice(0, 100), fileExtension: "pdf", documentId: "1" }],
        recipients: { signers },
        status: "sent",
        notification: { useAccountDefaults: "false", reminders: { reminderEnabled: "true", reminderDelay: "2", reminderFrequency: "2" }, expirations: { expireEnabled: "true", expireAfter: "30", expireWarn: "5" } },
        eventNotification: { url: `${URL_}/functions/v1/esign?hook=${cfg.hook}`, loggingEnabled: "true", requireAcknowledgment: "true", deliveryMode: "SIM",
          events: ["envelope-sent", "envelope-delivered", "envelope-completed", "envelope-declined", "envelope-voided"],
          eventData: { version: "restv2.1", format: "json" } },
      }) })).json();
      const { data } = await admin.from("documents").update({ envelope_id: env.envelopeId, sign_status: "sent", signer_name: signer.name, signer_email: signer.email, sign_sent_at: new Date().toISOString(), sign_done_at: null, sign_error: null, status: "sent" }).eq("id", doc.id).select("*").single();
      return json({ ok: true, doc: data });
    }
    if (!doc.envelope_id) return json({ error: "not_sent" }, 409);
    if (b.action === "refresh") return json({ ok: true, doc: await sync(doc) });
    if (b.action === "remind") { await api(`/envelopes/${doc.envelope_id}?resend_envelope=true`, { method: "PUT", body: "{}" }); return json({ ok: true }); }
    if (b.action === "void") {
      await api(`/envelopes/${doc.envelope_id}`, { method: "PUT", body: JSON.stringify({ status: "voided", voidedReason: String(b.reason || "Cancelado por C Plus").slice(0, 200) }) });
      const { data } = await admin.from("documents").update({ sign_status: "voided" }).eq("id", doc.id).select("*").single();
      return json({ ok: true, doc: data });
    }
    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error(e);
    const code = (e as { code?: string }).code;
    if (code === "consent_required") return json({ error: "consent_required", consent: consentUrl() }, 409);
    return json({ error: String((e as Error).message || e).slice(0, 300) }, 500);
  }
});
