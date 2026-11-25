// C Plus · lee la foto de una factura y devuelve los datos para registrar el gasto.
// Solo admin y project manager. Usa Claude (visión) si el secreto ANTHROPIC_API_KEY existe;
// si no existe responde "no_key" y la página usa su lector de texto local.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const CATS = ["materials", "subcontract", "wages", "equipment", "tools", "vehicle", "permits", "disposal", "insurance", "meals", "office", "advertising", "other"];
const PROMPT = `You read a photo of a receipt or invoice for a US construction and remodeling company.
Reply with ONLY a JSON object, no other text:
{"vendor": string, "date": "YYYY-MM-DD" or "", "total": number, "subtotal": number or null, "sales_tax": number or null,
 "pay_method": "card"|"cash"|"check"|"transfer"|"", "card_last4": string or "",
 "items": [{"desc": string, "amount": number}], "summary": string (max 80 chars, what was bought),
 "tax_cat": one of ${JSON.stringify(CATS)}, "confidence": "high"|"medium"|"low"}
Rules: total is the final amount paid. Use the purchase date. tax_cat: lumber, tile, drywall, paint, hardware for a job = "materials";
gas station = "vehicle"; restaurant = "meals"; dumpster = "disposal"; tool purchase = "tools"; equipment rental = "equipment";
city or county permit = "permits"; a subcontractor's invoice for labor = "subcontract". If unsure, "materials".
Keep at most 15 items. If the image is not a receipt, return {"error":"not_receipt"}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "method" }, 405);

  const auth = req.headers.get("Authorization") || "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const user = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await user.auth.getUser();
  if (!u?.user) return reply({ error: "auth" }, 401);
  const { data: role } = await user.rpc("my_role");
  if (role !== "admin" && role !== "manager") return reply({ error: "forbidden" }, 403);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return reply({ error: "no_key" }, 501);

  let b: { image?: string; media?: string };
  try { b = await req.json(); } catch { return reply({ error: "bad json" }, 400); }
  const image = String(b.image || "");
  const media = /^image\/(jpeg|png|webp)$/.test(String(b.media)) ? String(b.media) : "image/jpeg";
  if (!image || image.length > 7_000_000) return reply({ error: "image" }, 400);

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("RECEIPT_MODEL") || "claude-haiku-5-5",
      max_tokens: 1200,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: media, data: image } },
        { type: "text", text: PROMPT },
      ] }],
    }),
  });
  if (!r.ok) return reply({ error: "ai", status: r.status, detail: (await r.text()).slice(0, 300) }, 502);
  const j = await r.json();
  const text = (j.content || []).map((c: { text?: string }) => c.text || "").join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return reply({ error: "parse" }, 502);
  try {
    const out = JSON.parse(m[0]);
    if (out.error) return reply(out, 422);
    if (!CATS.includes(out.tax_cat)) out.tax_cat = "materials";
    out.source = "ai";
    return reply(out);
  } catch { return reply({ error: "parse" }, 502); }
});
