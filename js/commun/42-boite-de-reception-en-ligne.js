// AYO — BOÎTE DE RÉCEPTION EN LIGNE
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
        CLOUD.shopPay = (data && data.pay) || null;
        try { setPaymentRegion(appState.paymentRegion || "local"); } catch (e) {}
        if (new URLSearchParams(location.search).get("ayo_pay")) setTimeout(payReturn, 500);
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
