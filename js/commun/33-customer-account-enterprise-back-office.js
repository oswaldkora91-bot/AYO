// AYO — CUSTOMER ACCOUNT & ENTERPRISE BACK-OFFICE
// ==================== CUSTOMER ACCOUNT & ENTERPRISE BACK-OFFICE ====================
function renderCustomerAccount() {
    const initials = appState.customer.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "AS";
    document.getElementById("cust-avatar-badge").textContent = initials;
    document.getElementById("cust-profile-name").textContent = appState.customer.name;
    document.getElementById("cust-profile-meta").textContent = `${appState.customer.email} • ${appState.customer.phone}`;
    document.getElementById("cust-points-val").textContent = `${appState.customer.points} pts`;

    const mine = appState.notifications.filter(n => n.to.includes(appState.customer.phone) || clientName(n.to) === appState.customer.name);
    const cn = document.getElementById("customer-notifs-container");
    if (cn) cn.innerHTML = mine.map(n => `
        <div class="p-3.5 rounded-2xl bg-vanilla border border-beech/30 text-xs">
            <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-extrabold text-darkChoc">${escapeHTML(n.channel)} • ${escapeHTML(n.event)}</span>
                <span class="text-[10px] text-cocoaSoft">${escapeHTML(n.at)}</span>
            </div>
            <p class="text-cocoaSoft">${escapeHTML(n.message)}</p>
        </div>`).join("") || `<p class="text-xs text-cocoaSoft">Aucune notification pour le moment.</p>`;

    document.getElementById("customer-orders-container").innerHTML = appState.orders.map(o => `
        <div class="p-4 rounded-2xl bg-vanilla border border-beech/35 flex flex-wrap items-center justify-between gap-3">
            <div>
                <span class="font-mono font-extrabold text-xs text-darkChoc">${escapeHTML(o.ref)}</span>
                ${invoiceForOrder(o.ref) ? `<button type="button" onclick="openInvoice('${escapeHTML(invoiceForOrder(o.ref).id)}')" class="ml-2 text-[10px] font-bold text-caramel underline">Voir la facture</button>` : ""}
                <span class="ml-2 bg-sageLight text-sage text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">${o.status}</span>
                <p class="text-xs font-semibold text-darkChoc mt-1">${o.details}</p>
                <span class="text-[11px] text-cocoaSoft">${o.payment}</span>
            </div>
            <span class="font-serif text-lg font-extrabold text-caramel">${convertFromFcfa(o.amountFcfa)}</span>
        </div>`).join("");
}

let currentBoTab = "home";
function switchBoTab(tabKey) {
    currentBoTab = tabKey;
    if (typeof saveBizSession === "function") saveBizSession();
    ["gallery", "company", "account", "orders", "invoices", "catalog", "stocks", "payments", "notifs", "campaigns", "feedback", "costs", "tickets", "code"].forEach(k => {
        document.getElementById(`bo-panel-${k}`).classList.add("hidden");
        document.getElementById(`bo-btn-${k}`).classList.remove("is-active");
    });
    const boPanel = document.getElementById(`bo-panel-${tabKey}`);
    boPanel.classList.remove("hidden", "bo-panel-enter"); void boPanel.offsetWidth; boPanel.classList.add("bo-panel-enter");
    const activeItem = document.getElementById(`bo-btn-${tabKey}`);
    activeItem.classList.add("is-active");
    if (window.innerWidth < 1024 && activeItem.scrollIntoView) activeItem.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    renderBoPageHeader(tabKey);
    refreshIcons();
    if (tabKey === "code") selectCodeTab(activeCodeExplorerTab);
}

function renderBackOfficeAll() {
    if (APP_MODE !== "business") return;
    const totalRevenueFcfa = appState.orders.reduce((s, o) => s + o.amountFcfa, 0);
    const lowStockCount = appState.stocks.filter(st => st.qty <= st.minAlert).length;

    document.getElementById("topbar-orders-badge").textContent = appState.orders.length;
    countUp(document.getElementById("bo-kpi-revenue"), totalRevenueFcfa, v => convertFromFcfa(v));
    countUp(document.getElementById("bo-kpi-orders"), appState.orders.length, v => String(Math.round(v)));
    const ordersCount = document.getElementById("bo-orders-count");
    if (ordersCount) ordersCount.textContent = appState.orders.filter(o => o.status !== "Livrée").length;
    countUp(document.getElementById("bo-kpi-lowstock"), lowStockCount, v => String(Math.round(v)));
    const toDo = appState.orders.filter(o => o.status !== "Livrée").length;
    const hint = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };
    hint("bo-kpi-revenue-hint", appState.orders.length ? `Sur ${appState.orders.length} commande${appState.orders.length > 1 ? "s" : ""}` : "Aucune vente pour l'instant");
    hint("bo-kpi-orders-hint", toDo ? `${toDo} à traiter` : "Tout est livré");
    hint("bo-kpi-lowstock-hint", lowStockCount ? "Produits à réapprovisionner" : "Stock en ordre");

    // Orders table (Sanitized with escapeHTML)
    document.getElementById("bo-orders-tbody").innerHTML = appState.orders.length === 0
        ? `<tr><td colspan="6" class="py-8 text-center text-cocoaSoft">Aucune commande pour l'instant. Elles apparaîtront ici dès vos premières ventes.</td></tr>`
        : appState.orders.map((o, idx) => `
        <tr>
            <td class="py-3 px-3 font-mono font-bold">${escapeHTML(o.ref)}
                ${o.payment === "Devis Agenda" ? "" : (invoiceForOrder(o.ref)
                    ? `<button type="button" onclick="openInvoice('${escapeHTML(invoiceForOrder(o.ref).id)}')" class="inv-btn done">Facture ${escapeHTML(invoiceForOrder(o.ref).id)}</button>`
                    : `<button type="button" onclick="createInvoiceForOrder('${escapeHTML(o.ref)}'); renderBackOfficeAll();" class="inv-btn make">Émettre la facture</button>`)}
            </td>
            <td class="py-3 px-3 font-semibold">${escapeHTML(o.client)}</td>
            <td class="py-3 px-3 text-cocoaSoft">${escapeHTML(o.details)}</td>
            <td class="py-3 px-3 font-bold text-sage">${escapeHTML(o.payment)}</td>
            <td class="py-3 px-3 font-extrabold text-caramel">${convertFromFcfa(o.amountFcfa)}</td>
            <td class="py-3 px-3">
                <select onchange="this.dataset.st = this.value; updateBoOrderStatus(${idx}, this.value)" data-st="${escapeHTML(o.status)}" class="st-select" aria-label="Statut de la commande ${escapeHTML(o.ref)}">
                    <option value="En attente" ${o.status === "En attente" ? "selected" : ""}>En attente</option>
                    <option value="En préparation" ${o.status === "En préparation" ? "selected" : ""}>En préparation</option>
                    <option value="Prête" ${o.status === "Prête" ? "selected" : ""}>Prête</option>
                    <option value="Livrée" ${o.status === "Livrée" ? "selected" : ""}>Livrée</option>
                </select>
            </td>
        </tr>`).join("");

    // Stocks grid
    document.getElementById("bo-stocks-grid").innerHTML = appState.stocks.length === 0
        ? `<p class="col-span-full text-xs text-cocoaSoft p-4 rounded-2xl bg-vanilla border border-beech/30">Stock vide. Enregistrez vos achats dans « Gestion du compte » pour le remplir.</p>`
        : appState.stocks.map((st, idx) => {
        const pct = Math.min(100, Math.round((st.qty / st.max) * 100));
        const low = st.qty <= st.minAlert;
        return `
        <div class="p-4 rounded-2xl bg-vanilla border ${low ? 'border-red-400' : 'border-beech/35'} space-y-2.5">
            <div class="flex items-start justify-between gap-2">
                <h4 class="font-bold text-xs text-darkChoc">${escapeHTML(st.name)}</h4>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${low ? 'bg-red-100 text-red-700' : 'bg-sageLight text-sage'}">${low ? 'Stock Bas' : 'OK'}</span>
            </div>
            <div class="w-full h-2.5 bg-white rounded-full overflow-hidden border border-beech/25">
                <div class="h-full ${low ? 'bg-red-500' : 'bg-sage'}" style="width:${pct}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs">
                <span class="font-extrabold">${st.qty} / ${st.max} ${st.unit}</span>
                <div class="flex gap-1.5">
                    <button type="button" onclick="adjustStock(${idx}, -1)" class="w-6 h-6 rounded-lg bg-white border border-beech/35 font-bold">-</button>
                    <button type="button" onclick="adjustStock(${idx}, 3)" class="px-2 py-1 rounded-lg bg-darkChoc text-white text-[10px] font-bold">+3 ${st.unit}</button>
                </div>
            </div>
        </div>`;
    }).join("");

    renderCostsAndMargins();

    renderGallery();
    renderAccount();
    renderInvoices();
    renderCatalogAdmin();
    renderPayments();
    renderNotifications();
    renderCampaigns();
    renderFeedback();

    // Tickets list (Sanitized with escapeHTML)
    document.getElementById("bo-tickets-list").innerHTML = appState.tickets.length === 0
        ? `<p class="text-xs text-cocoaSoft">Aucune réservation ni demande de contact pour l'instant.</p>`
        : appState.tickets.map(t => `
        <div class="p-4 rounded-2xl bg-vanilla border border-beech/35 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
                <span class="font-mono font-bold">${escapeHTML(t.id)}</span>
                <span class="ml-2 bg-darkChoc text-brass text-[10px] font-bold px-2 py-0.5 rounded-full">${escapeHTML(t.type)}</span>
                <strong class="ml-2">${escapeHTML(t.from)}</strong>
                <p class="text-cocoaSoft mt-1">${escapeHTML(t.message)}</p>
            </div>
            ${(window.TICKET_STATUSES || {})[t.type] ? `<label class="sr-only" for="tk-${escapeHTML(t.id)}">Statut de ${escapeHTML(t.id)}</label>
            <select id="tk-${escapeHTML(t.id)}" onchange="setTicketStatus('${escapeHTML(t.id)}', this.value)" class="bg-sageLight text-sage font-extrabold px-3 py-1.5 rounded-full text-[11px] border-0 cursor-pointer">
                ${[...new Set([t.status, ...TICKET_STATUSES[t.type]])].map(st => `<option ${st === t.status ? "selected" : ""}>${escapeHTML(st)}</option>`).join("")}
            </select>` : `<span class="bg-sageLight text-sage font-extrabold px-3 py-1 rounded-full text-[10px]">${escapeHTML(t.status)}</span>`}
        </div>`).join("");
}

function updateBoOrderStatus(idx, status) {
    appState.orders[idx].status = status;
    notifyOrderStatus(appState.orders[idx]);
    saveAppState();
    renderCustomerAccount();
    renderNotifications();
    showToast(`Commande ${appState.orders[idx].ref} : ${status}`, "success");
}

function adjustStock(idx, delta) {
    const st = appState.stocks[idx];
    st.qty = Math.max(0, Math.min(st.max, Number((st.qty + delta).toFixed(1))));
    saveAppState();
    renderBackOfficeAll();
    renderPodiumShowcase();
}

function renderCostsAndMargins() {
    const promoSim = document.getElementById("sim-promo-15")?.checked || false;
    let avgMarginPct = 0;

    document.getElementById("bo-costs-grid").innerHTML = PASTRIES.map(p => {
        const saleFcfa = promoSim ? Math.round(p.sizes[0].price * 0.85) : p.sizes[0].price;
        const totalCostFcfa = p.materialCost + p.laborCost;
        const netMarginFcfa = saleFcfa - totalCostFcfa;
        const marginPct = saleFcfa > 0 ? Math.round((netMarginFcfa / saleFcfa) * 100) : 0;
        avgMarginPct += marginPct;
        const tightMargin = marginPct < 35;

        return `
        <div class="p-4 rounded-2xl bg-vanilla border ${tightMargin ? 'border-red-400' : 'border-beech/35'} space-y-2 text-xs">
            <div class="flex items-start justify-between gap-2">
                <h4 class="font-bold text-darkChoc">${escapeHTML(p.name)}</h4>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${tightMargin ? 'bg-red-100 text-red-700' : 'bg-sageLight text-sage'}">${marginPct}% marge</span>
            </div>
            <div class="flex justify-between text-cocoaSoft"><span>Prix vente (${promoSim ? '-15%' : 'base'}) :</span><strong class="text-darkChoc">${convertFromFcfa(saleFcfa)}</strong></div>
            <div class="flex justify-between text-cocoaSoft"><span>Matières + Main-d'œuvre :</span><span>${convertFromFcfa(totalCostFcfa)}</span></div>
            <div class="flex justify-between pt-1.5 border-t border-beech/25 font-extrabold">
                <span>Marge nette :</span>
                <span class="${tightMargin ? 'text-red-600' : 'text-sage'}">${convertFromFcfa(netMarginFcfa)}</span>
            </div>
        </div>`;
    }).join("");

    document.getElementById("bo-kpi-margin").textContent = PASTRIES.length ? `${Math.round(avgMarginPct / PASTRIES.length)}%` : "—";
}

function selectCodeTab(tab) {
    activeCodeExplorerTab = tab;
    document.querySelectorAll(".code-tab-btn").forEach(btn => {
        const active = btn.dataset.codeTab === tab;
        btn.className = active
            ? "code-tab-btn px-3.5 py-1.5 rounded-xl text-xs font-bold bg-darkChoc text-vanilla"
            : "code-tab-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-vanilla text-darkChoc border border-beech/35";
    });
    document.getElementById("code-explorer-box").value = tab === "sql" ? SQL_SNIPPET : PHP_SNIPPET;
}

function copyExplorerCode() {
    const box = document.getElementById("code-explorer-box");
    if (!box) return;
    box.select();
    document.execCommand("copy");
    showToast("Code copié dans le presse-papiers !", "success");
}

function showToast(message, type = "info") {
    if (window.__quietToast) return;
    const container = document.getElementById("toast-box");
    const el = document.createElement("div");
    const bg = type === "success" ? "bg-sage text-white" : "bg-darkChoc text-vanilla border border-brass/40";
    el.className = `${bg} px-4 py-3 rounded-2xl shadow-xl text-xs font-bold pointer-events-auto max-w-sm transition-all duration-300`;
    el.style.transform = "translateX(120%)"; el.style.opacity = "0";
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = "none"; el.style.opacity = "1"; }));
    setTimeout(() => { el.style.transform = "translateX(120%)"; el.style.opacity = "0"; }, 3100);
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function renderAll() {
    rebuildCatalog();
    syncCustomProducts();
    applyCatalogOverrides();
    const allBtn = document.querySelector('.cat-btn[data-cat="all"]');
    if (allBtn) allBtn.textContent = `Toutes les Créations (${PASTRIES.filter(p => p.available !== false).length})`;
    renderSocialBar();
    updateBrandHeaderUI();
    updateAdminAccessUI();
    updateCurrencyButtonsUI();
    renderMobilePills();
    carouselPos = Math.floor((getFilteredPastries().length - 1) / 2);
    applyFormat(appState.activeFormat, false);
    renderPodiumShowcase();
    renderAgendaCalendar();
    updateAgendaEstimate();
    renderReviewsSummary();
    renderFormatsAndTable();
    renderCustomerAccount();
    renderBackOfficeAll();
    renderCartUI();
    if (window.lucide) lucide.createIcons();
}

function syncStickyOffsets() {
    const h = document.querySelector("header")?.offsetHeight || 46;
    document.documentElement.style.setProperty("--hdr", `${h}px`);
    const sub = document.querySelector("#view-client > nav");
    if (sub) sub.style.top = `${h}px`;
}
window.addEventListener("resize", syncStickyOffsets);
