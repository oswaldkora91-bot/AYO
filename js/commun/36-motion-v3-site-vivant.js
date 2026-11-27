// AYO — MOTION v3 : site vivant
// ==================== MOTION v3 : site vivant ====================
const FINE_POINTER = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function initMotion3() {
    initServiceGenerator();
    initScrollProgress();
    initRipple();
    buildMarquees();
    if (REDUCED_MOTION) return;
    initIntro();
    initSplitHeadings();
    initMagnetic();
    initSpotlight();
    initBlobParallax();
    initLiveDemo();
}

// ---- Barre de progression de lecture ----
function initScrollProgress() {
    if (REDUCED_MOTION) return;
    const bar = document.createElement("div");
    bar.id = "ayo-progress";
    document.body.appendChild(bar);
    let raf = 0;
    const upd = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    };
    addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(upd); }, { passive: true });
    upd();
}

// ---- Intro AYO (page entreprise, une fois par session) ----
function initIntro() {
    if (typeof APP_MODE === "undefined" || APP_MODE !== "business") return;
    try { if (sessionStorage.getItem("ayo_intro")) return; sessionStorage.setItem("ayo_intro", "1"); } catch (e) { return; }
    const el = document.createElement("div");
    el.id = "ayo-intro";
    el.innerHTML = `<div class="curtain top"></div><div class="curtain bot"></div><div class="mark"><span><i>A</i></span><span><i>Y</i></span><span><i>O</i></span></div><div class="line"></div>`;
    document.body.appendChild(el);
    document.documentElement.classList.add("intro-playing");
    setTimeout(() => el.classList.add("out"), 950);
    setTimeout(() => { document.documentElement.classList.remove("intro-playing"); replaySplit(document.querySelector("#view-pro h1")); }, 1150);
    setTimeout(() => el.remove(), 2000);
}

// ---- Titres : découpage en mots, montée au défilement ----
const SPLIT_SELECTORS = ["#view-pro h1", "#view-pro h2", "#hero-main-title", "#agenda-section h2", "#reviews-section h2", "#contact-section h2", "#pro-teaser h2", "#view-customer h1", "#view-formats h1"];
let splitObserver = null;
function splitWords(el) {
    let w = 0;
    const wrap = node => {
        [...node.childNodes].forEach(ch => {
            if (ch.nodeType === 3) {
                const parts = ch.textContent.split(/(\s+)/);
                const frag = document.createDocumentFragment();
                parts.forEach(p => {
                    if (!p) return;
                    if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
                    const m = document.createElement("span"); m.className = "w-mask";
                    const i = document.createElement("span"); i.className = "w-in"; i.style.setProperty("--w", w++); i.textContent = p;
                    m.appendChild(i); frag.appendChild(m);
                });
                ch.replaceWith(frag);
            } else if (ch.nodeType === 1 && ch.tagName !== "BR" && !ch.classList.contains("w-mask")) {
                if (ch.classList.contains("shine-text") || ch.id === "demo-kind") {
                    const m = document.createElement("span"); m.className = "w-mask";
                    const i = document.createElement("span"); i.className = "w-in"; i.style.setProperty("--w", w++);
                    ch.replaceWith(m); i.appendChild(ch); m.appendChild(i);
                } else wrap(ch);
            }
        });
    };
    wrap(el);
}
function initSplitHeadings() {
    splitObserver = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        splitObserver.unobserve(e.target);
        const t = e.target, wait = document.documentElement.classList.contains("intro-playing") ? 1250 : 0;
        setTimeout(() => t.classList.add("split-in"), wait);
    }), { threshold: .3 });
    scanSplit();
}
function scanSplit() {
    if (!splitObserver) return;
    SPLIT_SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(el => {
        if (el.dataset.split) return;
        el.dataset.split = "1"; el.dataset.revealed = "1"; el.classList.remove("reveal");
        splitWords(el);
        splitObserver.observe(el);
    }));
}
function replaySplit(el) {
    if (!el || !el.dataset.split) return;
    el.classList.remove("split-in"); void el.offsetWidth;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add("split-in"); else splitObserver && splitObserver.observe(el);
}

// ---- Bandeaux défilants ----
function buildMarquees() {
    const fill = (track, items) => {
        if (!track) return;
        const row = items.map(t => `<span class="ayo-marquee-item">${escapeHTML(t)}</span>`).join("");
        track.innerHTML = row + row; // deux copies pour une boucle sans couture
    };
    fill(_getByIdSafe("pro-marquee-track"), ["MTN MoMo", "Moov Money", "Celtiis Cash", "FedaPay", "KKiaPay", "Carte bancaire", "WhatsApp", "Instagram", "TikTok", "Facebook", "Facture normalisée", "FCFA, euro, dollar"]);
    const shop = _getByIdSafe("shop-marquee-track");
    if (shop) {
        const t = appState.tenant || {};
        const cats = [...new Set(PASTRIES.map(p => p.catLabel).filter(Boolean))];
        fill(shop, ["Commandez en ligne", "Payez par Mobile Money ou carte", t.city ? `Retrait à ${t.city}` : "Retrait en boutique", "Confirmation sur WhatsApp", ...cats]);
    }
}

// ---- Onde au clic sur tous les boutons ----
function initRipple() {
    if (REDUCED_MOTION) return;
    document.addEventListener("pointerdown", e => {
        const b = e.target.closest("button, .bo-item, a.rounded-full");
        if (!b || b.disabled || b.closest(".demo-page, .spin-med, .box-slot")) return;
        const cs = getComputedStyle(b);
        if (cs.position === "static") b.style.position = "relative";
        if (cs.overflow !== "hidden") b.style.overflow = "hidden";
        const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
        const s = document.createElement("span");
        s.className = "ayo-ripple";
        Object.assign(s.style, { width: `${d}px`, height: `${d}px`, left: `${e.clientX - r.left - d / 2}px`, top: `${e.clientY - r.top - d / 2}px` });
        b.appendChild(s);
        setTimeout(() => s.remove(), 650);
    }, { passive: true });
}

// ---- Boutons principaux aimantés ----
function initMagnetic() {
    if (!FINE_POINTER) return;
    document.querySelectorAll(".cta-glow, #view-pro .flex-wrap.gap-2 > button, #pro-teaser button, [data-magnetic]").forEach(b => {
        b.classList.add("magnetic");
        b.addEventListener("mousemove", e => {
            const r = b.getBoundingClientRect();
            b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
        });
        b.addEventListener("mouseleave", () => { b.style.transform = ""; });
    });
}

// ---- Lumière qui suit le pointeur ----
function initSpotlight() {
    if (!FINE_POINTER) return;
    document.addEventListener("pointermove", e => {
        const c = e.target.closest && e.target.closest(".spot");
        if (!c) return;
        const r = c.getBoundingClientRect();
        c.style.setProperty("--sx", `${e.clientX - r.left}px`);
        c.style.setProperty("--sy", `${e.clientY - r.top}px`);
    }, { passive: true });
    const mark = () => document.querySelectorAll("#view-pro .svc-front, #view-pro .grid > div.p-4, #view-pro .grid > div.p-3\\.5, #reviews-section .grid > div, #contact-section .grid > div, #view-admin .bg-white.rounded-3xl, #view-admin .bg-white.rounded-2xl, #podium-showcase-card").forEach(c => {
        if (c.classList.contains("spot")) return;
        if (getComputedStyle(c).position === "static") c.style.position = "relative";
        c.classList.add("spot");
    });
    mark();
    setInterval(mark, 2500);
}

// ---- Taches de couleur qui suivent la souris ----
function initBlobParallax() {
    if (!FINE_POINTER) return;
    let raf = 0;
    addEventListener("mousemove", e => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
            document.querySelectorAll(".ayo-blob").forEach((b, i) => {
                const k = (i % 3 + 1) * 22;
                b.style.setProperty("--px", `${x * k}px`); b.style.setProperty("--py", `${y * k}px`);
            });
        });
    }, { passive: true });
}

// ---- Démo en direct : AYO construit un site ----
const DEMO_ICONS = {
    cake: '<path d="M4 20h16v-6H4z"/><path d="M4 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M12 4v4"/><circle cx="12" cy="3.5" r="1"/>',
    tart: '<ellipse cx="12" cy="13" rx="9" ry="4"/><path d="M3 13v2c0 2.2 4 4 9 4s9-1.8 9-4v-2"/><circle cx="9" cy="12" r="1"/><circle cx="14" cy="11.5" r="1"/>',
    bread: '<path d="M4 15c0-5 3.6-8 8-8s8 3 8 8z"/><path d="M8 11l1.5 3M12 10v4M16 11l-1.5 3"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3M16 7c0-1.5 1-2 1-3"/>',
    fish: '<path d="M3 12c3-5 10-6 15 0-5 6-12 5-15 0z"/><path d="M18 12l3-3v6z"/><circle cx="8" cy="11" r=".8"/>',
    plate: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
    shoe: '<path d="M3 16v-5l5 1 3-3 3 4 6 1.5a2 2 0 0 1 1 1.5V16z"/><path d="M3 19h19"/>',
    brush: '<rect x="4" y="9" width="16" height="6" rx="2"/><path d="M6 15v3M10 15v3M14 15v3M18 15v3"/>',
    bag: '<path d="M6 8h12l1 12H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    shirt: '<path d="M8 4l-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3c-1 1.5-2.5 2-4 2s-3-.5-4-2z"/>',
    dress: '<path d="M9 3h6l-1 5 5 13H5l5-13z"/>'
};
const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${DEMO_ICONS[k]}</svg>`;
const DEMO_SITES = [
    { kind: "pâtisserie", name: "Délices Sucrés", slug: "delices-sucres", city: "Cotonou, Haie Vive", tag: "Gâteaux d'anniversaire sur commande", brand: "#A0522D", bg: "#FBF4EA",
      items: [["Royal chocolat", "3 500", "cake", "#F4E1E6"], ["Tarte citron", "3 000", "tart", "#F6EFC9"], ["Pain au lait", "500", "bread", "#F7E3C8"]], pay: "MTN MoMo", amount: "3 500" },
    { kind: "restaurant", name: "Maquis Chez Tanti", slug: "chez-tanti", city: "Cotonou, Akpakpa", tag: "Le déjeuner livré à votre bureau", brand: "#2E6F40", bg: "#EEF5EC",
      items: [["Poulet braisé", "2 500", "plate", "#FBE7D3"], ["Amiwo", "1 500", "bowl", "#F6EFC9"], ["Ablo & poisson", "2 000", "fish", "#DDEFF0"]], pay: "Moov Money", amount: "2 500" },
    { kind: "cordonnerie", name: "Atelier Kossi", slug: "atelier-kossi", city: "Porto-Novo", tag: "Réparation de chaussures en 48 h", brand: "#3B4A6B", bg: "#EEF0F6",
      items: [["Ressemelage", "3 000", "shoe", "#E3E7F1"], ["Cirage", "500", "brush", "#F1E7D6"], ["Réparation sac", "2 500", "bag", "#EFE3DA"]], pay: "Celtiis Cash", amount: "3 000" },
    { kind: "boutique de mode", name: "Akwaba Mode", slug: "akwaba-mode", city: "Lomé, Bè", tag: "Pagnes et wax cousus sur mesure", brand: "#B5376B", bg: "#FBEFF3",
      items: [["Chemise wax", "8 000", "shirt", "#FBE3EC"], ["Robe pagne", "12 000", "dress", "#F6EFC9"], ["Sac tissé", "6 500", "bag", "#E9E0F3"]], pay: "carte bancaire", amount: "8 000" }
];
const DEMO = { idx: 0, running: false, visible: false, timers: [] };
const dWait = ms => new Promise(res => DEMO.timers.push(setTimeout(res, ms)));

function initLiveDemo() {
    const root = _getByIdSafe("ayo-live-demo");
    if (!root || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(es => es.forEach(e => {
        DEMO.visible = e.isIntersecting;
        if (DEMO.visible && !DEMO.running) runDemo();
    }), { threshold: .25 }).observe(root);
}
function demoStep(n, dur) {
    document.querySelectorAll("#demo-steps .demo-step").forEach((s, i) => {
        s.classList.toggle("is-on", i === n);
        s.classList.toggle("is-done", i < n);
        if (i === n) { s.style.setProperty("--dur", `${dur}ms`); const b = s.querySelector(".bar"); b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; }
    });
}
function moveCursor(el, press) {
    const cur = _getByIdSafe("demo-cursor"), page = _getByIdSafe("demo-page");
    if (!cur || !page || !el) return;
    const p = page.getBoundingClientRect(), r = el.getBoundingClientRect();
    cur.style.left = `${r.left - p.left + r.width / 2 - 4}px`;
    cur.style.top = `${r.top - p.top + r.height / 2 - 3}px`;
    if (press) setTimeout(() => { cur.classList.add("press"); setTimeout(() => cur.classList.remove("press"), 160); }, 900);
}
async function runDemo() {
    DEMO.running = true;
    const $ = id => _getByIdSafe(id);
    while (DEMO.visible && !document.hidden && $("demo-page") && !$("view-pro").classList.contains("hidden")) {
        const s = DEMO_SITES[DEMO.idx % DEMO_SITES.length];
        const page = $("demo-page"), url = $("demo-url-text"), cards = $("demo-cards"), toasts = $("demo-toasts");
        // remise à zéro
        page.classList.remove("built", "wipe");
        page.style.setProperty("--brand", s.brand); page.style.setProperty("--brand-bg", "#FBF7F0");
        cards.innerHTML = s.items.map((it, i) => `<div class="demo-card" style="--tint:${it[3]};--rot:${[-8, 5, -4][i]}deg"><div class="ph">${icon(it[2])}</div><strong class="block text-[11px] text-darkChoc mt-1.5 leading-tight">${it[0]}</strong><span class="block text-[10px] font-extrabold" style="color:${s.brand}">${it[1]} F</span><span class="add">+</span></div>`).join("");
        toasts.innerHTML = ""; $("demo-cart-n").textContent = "0"; url.textContent = "";
        const kind = $("demo-kind");
        if (kind && kind.textContent !== s.kind) { kind.textContent = s.kind; kind.classList.remove("flip"); void kind.offsetWidth; kind.classList.add("flip"); }
        // 1. compte : l'adresse se tape
        demoStep(0, 1100);
        const full = `ayo.io/${s.slug}`;
        for (let i = 1; i <= full.length; i++) { url.textContent = full.slice(0, i); await dWait(1000 / full.length); }
        await dWait(250);
        // 2. format : en-tête, couleurs
        demoStep(1, 1100);
        $("demo-logo").textContent = s.name[0];
        $("demo-name").textContent = s.name; $("demo-city").textContent = s.city; $("demo-tagline").textContent = s.tag;
        page.style.setProperty("--brand-bg", s.bg);
        page.classList.add("built");
        await dWait(1150);
        // 3. produits qui tombent dans la grille
        demoStep(2, 1300);
        const cs = [...cards.children];
        for (const c of cs) { c.classList.add("in"); await dWait(260); }
        await dWait(500);
        // 4. commande, paiement, message
        demoStep(3, 2600);
        const add = cs[0].querySelector(".add");
        moveCursor(add, true);
        await dWait(1000);
        add.classList.add("hit"); setTimeout(() => add.classList.remove("hit"), 250);
        const n = $("demo-cart-n"); n.textContent = "1"; n.classList.remove("pop"); void n.offsetWidth; n.classList.add("pop");
        await dWait(450);
        const toast = (txt, bg, ico) => { const t = document.createElement("div"); t.className = "demo-toast"; t.style.background = bg; t.innerHTML = `${ico}<span>${txt}</span>`; toasts.appendChild(t); requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("in"))); };
        toast(`Paiement ${s.pay} reçu, ${s.amount} FCFA`, "#2E6F40", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l5 5 9-10"/></svg>');
        await dWait(700);
        toast("Facture envoyée au client", "#231712", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h9l3 3v15H6z"/><path d="M9 11h6M9 15h6"/></svg>');
        await dWait(700);
        toast("Confirmation WhatsApp envoyée", "#1F8A4C", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l1.5-4A8 8 0 1 1 8 18.5z"/></svg>');
        moveCursor(_getByIdSafe("demo-toasts"), false);
        await dWait(1900);
        demoStep(4, 0);
        page.classList.add("wipe");
        await dWait(550);
        DEMO.idx++;
    }
    DEMO.running = false;
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && DEMO.visible && !DEMO.running) runDemo(); });
