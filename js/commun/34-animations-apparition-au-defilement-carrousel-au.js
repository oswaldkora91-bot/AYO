// AYO — ANIMATIONS : APPARITION AU DÉFILEMENT, CARROUSEL AUTO, COMPTEURS
// ==================== ANIMATIONS : APPARITION AU DÉFILEMENT, CARROUSEL AUTO, COMPTEURS ====================
const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let revealObserver = null;
const REVEAL_SELECTORS = [
    "#view-pro .grid > div.p-3\\.5", "#view-pro h2",
    "#arc-carousel-section > div > div:first-child", "#podium-showcase-card", "#social-deeplinks-bar",
    "#pro-teaser > div", "#agenda-section h2", "#agenda-section .grid > *", "#reviews-section h2", "#reviews-section .grid > div",
    "#contact-section .grid > *", "#view-customer .bg-white.rounded-3xl", "#view-admin .bg-white.rounded-3xl",
    "#formats-cards-grid > div", "footer > div", "#view-admin h1", "#view-admin .grid.grid-cols-2 > div",
    "#view-customer h1", "#view-customer h2", "#reviews-section form", "#contact-section form", "#agenda-section form", "#view-formats h1", "#view-formats table"
];
function initReveal() {
    if (REDUCED_MOTION || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("ayo-anim");
    revealObserver = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add("reveal-in"); revealObserver.unobserve(en.target); }
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    scanReveal();
}
function scanReveal() {
    if (!revealObserver) return;
    REVEAL_SELECTORS.forEach(sel => {
        document.querySelectorAll(sel).forEach((el, i) => {
            if (el.dataset.revealed) return;
            el.dataset.revealed = "1";
            el.classList.add("reveal");
            el.style.setProperty("--d", `${Math.min(i % 6, 5) * 0.07}s`);
            revealObserver.observe(el);
        });
    });
}
function playViewEnter(viewName) {
    const v = document.getElementById(`view-${viewName}`);
    if (!v || REDUCED_MOTION) return;
    v.classList.remove("view-enter"); void v.offsetWidth; v.classList.add("view-enter");
    setTimeout(scanReveal, 30);
}
function bumpEl(id) {
    const el = document.getElementById(id);
    if (!el || REDUCED_MOTION) return;
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
}
function countUp(el, target, format) {
    if (!el) return;
    if (REDUCED_MOTION || !isFinite(target)) { el.textContent = format(target); return; }
    const start = performance.now(), dur = 900;
    const step = now => {
        const t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
        el.textContent = format(target * e);
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}


// Conteneurs dont le contenu apparaît en cascade à chaque affichage
const STAGGER_IDS = ["reviews-grid", "rating-breakdown-bars", "agenda-calendar-cells", "podium-portions-row", "podium-gallery-thumbs",
    "cart-items-container", "customer-orders-container", "customer-notifs-container", "social-deeplinks-buttons", "mobile-quick-selector",
    "formats-cards-grid", "params-table-body", "bo-orders-tbody", "bo-stocks-grid", "bo-costs-grid", "bo-campaigns-grid", "bo-camp-kpis",
    "bo-tickets-list", "bo-catalog-list", "bo-pay-kpis", "bo-pay-gateways", "bo-pay-bars", "bo-pay-tx", "bo-notif-list", "bo-fb-kpis",
    "bo-fb-themes", "bo-fb-list", "bo-gallery-templates", "bo-gallery-products", "bo-acc-kpis", "bo-acc-stock", "bo-my-products",
    "bo-purchases", "bo-inv-kpis", "bo-inv-pending", "bo-inv-list"];
function initStaggers() {
    if (REDUCED_MOTION) return;
    STAGGER_IDS.forEach(id => { const el = _getByIdSafe(id); if (el) el.classList.add("stagger"); });
    // la grille de modèles de l'alt-format contient une grille : on anime ses cartes
    document.querySelectorAll("#view-admin .grid > div.bg-white.p-5, #podium-showcase-card, #view-pro .grid > div.p-4").forEach(el => el.classList.add("ayo-card-hover"));
    ["topbar-cart-count", "nav-cart-count", "bo-notif-count", "topbar-orders-badge"].forEach(id => {
        const el = _getByIdSafe(id); if (!el) return;
        new MutationObserver(() => { el.classList.remove("pop-in"); void el.offsetWidth; el.classList.add("pop-in"); }).observe(el, { childList: true, characterData: true, subtree: true });
    });
}
function _getByIdSafe(id) { return (typeof _getById === "function" ? _getById : document.getElementById.bind(document))(id); }
// Vitrine : avance toute seule toutes les 7 s, s'arrête au survol, au glisser ou quand il n'est pas visible
let autoplayTimer = null, autoplayPaused = false;
function initCarouselAutoplay() {
    if (REDUCED_MOTION) return;
    const stage = document.getElementById("arc-wheel-stage");
    if (!stage) return;
    ["mouseenter", "touchstart", "mousedown"].forEach(ev => stage.addEventListener(ev, () => { autoplayPaused = true; }, { passive: true }));
    stage.addEventListener("mouseleave", () => { autoplayPaused = false; });
    stage.addEventListener("touchend", () => setTimeout(() => { autoplayPaused = false; }, 6000));
    autoplayTimer = setInterval(() => {
        const visible = !document.getElementById("view-client").classList.contains("hidden") && appState.activeFormat === IMM_FMT && !stage.classList.contains("hidden");
        if (!visible || autoplayPaused || isWheelDragging || document.hidden) return;
        const r = stage.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const n = getFilteredPastries().length;
        if (n < 2) return;
        carouselPos = (Math.round(carouselPos) + 1) % n;
        layoutArc();
    }, 7000);
}
