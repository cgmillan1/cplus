// C Plus · weekly summary for the owners (admins), every Monday morning.
// Called by pg_cron with the x-hook-secret header, or by a signed-in admin ("send me a test now").
// Sends a push notification to the admins and, if RESEND_API_KEY is set, an email.
// Optional secrets: RESEND_FROM, WEEKLY_TO (comma-separated emails, overrides the admin list).
import { createClient } from "npm:@supabase/supabase-js@2";

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const usd = (n: number) => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const num = (v: unknown) => +(v as number) || 0;
const LABOR = ["wages", "subcontract"];
const APP = "https://cgmillan1.github.io/cplus/admin.html";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // who is asking
  let onlyTo: { id: string; email: string } | null = null;
  const { data: sec } = await db.from("private_config").select("value").eq("key", "hook_secret").maybeSingle();
  const hook = !!sec && req.headers.get("x-hook-secret") === sec.value;
  if (!hook) {
    const tok = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await db.auth.getUser(tok);
    if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: m } = await db.from("team").select("user_id,email,role,active").eq("user_id", u.user.id).maybeSingle();
    if (!m || !m.active || m.role !== "admin") return json({ error: "forbidden" }, 403);
    onlyTo = { id: m.user_id, email: m.email };
  }

  const { data: st } = await db.from("settings").select("*").limit(1).maybeSingle();
  if (hook && st && st.weekly_email === false) return json({ skipped: "turned off" });
  const rate0 = st?.labor_rate != null ? num(st.labor_rate) : 35;
  const now = new Date(), wk = new Date(now.getTime() - 7 * 864e5).toISOString().slice(0, 10), today = now.toISOString().slice(0, 10);

  const all = async (t: string, sel = "*") => (await db.from(t).select(sel)).data || [];
  const [projects, steps, expenses, payments, invoices, targets, hours, logs, team, cos] = await Promise.all(
    ["projects", "steps", "expenses", "payments", "invoices", "targets", "time_entries", "daily_logs", "team", "change_orders"].map((t) => all(t)));
  const by = (xs: any[], pid: string) => xs.filter((x) => x.project_id === pid);
  const nameOf = (id: string) => team.find((m: any) => m.user_id === id)?.name || "";

  const rev = payments.filter((p: any) => p.paid_on >= wk).reduce((a: number, p: any) => a + num(p.amount), 0);
  const spent = expenses.filter((e: any) => e.spent_on >= wk).reduce((a: number, e: any) => a + num(e.amount), 0);
  const pending = expenses.filter((e: any) => e.approval === "pending");
  const late = invoices.filter((i: any) => i.status === "sent" && i.due_on < today);
  const open = invoices.filter((i: any) => i.status === "sent");
  const review = projects.filter((p: any) => p.review_status === "review");

  // how each active job is doing against its estimate
  const jobs = projects.filter((p: any) => p.review_status === "approved" && p.status !== "done").map((p: any) => {
    const tg: any = targets.find((t: any) => t.project_id === p.id), ex = by(expenses, p.id), te = by(hours, p.id).filter((x: any) => x.hours);
    const s = by(steps, p.id), prog = s.length ? Math.round(s.filter((x: any) => x.done).length / s.length * 100) : 0;
    const rate = tg?.labor_rate != null ? num(tg.labor_rate) : rate0;
    const hrs = te.length ? te.reduce((a: number, x: any) => a + num(x.hours), 0) : by(logs, p.id).reduce((a: number, x: any) => a + num(x.hours), 0);
    const mat = ex.filter((e: any) => !LABOR.includes(e.tax_cat)).reduce((a: number, e: any) => a + num(e.amount), 0);
    const sub = ex.filter((e: any) => LABOR.includes(e.tax_cat)).reduce((a: number, e: any) => a + num(e.amount), 0);
    const eM = num(tg?.est_mat), eH = num(tg?.est_hours), eS = num(tg?.est_sub), has = eM + eH + eS > 0;
    const estCost = eM + eH * rate + eS, act = mat + hrs * rate + sub;
    const contract = num(p.contract_amount) + by(cos, p.id).filter((c: any) => c.status === "approved").reduce((a: number, c: any) => a + num(c.amount), 0);
    const fCost = has ? Math.max(eM, mat) + Math.max(eH * rate, hrs * rate) + Math.max(eS, sub) : act;
    const used = estCost ? act / estCost * 100 : 0, hp = eH ? hrs / eH * 100 : 0, burn = Math.max(used, hp);
    const st = !has ? "none" : act > estCost + 0.5 || (eH > 0 && hrs > eH) ? "over" : burn >= 85 || (s.length > 0 && burn >= 40 && burn - prog >= 20) ? "watch" : "ok";
    return { p, st, prog, used, estProfit: contract - estCost, fProfit: contract - fCost, has };
  });
  const over = jobs.filter((j) => j.st === "over"), watch = jobs.filter((j) => j.st === "watch"), noEst = jobs.filter((j) => !j.has);

  const hrsWeek: Record<string, number> = {};
  hours.filter((x: any) => x.hours && x.work_date >= wk).forEach((x: any) => { hrsWeek[x.user_id] = (hrsWeek[x.user_id] || 0) + num(x.hours); });
  const hrsRows = Object.entries(hrsWeek).sort((a, b) => b[1] - a[1]);

  // push to admins
  const admins = team.filter((m: any) => m.role === "admin" && m.active);
  const pushTo = onlyTo ? [onlyTo.id] : admins.map((m: any) => m.user_id);
  const bodyEs = `Cobrado ${usd(rev)} · gastado ${usd(spent)}` + (over.length ? ` · ${over.length} sobre el estimado` : "") + (pending.length ? ` · ${pending.length} gasto(s) por aprobar` : "") + (late.length ? ` · ${late.length} factura(s) vencida(s)` : "");
  const bodyEn = `Collected ${usd(rev)} · spent ${usd(spent)}` + (over.length ? ` · ${over.length} over estimate` : "") + (pending.length ? ` · ${pending.length} expense(s) to approve` : "") + (late.length ? ` · ${late.length} late invoice(s)` : "");
  await db.rpc("weekly_push", { users: pushTo, es_body: bodyEs, en_body: bodyEn }).then(() => {}, () => {});

  // email
  const key = Deno.env.get("RESEND_API_KEY");
  let to = onlyTo ? [onlyTo.email] : (Deno.env.get("WEEKLY_TO") || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!to.length) to = admins.map((m: any) => m.email);
  to = to.filter((e: string) => /@/.test(e) && !/\.demo$/i.test(e));
  if (!key) return json({ push: true, email: "no_key", body: bodyEs });
  if (!to.length) return json({ push: true, email: "no_recipients", body: bodyEs });

  const tile = (l: string, v: string, c = "#1d1812") => `<td style="padding:10px 12px;background:#f6f1ea;border-radius:10px;width:33%"><div style="color:#655d53;font-size:13px">${l}</div><div style="font-size:22px;font-weight:bold;color:${c}">${v}</div></td>`;
  const li = (j: any) => `<tr><td style="padding:8px 0;border-top:1px solid #eee"><b>${esc(j.p.title)}</b><br><span style="color:#655d53;font-size:13px">Avance ${j.prog}% · costo usado ${Math.round(j.used)}% · ganancia proyectada ${usd(j.fProfit)} (estimada ${usd(j.estProfit)})</span></td></tr>`;
  const sec2 = (t: string, rows: string) => rows ? `<h3 style="margin:22px 0 6px;font-size:16px">${t}</h3><table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>` : "";
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#1d1812">
  <div style="background:#110f0d;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0"><b style="font-size:18px">C<span style="color:#ec9c3b">+</span>PLUS</b> · Resumen de la semana</div>
  <div style="border:1px solid #e5dcd0;border-top:0;padding:20px 22px;border-radius:0 0 12px 12px">
  <p style="margin:0 0 12px;color:#655d53">Últimos 7 días</p>
  <table style="width:100%;border-spacing:8px 0;margin:0 -8px"><tr>${tile("Cobrado", usd(rev))}${tile("Gastado", usd(spent))}${tile("Neto", usd(rev - spent), rev - spent < 0 ? "#b23a26" : "#2f7d4f")}</tr></table>
  ${sec2(`Sobre el estimado (${over.length})`, over.map(li).join(""))}
  ${sec2(`Para vigilar (${watch.length})`, watch.map(li).join(""))}
  ${sec2(`Gastos por aprobar (${pending.length})`, pending.slice(0, 10).map((e: any) => `<tr><td style="padding:8px 0;border-top:1px solid #eee">${esc(e.vendor || e.description)} · <b>${usd(num(e.amount))}</b> · ${esc(projects.find((p: any) => p.id === e.project_id)?.title || "")}</td></tr>`).join(""))}
  ${sec2(`Facturas sin cobrar: ${usd(open.reduce((a: number, i: any) => a + num(i.amount), 0))}`, late.map((i: any) => `<tr><td style="padding:8px 0;border-top:1px solid #eee;color:#b23a26">${esc(i.number)} · ${esc(i.bill_to)} · <b>${usd(num(i.amount))}</b> · vencida desde ${esc(i.due_on)}</td></tr>`).join(""))}
  ${sec2("Horas de la semana", hrsRows.map(([u, h]) => `<tr><td style="padding:6px 0;border-top:1px solid #eee">${esc(nameOf(u))}</td><td style="text-align:right;border-top:1px solid #eee"><b>${Math.round(h * 10) / 10} h</b></td></tr>`).join(""))}
  ${review.length ? `<p style="margin-top:18px">${review.length} proyecto(s) esperando revisión.</p>` : ""}
  ${noEst.length ? `<p style="color:#655d53;font-size:13px">${noEst.length} proyecto(s) activo(s) sin estimado.</p>` : ""}
  <p style="margin-top:22px"><a href="${APP}" style="background:#ec9c3b;color:#1d1208;padding:11px 18px;border-radius:999px;text-decoration:none;font-weight:bold">Abrir el panel de C Plus</a></p></div></div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: Deno.env.get("RESEND_FROM") || "C Plus <onboarding@resend.dev>", to, subject: `Resumen semanal C Plus: ${bodyEs}`.slice(0, 160), html }),
  });
  const out = await r.json().catch(() => ({}));
  return json({ push: true, email: r.ok ? "sent" : "failed", to, status: r.status, out }, r.ok ? 200 : 502);
});
