// AYO — ENTREPRISE & SITES CONNECTÉS
// ==================== ENTREPRISE & SITES CONNECTÉS ====================
// Numéros officiels (IFU, RCCM), coordonnées et liens vers les sites / réseaux de l'entreprise.
// L'IFU, le RCCM et l'adresse sont partagés avec la facturation (appState.billing).
const LINK_TYPES = {
    site:      { label: "Site web",         color: "#2E6F40", abbr: "www", base: "" },
    facebook:  { label: "Facebook",         color: "#1877F2", abbr: "f",   base: "https://facebook.com/" },
    instagram: { label: "Instagram",        color: "#C13584", abbr: "ig",  base: "https://instagram.com/" },
    tiktok:    { label: "TikTok",           color: "#111111", abbr: "tt",  base: "https://tiktok.com/@" },
    whatsapp:  { label: "WhatsApp Business",color: "#25D366", abbr: "wa",  base: "https://wa.me/" },
    google:    { label: "Fiche Google",     color: "#EA4335", abbr: "G",   base: "" },
    youtube:   { label: "YouTube",          color: "#FF0000", abbr: "yt",  base: "https://youtube.com/@" },
    linkedin:  { label: "LinkedIn",         color: "#0A66C2", abbr: "in",  base: "https://linkedin.com/company/" },
    snapchat:  { label: "Snapchat",         color: "#E8C900", abbr: "sc",  base: "https://snapchat.com/add/" },
    x:         { label: "X (Twitter)",      color: "#111111", abbr: "X",   base: "https://x.com/" },
    other:     { label: "Autre site",       color: "#8C4A27", abbr: "+",   base: "" }
};
function ensureCompany() {
    if (!appState.company || typeof appState.company !== "object") appState.company = {};
    const c = appState.company;
    if (!Array.isArray(c.links)) c.links = [];
    ["phone", "whatsapp", "email"].forEach(k => { if (typeof c[k] !== "string") c[k] = ""; });
    if (!appState.billing) appState.billing = { ifu: "", rccm: "", address: "", regime: "B", auto: true };
    return c;
}
// Accepte un lien complet, un domaine ou un nom de compte (@delices) et renvoie une adresse https
function normalizeLink(type, raw) {
    let v = String(raw || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    const t = LINK_TYPES[type] || LINK_TYPES.other;
    if (type === "whatsapp") { const d = v.replace(/\D/g, ""); return d.length >= 8 ? t.base + d : ""; }
    if (t.base && !/[./]/.test(v.replace(/^@/, ""))) return t.base + v.replace(/^@/, "");
    if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v)) return "https://" + v;
    return "";
}
function linkHost(url) { try { const u = new URL(url); return (u.host + u.pathname).replace(/^www\./, "").replace(/\/$/, ""); } catch (e) { return url; } }
function linkBadge(type) {
    const t = LINK_TYPES[type] || LINK_TYPES.other;
    return `<span class="co-badge" style="--c:${t.color}" aria-hidden="true">${escapeHTML(t.abbr)}</span>`;
}

function renderCompany() {
    const panel = document.getElementById("bo-panel-company");
    if (!panel) return;
    const c = ensureCompany(), b = appState.billing;
    const set = (id, v) => { const e = document.getElementById(id); if (e && document.activeElement !== e) e.value = v || ""; };
    set("co-ifu", b.ifu); set("co-rccm", b.rccm); set("co-address", b.address);
    set("co-phone", c.phone); set("co-wa", c.whatsapp); set("co-email", c.email);
    const ifuOk = /^\d{13}$/.test(String(b.ifu || ""));
    const st = document.getElementById("co-ifu-state");
    if (st) {
        st.textContent = ifuOk ? "IFU valide — vos factures peuvent être émises." : (b.ifu ? "L'IFU doit comporter 13 chiffres." : "Sans IFU, aucune facture ne peut être émise.");
        st.className = `text-[11px] font-bold mt-1 ${ifuOk ? "text-sage" : "text-red-600"}`;
    }
    const box = document.getElementById("co-links");
    if (!box) return;
    box.innerHTML = c.links.length ? c.links.map((l, i) => {
        const t = LINK_TYPES[l.type] || LINK_TYPES.other;
        return `
        <div class="co-row">
            ${linkBadge(l.type)}
            <div class="min-w-0 flex-1">
                <span class="block text-xs font-extrabold text-darkChoc">${escapeHTML(t.label)}</span>
                <input type="text" value="${escapeHTML(l.url)}" aria-label="Lien ${escapeHTML(t.label)}" onchange="updateCompanyLink(${i}, this.value)" class="co-url">
            </div>
            <a href="${escapeHTML(l.url)}" target="_blank" rel="noopener" class="co-icon" aria-label="Ouvrir ${escapeHTML(t.label)}"><i data-lucide="external-link" class="w-3.5 h-3.5"></i></a>
            <label class="co-switch" title="Afficher sur la boutique"><input type="checkbox" ${l.show !== false ? "checked" : ""} onchange="toggleCompanyLink(${i}, this.checked)"><span>Sur la boutique</span></label>
            <button type="button" onclick="removeCompanyLink(${i})" class="co-icon -danger" aria-label="Retirer ${escapeHTML(t.label)}"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </div>`;
    }).join("") : `<div class="rounded-2xl border-2 border-dashed border-beech/45 bg-vanilla p-5 text-center">
            <p class="text-sm font-bold text-darkChoc">Aucun site connecté pour l'instant</p>
            <p class="text-[11px] text-cocoaSoft mt-1">Ajoutez votre page Facebook, votre compte Instagram, votre fiche Google ou votre propre site.</p></div>`;
    const count = document.getElementById("co-links-count");
    if (count) count.textContent = c.links.length ? `${c.links.length} connecté${c.links.length > 1 ? "s" : ""}` : "";
    if (typeof refreshIcons === "function") refreshIcons();
}
function afterCompanyChange(msg) {
    saveAppState();
    renderCompany();
    renderShopCompany();
    if (typeof renderInvoices === "function") { try { renderInvoices(); } catch (e) {} }
    if (typeof currentBoTab !== "undefined" && currentBoTab === "company") renderBoPageHeader("company");
    if (msg) showToast(msg, "success");
}
function saveCompany(e) {
    e.preventDefault();
    const c = ensureCompany();
    const ifu = document.getElementById("co-ifu").value.replace(/\s/g, "");
    if (ifu && !/^\d{13}$/.test(ifu)) { showToast("L'IFU doit comporter 13 chiffres.", "info"); document.getElementById("co-ifu").focus(); return; }
    const email = document.getElementById("co-email").value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("L'adresse e-mail n'est pas valide.", "info"); document.getElementById("co-email").focus(); return; }
    appState.billing = { ...appState.billing, ifu, rccm: document.getElementById("co-rccm").value.trim(), address: document.getElementById("co-address").value.trim() };
    c.phone = document.getElementById("co-phone").value.trim();
    c.whatsapp = document.getElementById("co-wa").value.trim();
    c.email = email;
    afterCompanyChange("Informations de l'entreprise enregistrées.");
}
function addCompanyLink(e) {
    e.preventDefault();
    const c = ensureCompany();
    const type = document.getElementById("co-link-type").value;
    const input = document.getElementById("co-link-url");
    const url = normalizeLink(type, input.value);
    if (!url) { showToast("Saisissez un lien (https://…) ou un nom de compte.", "info"); input.focus(); return; }
    if (c.links.some(l => l.url === url)) { showToast("Ce lien est déjà dans la liste.", "info"); return; }
    c.links.push({ type, url, show: true });
    input.value = "";
    afterCompanyChange(`${(LINK_TYPES[type] || LINK_TYPES.other).label} ajouté.`);
}
function updateCompanyLink(i, value) {
    const c = ensureCompany(), l = c.links[i];
    if (!l) return;
    const url = normalizeLink(l.type, value);
    if (!url) { showToast("Lien non valide : il n'a pas été modifié.", "info"); renderCompany(); return; }
    l.url = url;
    afterCompanyChange("Lien mis à jour.");
}
function toggleCompanyLink(i, on) {
    const l = ensureCompany().links[i];
    if (!l) return;
    l.show = !!on;
    afterCompanyChange(on ? "Lien affiché sur la boutique." : "Lien masqué sur la boutique.");
}
function removeCompanyLink(i) {
    const c = ensureCompany(), l = c.links[i];
    if (!l) return;
    c.links.splice(i, 1);
    afterCompanyChange(`${(LINK_TYPES[l.type] || LINK_TYPES.other).label} retiré.`);
}

// Côté boutique : coordonnées et liens affichés dans la partie Contact
function renderShopCompany() {
    const box = document.getElementById("shop-company");
    if (!box) return;
    const c = ensureCompany();
    const shown = c.links.filter(l => l.show !== false);
    const chips = [];
    if (c.phone) chips.push(`<a href="tel:${escapeHTML(c.phone.replace(/[^\d+]/g, ""))}" class="co-chip"><i data-lucide="phone" class="w-3.5 h-3.5"></i>${escapeHTML(c.phone)}</a>`);
    if (c.whatsapp) { const d = c.whatsapp.replace(/\D/g, ""); if (d.length >= 8) chips.push(`<a href="https://wa.me/${d}" target="_blank" rel="noopener" class="co-chip"><i data-lucide="message-circle" class="w-3.5 h-3.5"></i>WhatsApp</a>`); }
    if (c.email) chips.push(`<a href="mailto:${escapeHTML(c.email)}" class="co-chip"><i data-lucide="mail" class="w-3.5 h-3.5"></i>${escapeHTML(c.email)}</a>`);
    if (!chips.length && !shown.length) { box.innerHTML = ""; box.classList.add("hidden"); return; }
    box.classList.remove("hidden");
    box.innerHTML = `${chips.length ? `<div class="flex flex-wrap gap-2">${chips.join("")}</div>` : ""}
        ${shown.length ? `<p class="text-[11px] font-extrabold text-cocoaSoft pt-2">Retrouvez-nous aussi sur</p>
        <div class="flex flex-wrap gap-2">${shown.map(l => `<a href="${escapeHTML(l.url)}" target="_blank" rel="noopener" class="co-chip">${linkBadge(l.type)}${escapeHTML((LINK_TYPES[l.type] || LINK_TYPES.other).label)}</a>`).join("")}</div>` : ""}`;
    if (typeof refreshIcons === "function") refreshIcons();
}
const _updateBrandHeaderUI_co = updateBrandHeaderUI;
updateBrandHeaderUI = function () { const r = _updateBrandHeaderUI_co.apply(this, arguments); try { renderShopCompany(); } catch (e) {} return r; };
const _renderBackOfficeAll_co = renderBackOfficeAll;
renderBackOfficeAll = function () { const r = _renderBackOfficeAll_co.apply(this, arguments); try { renderCompany(); } catch (e) {} return r; };

// Accessibilité : un champ sans étiquette reçoit le texte de son indication (ou de l'étiquette qui le précède)
function labelOrphanFields(root = document) {
    root.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea").forEach(f => {
        if (f.getAttribute("aria-label") || f.getAttribute("aria-labelledby") || f.closest("label") || (f.id && document.querySelector(`label[for="${CSS.escape(f.id)}"]`))) return;
        let name = f.getAttribute("placeholder") || "";
        if (!name) { const prev = f.previousElementSibling; if (prev && /^(LABEL|SPAN|P)$/.test(prev.tagName)) name = prev.textContent; }
        if (!name && f.tagName === "SELECT" && f.options[0]) name = f.options[0].text;
        name = name.replace(/\s+/g, " ").replace(/\s*\*\s*$/, "").trim();
        if (name) f.setAttribute("aria-label", name.slice(0, 80));
    });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => labelOrphanFields()); else labelOrphanFields();
// Les listes rendues plus tard (stock, coûts, panier…) sont étiquetées au fil de l'eau
(() => { let pend = 0; new MutationObserver(() => { if (pend) return; pend = requestAnimationFrame(() => { pend = 0; labelOrphanFields(); }); }).observe(document.documentElement, { childList: true, subtree: true }); })();

// Après le tout premier produit ajouté, on indique l'étape suivante : choisir le modèle du site
const _addCustomProduct_first = addCustomProduct;
addCustomProduct = function (e) {
    const before = PASTRIES.length;
    const r = _addCustomProduct_first.apply(this, arguments);
    if (before === 0 && PASTRIES.length > 0) setTimeout(() => showToast("Étape suivante : choisissez le modèle de votre site dans « Galerie & mon site ».", "info"), 900);
    return r;
};

// ---- Écran plein de connexion / inscription ----
const AAS_HEADS = { signup: "Votre site et vos services, prêts en quelques minutes.", login: "Bon retour. Vos commandes vous attendent." };
function openAuthScreen(mode = "login") {
    if (appState.isAdminAuthenticated) { goToProService("home"); return; }
    const scr = document.getElementById("ayo-auth-screen");
    if (!scr) return;
    authAccountType = "business";
    mountAuthCard(true);
    resetAuthForm("business");
    showAuthMode(mode);
    const h = document.getElementById("ayo-auth-head");
    if (h) h.textContent = AAS_HEADS[mode] || AAS_HEADS.login;
    scr.classList.add("open"); scr.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("aas-lock");
    setTimeout(() => document.getElementById(mode === "signup" ? "su-name" : "auth-email")?.focus({ preventScroll: true }), 450);
}
function closeAuthScreen() {
    const scr = document.getElementById("ayo-auth-screen");
    if (!scr || !scr.classList.contains("open")) return;
    scr.classList.remove("open"); scr.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("aas-lock");
}
const _closeAuthModal = closeAuthModal;
closeAuthModal = function () { closeAuthScreen(); return _closeAuthModal(); };
startSignup = function () { if (appState.isAdminAuthenticated) { goToProService("account"); return; } switchView("pro"); openAuthScreen("signup"); };
const _openProSpace = openProSpace;
openProSpace = function () { _openProSpace(); if (!appState.isAdminAuthenticated) openAuthScreen("login"); };
const _openProService = openProService;
openProService = function (key) {
    if (!appState.isAdminAuthenticated) { pendingProService = key; openAuthScreen("signup"); return; }
    return _openProService(key);
};
document.addEventListener("keydown", e => { if (e.key === "Escape") closeAuthScreen(); });
// Les onglets du formulaire changent aussi le titre de gauche
const _showAuthMode = showAuthMode;
showAuthMode = function (mode) {
    const r = _showAuthMode(mode);
    const h = document.getElementById("ayo-auth-head");
    if (h && document.getElementById("ayo-auth-screen")?.classList.contains("open")) h.textContent = AAS_HEADS[mode] || AAS_HEADS.login;
    return r;
};
