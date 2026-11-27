// AYO — BACK-OFFICE : services présentés dans le style delice.ca
// ==================== BACK-OFFICE : services présentés dans le style delice.ca ====================
const BO_SVC = {
    gallery:   { icon: "images",               tint: "#F4B9C2", title: "Galerie & mon site" },
    catalog:   { icon: "book-open",            tint: "#F6D99A", title: "Catalogue" },
    company:   { icon: "building-2",           tint: "#A8D0E6", title: "Entreprise & réseaux" },
    account:   { icon: "wallet",               tint: "#B9DCC3", title: "Achats & produits" },
    stocks:    { icon: "package",              tint: "#F7C59F", title: "Stock" },
    invoices:  { icon: "receipt",              tint: "#C9B6E4", title: "Facturation" },
    costs:     { icon: "calculator",           tint: "#A8D0E6", title: "Coûts & marges" },
    campaigns: { icon: "megaphone",            tint: "#F2A7A0", title: "Publications" },
    orders:    { icon: "clipboard-list",       tint: "#F6D99A", title: "Commandes" },
    payments:  { icon: "credit-card",          tint: "#B9DCC3", title: "Paiements" },
    notifs:    { icon: "bell",                 tint: "#F4B9C2", title: "Notifications clients" },
    feedback:  { icon: "message-square-heart", tint: "#D8E7A8", title: "Avis clients" },
    tickets:   { icon: "calendar-check",       tint: "#C9B6E4", title: "Agenda & devis" }
};
const BO_GROUPS = [
    { n: 1, over: "Étape 1", title: "Mon site", lead: "Ce que vos clients voient : le modèle de votre boutique et votre carte.", keys: ["gallery", "catalog"] },
    { n: 2, over: "Étape 2", title: "Gestion du compte", lead: "Ce qui se passe en coulisses : achats, stock, factures et marges.", keys: ["company", "account", "stocks", "invoices", "costs"] },
    { n: 3, over: "Étape 3", title: "Publicité & services", lead: "Ce qui fait venir et revenir vos clients.", keys: ["orders", "campaigns", "payments", "notifs", "feedback", "tickets"] }
];
// Le chiffre qui résume chaque service, calculé à partir des vraies données
function boFigure(key) {
    const n = (arr) => (Array.isArray(arr) ? arr.length : 0);
    const plural = (k, one, many) => `${k} ${k > 1 ? many : one}`;
    const todo = appState.orders.filter(o => o.status !== "Livrée").length;
    const low = appState.stocks.filter(s => s.qty <= s.minAlert).length;
    switch (key) {
        case "gallery": return { v: String(appState.activeFormat || 1), l: "format choisi" };
        case "catalog": return { v: String(PASTRIES.length), l: PASTRIES.length > 1 ? "produits" : "produit" };
        case "company": { const k = (appState.company?.links || []).length; return { v: String(k), l: k > 1 ? "sites connectés" : "site connecté" }; }
        case "account": return { v: String(n(appState.purchases)), l: n(appState.purchases) > 1 ? "achats" : "achat" };
        case "stocks": return { v: String(low), l: low ? "à recommander" : "alerte" };
        case "invoices": return { v: String(n(appState.invoices)), l: n(appState.invoices) > 1 ? "factures" : "facture" };
        case "costs": return { v: document.getElementById("bo-kpi-margin")?.textContent || "—", l: "marge moyenne" };
        case "campaigns": return { v: String(n(appState.campaigns)), l: n(appState.campaigns) > 1 ? "publications" : "publication" };
        case "orders": return { v: String(todo), l: "à traiter" };
        case "payments": { const k = [...LOCAL_PAYMENT_METHODS, ...INTL_PAYMENT_METHODS].filter(m => (appState.gateways || {})[m] !== false).length; return { v: String(k), l: k > 1 ? "moyens actifs" : "moyen actif" }; }
        case "notifs": return { v: String(n(appState.notifications)), l: n(appState.notifications) > 1 ? "messages" : "message" };
        case "feedback": return { v: String(n(appState.reviews)), l: n(appState.reviews) > 1 ? "avis" : "avis" };
        case "tickets": return { v: String(n(appState.tickets)), l: n(appState.tickets) > 1 ? "demandes" : "demande" };
        default: return { v: "", l: "" };
    }
}
const DL_WAVE = `<svg class="bo-wave" viewBox="0 0 420 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12 Q 52 2 105 12 T 210 12 T 315 12 T 420 12"/><path d="M0 22 Q 52 12 105 22 T 210 22 T 315 22 T 420 22"/></svg>`;
const DL_CORNER = `<svg class="bo-corner" viewBox="0 0 200 200" aria-hidden="true"><path d="M200 0v120c-30-8-48-34-50-62-36 6-68-14-76-46C59 10 46 4 34 0z"/></svg>`;

function renderBoHome() {
    const panel = document.getElementById("bo-panel-home");
    if (!panel) return;
    const acc = (appState.accounts || []).find(a => a.email === appState.currentAccountEmail);
    const first = (acc?.name || "").split(" ")[0];
    const todo = appState.orders.filter(o => o.status !== "Livrée").length;
    const low = appState.stocks.filter(s => s.qty <= s.minAlert).length;
    const revenue = appState.orders.reduce((s, o) => s + (o.amountFcfa || 0), 0);
    const stamps = [
        { v: todo, f: x => String(Math.round(x)), l: todo > 1 ? "commandes à traiter" : "commande à traiter", c: "var(--dl-primary)", go: "orders" },
        { v: revenue, f: x => convertFromFcfa(x), l: "de ventes", c: "var(--dl-dark)", go: "orders", small: true },
        { v: low, f: x => String(Math.round(x)), l: low ? "produits à recommander" : "alerte de stock", c: "#A0522D", go: "stocks" },
        { v: (appState.reviews || []).length, f: x => String(Math.round(x)), l: "avis clients", c: "#2E6F40", go: "feedback" }
    ];
    panel.innerHTML = `
        <section class="bo-hero">
            ${DL_CORNER}
            <span class="dl-overline">Bonjour${first ? ` ${escapeHTML(first)}` : ""}</span>
            <h2 class="bo-h1">Votre boutique aujourd'hui</h2>
            ${DL_WAVE}
            <p class="bo-lead">${todo ? `${todo} commande${todo > 1 ? "s attendent" : " attend"} votre réponse.` : "Toutes vos commandes sont traitées."} ${low ? `${low} produit${low > 1 ? "s sont" : " est"} sous le seuil de stock.` : ""}</p>
            <div class="bo-stamps">
                ${stamps.map((s, i) => `<button type="button" class="bo-stamp${s.small ? " -small" : ""}" style="--c:${s.c};--i:${i}" onclick="switchBoTab('${s.go}')"><b data-v="${s.v}">${s.f(0)}</b><span>${escapeHTML(s.l)}</span></button>`).join("")}
            </div>
        </section>
        ${BO_GROUPS.map(g => `
        <section class="bo-group-sec" style="--g:${g.n}">
            <div class="bo-group-head">
                <span class="bo-group-num">${g.n}</span>
                <div>
                    <span class="dl-overline">${g.over}</span>
                    <h3 class="bo-h2">${g.title}</h3>
                    <p class="bo-lead">${g.lead}</p>
                </div>
            </div>
            <div class="bo-rail">
                ${g.keys.map((k, i) => {
                    const m = BO_SVC[k], f = boFigure(k);
                    return `<article class="bo-svc" style="--tint:${m.tint};--i:${i}">
                        <button type="button" class="bo-svc-hit" onclick="switchBoTab('${k}')" aria-label="Ouvrir ${escapeHTML(m.title)}"></button>
                        <div class="bo-svc-disc"><i data-lucide="${m.icon}"></i></div>
                        <span class="bo-svc-stamp"><b>${escapeHTML(f.v)}</b><em>${escapeHTML(f.l)}</em></span>
                        <h4>${escapeHTML(m.title)}</h4>
                        <p>${escapeHTML((BO_META[k] || ["", ""])[1])}</p>
                        <span class="dl-btn bo-svc-btn">Ouvrir</span>
                    </article>`;
                }).join("")}
            </div>
        </section>`).join("")}`;
    refreshIcons();
    // apparition et décompte des tampons
    requestAnimationFrame(() => panel.querySelectorAll(".bo-stamp b").forEach((b, i) => {
        const s = stamps[i]; if (s) countUp(b, s.v, s.f);
    }));
    if ("IntersectionObserver" in window && !REDUCED_MOTION) {
        const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
        panel.querySelectorAll(".bo-group-sec, .bo-hero").forEach(el => io.observe(el));
    } else panel.querySelectorAll(".bo-group-sec, .bo-hero").forEach(el => el.classList.add("in"));
}

// En-tête de chaque service : surtitre, grand titre, vague et tampon
const _renderBoPageHeader = renderBoPageHeader;
renderBoPageHeader = function (tabKey) {
    const head = document.getElementById("bo-head");
    if (tabKey === "home") { if (head) head.classList.add("hidden"); return; }
    if (head) head.classList.remove("hidden");
    _renderBoPageHeader(tabKey);
    const meta = BO_META[tabKey] || ["Espace entreprise", ""];
    const crumb = document.getElementById("bo-crumb");
    if (crumb) crumb.textContent = meta[0].replace(/^[①②③]\s*/, "");
    const t = document.getElementById("bo-page-title");
    if (t) t.textContent = BO_SVC[tabKey]?.title || document.querySelector(`#bo-btn-${tabKey} span`)?.textContent || "";
    const st = document.getElementById("bo-page-stamp"), f = boFigure(tabKey);
    if (st) {
        st.style.display = f.v ? "" : "none";
        st.style.setProperty("--tint", BO_SVC[tabKey]?.tint || "#F6D99A");
        st.innerHTML = `<b>${escapeHTML(f.v)}</b><span>${escapeHTML(f.l)}</span>`;
        st.classList.remove("pop"); void st.offsetWidth; st.classList.add("pop");
    }
    head?.classList.remove("in"); void head?.offsetWidth; head?.classList.add("in");
};

// Le tableau de bord devient un onglet comme les autres
const _switchBoTab = switchBoTab;
switchBoTab = function (tabKey) {
    const home = document.getElementById("bo-panel-home"), homeBtn = document.getElementById("bo-btn-home");
    const kpis = document.querySelector("#bo-main .bo-kpis");
    if (tabKey === "home") {
        _switchBoTab("gallery"); // ferme les autres panneaux et garde la mémoire de session
        document.getElementById("bo-panel-gallery")?.classList.add("hidden");
        document.getElementById("bo-btn-gallery")?.classList.remove("is-active");
        if (typeof currentBoTab !== "undefined") { currentBoTab = "home"; if (typeof saveBizSession === "function") saveBizSession(); }
        home?.classList.remove("hidden", "bo-panel-enter"); void home?.offsetWidth; home?.classList.add("bo-panel-enter");
        homeBtn?.classList.add("is-active");
        renderBoPageHeader("home");
        kpis?.classList.add("hidden");
        renderBoHome();
        return;
    }
    home?.classList.add("hidden");
    homeBtn?.classList.remove("is-active");
    kpis?.classList.add("hidden");
    return _switchBoTab(tabKey);
};
const _renderBackOfficeAll = renderBackOfficeAll;
renderBackOfficeAll = function () {
    const r = _renderBackOfficeAll();
    if (!document.getElementById("bo-panel-home")?.classList.contains("hidden")) renderBoHome();
    return r;
};
