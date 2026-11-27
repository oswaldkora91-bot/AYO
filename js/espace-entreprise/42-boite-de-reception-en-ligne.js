// AYO — BOÎTE DE RÉCEPTION EN LIGNE
// Version de l'espace entreprise (index.html)
// ==================== BOÎTE DE RÉCEPTION EN LIGNE ====================
// Ce que les clients envoient depuis la boutique publique (réservations, avis, messages) part dans Supabase,
// puis arrive dans le back-office de l'entreprise.
const cloudPublic = () => cloudOn() && !!CLOUD.shopSlug && !appState.isAdminAuthenticated;
function cloudFail(what, error) {
    const msg = error && /trop de/.test(error.message || "") ? error.message : `${what} enregistré${/e$/.test(what) ? "e" : ""} ici, mais l'envoi à la boutique a échoué. Réessayez plus tard.`;
    showToast(msg.charAt(0).toUpperCase() + msg.slice(1), "info");
}

// ---- Côté boutique ----
const _submitAgendaBooking_c = submitAgendaBooking;
submitAgendaBooking = function (e) {
    const v = id => (document.getElementById(id)?.value || "").trim();
    const snap = {
        name: v("agenda-name"), phone: v("agenda-phone"), guests: parseInt(v("agenda-guests") || "1", 10), slot: v("agenda-slot"),
        eventType: (document.getElementById("agenda-event-type")?.selectedOptions[0]?.text || "").split("(")[0].trim(),
        day: `${appState.selectedAgendaDay} Nov 2026`
    };
    const before = appState.tickets[0]?.id;
    const r = _submitAgendaBooking_c.apply(this, arguments);
    const t = appState.tickets[0], o = appState.orders[0];
    if (cloudPublic() && t && t.id !== before && t.type === "Agenda") {
        CLOUD.sb.rpc("book_slot", { p_slug: CLOUD.shopSlug, p_booking: { ref: t.id, ...snap, estimateFcfa: o?.ref === t.id ? o.amountFcfa : 0 } })
            .then(({ error }) => { if (error) cloudFail("réservation", error); });
    }
    return r;
};
const _addClientReview_c = addClientReview;
addClientReview = function (e) {
    const before = appState.reviews[0];
    const r = _addClientReview_c.apply(this, arguments);
    const rv = appState.reviews[0];
    if (cloudPublic() && rv && rv !== before) {
        CLOUD.sb.rpc("post_review", { p_slug: CLOUD.shopSlug, p_review: { author: rv.author, stars: rv.stars, item: rv.item, comment: rv.comment } })
            .then(({ data, error }) => {
                if (error) { cloudFail("avis", error); return; }
                rv.cid = data; saveAppState();
            });
    }
    return r;
};
const _submitContactTicket_c = submitContactTicket;
submitContactTicket = function (e) {
    const v = id => (document.getElementById(id)?.value || "").trim();
    const snap = { name: v("contact-name"), email: v("contact-email"), topic: v("contact-topic"), body: v("contact-msg") };
    const before = appState.tickets[0]?.id;
    const r = _submitContactTicket_c.apply(this, arguments);
    const t = appState.tickets[0];
    if (cloudPublic() && t && t.id !== before && t.type === "Contact") {
        CLOUD.sb.rpc("send_message", { p_slug: CLOUD.shopSlug, p_message: { ref: t.id, ...snap } })
            .then(({ error }) => { if (error) cloudFail("message", error); });
    }
    return r;
};
// Les avis publiés en ligne s'affichent tout de suite dans la vitrine
const _cloudLoadShop_c = cloudLoadShop;
cloudLoadShop = async function (slug) {
    const ok = await _cloudLoadShop_c(slug);
    if (ok && cloudOn()) {
        const { data } = await CLOUD.sb.rpc("get_shop", { p_slug: slug });
        const online = (data && Array.isArray(data.reviews)) ? data.reviews : [];
        const known = new Set(appState.reviews.map(r => r.cid).filter(Boolean));
        const fresh = online.filter(r => !known.has(r.cid));
        if (fresh.length) {
            appState.reviews = [...fresh, ...appState.reviews];
            try { renderReviewsSummary(); renderAll(); } catch (e) {}
        }
    }
    return ok;
};

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

// ---------- Démarrage de l'espace entreprise ----------
// La session reste ouverte dans cet onglet (aller-retour vers la boutique), jamais après fermeture de l'onglet.
function saveBizSession() {
    if (!appState.isAdminAuthenticated) { ssSet("ayo_session", null); return; }
    ssSet("ayo_session", JSON.stringify({ email: appState.currentAccountEmail, last: Date.now(), tab: currentBoTab || "home" }));
}
function bootBusiness() {
    if (/^#boutique/.test(location.hash)) {
        const slug = location.hash.replace(/^#boutique-?/, "");
        location.replace(`boutique.html${slug ? "#" + slug : ""}`);
        return true;
    }
    let sess = null;
    try { sess = JSON.parse(ssGet("ayo_session") || "null"); } catch (e) { sess = null; }
    if (sess && Date.now() - sess.last < SESSION_IDLE_MS) {
        const acc = allAccounts().find(a => a.email === sess.email && a.type === "business");
        if (acc) { pendingProService = sess.tab || "home"; completeLogin(acc, false, true); return false; }
    }
    ssSet("ayo_session", null);
    return false;
}

window.addEventListener("DOMContentLoaded", () => {
    syncStickyOffsets();
    initOtpBoxes();
    initAdminSessionGuard();
    initWheelGestures();
    switchWorkspace("demo");
    renderAll();
    if (bootBusiness()) return;
    if (!appState.isAdminAuthenticated) switchView("pro"); // le lien du SaaS ouvre la page de bienvenue
    initReveal();
    initStaggers();
    initCarouselAutoplay();
    initMotion3();
});
