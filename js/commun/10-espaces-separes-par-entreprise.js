// AYO — ESPACES SÉPARÉS PAR ENTREPRISE
// ==================== ESPACES SÉPARÉS PAR ENTREPRISE ====================
// Chaque entreprise a ses propres données. Une nouvelle entreprise démarre avec un site vierge.
const BUILTIN_PASTRIES = PASTRIES.slice();
const WS_KEYS = ["tenant", "activeFormat", "builtinCatalog", "orders", "stocks", "campaigns", "reviews", "tickets", "notifications",
    "socialFeedback", "catalog", "customProducts", "purchases", "gateways", "notifSettings", "podiumPastryId", "cart", "selectedAgendaDay", "brandIdentity", "billing", "invoices", "company"];

function pickWorkspace(src) {
    const out = {};
    WS_KEYS.forEach(k => { out[k] = src[k]; });
    return JSON.parse(JSON.stringify(out));
}
function blankWorkspace(acc) {
    const b = acc.business || {};
    return {
        tenant: { name: b.name || "Mon entreprise", city: b.city || "", specialty: b.specialty || "" },
        activeFormat: b.format || 1, builtinCatalog: false, brandIdentity: "delices",
        orders: [], stocks: [], campaigns: [], reviews: [], tickets: [], notifications: [], socialFeedback: [],
        catalog: {}, customProducts: [], purchases: [], gateways: {},
        notifSettings: { whatsapp: true, sms: true, email: false },
        podiumPastryId: null, cart: [], selectedAgendaDay: 24,
        billing: { ifu: "", rccm: "", address: b.city || "", regime: "B", auto: true }, invoices: [],
        company: { phone: acc.phone || "", whatsapp: acc.phone || "", email: acc.email || "", links: [] }
    };
}
function switchWorkspace(id, acc) {
    if (appState.activeWorkspace === id) return;
    appState.workspaces = appState.workspaces || {};
    if (appState.activeWorkspace) appState.workspaces[appState.activeWorkspace] = pickWorkspace(appState);
    const data = appState.workspaces[id] || (id === "demo" ? pickWorkspace(getDefaultState()) : blankWorkspace(acc));
    Object.assign(appState, JSON.parse(JSON.stringify(data)));
    appState.activeWorkspace = id;
    appState.promoApplied = false;
    appState.promoCode = "";
    appState.activeCategory = "all";
    carouselPos = 0;
    delete appState.workspaces[id];
}
function rebuildCatalog() {
    PASTRIES.length = 0;
    if (appState.builtinCatalog !== false) PASTRIES.push(...BUILTIN_PASTRIES);
}
function emptyShopHtml(compact = false) {
    const cta = appState.isAdminAuthenticated
        ? `<button type="button" onclick="goToProService('account')" class="mt-4 bg-darkChoc hover:bg-caramel text-white font-extrabold px-5 py-2.5 rounded-full text-xs">Ajouter mes créations</button>`
        : "";
    return `<div class="${compact ? "py-12" : "absolute inset-0"} flex flex-col items-center justify-center text-center p-6">
        <div class="w-14 h-14 rounded-2xl bg-white border border-beech/40 flex items-center justify-center text-2xl shadow-sm">🧁</div>
        <h3 class="font-serif text-xl font-bold text-darkChoc mt-3">Votre vitrine est prête</h3>
        <p class="text-xs text-cocoaSoft max-w-sm mt-1">Aucune création pour l'instant. Ajoutez vos produits et vos photos : ils apparaîtront ici.</p>
        ${cta}
    </div>`;
}
