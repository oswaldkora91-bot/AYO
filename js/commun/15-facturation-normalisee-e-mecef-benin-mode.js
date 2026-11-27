// AYO — FACTURATION NORMALISÉE (e-MECeF BÉNIN — MODE SIMULATION)
// ==================== FACTURATION NORMALISÉE (e-MECeF BÉNIN — MODE SIMULATION) ====================
// Groupes de taxation e-MECeF : A exonéré 0 %, B taxable 18 %, C exportation 0 %.
const TAX_GROUPS = {
    A: { label: "A — Exonéré", rate: 0 },
    B: { label: "B — Taxable TVA 18 %", rate: 0.18 },
    C: { label: "C — Exportation", rate: 0 }
};

function billingReady() {
    const b = appState.billing || {};
    return /^\d{13}$/.test(String(b.ifu || "").trim());
}

function randomBlock(n) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const buf = new Uint32Array(n);
    crypto.getRandomValues(buf);
    return Array.from(buf).map(v => chars[v % chars.length]).join("");
}

function orderLines(order) {
    if (Array.isArray(order.items) && order.items.length) return order.items.map(i => ({ ...i }));
    return [{ name: String(order.details || "Prestation").split(" • ")[0], qty: 1, unitTtc: order.amountFcfa }];
}

function computeInvoice(lines, group) {
    const rate = TAX_GROUPS[group]?.rate || 0;
    const totalTtc = lines.reduce((s, l) => s + l.qty * l.unitTtc, 0);
    const ht = Math.round(totalTtc / (1 + rate));
    return { totalTtc, ht, tva: totalTtc - ht };
}

function createInvoiceForOrder(orderRef, silent = false) {
    const order = appState.orders.find(o => o.ref === orderRef);
    if (!order) return null;
    appState.invoices = appState.invoices || [];
    const existing = appState.invoices.find(f => f.orderRef === orderRef && f.type === "FV");
    if (existing) { if (!silent) openInvoice(existing.id); return existing; }
    if (!billingReady()) {
        if (!silent) { showToast("Renseignez d'abord votre IFU (13 chiffres) dans « Facturation ».", "info"); switchBoTab("invoices"); }
        return null;
    }
    const group = appState.billing.regime || "B";
    const lines = orderLines(order);
    if (order.discount > 0) lines.push({ name: "Remise promotionnelle", qty: 1, unitTtc: -order.discount });
    if (order.shipping > 0) lines.push({ name: "Frais de livraison", qty: 1, unitTtc: order.shipping });
    return issueInvoice("FV", order, lines, group, null);
}

function issueInvoice(type, order, lines, group, refInvoice) {
    const n = appState.invoices.filter(f => f.type === type).length + 1;
    const total = appState.invoices.length + 1;
    const year = new Date().getFullYear();
    const totals = computeInvoice(lines, group);
    const inv = {
        id: `${type}-${year}-${String(n).padStart(5, "0")}`,
        type, orderRef: order.ref, date: new Date().toISOString(),
        client: clientName(order.client), clientContact: clientPhone(order.client), clientIfu: "",
        lines, group, ...totals,
        payment: String(order.payment || "").replace(/\s*\((Local|Intl)\)\s*$/, ""),
        refInvoice,
        security: {
            mode: "simulation",
            codeMecef: `DEMO-${randomBlock(4)}-${randomBlock(4)}-${randomBlock(4)}-${randomBlock(4)}-${randomBlock(4)}`,
            nim: `DEMO${randomBlock(2)}${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`,
            counters: `${n}/${total} ${type}`,
            stamp: new Date().toLocaleString("fr-FR")
        }
    };
    appState.invoices.unshift(inv);
    saveAppState();
    return inv;
}

function createCreditNote(invoiceId) {
    const fv = appState.invoices.find(f => f.id === invoiceId);
    if (!fv || fv.type !== "FV") return;
    if (appState.invoices.some(f => f.type === "FA" && f.refInvoice === fv.id)) { showToast("Un avoir existe déjà pour cette facture.", "info"); return; }
    const order = appState.orders.find(o => o.ref === fv.orderRef) || { ref: fv.orderRef, client: `${fv.client} (${fv.clientContact})`, payment: fv.payment };
    const lines = fv.lines.map(l => ({ ...l, unitTtc: -l.unitTtc }));
    const fa = issueInvoice("FA", order, lines, fv.group, fv.id);
    renderInvoices();
    openInvoice(fa.id);
    showToast(`Avoir ${fa.id} émis (annule ${fv.id}).`, "success");
}

function qrSvg(text) {
    try {
        if (typeof window.qrcode === "function") {
            const qr = window.qrcode(0, "M");
            qr.addData(text);
            qr.make();
            return qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
        }
    } catch (err) { /* repli ci-dessous */ }
    return `<div class="w-full h-full border-2 border-dashed border-darkChoc/40 flex items-center justify-center text-[9px] font-bold text-cocoaSoft text-center p-1">QR code DGI</div>`;
}

function openInvoice(id) {
    const f = (appState.invoices || []).find(x => x.id === id);
    if (!f) return;
    const b = appState.billing || {};
    const fmt = v => `${Math.round(v).toLocaleString("fr-FR")} FCFA`;
    const sheet = document.getElementById("invoice-sheet");
    const title = f.type === "FA" ? "FACTURE D'AVOIR" : "FACTURE DE VENTE";
    const qrText = `F;${f.security.nim};${f.security.codeMecef};${b.ifu};${f.date.slice(0, 19).replace(/[-:T]/g, "")}`;
    sheet.innerHTML = `
        <div class="relative">
            ${f.security.mode === "simulation" ? `<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><span class="text-5xl sm:text-6xl font-extrabold text-red-600/10 -rotate-12 select-none">DÉMO – NON CERTIFIÉE</span></div>` : ""}
            <div class="flex flex-wrap items-start justify-between gap-4 pb-4 border-b-2 border-darkChoc">
                <div>
                    <h3 class="font-serif text-2xl font-bold text-darkChoc">${escapeHTML(appState.tenant.name)}</h3>
                    <p class="text-[11px] text-cocoaSoft">${escapeHTML(b.address || appState.tenant.city)}</p>
                    <p class="text-[11px] text-cocoaSoft">IFU : <strong class="text-darkChoc font-mono">${escapeHTML(b.ifu || "—")}</strong>${b.rccm ? ` • RCCM : ${escapeHTML(b.rccm)}` : ""}</p>
                    <p class="text-[11px] text-cocoaSoft">Tél. : ${escapeHTML(currentAccount()?.phone || "—")}</p>
                </div>
                <div class="text-right">
                    <span class="inline-block bg-darkChoc text-brass text-[10px] font-extrabold px-2.5 py-1 rounded-md">FACTURE NORMALISÉE</span>
                    <p class="font-extrabold text-darkChoc mt-1">${title}</p>
                    <p class="font-mono text-sm font-bold text-darkChoc">${escapeHTML(f.id)}</p>
                    <p class="text-[11px] text-cocoaSoft">${new Date(f.date).toLocaleString("fr-FR")}</p>
                    ${f.refInvoice ? `<p class="text-[11px] text-red-700 font-bold">Annule la facture ${escapeHTML(f.refInvoice)}</p>` : ""}
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 py-3 text-[11px]">
                <div><span class="block text-[10px] font-extrabold uppercase text-cocoaSoft">Client</span><strong class="text-darkChoc">${escapeHTML(f.client)}</strong><br><span class="text-cocoaSoft">${escapeHTML(f.clientContact || "")}</span></div>
                <div class="text-right"><span class="block text-[10px] font-extrabold uppercase text-cocoaSoft">Commande</span><strong class="font-mono text-darkChoc">${escapeHTML(f.orderRef)}</strong><br><span class="text-cocoaSoft">Paiement : ${escapeHTML(f.payment || "—")}</span></div>
            </div>
            <table class="w-full text-[11px] border-collapse">
                <thead><tr class="bg-vanillaDark text-darkChoc"><th class="text-left py-1.5 px-2">Désignation</th><th class="py-1.5 px-2">Qté</th><th class="text-right py-1.5 px-2">P.U. TTC</th><th class="py-1.5 px-2">Groupe</th><th class="text-right py-1.5 px-2">Montant TTC</th></tr></thead>
                <tbody>${f.lines.map(l => `<tr class="border-b border-beech/25"><td class="py-1.5 px-2">${escapeHTML(l.name)}</td><td class="text-center py-1.5 px-2">${l.qty}</td><td class="text-right py-1.5 px-2">${fmt(l.unitTtc)}</td><td class="text-center py-1.5 px-2 font-bold">${f.group}</td><td class="text-right py-1.5 px-2 font-bold">${fmt(l.qty * l.unitTtc)}</td></tr>`).join("")}</tbody>
            </table>
            <div class="flex flex-wrap items-end justify-between gap-4 mt-4">
                <div class="flex items-end gap-3">
                    <div class="w-24 h-24 bg-white">${qrSvg(qrText)}</div>
                    <div class="text-[10px] text-cocoaSoft space-y-0.5">
                        <p class="font-extrabold text-darkChoc uppercase">Éléments de sécurité DGI</p>
                        <p>Code MECeF/DGI : <span class="font-mono text-darkChoc">${escapeHTML(f.security.codeMecef)}</span></p>
                        <p>NIM : <span class="font-mono text-darkChoc">${escapeHTML(f.security.nim)}</span></p>
                        <p>Compteurs : <span class="font-mono text-darkChoc">${escapeHTML(f.security.counters)}</span></p>
                        <p>Heure MECeF : ${escapeHTML(f.security.stamp)}</p>
                    </div>
                </div>
                <div class="text-[11px] min-w-[210px] space-y-1">
                    <div class="flex justify-between"><span>Total HT (groupe ${f.group})</span><strong>${fmt(f.ht)}</strong></div>
                    <div class="flex justify-between"><span>TVA ${Math.round((TAX_GROUPS[f.group]?.rate || 0) * 100)} %</span><strong>${fmt(f.tva)}</strong></div>
                    <div class="flex justify-between text-sm font-extrabold text-darkChoc border-t-2 border-darkChoc pt-1"><span>Total TTC</span><span>${fmt(f.totalTtc)}</span></div>
                </div>
            </div>
            <p class="mt-4 text-[10px] ${f.security.mode === "simulation" ? "text-red-700 font-bold" : "text-cocoaSoft"}">
                ${f.security.mode === "simulation"
                    ? "Document de démonstration : les éléments de sécurité ci-dessus sont fictifs. Une facture n'est valable qu'après certification par la plateforme e-MECeF de la DGI."
                    : "Facture certifiée e-MECeF. Vérifiable avec l'application MECeF Bénin."}
            </p>
        </div>`;
    const wa = waLink(f.clientContact, `Bonjour ${f.client.split(" ")[0]}, voici votre ${f.type === "FA" ? "facture d'avoir" : "facture"} ${f.id} de ${appState.tenant.name} : ${fmt(f.totalTtc)} TTC (commande ${f.orderRef}).`);
    const waBtn = document.getElementById("invoice-wa-btn");
    waBtn.classList.toggle("hidden", !wa);
    if (wa) waBtn.href = wa;
    const avoirBtn = document.getElementById("invoice-avoir-btn");
    const canAvoir = f.type === "FV" && !appState.invoices.some(x => x.type === "FA" && x.refInvoice === f.id) && appState.isAdminAuthenticated;
    avoirBtn.classList.toggle("hidden", !canAvoir);
    avoirBtn.onclick = () => createCreditNote(f.id);
    const m = document.getElementById("invoice-modal");
    m.classList.remove("hidden");
    m.classList.add("flex");
}
function closeInvoice() {
    const m = document.getElementById("invoice-modal");
    m.classList.add("hidden");
    m.classList.remove("flex");
}

function renderInvoices() {
    const k = document.getElementById("bo-inv-kpis");
    if (!k) return;
    const b = appState.billing || {};
    document.getElementById("inv-ifu").value = b.ifu || "";
    document.getElementById("inv-rccm").value = b.rccm || "";
    document.getElementById("inv-address").value = b.address || "";
    document.getElementById("inv-regime").value = b.regime || "B";
    document.getElementById("inv-auto").checked = b.auto !== false;
    document.getElementById("inv-ifu-warning").classList.toggle("hidden", billingReady());

    const inv = appState.invoices || [];
    const fv = inv.filter(f => f.type === "FV");
    const net = inv.reduce((s, f) => s + f.totalTtc, 0);
    const tva = inv.reduce((s, f) => s + f.tva, 0);
    const invoiced = new Set(fv.map(f => f.orderRef));
    const pending = appState.orders.filter(o => !invoiced.has(o.ref) && o.payment !== "Devis Agenda");
    k.innerHTML =
        kpiCard("Factures émises", String(fv.length)) +
        kpiCard("Total facturé TTC (net d'avoirs)", convertFromFcfa(net), "text-sage") +
        kpiCard("TVA collectée", convertFromFcfa(tva), "text-caramel") +
        kpiCard("Commandes à facturer", String(pending.length), pending.length ? "text-red-600" : "text-sage");

    document.getElementById("bo-inv-pending").innerHTML = pending.map(o => `
        <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-vanilla border border-beech/30 text-xs">
            <div><span class="font-mono font-bold">${escapeHTML(o.ref)}</span> <span class="text-cocoaSoft ml-1">${escapeHTML(clientName(o.client))}</span></div>
            <div class="flex items-center gap-2"><strong class="text-caramel">${convertFromFcfa(o.amountFcfa)}</strong>
            <button type="button" onclick="createInvoiceForOrder('${escapeHTML(o.ref)}'); renderInvoices(); renderBackOfficeAll();" class="bg-darkChoc hover:bg-caramel text-white font-bold px-3 py-1.5 rounded-lg text-[11px]">Émettre la facture</button></div>
        </div>`).join("") || `<p class="text-xs text-cocoaSoft">Toutes les commandes sont facturées.</p>`;

    document.getElementById("bo-inv-list").innerHTML = inv.map(f => `
        <tr class="border-b border-vanillaDark">
            <td class="py-2 px-2 font-mono font-bold ${f.type === "FA" ? "text-red-700" : "text-darkChoc"}">${escapeHTML(f.id)}</td>
            <td class="py-2 px-2 text-cocoaSoft">${new Date(f.date).toLocaleDateString("fr-FR")}</td>
            <td class="py-2 px-2">${escapeHTML(f.client)}</td>
            <td class="py-2 px-2 font-mono text-cocoaSoft">${escapeHTML(f.orderRef)}</td>
            <td class="py-2 px-2 text-right font-extrabold ${f.totalTtc < 0 ? "text-red-700" : "text-caramel"}">${convertFromFcfa(f.totalTtc)}</td>
            <td class="py-2 px-2 text-right"><button type="button" onclick="openInvoice('${escapeHTML(f.id)}')" class="text-[11px] font-bold text-caramel underline">Voir</button></td>
        </tr>`).join("") || `<tr><td colspan="6" class="py-5 text-center text-cocoaSoft">Aucune facture émise.</td></tr>`;
}

function saveBilling(e) {
    e.preventDefault();
    const ifu = document.getElementById("inv-ifu").value.replace(/\s/g, "");
    if (ifu && !/^\d{13}$/.test(ifu)) { showToast("L'IFU doit comporter 13 chiffres.", "info"); return; }
    appState.billing = {
        ifu, rccm: document.getElementById("inv-rccm").value.trim(),
        address: document.getElementById("inv-address").value.trim(),
        regime: document.getElementById("inv-regime").value,
        auto: document.getElementById("inv-auto").checked
    };
    saveAppState();
    renderInvoices();
    showToast("Paramètres de facturation enregistrés.", "success");
}

function invoiceForOrder(ref) {
    return (appState.invoices || []).find(f => f.orderRef === ref && f.type === "FV") || null;
}
