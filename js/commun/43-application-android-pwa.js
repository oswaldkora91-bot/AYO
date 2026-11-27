// AYO — APPLICATION ANDROID (PWA)
// ==================== APPLICATION ANDROID (PWA) ====================
// AYO s'installe comme une application sur le téléphone : icône sur l'écran d'accueil, plein écran,
// fonctionnement hors connexion pour ce qui est déjà chargé, et touche « retour » qui ferme d'abord la fenêtre ouverte.
const AYO_APP = { prompt: null, ignorePop: 0, standalone: matchMedia("(display-mode: standalone)").matches || navigator.standalone === true };
if (AYO_APP.standalone) document.documentElement.classList.add("is-app");

// ---- La boutique installée se rouvre sur la dernière boutique visitée ----
(() => {
    if (typeof APP_MODE === "undefined" || APP_MODE !== "shop") return;
    try {
        if (location.hash.length > 1) localStorage.setItem("ayo_last_shop", location.hash);
        else { const h = localStorage.getItem("ayo_last_shop"); if (h) history.replaceState(history.state, "", location.pathname + location.search + h); }
    } catch (e) {}
    window.addEventListener("hashchange", () => { try { if (location.hash.length > 1) localStorage.setItem("ayo_last_shop", location.hash); } catch (e) {} });
})();

// ---- Mode hors connexion : le « service worker » garde une copie des fichiers du site ----
window.addEventListener("load", () => {
    const hosted = location.protocol === "https:" && !/(^|\.)claude(usercontent)?\.(ai|com)$/.test(location.hostname);
    if (!hosted || !("serviceWorker" in navigator) || !document.querySelector('link[rel="manifest"]')) return;
    navigator.serviceWorker.register("sw.js").catch(() => {});
});

// ---- Bouton « Installer l'application » (Android / Chrome) ----
window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    AYO_APP.prompt = e;
    ayoShowInstall();
});
window.addEventListener("appinstalled", () => {
    AYO_APP.prompt = null;
    document.querySelectorAll(".ayo-install-menu, .ayo-install-float").forEach(b => b.classList.add("hidden"));
    showToast("Application installée : retrouvez AYO sur votre écran d'accueil.", "success");
});
function ayoShowInstall() {
    document.querySelectorAll(".ayo-install-menu, .ayo-install-float").forEach(b => b.classList.remove("hidden"));
}
async function installAyoApp() {
    if (!AYO_APP.prompt) {
        showToast("Dans Chrome : menu ⋮ puis « Ajouter à l'écran d'accueil ».", "info");
        return;
    }
    AYO_APP.prompt.prompt();
    try { await AYO_APP.prompt.userChoice; } catch (e) {}
    AYO_APP.prompt = null;
    document.querySelectorAll(".ayo-install-menu, .ayo-install-float").forEach(b => b.classList.add("hidden"));
}
function mountInstallButtons() {
    if (AYO_APP.standalone) return;
    const label = (typeof APP_MODE !== "undefined" && APP_MODE === "shop") ? "Installer la boutique" : "Installer l'application";
    const make = cls => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `ayo-install hidden ${cls}`;
        b.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg><span>${label}</span>`;
        b.addEventListener("click", installAyoApp);
        return b;
    };
    const menu = document.getElementById("hdr-menu");
    if (menu) menu.appendChild(make("ayo-install-menu"));
    // Pastille flottante (téléphone), que l'on peut fermer pour la session
    let dismissed = false; try { dismissed = sessionStorage.getItem("ayo_install_x") === "1"; } catch (e) {}
    if (!dismissed) {
        const wrap = document.createElement("div");
        wrap.className = "ayo-install-float hidden";
        const btn = make("");
        btn.classList.remove("hidden");
        const x = document.createElement("button");
        x.type = "button"; x.className = "ayo-install-x"; x.setAttribute("aria-label", "Masquer"); x.textContent = "×";
        x.addEventListener("click", () => { wrap.remove(); try { sessionStorage.setItem("ayo_install_x", "1"); } catch (e) {} });
        wrap.append(btn, x);
        document.body.appendChild(wrap);
    }
    if (AYO_APP.prompt) ayoShowInstall();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountInstallButtons); else mountInstallButtons();

// ---- Touche « retour » d'Android : ferme la fenêtre ouverte au lieu de quitter ----
const ayoShown = id => { const el = document.getElementById(id); return !!el && el.isConnected && !el.classList.contains("hidden") && el.getClientRects().length > 0; };
const AYO_OVERLAYS = [
    { name: "invoice", open: () => ayoShown("invoice-modal"), close: () => closeInvoice() },
    { name: "tenant", open: () => ayoShown("create-tenant-modal"), close: () => closeCreateTenantModal() },
    { name: "auth", open: () => !!document.querySelector("#ayo-auth-screen.open"), close: () => closeAuthScreen() },
    { name: "cart", open: () => ayoShown("cart-drawer"), close: () => toggleCartDrawer(false) },
    { name: "menu", open: () => !!document.querySelector("header.menu-open"), close: () => toggleHdrMenu(false) }
];
let ayoClosingFromBack = false;
function ayoOverlayOpened(name) {
    if (history.state && history.state.ayoOv === name) return;
    history.pushState({ ayoOv: name }, "");
}
function ayoOverlayClosed(name) {
    if (ayoClosingFromBack) return;
    if (history.state && history.state.ayoOv === name) { AYO_APP.ignorePop++; history.back(); }
}
window.addEventListener("popstate", () => {
    if (AYO_APP.ignorePop > 0) { AYO_APP.ignorePop--; return; }
    const top = AYO_OVERLAYS.find(o => { try { return o.open(); } catch (e) { return false; } });
    if (!top) return;
    ayoClosingFromBack = true;
    try { top.close(); } finally { ayoClosingFromBack = false; }
});
const ayoWrap = (fnName, isOpening, name) => {
    const orig = window[fnName];
    if (typeof orig !== "function") return;
    window[fnName] = function () {
        const r = orig.apply(this, arguments);
        const ov = AYO_OVERLAYS.find(o => o.name === name);
        let nowOpen = false; try { nowOpen = ov.open(); } catch (e) {}
        if (isOpening(arguments) && nowOpen) ayoOverlayOpened(name);
        else if (!nowOpen) ayoOverlayClosed(name);
        return r;
    };
};
ayoWrap("openInvoice", () => true, "invoice");
ayoWrap("closeInvoice", () => false, "invoice");
ayoWrap("openCreateTenantModal", () => true, "tenant");
ayoWrap("closeCreateTenantModal", () => false, "tenant");
ayoWrap("openAuthScreen", () => true, "auth");
ayoWrap("closeAuthScreen", () => false, "auth");
ayoWrap("toggleCartDrawer", args => !!args[0], "cart");
ayoWrap("toggleHdrMenu", args => typeof args[0] === "boolean" ? args[0] : !!document.querySelector("header.menu-open"), "menu");
