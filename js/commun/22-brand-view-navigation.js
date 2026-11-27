// AYO — BRAND & VIEW NAVIGATION
// ==================== BRAND & VIEW NAVIGATION ====================
function updateBrandHeaderUI() {
    const name = appState.tenant.name || "Délices Sucrés";
    const city = appState.tenant.city || "Cotonou — Haie Vive";
    const spec = appState.tenant.specialty || "Haute Pâtisserie Artisanale & Événements";
    const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "DS";

    const initialsBox = document.getElementById("brand-initials-box");
    const titleEl = document.getElementById("brand-display-title");
    const subEl = document.getElementById("brand-display-sub");
    const footerTitleEl = document.getElementById("footer-brand-title");
    const boTitleEl = document.getElementById("bo-header-title");

    if (initialsBox) initialsBox.textContent = initials;
    if (titleEl) titleEl.textContent = name;
    if (subEl) subEl.textContent = `${spec} • ${city}`;
    if (footerTitleEl) footerTitleEl.textContent = name;
    const shopTop = _getById("shop-top-name");
    if (shopTop) shopTop.textContent = name;
    if (APP_MODE === "shop") document.title = `${name} — Boutique en ligne`;
    if (boTitleEl) boTitleEl.textContent = name;
    const boAvatar = document.getElementById("bo-avatar");
    if (boAvatar) boAvatar.textContent = initials;
    const hero = document.getElementById("hero-main-title");
    if (hero) hero.innerHTML = `${escapeHTML(name)}<span class="shop-spec">${escapeHTML(spec)}</span>`;
    const heroSub = document.getElementById("hero-main-subtitle");
    if (heroSub && appState.activeWorkspace !== "demo") heroSub.textContent = "Découvrez nos créations, choisissez votre format et commandez en ligne. Nous confirmons chaque commande sur WhatsApp.";
    const facts = document.getElementById("shop-facts");
    if (facts) facts.innerHTML = ["Commande en ligne", "Mobile Money ou carte", city ? `Retrait à ${city}` : "Retrait en boutique", "Confirmation WhatsApp"].map(t => `<span>${escapeHTML(t)}</span>`).join("");
    const branch = document.getElementById("branch-selector")?.parentElement;
    if (branch) branch.classList.toggle("hidden", appState.activeWorkspace !== "demo");

    const btnDelices = document.getElementById("btn-brand-delices");
    const btnGastro = document.getElementById("btn-brand-ayo");
    if (btnDelices && btnGastro) {
        if (appState.brandIdentity === "ayo") {
            btnGastro.className = "px-2.5 py-1 rounded-full font-bold text-[11px] bg-brass text-darkChoc transition-all";
            btnDelices.className = "px-2.5 py-1 rounded-full font-semibold text-[11px] text-vanilla/85 hover:text-white transition-all";
        } else {
            btnDelices.className = "px-2.5 py-1 rounded-full font-bold text-[11px] bg-brass text-darkChoc transition-all";
            btnGastro.className = "px-2.5 py-1 rounded-full font-semibold text-[11px] text-vanilla/85 hover:text-white transition-all";
        }
    }
}

function switchBrandIdentity(brand) {
    appState.brandIdentity = brand;
    if (brand === "ayo") {
        appState.tenant.name = "AYO × Délices";
        appState.tenant.specialty = "Plateforme Multi-Tenant Pâtisserie & Événements";
    } else {
        appState.tenant.name = "Délices Sucrés";
        appState.tenant.specialty = "Haute Pâtisserie Artisanale & Événements";
    }
    saveAppState();
    updateBrandHeaderUI();
}

function updateAdminAccessUI() {
    const isAdmin = !!appState.isAdminAuthenticated;
    document.querySelectorAll(".admin-lock").forEach(el => el.classList.toggle("hidden", isAdmin));
    const acc = isAdmin ? currentAccount() : null;
    document.getElementById("topbar-auth-badge").textContent = isAdmin ? `Connecté : ${acc?.business?.name || "Entreprise"}` : "Connexion / Créer un compte";
    const line = document.getElementById("bo-account-line");
    if (line) line.textContent = acc ? `${acc.name} • ${acc.email}${acc.demo ? " (compte démo)" : ""}` : "";
}

function switchView(viewName) {
    if (!_getById(`view-${viewName}`)) {
        if (viewName === "client" || viewName === "customer") { openShop(viewName === "customer" ? "customer" : ""); return; }
        goToBusinessApp(); return;
    }
    if ((viewName === "admin" || viewName === "formats") && !appState.isAdminAuthenticated) {
        pendingProService = viewName === "formats" ? "formats" : pendingProService;
        viewName = "pro";
    }
    ["client", "pro", "formats", "customer", "admin"].filter(v => _getById(`view-${v}`)).forEach(v => {
        document.getElementById(`view-${v}`).classList.add("hidden");
        const tabEl = document.getElementById(`tab-view-${v}`);
        if (tabEl) {
            tabEl.className = `${tabEl.classList.contains("admin-only-tab") ? "admin-only-tab " : ""}px-3 py-1 rounded-full font-semibold transition-all text-vanilla/85 hover:text-white flex items-center gap-1`;
        }
    });
    document.getElementById(`view-${viewName}`).classList.remove("hidden");
    const activeTab = document.getElementById(`tab-view-${viewName}`);
    if (activeTab) {
        activeTab.className = `${activeTab.classList.contains("admin-only-tab") ? "admin-only-tab " : ""}px-3 py-1 rounded-full font-bold transition-all bg-brass text-darkChoc shadow-sm flex items-center gap-1`;
    }

    if (viewName === "client") {
        renderArcCarousel();
        renderPodiumShowcase();
    } else if (viewName === "formats") {
        renderFormatsAndTable();
    } else if (viewName === "customer") {
        renderCustomerAccount();
    } else if (viewName === "admin") {
        renderBackOfficeAll();
    } else if (viewName === "pro") {
        const logged = !!appState.isAdminAuthenticated;
        document.getElementById("pro-logged-box").classList.toggle("hidden", !logged);
        if (logged) document.getElementById("pro-logged-name").textContent = currentAccount()?.business?.name || "Session entreprise ouverte";
        document.getElementById("pro-login-slot").classList.toggle("hidden", logged);
        if (!logged) {
            const card = document.getElementById("auth-card");
            const already = card.parentElement === document.getElementById("pro-login-slot");
            mountAuthCard(true);
            if (!already) resetAuthForm("business");
        }
    }
    if (window.lucide) lucide.createIcons();
    playViewEnter(viewName);
}

function setViewportMode(mode) {
    const wrapper = document.getElementById("viewport-wrapper");
    const btnDesk = document.getElementById("btn-vp-desktop");
    const btnMob = document.getElementById("btn-vp-mobile");
    if (mode === "mobile") {
        wrapper.classList.add("mobile-viewport-frame");
        btnMob.className = "px-2 py-1 rounded-full font-bold bg-white/15 text-brass flex items-center gap-1";
        btnDesk.className = "px-2 py-1 rounded-full font-semibold text-vanilla/75 hover:text-white flex items-center gap-1";
    } else {
        wrapper.classList.remove("mobile-viewport-frame");
        btnDesk.className = "px-2 py-1 rounded-full font-bold bg-white/15 text-brass flex items-center gap-1";
        btnMob.className = "px-2 py-1 rounded-full font-semibold text-vanilla/75 hover:text-white flex items-center gap-1";
    }
    setTimeout(renderArcCarousel, 60);
}

function changeBranch(branchKey) {
    const map = {
        "haie-vive": { city: "Cotonou — Haie Vive", spec: "Haute Pâtisserie Artisanale & Événements" },
        "peches": { city: "Fidjrossè — Route des Pêches", spec: "Comptoir Bord de Mer & Glacerie" },
        "parakou": { city: "Parakou — Stand Foire & Événements", spec: "Pâtisserie Événementielle & Coffrets" }
    };
    const info = map[branchKey] || map["haie-vive"];
    appState.tenant.city = info.city;
    appState.tenant.specialty = info.spec;
    saveAppState();
    updateBrandHeaderUI();
    showToast(`Atelier sélectionné : ${info.city}`, "success");
}
