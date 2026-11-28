// AYO — PAIEMENT EN LIGNE RÉEL (FedaPay)
// Version de la boutique client (boutique.html)
// ==================== PAIEMENT EN LIGNE RÉEL (FedaPay) ====================
// L'argent va directement sur le compte FedaPay du commerçant. Sa clé secrète est gardée côté serveur
// (fonction « paiement » de Supabase) : le navigateur ne la voit jamais.
const PAY_ONLINE = "Mobile Money ou carte (FedaPay)";
const PAY_CASH = "Paiement à la livraison / Retrait atelier";
async function payCall(body, withUser) {
    const headers = { "Content-Type": "application/json", apikey: SB_KEY };
    if (withUser && CLOUD.sb) { const { data } = await CLOUD.sb.auth.getSession(); if (data && data.session) headers.Authorization = `Bearer ${data.session.access_token}`; }
    let r;
    try { r = await fetch(`${SB_URL}/functions/v1/paiement`, { method: "POST", headers, body: JSON.stringify(body) }); }
    catch (e) { throw new Error("Connexion impossible au service de paiement. Vérifiez internet puis réessayez."); }
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { const m = j.error || "Le service de paiement ne répond pas."; throw new Error(m.charAt(0).toUpperCase() + m.slice(1)); }
    return j;
}
// Dans la vraie boutique en ligne, on ne propose que ce qui marche vraiment
const _enabledMethods_pay = enabledMethods;
enabledMethods = function (region) {
    if (!(cloudOn() && CLOUD.shopSlug && !appState.isAdminAuthenticated)) return _enabledMethods_pay(region);
    return CLOUD.shopPay ? [PAY_ONLINE, PAY_CASH] : [PAY_CASH];
};
function payReceipt(o, mode, msg) {
    const el = document.getElementById("tx-receipt-details"); if (!el || !o) return;
    const amount = o.amountFcfa ? convertFromFcfa(o.amountFcfa) + " " : "";
    el.textContent = {
        start: `${amount}à payer par Mobile Money ou carte. La page de paiement sécurisée FedaPay s'ouvre…`,
        cash: `${amount}à régler à la livraison ou au retrait.`,
        error: `${msg || "Le paiement en ligne n'a pas pu démarrer."} Vous pouvez régler à la livraison ou contacter la boutique.`,
        payé: `Commande ${amount}payée en ligne. Merci !`,
        "en attente": "Paiement en cours de confirmation. La boutique est prévenue dès qu'il est validé.",
        refusé: "Le paiement a été refusé. Vous pouvez repasser commande ou régler à la livraison.",
        annulé: "Le paiement a été annulé. Vous pouvez repasser commande ou régler à la livraison."
    }[mode] || el.textContent;
}
async function payStart(o) {
    const slug = CLOUD.shopSlug;
    const back = /^https?:$/.test(location.protocol) ? `${location.origin}${location.pathname}?shop=${encodeURIComponent(slug)}&ayo_pay=${encodeURIComponent(o.ref)}` : "";
    try {
        const r = await payCall({ action: "start", slug, ref: o.ref, return_url: back });
        try { localStorage.setItem("ayo_pay_pending", JSON.stringify({ ref: o.ref, slug, amountFcfa: o.amountFcfa, at: Date.now() })); } catch (e) {}
        if (r.env === "sandbox") showToast("Mode test FedaPay : aucun argent réel ne sera débité.", "info");
        setTimeout(() => { location.href = r.url; }, r.env === "sandbox" ? 1200 : 300);
    } catch (err) {
        payReceipt(o, "error", err.message);
        showToast(err.message, "info");
    }
}
// Retour de la page FedaPay : on demande au serveur l'état réel du paiement
async function payReturn() {
    const q = new URLSearchParams(location.search), ref = q.get("ayo_pay");
    if (!ref || !CLOUD.shopSlug) return;
    let pending = null; try { pending = JSON.parse(localStorage.getItem("ayo_pay_pending") || "null"); } catch (e) {}
    const o = { ref, amountFcfa: pending && pending.ref === ref ? pending.amountFcfa : 0 };
    try { history.replaceState(null, "", `${location.pathname}#${CLOUD.shopSlug}`); } catch (e) {}
    let st = "en attente";
    try { st = (await payCall({ action: "check", slug: CLOUD.shopSlug, ref })).pay_status || "en attente"; } catch (e) {}
    if (st === "payé") try { localStorage.removeItem("ayo_pay_pending"); } catch (e) {}
    const box = document.getElementById("tx-receipt-box");
    const refEl = document.getElementById("tx-receipt-ref");
    if (box && refEl) {
        try { toggleCartDrawer(true); setCartStep(2); } catch (e) {}
        refEl.textContent = ref; payReceipt(o, st);
        const inv = document.getElementById("tx-invoice-btn"); if (inv) inv.classList.add("hidden");
        box.classList.remove("hidden");
    }
    showToast({ "payé": `Paiement reçu pour la commande ${ref}. Merci !`, "refusé": `Le paiement de ${ref} a été refusé.`, "annulé": `Le paiement de ${ref} a été annulé.` }[st] || `Paiement de ${ref} en cours de confirmation.`, st === "payé" ? "success" : "info");
}

// ---- Côté entreprise : activer le paiement en ligne ----
async function renderPayOnline() {
    const box = document.getElementById("bo-pay-online"); if (!box) return;
    if (!(cloudOn() && CLOUD.user && CLOUD.wsId)) {
        box.innerHTML = `<strong class="block text-sm font-serif">Paiement en ligne réel (FedaPay)</strong><p class="mt-1 text-cocoaSoft">Connectez-vous avec votre compte AYO en ligne pour encaisser de vrais paiements Mobile Money et carte.</p>`;
        return;
    }
    let st = CLOUD.payStatus;
    if (!st) {
        box.innerHTML = `<p class="text-cocoaSoft">Chargement du paiement en ligne…</p>`;
        const { data, error } = await CLOUD.sb.rpc("get_payment_status");
        if (error) { box.innerHTML = `<p class="text-red-700">Impossible de lire l'état du paiement en ligne. Réessayez plus tard.</p>`; return; }
        st = CLOUD.payStatus = data || { active: false };
    }
    const form = `<form onsubmit="savePayKey(event)" class="mt-3 flex flex-col sm:flex-row gap-2">
            <label class="sr-only" for="pay-key-input">Clé secrète FedaPay</label>
            <input id="pay-key-input" type="password" autocomplete="off" spellcheck="false" placeholder="Clé secrète : sk_live_… ou sk_sandbox_…" class="flex-1 bg-white border border-beech/40 rounded-xl px-3 py-2 text-xs font-mono" required>
            <button class="bg-darkChoc text-vanilla px-4 py-2 rounded-xl text-xs font-bold">Enregistrer la clé</button>
        </form>`;
    if (!st.active) {
        box.innerHTML = `<strong class="block text-sm font-serif">Paiement en ligne réel : pas encore activé</strong>
            <p class="mt-1 text-cocoaSoft">Vos clients paient par MTN MoMo, Moov Money ou carte, et l'argent arrive directement sur votre compte FedaPay. AYO ne touche jamais votre argent.</p>
            <ol class="mt-2 list-decimal pl-5 space-y-0.5 text-cocoaSoft">
                <li>Créez votre compte gratuit sur <a href="https://fedapay.com" target="_blank" rel="noopener" class="underline font-bold text-caramel">fedapay.com</a> et faites valider votre entreprise.</li>
                <li>Dans FedaPay, ouvrez la page des clés API et copiez la <b>clé secrète</b>. Celle qui commence par <code>sk_sandbox_</code> sert aux essais ; celle qui commence par <code>sk_live_</code> encaisse pour de vrai.</li>
                <li>Collez-la ci-dessous. Elle est gardée sur le serveur et ne s'affichera plus.</li>
            </ol>${form}`;
        return;
    }
    const envTxt = st.env === "live" ? `<span class="px-2 py-0.5 rounded-full bg-sageLight text-sage font-extrabold">Encaissement réel</span>` : `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">Mode test : aucun argent réel</span>`;
    box.innerHTML = `<div class="flex flex-wrap items-center gap-2"><strong class="text-sm font-serif">Paiement en ligne FedaPay activé</strong>${envTxt}</div>
        <p class="mt-1 text-cocoaSoft">Clé se terminant par ••••${escapeHTML(st.hint || "")}${st.verified_at ? ` · vérifiée le ${new Date(st.verified_at).toLocaleDateString("fr-FR")}` : " · pas encore vérifiée"}. Vos clients voient « ${PAY_ONLINE} » au moment de payer.</p>
        <div class="mt-3 flex flex-wrap gap-2">
            <button type="button" onclick="testPayKey(this)" class="bg-darkChoc text-vanilla px-3.5 py-2 rounded-xl text-xs font-bold">Tester la clé</button>
            <button type="button" onclick="document.getElementById('pay-key-change').classList.toggle('hidden')" class="bg-white border border-beech/40 px-3.5 py-2 rounded-xl text-xs font-bold">Changer la clé</button>
            <button type="button" onclick="removePayKey()" class="bg-white border border-red-200 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold">Désactiver le paiement en ligne</button>
        </div><div id="pay-key-change" class="hidden">${form}</div>`;
}
async function savePayKey(e) {
    e.preventDefault();
    const inp = document.getElementById("pay-key-input"), key = inp.value.trim();
    const { data, error } = await CLOUD.sb.rpc("set_payment_key", { p_key: key });
    inp.value = "";
    if (error) { showToast(error.message.charAt(0).toUpperCase() + error.message.slice(1), "info"); return; }
    CLOUD.payStatus = { ...data, verified_at: null };
    await renderPayOnline();
    showToast(data.env === "live" ? "Clé enregistrée : vos clients peuvent payer en ligne." : "Clé de test enregistrée : faites un essai sans argent réel.", "success");
    testPayKey();
}
async function testPayKey(btn) {
    if (btn) { btn.disabled = true; btn.textContent = "Test en cours…"; }
    try {
        const r = await payCall({ action: "test" }, true);
        if (r.ok) { CLOUD.payStatus = { ...CLOUD.payStatus, verified_at: new Date().toISOString() }; showToast("FedaPay accepte votre clé.", "success"); }
        else showToast(r.error || "FedaPay refuse cette clé.", "info");
    } catch (err) { showToast(err.message, "info"); }
    renderPayOnline();
}
async function removePayKey() {
    if (!confirm("Désactiver le paiement en ligne ? Vos clients ne pourront plus payer par Mobile Money ou carte sur votre boutique.")) return;
    const { error } = await CLOUD.sb.rpc("set_payment_key", { p_key: "" });
    if (error) { showToast("Impossible de désactiver pour le moment.", "info"); return; }
    CLOUD.payStatus = { active: false };
    renderPayOnline();
    showToast("Paiement en ligne désactivé.", "success");
}
const _renderPayments_pay = renderPayments;
renderPayments = function () { _renderPayments_pay.apply(this, arguments); renderPayOnline(); };

// ---- Côté entreprise : effets d'une commande en ligne (stock, facture, alerte) ----
function applyOnlineOrderEffects(order) {
    const lines = Array.isArray(order.lines) ? order.lines : [];
    const wasLow = appState.stocks.map(st => st.qty <= st.minAlert);
    lines.forEach(item => {
        const pastry = PASTRIES.find(p => p.id === item.pastryId);
        const bom = pastry?.recipeBom || (Number.isInteger(item.ingredientIdx) ? [{ idx: item.ingredientIdx, qty: 0.5 }] : []);
        bom.forEach(b => {
            const st = appState.stocks[b.idx];
            if (st) st.qty = Math.max(0, Number((st.qty - (Number(item.qty) || 0) * b.qty).toFixed(2)));
        });
    });
    appState.stocks.forEach((st, i) => {
        if (!wasLow[i] && st.qty <= st.minAlert) pushNotification(`Atelier ${appState.tenant.name}`, "", "Stock bas", `${st.name} : ${st.qty} ${st.unit} restants (seuil ${st.minAlert} ${st.unit}). Prévoir réapprovisionnement.`, "Alerte interne");
    });
    try {
        if (appState.billing?.auto !== false && billingReady() && !appState.invoices.some(f => f.orderRef === order.ref)) createInvoiceForOrder(order.ref, true);
    } catch (e) {}
}
const _cloudSyncOrders_c = cloudSyncOrders;
cloudSyncOrders = async function (silent) {
    const before = new Set(appState.orders.map(o => o.ref));
    await _cloudSyncOrders_c(silent);
    const fresh = appState.orders.filter(o => o.online && !before.has(o.ref) && !o.effectsDone);
    if (fresh.length) {
        fresh.forEach(o => { applyOnlineOrderEffects(o); o.effectsDone = true; });
        saveAppState(); renderBackOfficeAll();
    }
};

// ---- Côté entreprise : réservations, messages, avis et fichier clients ----
async function cloudSyncInbox(silent) {
    if (!CLOUD.user || !CLOUD.wsId) return;
    await cloudSyncOrders(silent);
    const ws = CLOUD.wsId;
    const [bk, ms, rv, cu] = await Promise.all([
        CLOUD.sb.from("bookings").select("ref, name, phone, day, slot, guests, event_type, estimate_fcfa, status, created_at").eq("workspace_id", ws).order("created_at", { ascending: false }).limit(200),
        CLOUD.sb.from("messages").select("ref, name, email, topic, body, status, created_at").eq("workspace_id", ws).order("created_at", { ascending: false }).limit(200),
        CLOUD.sb.from("reviews").select("id, author, stars, item, comment, status, created_at").eq("workspace_id", ws).order("created_at", { ascending: false }).limit(200),
        CLOUD.sb.from("customers").select("contact, name, orders_count, bookings_count, messages_count, last_seen_at").eq("workspace_id", ws).order("last_seen_at", { ascending: false }).limit(300)
    ]);
    let added = { bookings: 0, messages: 0, reviews: 0 }, changed = false;
    (bk.data || []).slice().reverse().forEach(b => {
        const t = appState.tickets.find(x => x.id === b.ref);
        if (!t) {
            appState.tickets.unshift({ id: b.ref, type: "Agenda", from: `${b.name} (${b.phone})`, message: `${b.day} • ${b.event_type} (${b.guests} pers. • ${b.slot})`, status: b.status, cloud: "bookings" });
            if (!appState.orders.some(o => o.ref === b.ref)) appState.orders.unshift({ ref: b.ref, client: `${b.name} (${b.phone})`, details: `Agenda ${b.day} • ${b.event_type} (${b.guests} pers.)`, payment: "Devis Agenda", amountFcfa: Number(b.estimate_fcfa) || 0, status: "En attente", online: true, effectsDone: true });
            added.bookings++;
        } else if (t.status !== b.status) { t.status = b.status; t.cloud = "bookings"; changed = true; }
    });
    (ms.data || []).slice().reverse().forEach(m => {
        const t = appState.tickets.find(x => x.id === m.ref);
        if (!t) {
            appState.tickets.unshift({ id: m.ref, type: "Contact", from: `${m.name} (${m.email})`, message: `[${m.topic}] ${m.body}`, status: m.status, cloud: "messages" });
            added.messages++;
        } else if (t.status !== m.status) { t.status = m.status; t.cloud = "messages"; changed = true; }
    });
    (rv.data || []).slice().reverse().forEach(r => {
        const local = appState.reviews.find(x => x.cid === r.id);
        if (!local && r.status === "publié") { appState.reviews.unshift({ cid: r.id, author: r.author, stars: r.stars, item: r.item, comment: r.comment }); added.reviews++; }
        else if (local && r.status === "masqué") { appState.reviews = appState.reviews.filter(x => x !== local); changed = true; }
    });
    if (!cu.error) { appState.cloudCustomers = cu.data || []; renderCloudCustomers(); }
    const n = added.bookings + added.messages + added.reviews;
    if (n || changed) {
        saveAppState();
        renderBackOfficeAll();
        if (n && !silent) {
            const parts = [];
            if (added.bookings) parts.push(`${added.bookings} réservation${added.bookings > 1 ? "s" : ""}`);
            if (added.messages) parts.push(`${added.messages} message${added.messages > 1 ? "s" : ""}`);
            if (added.reviews) parts.push(`${added.reviews} avis`);
            showToast(`Nouveau en ligne : ${parts.join(", ")}.`, "success");
        }
    }
}
// Statut d'une réservation ou d'un message, aussi mis à jour dans la base
var TICKET_STATUSES = { Agenda: ["Confirmé", "En cours", "Terminé", "Annulé"], Contact: ["Nouveau", "En cours", "Traité"] };
function setTicketStatus(id, status) {
    const t = appState.tickets.find(x => x.id === id);
    if (!t) return;
    t.status = status;
    saveAppState();
    renderBackOfficeAll();
    showToast(`${t.id} : ${status}`, "success");
    const table = t.cloud || (t.type === "Agenda" ? "bookings" : "messages");
    if (cloudOn() && CLOUD.user && CLOUD.wsId) CLOUD.sb.from(table).update({ status }).eq("workspace_id", CLOUD.wsId).eq("ref", id).then(() => {});
}
// Masquer un avis publié (il disparaît de la boutique)
function hideReview(cid) {
    appState.reviews = appState.reviews.filter(r => r.cid !== cid);
    saveAppState(); renderBackOfficeAll(); renderReviewsSummary();
    showToast("Avis masqué sur la boutique.", "success");
    if (cloudOn() && CLOUD.user && CLOUD.wsId) CLOUD.sb.from("reviews").update({ status: "masqué" }).eq("workspace_id", CLOUD.wsId).eq("id", cid).then(() => {});
}
function renderCloudCustomers() {
    const box = document.getElementById("bo-cloud-customers");
    if (!box) return;
    const list = appState.cloudCustomers || [];
    box.classList.toggle("hidden", !list.length);
    if (!list.length) return;
    const date = d => { try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }); } catch (e) { return ""; } };
    box.innerHTML = `
        <div class="flex items-end justify-between gap-3 mb-3">
            <div><h3 class="font-serif text-lg font-bold text-darkChoc">Fichier clients</h3>
            <p class="text-[11px] text-cocoaSoft">Les clients qui ont commandé, réservé ou écrit depuis la boutique en ligne.</p></div>
            <span class="bg-sageLight text-sage text-[11px] font-extrabold px-2.5 py-1 rounded-full">${list.length} client${list.length > 1 ? "s" : ""}</span>
        </div>
        <div class="overflow-x-auto"><table class="w-full text-xs">
            <thead><tr class="text-left text-cocoaSoft border-b border-beech/25"><th class="py-2 pr-3">Client</th><th class="py-2 pr-3">Contact</th><th class="py-2 pr-3 text-right">Commandes</th><th class="py-2 pr-3 text-right">Réservations</th><th class="py-2 pr-3 text-right">Messages</th><th class="py-2 text-right">Dernière visite</th></tr></thead>
            <tbody>${list.map(c => `<tr class="border-b border-beech/15"><td class="py-2 pr-3 font-bold text-darkChoc">${escapeHTML(c.name || "—")}</td><td class="py-2 pr-3 font-mono">${escapeHTML(c.contact)}</td><td class="py-2 pr-3 text-right">${c.orders_count}</td><td class="py-2 pr-3 text-right">${c.bookings_count}</td><td class="py-2 pr-3 text-right">${c.messages_count}</td><td class="py-2 text-right">${date(c.last_seen_at)}</td></tr>`).join("")}</tbody>
        </table></div>`;
}
const _renderBackOfficeAll_in = renderBackOfficeAll;
renderBackOfficeAll = function () { const r = _renderBackOfficeAll_in.apply(this, arguments); try { renderCloudCustomers(); } catch (e) {} return r; };
// Après la connexion, la boîte de réception suit les commandes (toutes les 30 s)
const _cloudAfterLogin_c = cloudAfterLogin;
cloudAfterLogin = async function (acc, isNew) {
    await _cloudAfterLogin_c(acc, isNew);
    if (!CLOUD.user || !CLOUD.wsId) return;
    await cloudSyncInbox(true);
    clearInterval(CLOUD.pollTimer);
    CLOUD.pollTimer = setInterval(() => { if (appState.isAdminAuthenticated && !document.hidden) { cloudAdminCheck(); cloudSyncInbox(false); } }, 30000);
};

// ---------- Navigation entre les deux pages ----------
function slugify(name) {
    return String(name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function shopShareLink(slug) { return `${AYO_ARTIFACT_URL}#boutique-${slug || siteSlug()}`; }
function openShop(view) {
    saveAppState();
    if (APP_MODE === "business" && appState.isAdminAuthenticated) ssSet("ayo_preview", "1"); else ssSet("ayo_preview", null);
    ssSet("ayo_shop_view", view || null);
    location.href = `boutique.html#${siteSlug()}`;
}
function goToBusinessApp() {
    saveAppState();
    location.href = "index.html";
}
function findWorkspaceIdBySlug(slug) {
    if (!slug) return null;
    if (slugify(appState.tenant?.name) === slug) return appState.activeWorkspace;
    for (const [id, ws] of Object.entries(appState.workspaces || {})) {
        if (slugify(ws?.tenant?.name) === slug) return id;
    }
    if (slugify(getDefaultState().tenant.name) === slug) return "demo";
    return null;
}
function accountForWorkspace(id) {
    if (!id || id === "demo") return DEMO_ACCOUNTS[0];
    return allAccounts().find(a => `acc:${a.email}` === id) || null;
}

// ---------- Démarrage de la boutique client ----------
function bootShop() {
    const slug = decodeURIComponent(location.hash.replace(/^#/, "").replace(/^boutique-/, "")) || new URLSearchParams(location.search).get("shop") || "";
    let wsId = findWorkspaceIdBySlug(slug);
    const notFound = () => setTimeout(() => showToast("Boutique introuvable : voici la boutique de démonstration.", "info"), 400);
    if (slug && cloudOn()) {
        cloudLoadShop(slug).then(ok => {
            if (ok) { renderAll(); switchView(document.getElementById("view-customer") && !document.getElementById("view-customer").classList.contains("hidden") ? "customer" : "client"); }
            else if (!wsId) notFound();
        });
    } else if (slug && !wsId) notFound();
    switchWorkspace(wsId || "demo");
    appState.isAdminAuthenticated = false;
    saveAppState();
    renderAll();
    const view = ssGet("ayo_shop_view"); ssSet("ayo_shop_view", null);
    switchView(view === "customer" ? "customer" : "client");
    document.getElementById("preview-bar").classList.toggle("hidden", ssGet("ayo_preview") !== "1");
    const camp = ssGet("ayo_campaign"); ssSet("ayo_campaign", null);
    if (camp) setTimeout(() => triggerSocialDeepLink(camp), 300);
}

window.addEventListener("DOMContentLoaded", () => {
    syncStickyOffsets();
    initOtpBoxes();
    initAdminSessionGuard();
    initWheelGestures();
    bootShop();
    initReveal();
    initStaggers();
    initCarouselAutoplay();
    initMotion3();
});
