// AYO — CLOUD : base de données Supabase
// ==================== CLOUD : base de données Supabase ====================
// Comptes entreprise, données de chaque entreprise, vitrine publique et commandes en ligne.
// Sans connexion (ou si Supabase est injoignable), le site continue de fonctionner sur l'appareil.
const PUBLIC_KEYS = ["tenant", "activeFormat", "builtinCatalog", "catalog", "customProducts", "campaigns", "reviews", "brandIdentity", "gateways", "podiumPastryId", "company"];
const CLOUD = { sb: null, user: null, wsId: null, slug: null, ready: false, saveTimer: 0, pollTimer: 0, shopSlug: null };

function cloudInit() {
    try {
        if (window.supabase && window.supabase.createClient) {
            CLOUD.sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, storageKey: "ayo-auth", autoRefreshToken: true } });
        }
    } catch (e) { CLOUD.sb = null; }
}
cloudInit();
const cloudOn = () => !!CLOUD.sb;
const isDemoEmail = email => (typeof DEMO_ACCOUNTS !== "undefined") && DEMO_ACCOUNTS.some(a => a.email === email);

function publicState() {
    const out = {};
    PUBLIC_KEYS.forEach(k => { out[k] = appState[k]; });
    return JSON.parse(JSON.stringify(out));
}
function accFromUser(user) {
    const m = user.user_metadata || {};
    return { type: "business", name: m.name || user.email, email: user.email, phone: m.phone || "", twoFA: false, cloud: true, createdAt: user.created_at, business: m.business || {} };
}
function rememberCloudAccount(acc) {
    appState.accounts = (appState.accounts || []).filter(a => !(a.email === acc.email && a.type === "business"));
    appState.accounts.unshift(acc);
}

// ---- Connexion : d'abord Supabase, sinon les comptes enregistrés sur l'appareil ----
const _localSubmitLogin = submitLogin;
submitLogin = async function (e) {
    const email = document.getElementById("auth-email").value.trim().toLowerCase();
    const pass = document.getElementById("auth-password").value;
    if (!cloudOn() || authAccountType !== "business" || isDemoEmail(email)) return _localSubmitLogin(e);
    e.preventDefault();
    setAuthError("login", "");
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    const { data, error } = await CLOUD.sb.auth.signInWithPassword({ email, password: pass });
    if (btn) btn.disabled = false;
    if (!error && data.user) {
        CLOUD.user = data.user;
        const acc = accFromUser(data.user);
        rememberCloudAccount(acc);
        completeLogin(acc);
        return;
    }
    if (error && /confirm/i.test(error.message)) { setAuthError("login", "Confirmez d'abord votre adresse e-mail : ouvrez le lien reçu, puis reconnectez-vous."); return; }
    // Compte créé avant la mise en ligne de la base : on essaie sur l'appareil
    return _localSubmitLogin(e);
};

// ---- Création de compte ----
const _localSignup2 = submitSignupStep2;
submitSignupStep2 = async function (e) {
    if (!cloudOn() || !pendingSignup) return _localSignup2(e);
    e.preventDefault();
    const bizName = document.getElementById("su-biz-name").value.trim();
    const city = document.getElementById("su-biz-city").value.trim();
    if (!bizName || !city) { setAuthError("su2", "Indiquez le nom et la ville de l'entreprise."); return; }
    const business = { name: bizName, city, specialty: document.getElementById("su-biz-spec").value, format: parseInt(document.querySelector('input[name="su-format"]:checked')?.value || "1", 10) };
    const p = pendingSignup;
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    const { data, error } = await CLOUD.sb.auth.signUp({
        email: p.email, password: p.pass,
        options: { data: { app: "ayo", name: p.name, phone: p.phone, business }, emailRedirectTo: location.origin + location.pathname }
    });
    if (btn) btn.disabled = false;
    if (error) {
        setAuthError("su2", /registered|exists/i.test(error.message) ? "Un compte existe déjà avec cet e-mail. Connectez-vous." : `Création impossible : ${error.message}`);
        return;
    }
    if (data.session && data.user) {
        CLOUD.user = data.user;
        await _localSignup2(e); // crée l'espace et ouvre la session
        const acc = (appState.accounts || []).find(a => a.email === p.email);
        if (acc) { delete acc.salt; delete acc.hash; acc.cloud = true; }
        return;
    }
    // Confirmation par e-mail demandée par Supabase
    pendingSignup = null;
    showAuthMode("login");
    document.getElementById("auth-email").value = p.email;
    setAuthError("login", "Compte créé. Ouvrez l'e-mail de confirmation que nous venons d'envoyer, puis connectez-vous ici.");
};

// ---- Après l'ouverture de session : récupérer l'espace depuis la base ----
const _completeLogin = completeLogin;
completeLogin = function (acc, isNew = false, ...rest) {
    const r = _completeLogin(acc, isNew, ...rest);
    if (cloudOn() && acc && acc.type === "business" && !acc.demo && !isDemoEmail(acc.email)) cloudAfterLogin(acc, isNew);
    return r;
};
async function cloudAfterLogin(acc, isNew) {
    if (!CLOUD.user) {
        const { data } = await CLOUD.sb.auth.getUser();
        CLOUD.user = data && data.user && data.user.email === acc.email ? data.user : null;
    }
    if (!CLOUD.user) return; // compte uniquement sur l'appareil
    CLOUD.ready = false; CLOUD.adminRev = 0;
    const { data: row, error } = await CLOUD.sb.from("workspaces").select("id, slug, state, admin_rev").eq("owner", CLOUD.user.id).maybeSingle();
    if (error) { showToast("Base de données injoignable : vos changements restent sur cet appareil.", "info"); return; }
    if (row) {
        CLOUD.wsId = row.id; CLOUD.slug = row.slug;
        CLOUD.adminRev = Number(row.admin_rev) || 0;
        if (row.state && Object.keys(row.state).length && !isNew) {
            WS_KEYS.forEach(k => { if (k in row.state) appState[k] = row.state[k]; });
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...appState, isAdminAuthenticated: false })); } catch (e) {}
            renderAll(); renderBackOfficeAll();
            if (typeof currentBoTab !== "undefined" && currentBoTab) switchBoTab(currentBoTab);
        }
    }
    CLOUD.ready = true;
    await cloudPush();
    await cloudSyncOrders(true);
    clearInterval(CLOUD.pollTimer);
    CLOUD.pollTimer = setInterval(() => { if (appState.isAdminAuthenticated && !document.hidden) { cloudAdminCheck(); cloudSyncOrders(false); } }, 30000);
}

// ---- Sauvegarde : chaque changement part aussi dans la base (regroupé toutes les 1,5 s) ----
const _saveAppState = saveAppState;
saveAppState = function () {
    _saveAppState();
    if (cloudOn() && CLOUD.user && CLOUD.ready && appState.isAdminAuthenticated && String(appState.activeWorkspace || "").startsWith("acc:")) {
        clearTimeout(CLOUD.saveTimer);
        CLOUD.saveTimer = setTimeout(cloudPush, 1500);
    }
};
// ---- Modifications faites par l'équipe AYO (page administrateur) à la demande de l'entreprise ----
const ADMIN_FIELD_PATH = { name: ["tenant", "name"], city: ["tenant", "city"], specialty: ["tenant", "specialty"], ifu: ["billing", "ifu"], rccm: ["billing", "rccm"], address: ["billing", "address"], phone: ["company", "phone"], whatsapp: ["company", "whatsapp"], email: ["company", "email"] };
async function cloudAdminCheck() {
    if (!CLOUD.user || !CLOUD.wsId) return false;
    const { data, error } = await CLOUD.sb.from("workspaces").select("admin_rev, admin_patch").eq("id", CLOUD.wsId).maybeSingle();
    if (error || !data) return false;
    const rev = Number(data.admin_rev) || 0;
    if (rev <= (CLOUD.adminRev || 0)) return false;
    const patch = data.admin_patch || {}, since = CLOUD.adminRev || 0;
    Object.keys(patch).forEach(k => {
        const path = ADMIN_FIELD_PATH[k], e = patch[k]; if (!path || !e || typeof e !== "object" || !(Number(e.rev) > since)) return;
        if (!appState[path[0]] || typeof appState[path[0]] !== "object") appState[path[0]] = {};
        appState[path[0]][path[1]] = String(e.v ?? "");
    });
    CLOUD.adminRev = rev;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...appState, isAdminAuthenticated: false })); } catch (e) {}
    try { renderAll(); renderBackOfficeAll(); if (typeof currentBoTab !== "undefined" && currentBoTab) switchBoTab(currentBoTab); } catch (e) {}
    showToast("L'équipe AYO a mis à jour vos informations à votre demande.", "success");
    return true;
}
async function cloudPush() {
    if (!CLOUD.user || !CLOUD.ready) return;
    await cloudAdminCheck();
    const base = { owner: CLOUD.user.id, name: appState.tenant?.name || "", state: pickWorkspace(appState), public_state: publicState() };
    let slug = CLOUD.slug || siteSlug();
    for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await CLOUD.sb.from("workspaces").upsert({ ...base, slug }, { onConflict: "owner" }).select("id, slug").single();
        if (!error) { CLOUD.wsId = data.id; CLOUD.slug = data.slug; return true; }
        if (error.code === "23505" && /slug/.test(error.message + error.details)) { slug = `${siteSlug()}-${CLOUD.user.id.slice(0, 4 + attempt)}`; continue; }
        console.warn("Sauvegarde en ligne impossible", error);
        return false;
    }
    return false;
}

// ---- Commandes reçues en ligne ----
async function cloudSyncOrders(silent) {
    if (!CLOUD.user || !CLOUD.wsId) return;
    const { data, error } = await CLOUD.sb.from("orders").select("ref, payload, status, created_at").eq("workspace_id", CLOUD.wsId).order("created_at", { ascending: false }).limit(300);
    if (error || !data) return;
    const known = new Set(appState.orders.map(o => o.ref));
    let added = 0, changed = false;
    data.slice().reverse().forEach(r => {
        const local = appState.orders.find(o => o.ref === r.ref);
        if (!known.has(r.ref)) {
            appState.orders.unshift({ ...r.payload, ref: r.ref, status: r.status, online: true });
            added++;
        } else if (local && local.online && local.status !== r.status) { local.status = r.status; changed = true; }
    });
    if (added || changed) {
        saveAppState();
        renderBackOfficeAll();
        if (added && !silent) showToast(`${added} nouvelle${added > 1 ? "s" : ""} commande${added > 1 ? "s" : ""} en ligne.`, "success");
    }
}
const _updateBoOrderStatus = updateBoOrderStatus;
updateBoOrderStatus = function (idx, status) {
    const o = appState.orders[idx];
    _updateBoOrderStatus(idx, status);
    if (cloudOn() && CLOUD.user && CLOUD.wsId && o) CLOUD.sb.from("orders").update({ status }).eq("workspace_id", CLOUD.wsId).eq("ref", o.ref).then(() => {});
};

// ---- Déconnexion ----
const _logoutAdmin = logoutAdmin;
logoutAdmin = function () {
    clearInterval(CLOUD.pollTimer); clearTimeout(CLOUD.saveTimer);
    if (CLOUD.user && CLOUD.ready) cloudPush();
    if (cloudOn()) CLOUD.sb.auth.signOut().catch(() => {});
    CLOUD.user = null; CLOUD.wsId = null; CLOUD.slug = null; CLOUD.ready = false;
    return _logoutAdmin();
};

// ---- Le lien de la boutique suit l'adresse enregistrée en ligne ----
const _siteSlug = siteSlug;
siteSlug = function () { return CLOUD.slug && appState.isAdminAuthenticated ? CLOUD.slug : _siteSlug(); };

// ---- Vitrine publique : charger la boutique depuis la base ----
async function cloudLoadShop(slug) {
    if (!cloudOn() || !slug) return false;
    const { data, error } = await CLOUD.sb.rpc("get_shop", { p_slug: slug });
    if (error || !data || !data.public) return false;
    const id = `shop:${data.slug}`;
    const ws = { ...blankWorkspace({ business: {} }), ...data.public, orders: [], stocks: [], invoices: [], notifications: [], cart: [] };
    if (appState.activeWorkspace === id) { Object.assign(appState, JSON.parse(JSON.stringify(ws))); }
    else { appState.workspaces = appState.workspaces || {}; appState.workspaces[id] = ws; switchWorkspace(id); }
    CLOUD.shopSlug = data.slug;
    return true;
}

// ---- Commande passée en boutique : envoyée à l'entreprise ----
const _submitCheckoutPayment = submitCheckoutPayment;
submitCheckoutPayment = function (e) {
    const before = appState.orders[0]?.ref;
    const lines = appState.cart.map(i => ({ pastryId: i.pastryId, qty: i.qty, ingredientIdx: i.ingredientIdx }));
    const r = _submitCheckoutPayment(e);
    const o = appState.orders[0];
    if (o && o.ref !== before && cloudOn() && CLOUD.shopSlug) {
        const payload = { ref: o.ref, client: o.client, details: o.details, payment: o.payment, amountFcfa: o.amountFcfa, items: o.items, discount: o.discount, shipping: o.shipping, source: o.source, lines, createdAt: new Date().toISOString() };
        CLOUD.sb.rpc("place_order", { p_slug: CLOUD.shopSlug, p_order: payload }).then(({ error }) => {
            if (error) showToast("Commande enregistrée, mais l'envoi à la boutique a échoué. Réessayez ou contactez la boutique.", "info");
        });
    }
    return r;
};
