// AYO — ÉTAPE 2 : GESTION DU COMPTE (ACHATS, STOCK, PRODUITS, PROFIL)
// ==================== ÉTAPE 2 : GESTION DU COMPTE (ACHATS, STOCK, PRODUITS, PROFIL) ====================
const CATEGORY_LABELS = { entremets: "Entremets Signature", tartes: "Tartes Fines", viennoiseries: "Viennoiseries", coffrets: "Coffrets Prestige" };
const CATEGORY_ART = { entremets: 1, tartes: 2, viennoiseries: 4, coffrets: 5 };
const DEFAULT_UNIT_COSTS = [6500, 12000, 1500, 9000, 15000, 800];

function sizesFromPrice(price) {
    const r = v => Math.round(v / 100) * 100;
    return [{ label: "Individuel", price: r(price) }, { label: "4 parts", price: r(price * 3.4) }, { label: "6 parts", price: r(price * 4.9) }, { label: "8 parts", price: r(price * 6.3) }];
}
function buildCustomPastry(c) {
    return {
        id: c.id, name: c.name, category: c.category, catLabel: CATEGORY_LABELS[c.category] || "Créations",
        leadTime: c.leadTime, desc: c.desc || "Création maison.", allergens: c.allergens || "À préciser",
        ingredientIdx: 0, recipeBom: [], materialCost: Math.round(c.price * 0.35), laborCost: Math.round(c.price * 0.15),
        images: c.image ? [c.image] : PASTRY_ART[CATEGORY_ART[c.category] || 1].slice(),
        sizes: sizesFromPrice(c.price), custom: true
    };
}
function syncCustomProducts() {
    (appState.customProducts || []).forEach(c => {
        if (PASTRIES.some(p => p.id === c.id)) return;
        const p = buildCustomPastry(c);
        PASTRIES.push(p);
        PASTRY_BASE[p.id] = { leadTime: p.leadTime, prices: p.sizes.map(s => s.price), images: p.images.slice() };
    });
}
function unitCost(st, idx) { return Number(st.unitCost) || DEFAULT_UNIT_COSTS[idx] || 0; }

function renderAccount() {
    const k = document.getElementById("bo-acc-kpis");
    if (!k) return;
    const acc = currentAccount();
    const spend = (appState.purchases || []).reduce((s, x) => s + x.total, 0);
    const stockValue = appState.stocks.reduce((s, st, i) => s + st.qty * unitCost(st, i), 0);
    const revenue = appState.orders.reduce((s, o) => s + o.amountFcfa, 0);
    k.innerHTML =
        kpiCard("Achats enregistrés", convertFromFcfa(spend), "text-caramel") +
        kpiCard("Valeur du stock", convertFromFcfa(stockValue)) +
        kpiCard("Produits en vitrine", String(PASTRIES.filter(p => p.available !== false).length), "text-sage") +
        kpiCard("Chiffre d'affaires", convertFromFcfa(revenue), "text-sage");

    // Profil
    if (acc) {
        document.getElementById("acc-name").value = acc.name;
        document.getElementById("acc-email").value = acc.email;
        document.getElementById("acc-phone").value = acc.phone;
        document.getElementById("acc-biz-name").value = appState.tenant.name;
        document.getElementById("acc-biz-city").value = appState.tenant.city;
        document.getElementById("acc-biz-spec").value = appState.tenant.specialty;
        document.getElementById("acc-2fa").checked = !!acc.twoFA;
        document.getElementById("acc-demo-note").classList.toggle("hidden", !acc.demo);
    }

    // Achats
    const sel = document.getElementById("pu-item");
    const prev = sel.value;
    sel.innerHTML = appState.stocks.map((st, i) => `<option value="${i}">${escapeHTML(st.name)} (${escapeHTML(st.unit)})</option>`).join("") + `<option value="new">+ Nouvel article…</option>`;
    if (prev && [...sel.options].some(o => o.value === prev)) sel.value = prev;
    toggleNewItemFields();
    if (!document.getElementById("pu-date").value) document.getElementById("pu-date").value = new Date().toISOString().slice(0, 10);

    document.getElementById("bo-purchases").innerHTML = (appState.purchases || []).slice(0, 12).map(x => `
        <tr>
            <td class="py-2 px-2 text-cocoaSoft">${escapeHTML(x.date)}</td>
            <td class="py-2 px-2 font-bold text-darkChoc">${escapeHTML(x.item)}</td>
            <td class="py-2 px-2">${x.qty} ${escapeHTML(x.unit)}</td>
            <td class="py-2 px-2 text-cocoaSoft">${escapeHTML(x.supplier || "—")}</td>
            <td class="py-2 px-2 text-right font-extrabold text-caramel">${convertFromFcfa(x.total)}</td>
        </tr>`).join("") || `<tr><td colspan="5" class="py-4 text-center text-cocoaSoft">Aucun achat enregistré.</td></tr>`;

    document.getElementById("bo-acc-stock").innerHTML = appState.stocks.map((st, i) => {
        const low = st.qty <= st.minAlert;
        return `<div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-vanilla border ${low ? "border-red-300" : "border-beech/30"} text-xs">
            <span class="font-bold text-darkChoc">${escapeHTML(st.name)}</span>
            <span class="text-right"><strong class="${low ? "text-red-600" : "text-darkChoc"}">${st.qty} ${escapeHTML(st.unit)}</strong><span class="block text-[10px] text-cocoaSoft">${convertFromFcfa(st.qty * unitCost(st, i))}</span></span>
        </div>`;
    }).join("");

    // Produits ajoutés
    const mine = PASTRIES.filter(p => p.custom);
    document.getElementById("bo-my-products").innerHTML = mine.map(p => `
        <div class="flex items-center gap-3 p-2.5 rounded-xl bg-vanilla border border-beech/30 text-xs">
            <img src="${p.images[0]}" alt="" class="w-12 h-10 rounded-lg object-cover">
            <div class="flex-1"><strong class="block text-darkChoc">${escapeHTML(p.name)}</strong><span class="text-cocoaSoft">${escapeHTML(p.catLabel)} • ${convertFromFcfa(p.sizes[0].price)} • ${escapeHTML(p.leadTime)}</span></div>
            <button type="button" onclick="deleteCustomProduct(${p.id})" class="text-red-600 font-bold text-[11px] px-2 py-1 rounded-lg hover:bg-red-50">Supprimer</button>
        </div>`).join("") || `<p class="text-xs text-cocoaSoft">Aucun produit ajouté pour l'instant. Vos créations apparaîtront ici et sur votre site.</p>`;
}

function toggleNewItemFields() {
    const isNew = document.getElementById("pu-item").value === "new";
    document.getElementById("pu-new-fields").classList.toggle("hidden", !isNew);
    document.getElementById("pu-new-name").required = isNew;
}

function addPurchase(e) {
    e.preventDefault();
    const sel = document.getElementById("pu-item").value;
    const qty = parseFloat(document.getElementById("pu-qty").value);
    const total = Math.round(parseFloat(document.getElementById("pu-total").value));
    const supplier = document.getElementById("pu-supplier").value.trim();
    const date = document.getElementById("pu-date").value || new Date().toISOString().slice(0, 10);
    if (!(qty > 0) || !(total > 0)) { showToast("Indiquez une quantité et un montant valides.", "info"); return; }
    let idx;
    if (sel === "new") {
        const name = document.getElementById("pu-new-name").value.trim();
        const unit = document.getElementById("pu-new-unit").value;
        if (!name) { showToast("Donnez un nom à l'article.", "info"); return; }
        appState.stocks.push({ name, qty: 0, max: Math.max(1, Math.ceil(qty * 2)), unit, minAlert: Math.round(qty * 0.2 * 10) / 10, unitCost: Math.round(total / qty) });
        idx = appState.stocks.length - 1;
    } else {
        idx = parseInt(sel, 10);
    }
    const st = appState.stocks[idx];
    const prevValue = st.qty * unitCost(st, idx);
    st.qty = Number((st.qty + qty).toFixed(2));
    st.unitCost = Math.round((prevValue + total) / st.qty);
    if (st.qty > st.max) st.max = Math.ceil(st.qty * 1.2);
    appState.purchases = appState.purchases || [];
    appState.purchases.unshift({ id: `ACH-${Date.now().toString(36).toUpperCase()}`, date, supplier, item: st.name, qty, unit: st.unit, total });
    saveAppState();
    e.target.reset();
    document.getElementById("pu-date").value = new Date().toISOString().slice(0, 10);
    renderBackOfficeAll();
    renderPodiumShowcase();
    showToast(`Achat enregistré : +${qty} ${st.unit} de ${st.name} ajoutés au stock.`, "success");
}

async function addCustomProduct(e) {
    e.preventDefault();
    const name = document.getElementById("np-name").value.trim();
    const category = document.getElementById("np-cat").value;
    const price = Math.round(parseFloat(document.getElementById("np-price").value));
    const leadTime = document.getElementById("np-lead").value;
    const desc = document.getElementById("np-desc").value.trim();
    const file = document.getElementById("np-photo").files[0];
    if (!name || !(price > 0)) { showToast("Nom et prix sont obligatoires.", "info"); return; }
    let image = "";
    if (file) {
        try { image = await readImageFile(file); }
        catch (err) { showToast("Photo non reconnue : une illustration par défaut sera utilisée.", "info"); }
    }
    const id = Math.max(100, ...PASTRIES.map(p => p.id)) + 1;
    appState.customProducts = appState.customProducts || [];
    appState.customProducts.push({ id, name, category, price, leadTime, desc, image });
    e.target.reset();
    afterCatalogChange(`« ${name} » est maintenant en vente sur votre site.`);
}

function deleteCustomProduct(id) {
    appState.customProducts = (appState.customProducts || []).filter(c => c.id !== id);
    const i = PASTRIES.findIndex(p => p.id === id);
    if (i >= 0) PASTRIES.splice(i, 1);
    delete PASTRY_BASE[id];
    delete appState.catalog[id];
    appState.cart = appState.cart.filter(c => c.pastryId !== id);
    if (appState.podiumPastryId === id) appState.podiumPastryId = PASTRIES[0]?.id ?? null;
    afterCatalogChange("Produit supprimé du site.");
}

function saveProfile(e) {
    e.preventDefault();
    const acc = currentAccount();
    if (!acc) return;
    acc.name = document.getElementById("acc-name").value.trim() || acc.name;
    acc.phone = document.getElementById("acc-phone").value.trim() || acc.phone;
    acc.twoFA = document.getElementById("acc-2fa").checked;
    const biz = {
        name: document.getElementById("acc-biz-name").value.trim() || appState.tenant.name,
        city: document.getElementById("acc-biz-city").value.trim() || appState.tenant.city,
        specialty: document.getElementById("acc-biz-spec").value.trim() || appState.tenant.specialty
    };
    acc.business = { ...(acc.business || {}), ...biz, format: appState.activeFormat };
    appState.tenant = { ...biz };
    saveAppState();
    updateBrandHeaderUI();
    updateAdminAccessUI();
    renderGallery();
    showToast("Profil de l'entreprise enregistré.", "success");
}
