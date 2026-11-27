// AYO — FORMAT 5 : LUXE EN CHAPITRES
// ==================== FORMAT 5 : LUXE EN CHAPITRES ====================
const LX = { wrap: null, raf: 0, bound: false, io: null };
const LX_CHAPTERS = [
    { name: "La révélation", head: ["L'or", "se mange."] },
    { name: "La découpe", head: ["La précision", "fait tout."] },
    { name: "La couronne", head: null },
    { name: "L'éclat", head: ["L'éclat", "du goût."] },
    { name: "Le détail", head: ["Le détail", "qui compte."] },
    { name: "L'instant", head: ["Un instant", "rare."] }
];
// Les illustrations intégrées sont des SVG : on retire leur fond et leur assiette pour que la création flotte.
function lxCutout(src) {
    if (!/^data:image\/svg\+xml/.test(src)) return null;
    try {
        const i = src.indexOf(",");
        let svg = decodeURIComponent(src.slice(i + 1));
        svg = svg.replace(/<rect width="400" height="300" fill="url\(#bg\)"\/>/, "")
            .replace(/<ellipse cx="200" cy="110" rx="200" ry="120"[^>]*\/>/, "")
            .replace(/<ellipse cx="200" cy="[\d.]+" rx="1[47]0" ry="(36|27)"[^>]*\/>/g, "")
            .replace(/<ellipse cx="200" cy="[\d.]+" rx="124" ry="17"[^>]*\/>/, "");
        return src.slice(0, i + 1) + encodeURIComponent(svg);
    } catch (e) { return null; }
}
function lxGold(n, seed) {
    let out = "";
    for (let k = 0; k < n; k++) {
        const r = (a) => { const x = Math.sin((seed + 1) * 97.13 + k * 13.7 + a * 7.1) * 10000; return x - Math.floor(x); };
        out += `<i style="--x:${(r(1) * 100).toFixed(1)}%;--s:${(8 + r(2) * 18).toFixed(0)}px;--d:${(7 + r(3) * 7).toFixed(1)}s;--w:${(-r(4) * 12).toFixed(1)}s;--dx:${((r(5) - .5) * 120).toFixed(0)}px"></i>`;
    }
    return `<div class="lx-gold" aria-hidden="true">${out}</div>`;
}
function renderLuxeFormat(items) {
    const n = items.length;
    const dots = i => `<div class="lx-dots" aria-hidden="true">${items.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>`;
    const prod = (p, slate) => {
        const cut = lxCutout(p.images[0]);
        return `<div class="lx-stage">${slate ? `<div class="lx-slate"></div>` : ""}
            <div class="lx-prod${cut ? "" : " -round"}"><img src="${cut || p.images[0]}" alt="${escapeHTML(p.name)}"></div></div>`;
    };
    const foot = p => `<div class="lx-foot">
            <button type="button" class="lx-link" onclick="lxShow(${p.id})">Découvrir — ${convertFromFcfa(p.sizes[0].price)}</button>
            <button type="button" class="lx-pill" onclick="addToCart(${p.id}, 0)">Ajouter au panier</button></div>`;
    const chapters = items.map((p, i) => {
        const c = LX_CHAPTERS[i % LX_CHAPTERS.length];
        const num = String(i + 1).padStart(2, "0");
        const over = `<span class="lx-over">Chapitre ${num} — ${c.name}</span>`;
        if (!c.head) {
            return `<section class="lx-ch -crown" data-i="${i}">${lxGold(14, i)}
                <div class="lx-crown-grid">
                    <div>${over}<h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.desc || "")}</p>${foot(p)}</div>
                    ${prod(p, true)}
                </div>
                <div class="lx-tag">Goûtez l'extraordinaire</div>${dots(i)}</section>`;
        }
        const ivory = i % 3 === 1;
        return `<section class="lx-ch${ivory ? " -ivory" : ""}" data-i="${i}">
            <div class="lx-head" aria-hidden="true"><span><b>${escapeHTML(c.head[0])}</b></span><span><b>${escapeHTML(c.head[1])}</b></span></div>
            ${over}${prod(p, !ivory)}
            <div class="lx-foot"><span class="lx-name">${escapeHTML(p.name)}</span></div>
            ${foot(p)}${lxGold(ivory ? 10 : 18, i)}${dots(i)}</section>`;
    }).join("");
    return `<div class="lx-wrap" id="lx-wrap">${chapters}
        <div class="lx-end"><h3>Goûtez<br>l'extraordinaire</h3><button type="button" class="lx-pill" onclick="toggleCartDrawer(true)">Voir mon panier</button></div></div>`;
}
function lxShow(id) {
    detachPastryToPodium(id);
    const card = document.getElementById("podium-showcase-card");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
}
function initLuxe() {
    LX.wrap = document.getElementById("lx-wrap");
    if (!LX.wrap) return;
    apMeasureTop();
    const chs = [...LX.wrap.querySelectorAll(".lx-ch")];
    if (LX.io) LX.io.disconnect();
    if ("IntersectionObserver" in window) {
        LX.io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }), { threshold: .35 });
        chs.forEach(c => LX.io.observe(c));
    } else chs.forEach(c => c.classList.add("in"));
    // Le chapitre recouvert s'assombrit et recule pendant que le suivant glisse dessus
    const tick = () => {
        LX.raf = 0;
        if (!LX.wrap || !LX.wrap.isConnected) return;
        const vh = window.innerHeight;
        chs.forEach((c, k) => {
            const next = chs[k + 1];
            let cover = 0;
            if (next) { const t = next.getBoundingClientRect().top; cover = Math.min(1, Math.max(0, 1 - t / vh)); }
            c.style.setProperty("--cover", cover.toFixed(3));
        });
    };
    LX.tick = tick;
    if (!LX.bound) {
        LX.bound = true;
        const go = () => { if (!LX.raf) LX.raf = requestAnimationFrame(() => LX.tick && LX.tick()); };
        window.addEventListener("scroll", go, { passive: true });
        window.addEventListener("resize", go);
    }
    tick();
}

// Format 1 : Éditorial chic — une double page puis une grille de portraits (photo 2 au survol)
function renderEditorialFormat(items) {
    const sel = id => appState.podiumPastryId === id;
    const [lead, ...rest] = items;
    const price = p => convertFromFcfa(p.sizes[0].price);
    const card = (p, i) => `
        <article class="ed-card${sel(p.id) ? " is-sel" : ""}" style="--i:${i}" onclick="detachPastryToPodium(${p.id})">
            <div class="ed-media">
                <img src="${p.images[0]}" alt="${escapeHTML(p.name)}" loading="lazy">
                ${p.images[1] ? `<img class="ed-alt" src="${p.images[1]}" alt="" loading="lazy">` : ""}
            </div>
            <div class="ed-cap"><h3>${escapeHTML(p.name)}</h3><span class="ed-price">${price(p)}</span></div>
            <span class="ed-cat">${escapeHTML(p.catLabel)}</span>
            <button type="button" class="ed-add" onclick="event.stopPropagation(); addToCart(${p.id}, 0)">Ajouter au panier</button>
        </article>`;
    return `
    <div class="ed-wrap" id="ed-wrap">
        <article class="ed-lead" onclick="detachPastryToPodium(${lead.id})">
            <div class="ed-lead-media"><img src="${lead.images[0]}" alt="${escapeHTML(lead.name)}"></div>
            <div>
                <span class="ed-cat">${escapeHTML(lead.catLabel)}</span>
                <h3>${escapeHTML(lead.name)}</h3>
                <p>${escapeHTML(lead.desc || "")}</p>
                <div class="ed-lead-row">
                    <span class="ed-price">${price(lead)}</span>
                    <span class="ed-lead-meta">${escapeHTML(lead.leadTime)}</span>
                    <button type="button" class="dl-btn" onclick="event.stopPropagation(); addToCart(${lead.id}, 0)">Ajouter au panier</button>
                </div>
            </div>
        </article>
        ${rest.length ? `<div class="ed-grid">${rest.map(card).join("")}</div>` : ""}
    </div>`;
}
function initEditorial() {
    const wrap = document.getElementById("ed-wrap");
    if (!wrap) return;
    if (!("IntersectionObserver" in window)) { wrap.classList.add("in"); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { wrap.classList.add("in"); io.disconnect(); } }, { threshold: .08 });
    io.observe(wrap);
    setTimeout(() => wrap.classList.add("in"), 1800);
}

// Format 4 : Commande express — liste par catégorie, bouton « + » sur la photo, panier collé en bas
function cartQtyFor(id) { return appState.cart.filter(c => c.pastryId === id).reduce((s, c) => s + c.qty, 0); }
function renderAppFormat(items) {
    const sel = id => appState.podiumPastryId === id;
    const groups = [];
    items.forEach(p => {
        let g = groups.find(x => x.label === p.catLabel);
        if (!g) groups.push(g = { label: p.catLabel, items: [] });
        g.items.push(p);
    });
    const hours = items.map(p => parseInt((String(p.leadTime).match(/(\d+)\s*h/) || [])[1], 10)).filter(h => h > 0);
    const fastest = hours.length ? `Prêt dès ${Math.min(...hours)} h` : "Fait à la commande";
    const row = p => {
        const q = cartQtyFor(p.id);
        return `
        <article class="ap-item${sel(p.id) ? " is-sel" : ""}" onclick="detachPastryToPodium(${p.id})">
            <div class="ap-txt">
                <h4>${escapeHTML(p.name)}</h4>
                <p>${escapeHTML(p.desc || "")}</p>
                <div class="ap-meta"><b>${convertFromFcfa(p.sizes[0].price)}</b><span class="ap-lead">${escapeHTML(p.leadTime)}</span></div>
            </div>
            <div class="ap-img">
                <img src="${p.images[0]}" alt="${escapeHTML(p.name)}" loading="lazy">
                <span class="ap-qty${q ? " on" : ""}" data-qty-for="${p.id}" aria-label="${q} dans le panier">${q || ""}</span>
                <button type="button" class="ap-plus" aria-label="Ajouter ${escapeHTML(p.name)} au panier" onclick="event.stopPropagation(); addToCart(${p.id}, 0); apPop(this)">+</button>
            </div>
        </article>`;
    };
    return `
    <div class="ap-wrap">
        <div class="ap-info">
            <span><i data-lucide="timer"></i>${escapeHTML(fastest)}</span>
            <span><i data-lucide="bike"></i>Retrait ou livraison</span>
            <span><i data-lucide="smartphone"></i>Mobile Money accepté</span>
        </div>
        ${groups.map(g => `
        <section>
            <h3 class="ap-h">${escapeHTML(g.label)} <span>${g.items.length}</span></h3>
            <div class="ap-grid">${g.items.map(row).join("")}</div>
        </section>`).join("")}
    </div>`;
}
function apPop(btn) { btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop"); setTimeout(() => btn.classList.remove("pop"), 220); }
function refreshAppCart() {
    document.querySelectorAll(".ap-qty[data-qty-for]").forEach(el => {
        const q = cartQtyFor(parseInt(el.dataset.qtyFor, 10));
        el.textContent = q || "";
        el.classList.toggle("on", q > 0);
    });
    const bar = document.getElementById("ap-cartbar");
    if (!bar) return;
    const n = appState.cart.reduce((s, c) => s + c.qty, 0);
    const total = appState.cart.reduce((s, c) => s + c.qty * c.priceFcfa, 0);
    bar.classList.toggle("has-items", n > 0);
    document.getElementById("ap-cb-n").textContent = n;
    document.getElementById("ap-cb-total").textContent = n ? convertFromFcfa(total) : "";
}
const _renderCartUI_ss = renderCartUI;
renderCartUI = function () { _renderCartUI_ss.apply(this, arguments); refreshAppCart(); };

// Mini-aperçus des 4 modèles dans la galerie du back-office
const _templatePreview_ss = templatePreview;
templatePreview = function (id) {
    const imgs = PASTRIES.filter(p => p.available !== false).map(p => p.images[0]);
    const im = (i, cls, st = "") => imgs.length
        ? `<img src="${imgs[i % imgs.length]}" alt="" class="${cls} object-cover" style="${st}">`
        : `<div class="${cls} bg-gradient-to-br from-beech/30 to-brass/30" style="${st}"></div>`;
    if (id === 1) {
        return `<div class="h-full bg-white grid grid-cols-5 gap-2 p-3 items-center" style="font-family:Jost,sans-serif">
            ${im(0, "col-span-3 w-full h-full")}
            <div class="col-span-2 space-y-1.5"><div class="text-[9px] text-neutral-500">Collection</div><div class="text-[13px] leading-tight text-black font-light">Une pièce, une page</div><div class="h-px bg-black"></div><div class="text-[9px] text-black underline">Ajouter</div></div></div>`;
    }
    if (id === 2) {
        return `<div class="h-full relative overflow-hidden" style="background:#C8324A">
            <div class="absolute left-3 top-3 text-[13px] font-bold leading-tight" style="font-family:'Playfair Display',serif;color:#FBF4E6">Une création<br>par écran</div>
            ${im(0, "absolute w-20 h-20 rounded-full", "right:18px;top:24px;border:4px solid #FBF4E6")}
            ${im(1, "absolute w-12 h-12 rounded-full", "left:22px;bottom:14px;border:3px solid #FBF4E6")}
            <span class="absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-extrabold" style="background:#F6D99A;color:#231712;rotate:-10deg">−10%</span></div>`;
    }
    if (id === 3) return _templatePreview_ss(1);
    if (id === 5) {
        const p0 = PASTRIES.find(p => p.available !== false);
        const src = p0 ? (lxCutout(p0.images[0]) || p0.images[0]) : "";
        return `<div class="h-full relative overflow-hidden flex items-center justify-center" style="background:#2A0E14">
            <div class="absolute inset-x-0 text-center leading-[.85] uppercase" style="top:22%;font-family:'Bodoni Moda',Georgia,serif;font-size:34px;color:#6E2733">L'or<br>se mange.</div>
            ${src ? `<img src="${src}" alt="" class="relative w-36 h-28 object-contain" style="filter:drop-shadow(0 12px 12px rgba(0,0,0,.5))">` : ""}
            ${[12, 30, 64, 80, 46, 90].map((x, k) => `<i class="absolute block" style="left:${x}%;top:${[18, 60, 12, 40, 78, 70][k]}%;width:9px;height:7px;background:linear-gradient(135deg,#FBEBA8,#C8A15A);clip-path:polygon(12% 8%,58% 0,96% 22%,84% 62%,100% 92%,46% 100%,4% 78%)"></i>`).join("")}
            <span class="absolute top-2.5 left-0 right-0 text-center text-[8px] tracking-[.2em] text-[#F3EEE6]">CHAPITRE 01 — LA RÉVÉLATION</span></div>`;
    }
    return `<div class="h-full bg-white p-2 space-y-1" style="font-family:'Nunito Sans',sans-serif">
        <div class="flex gap-1"><span class="px-2 py-0.5 rounded-full bg-black text-white text-[8px] font-bold">Tout</span><span class="px-2 py-0.5 rounded-full bg-neutral-100 text-[8px] font-bold">Tartes</span><span class="px-2 py-0.5 rounded-full bg-neutral-100 text-[8px] font-bold">Coffrets</span></div>
        ${[0, 1].map(i => `<div class="flex items-center gap-2 rounded-lg border border-neutral-200 p-1"><div class="flex-1"><div class="h-1.5 w-16 bg-neutral-800 rounded"></div><div class="h-1 w-20 bg-neutral-200 rounded mt-1"></div></div>${im(i, "w-7 h-7 rounded-md")}</div>`).join("")}
        <div class="rounded-full text-white text-[9px] font-extrabold px-2.5 py-1 flex justify-between" style="background:#009E81"><span>Voir le panier</span><span>2</span></div></div>`;
};
