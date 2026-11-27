// AYO — PAIEMENTS EN LIGNE
// ==================== PAIEMENTS EN LIGNE ====================
function enabledMethods(region) {
    const list = region === "international" ? INTL_PAYMENT_METHODS : LOCAL_PAYMENT_METHODS;
    const on = list.filter(m => appState.gateways[m] !== false);
    return on.length ? on : [list[list.length - 1]];
}

function paymentMethodOf(order) {
    return String(order.payment || "").replace(/\s*\((Local|Intl)\)\s*$/, "").trim();
}

function renderPayments() {
    const box = document.getElementById("bo-pay-kpis");
    if (!box) return;
    const paid = appState.orders.filter(o => o.payment !== "Devis Agenda");
    const isCash = o => /livraison|Retrait atelier/i.test(paymentMethodOf(o));
    const collected = paid.filter(o => !isCash(o)).reduce((s, o) => s + o.amountFcfa, 0);
    const toCollect = paid.filter(isCash).reduce((s, o) => s + o.amountFcfa, 0);
    const intl = paid.filter(o => /\(Intl\)/.test(o.payment)).reduce((s, o) => s + o.amountFcfa, 0);
    const total = paid.reduce((s, o) => s + o.amountFcfa, 0) || 1;
    box.innerHTML =
        kpiCard("Encaissé en ligne", convertFromFcfa(collected), "text-sage") +
        kpiCard("À encaisser (livraison)", convertFromFcfa(toCollect), "text-caramel") +
        kpiCard("Part diaspora", `${Math.round(intl / total * 100)}%`) +
        kpiCard("Transactions", String(paid.length));

    document.getElementById("bo-pay-gateways").innerHTML = [
        ["Local Bénin / UEMOA", LOCAL_PAYMENT_METHODS], ["International Diaspora", INTL_PAYMENT_METHODS]
    ].map(([title, list]) => `
        <div class="p-3 rounded-2xl bg-vanilla border border-beech/30 space-y-1.5">
            <span class="text-[10px] font-extrabold uppercase text-caramel">${title}</span>
            ${list.map(m => {
                const on = appState.gateways[m] !== false;
                return `<label class="flex items-center justify-between gap-2 text-xs font-bold text-darkChoc cursor-pointer">
                    <span>${escapeHTML(m)}</span>
                    <input type="checkbox" ${on ? "checked" : ""} onchange="toggleGateway('${escapeHTML(m)}', this.checked)" class="w-4 h-4 accent-[#2E6F40]">
                </label>`;
            }).join("")}
        </div>`).join("");

    const byMethod = {};
    paid.forEach(o => { const m = paymentMethodOf(o); byMethod[m] = (byMethod[m] || 0) + o.amountFcfa; });
    const max = Math.max(1, ...Object.values(byMethod));
    document.getElementById("bo-pay-bars").innerHTML = Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([m, v]) => `
        <div class="text-xs">
            <div class="flex justify-between font-bold text-darkChoc"><span>${escapeHTML(m)}</span><span>${convertFromFcfa(v)}</span></div>
            <div class="w-full h-2 bg-vanilla rounded-full overflow-hidden border border-beech/25 mt-1"><div class="h-full bg-caramel" style="width:${Math.round(v / max * 100)}%"></div></div>
        </div>`).join("") || `<p class="text-xs text-cocoaSoft">Aucune transaction.</p>`;

    document.getElementById("bo-pay-tx").innerHTML = paid.slice(0, 6).map(o => `
        <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-vanilla border border-beech/30 text-xs">
            <div>
                <span class="font-mono font-bold">${escapeHTML(o.ref)}</span>
                <span class="ml-2 text-cocoaSoft">${escapeHTML(clientName(o.client))}</span>
                <span class="block text-[11px] text-cocoaSoft">${escapeHTML(o.payment)}</span>
            </div>
            <div class="text-right">
                <strong class="text-caramel">${convertFromFcfa(o.amountFcfa)}</strong>
                <span class="block text-[10px] font-extrabold ${isCash(o) ? "text-caramel" : "text-sage"}">${isCash(o) ? "À encaisser" : "Payé"}</span>
            </div>
        </div>`).join("");
}

function toggleGateway(method, on) {
    appState.gateways[method] = !!on;
    saveAppState();
    setPaymentRegion(appState.paymentRegion);
    renderPayments();
    showToast(`${method} ${on ? "activé" : "désactivé"} au paiement.`, "success");
}
