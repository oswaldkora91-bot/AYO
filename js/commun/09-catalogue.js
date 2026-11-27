// AYO — CATALOGUE
// ==================== CATALOGUE ====================
const PASTRY_BASE = Object.fromEntries(PASTRIES.map(p => [p.id, { leadTime: p.leadTime, prices: p.sizes.map(s => s.price), images: p.images.slice() }]));

function applyCatalogOverrides() {
    PASTRIES.forEach(p => {
        const base = PASTRY_BASE[p.id];
        const o = appState.catalog[p.id] || {};
        p.available = o.available !== false;
        p.leadTime = o.leadTime || base.leadTime;
        p.images = o.image ? [o.image, ...base.images] : base.images.slice();
        p.sizes.forEach((s, i) => { s.price = Number(o.prices?.[i]) > 0 ? Number(o.prices[i]) : base.prices[i]; });
    });
}

function catalogEntry(id) {
    if (!appState.catalog[id]) appState.catalog[id] = {};
    return appState.catalog[id];
}

function canProduce(p) {
    return (p.recipeBom || []).every(b => (appState.stocks[b.idx]?.qty || 0) >= b.qty);
}

function renderCatalogAdmin() {
    const box = document.getElementById("bo-catalog-list");
    if (!box) return;
    if (!PASTRIES.length) { box.innerHTML = `<p class="text-xs text-cocoaSoft p-4 rounded-2xl bg-vanilla border border-beech/30">Aucun produit. Ajoutez vos créations dans « Gestion du compte ».</p>`; return; }
    box.innerHTML = PASTRIES.map(p => {
        const matOk = canProduce(p);
        return `
        <div class="p-3.5 rounded-2xl border ${p.available ? "border-beech/35 bg-vanilla" : "border-red-200 bg-red-50/60"} grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div class="lg:col-span-4 flex items-center gap-3">
                <img src="${p.images[0]}" alt="${escapeHTML(p.name)}" class="w-16 h-12 rounded-xl object-cover border border-beech/30">
                <div>
                    <span class="text-[10px] font-extrabold uppercase text-caramel">${escapeHTML(p.catLabel)}</span>
                    <h4 class="font-serif text-sm font-bold text-darkChoc leading-tight">${escapeHTML(p.name)}</h4>
                    <span class="text-[10px] font-bold ${matOk ? "text-sage" : "text-red-600"}">${matOk ? "Matières disponibles" : "Matière insuffisante en stock"}</span>
                </div>
            </div>
            <div class="lg:col-span-2">
                <label class="block text-[10px] font-extrabold uppercase text-cocoaSoft mb-1">Délai</label>
                <select onchange="updateCatalogLead(${p.id}, this.value)" class="w-full px-2 py-1.5 rounded-lg bg-white border border-beech/35 text-xs font-bold">
                    ${LEAD_OPTIONS.map(l => `<option ${l === p.leadTime ? "selected" : ""}>${l}</option>`).join("")}
                </select>
            </div>
            <div class="lg:col-span-4 grid grid-cols-4 gap-1.5">
                ${p.sizes.map((s, i) => `
                <div>
                    <label class="block text-[9px] font-extrabold uppercase text-cocoaSoft mb-1">${escapeHTML(s.label)}</label>
                    <input type="number" min="100" step="100" value="${s.price}" onchange="updateCatalogPrice(${p.id}, ${i}, this.value)" class="w-full px-1.5 py-1.5 rounded-lg bg-white border border-beech/35 text-[11px] font-bold">
                </div>`).join("")}
            </div>
            <div class="lg:col-span-2 flex lg:justify-end">
                <button type="button" onclick="toggleAvailability(${p.id})" class="px-3 py-2 rounded-xl text-[11px] font-extrabold ${p.available ? "bg-sageLight text-sage" : "bg-red-100 text-red-700"}">
                    ${p.available ? "En vitrine" : "En rupture (masqué)"}
                </button>
            </div>
        </div>`;
    }).join("");
}

function afterCatalogChange(message) {
    saveAppState();
    applyCatalogOverrides();
    renderAll();
    if (message) showToast(message, "success");
}
function updateCatalogPrice(id, idx, value) {
    const v = Math.round(Number(value));
    if (!(v > 0)) { renderCatalogAdmin(); return; }
    const e = catalogEntry(id);
    e.prices = e.prices || [...PASTRY_BASE[id].prices];
    e.prices[idx] = v;
    afterCatalogChange("Prix mis à jour sur la vitrine.");
}
function updateCatalogLead(id, value) {
    catalogEntry(id).leadTime = value;
    afterCatalogChange("Délai de fabrication mis à jour.");
}
function toggleAvailability(id) {
    const e = catalogEntry(id);
    e.available = e.available === false;
    const p = PASTRIES.find(x => x.id === id);
    if (!e.available && appState.podiumPastryId === id) {
        const next = PASTRIES.find(x => x.id !== id && (appState.catalog[x.id]?.available !== false));
        if (next) appState.podiumPastryId = next.id;
    }
    afterCatalogChange(`${p.name} : ${e.available ? "remis en vitrine" : "marqué en rupture"}.`);
}
function resetCatalog() {
    appState.catalog = {};
    afterCatalogChange("Catalogue rétabli.");
}
