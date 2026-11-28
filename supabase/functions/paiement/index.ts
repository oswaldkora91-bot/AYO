// AYO · Paiement en ligne FedaPay (Mobile Money et carte)
// L'argent va directement sur le compte FedaPay du commerçant : AYO ne le touche jamais.
// La clé secrète du commerçant reste dans la base (table payment_accounts) et n'est lue qu'ici.
//
// Actions (POST, JSON) :
//   { action: "start", slug, ref, return_url, email? } -> { url }        (public : client de la boutique)
//   { action: "check", slug, ref }                       -> { pay_status } (public)
//   { action: "test" }                                    -> { ok, env }   (commerçant connecté)
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (message: string, status = 400) => json({ error: message }, status);

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const apiBase = (env: string) => env === "live" ? "https://api.fedapay.com/v1" : "https://sandbox-api.fedapay.com/v1";

async function feda(env: string, key: string, path: string, init: RequestInit = {}) {
  const res = await fetch(apiBase(env) + path, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json", ...(init.headers || {}) },
  });
  let body: any = null;
  try { body = await res.json(); } catch { body = null; }
  return { ok: res.ok, status: res.status, body };
}
// FedaPay renvoie selon les versions { "v1/transaction": {...} } ou l'objet directement
const unwrap = (b: any) => (b && (b["v1/transaction"] || b.transaction || b)) || {};

const STATUS: Record<string, string> = {
  approved: "payé", transferred: "payé", approved_partially_refunded: "payé",
  declined: "refusé", canceled: "annulé", cancelled: "annulé", refunded: "annulé", expired: "annulé",
  pending: "en attente",
};

async function shopAndKey(slug: string) {
  const { data: ws } = await db.from("workspaces").select("id, name, slug").eq("slug", String(slug || "").toLowerCase()).maybeSingle();
  if (!ws) return null;
  const { data: acc } = await db.from("payment_accounts").select("env, secret_key").eq("workspace_id", ws.id).maybeSingle();
  return { ws, acc };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("méthode non autorisée", 405);
  let p: any;
  try { p = await req.json(); } catch { return fail("requête invalide"); }

  try {
    // ---------- Démarrer un paiement ----------
    if (p.action === "start") {
      const s = await shopAndKey(p.slug);
      if (!s) return fail("boutique introuvable", 404);
      if (!s.acc) return fail("cette boutique n'accepte pas encore le paiement en ligne", 409);
      const ref = String(p.ref || "");
      const { data: order } = await db.from("orders").select("id, payload, pay_status, pay_ref").eq("workspace_id", s.ws.id).eq("ref", ref).maybeSingle();
      if (!order) return fail("commande introuvable", 404);
      if (order.pay_status === "payé") return fail("cette commande est déjà payée", 409);
      const amount = Math.round(Number(order.payload?.amountFcfa) || 0);
      if (amount < 100) return fail("montant trop faible pour un paiement en ligne");

      let back = String(p.return_url || "");
      if (!/^https?:\/\//i.test(back)) back = "";
      const client = String(order.payload?.client || "");
      const name = client.split("(")[0].trim() || "Client";
      const phone = (client.match(/\(([^)]+)\)/)?.[1] || "").replace(/\D/g, "");
      const [firstname, ...rest] = name.split(/\s+/);
      const customer: Record<string, unknown> = { firstname: firstname || "Client", lastname: rest.join(" ") || "-" };
      const email = String(p.email || "").trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) customer.email = email;
      // numéro local béninois : 8 ou 10 chiffres, sans indicatif
      const local = phone.startsWith("229") ? phone.slice(3) : phone;
      if (local.length >= 8 && local.length <= 10) customer.phone_number = { number: local, country: "bj" };

      const tx = await feda(s.acc.env, s.acc.secret_key, "/transactions", {
        method: "POST",
        body: JSON.stringify({
          description: `${s.ws.name || "Boutique"} — commande ${ref}`.slice(0, 250),
          amount,
          currency: { iso: "XOF" },
          ...(back ? { callback_url: back } : {}),
          customer,
          custom_metadata: { ayo_ref: ref, ayo_shop: s.ws.slug },
        }),
      });
      const t = unwrap(tx.body);
      if (!tx.ok || !t.id) {
        console.error("FedaPay create", tx.status, JSON.stringify(tx.body).slice(0, 500));
        return fail(tx.status === 401 ? "la clé FedaPay de la boutique est refusée" : "FedaPay n'a pas pu créer le paiement", 502);
      }
      const tok = await feda(s.acc.env, s.acc.secret_key, `/transactions/${t.id}/token`, { method: "POST" });
      const url = tok.body?.url || tok.body?.["v1/token"]?.url;
      if (!tok.ok || !url) {
        console.error("FedaPay token", tok.status, JSON.stringify(tok.body).slice(0, 500));
        return fail("FedaPay n'a pas pu ouvrir la page de paiement", 502);
      }
      await db.from("orders").update({ pay_provider: "fedapay", pay_status: "en attente", pay_ref: String(t.id), pay_amount: amount }).eq("id", order.id);
      return json({ url, env: s.acc.env });
    }

    // ---------- Vérifier un paiement (au retour du client ou depuis le back-office) ----------
    if (p.action === "check") {
      const s = await shopAndKey(p.slug);
      if (!s) return fail("boutique introuvable", 404);
      const { data: order } = await db.from("orders").select("id, pay_status, pay_ref, pay_amount").eq("workspace_id", s.ws.id).eq("ref", String(p.ref || "")).maybeSingle();
      if (!order) return fail("commande introuvable", 404);
      if (!order.pay_ref || !s.acc) return json({ pay_status: order.pay_status || null });
      if (order.pay_status === "payé") return json({ pay_status: "payé" });
      const tx = await feda(s.acc.env, s.acc.secret_key, `/transactions/${order.pay_ref}`);
      const t = unwrap(tx.body);
      if (!tx.ok || !t.status) return json({ pay_status: order.pay_status });
      let st = STATUS[String(t.status)] || "en attente";
      // un paiement approuvé doit couvrir le montant de la commande
      if (st === "payé" && Number(t.amount) + 0.5 < Number(order.pay_amount || 0)) st = "en attente";
      if (st !== order.pay_status) {
        await db.from("orders").update({ pay_status: st, ...(st === "payé" ? { paid_at: new Date().toISOString() } : {}) }).eq("id", order.id);
      }
      return json({ pay_status: st, env: s.acc.env });
    }

    // ---------- Tester la clé (commerçant connecté) ----------
    if (p.action === "test") {
      const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: u } = await db.auth.getUser(token);
      if (!u?.user) return fail("connectez-vous à votre espace", 401);
      const { data: ws } = await db.from("workspaces").select("id").eq("owner", u.user.id).maybeSingle();
      if (!ws) return fail("espace introuvable", 404);
      const { data: acc } = await db.from("payment_accounts").select("env, secret_key").eq("workspace_id", ws.id).maybeSingle();
      if (!acc) return fail("aucune clé FedaPay enregistrée", 404);
      const r = await feda(acc.env, acc.secret_key, "/transactions?per_page=1");
      if (!r.ok) return json({ ok: false, env: acc.env, error: r.status === 401 || r.status === 403 ? "FedaPay refuse cette clé : vérifiez-la dans votre tableau de bord FedaPay." : "FedaPay ne répond pas, réessayez." });
      await db.from("payment_accounts").update({ verified_at: new Date().toISOString() }).eq("workspace_id", ws.id);
      return json({ ok: true, env: acc.env });
    }

    return fail("action inconnue");
  } catch (e) {
    console.error(e);
    return fail("erreur du serveur de paiement", 500);
  }
});
