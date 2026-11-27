// AYO — FORMAT 1 : « VITRINE IMMERSIVE »
// ==================== FORMAT 1 : « VITRINE IMMERSIVE » ====================
// Un plat au centre, en grand. Il change avec un travelling (l'ancien vient vers vous, le nouveau sort de la profondeur).
// Un clic sur le plat vous fait entrer dedans (plein écran). Toutes les créations restent sur une ligne en perspective en bas.
const IMM = { active: -1, n: 0, timers: [] };

function renderArcCarousel() {
    const layer = document.getElementById("arc-hangers-layer");
    if (!layer) return;
    const items = getFilteredPastries();
    IMM.active = -1;
    if (items.length === 0) { layer.innerHTML = `<div class="bg-white h-full">${emptyShopHtml()}</div>`; return; }
    carouselPos = Math.max(0, Math.min(items.length - 1, Math.round(carouselPos)));
    IMM.n = items.length;
    const sparks = Array.from({ length: 16 }, (_, k) => `<span style="--k:${k};--x:${(k * 37) % 100}%;--s:${4 + (k * 7) % 6}px;--t:${5 + (k * 3) % 5}s"></span>`).join("");
    layer.innerHTML = `
    <div id="arc-track" class="imm">
        <div class="imm-bg">${items.map((p, i) => `<img data-i="${i}" src="${p.images[0]}" alt="" draggable="false">`).join("")}</div>
        <div class="imm-vignette"></div>
        <div class="imm-texts">
            ${items.map((p, i) => `
            <div class="imm-text" data-i="${i}">
                <span class="imm-l text-[11px] font-extrabold tracking-[.18em] text-brass" style="--d:0">${escapeHTML(p.catLabel)}</span>
                <h3 class="imm-title font-serif font-bold text-vanilla" aria-label="${escapeHTML(p.name)}">${(() => { let c = 0; return p.name.split(" ").map(w => `<span class="imm-word">${[...w].map(ch => `<span class="imm-ch" style="--c:${c++}">${escapeHTML(ch)}</span>`).join("")}</span>`).join(" "); })()}</h3>
                <p class="imm-l text-sm text-vanilla/75 leading-relaxed max-w-sm" style="--d:3">${escapeHTML(p.desc)}</p>
                <div class="imm-l flex items-center gap-3 flex-wrap" style="--d:4">
                    <span class="imm-price font-serif text-3xl font-extrabold text-brass" data-price="${p.sizes[0].price}">${convertFromFcfa(p.sizes[0].price)}</span>
                    <span class="text-[11px] font-bold text-vanilla/70 border border-white/20 rounded-full px-2.5 py-1">${escapeHTML(p.leadTime)}</span>
                </div>
                <div class="imm-l flex items-center gap-2 flex-wrap" style="--d:5">
                    <button type="button" onclick="event.stopPropagation(); immOpen(${i})" class="imm-btn bg-brass hover:bg-white text-darkChoc font-extrabold px-5 py-3 rounded-full text-xs">Entrer dans le plat</button>
                    <button type="button" onclick="event.stopPropagation(); immAdd(${p.id})" class="imm-btn bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold px-5 py-3 rounded-full text-xs">+ Ajouter au panier</button>
                </div>
            </div>`).join("")}
        </div>
        <div class="imm-scene">
            <div class="imm-halo"></div>
            <div class="imm-ring"></div>
            <div class="imm-sparks">${sparks}</div>
            ${items.map((p, i) => `
            <button type="button" class="imm-dish" data-i="${i}" onclick="if (wheelDragDistance < 8) immOpen(${i})" aria-label="Entrer dans ${escapeHTML(p.name)}">
                <span class="imm-tilt"><span class="imm-float"><img src="${p.images[0]}" alt="${escapeHTML(p.name)}" draggable="false"><span class="imm-shine"></span></span></span>
            </button>`).join("")}
            <span class="imm-zoom-hint">Cliquez pour entrer dans le plat</span>
        </div>
        <div class="imm-rail">
            ${items.map((p, idx) => `
            <div class="arc-card imm-card" data-idx="${idx}" data-id="${p.id}" onclick="onArcCardClick(${idx}, ${p.id})">
                <div class="arc-card-inner"><img src="${p.images[0]}" alt="${escapeHTML(p.name)}" draggable="false"><span class="arc-shade"></span></div>
                <span class="imm-card-name">${escapeHTML(p.name)}</span>
            </div>`).join("")}
        </div>
        <div class="imm-hud">
            <span class="imm-count font-mono text-xs text-vanilla/60"><b class="text-brass">01</b> / ${String(items.length).padStart(2, "0")}</span>
            <span class="imm-prog"><i></i></span>
        </div>
    </div>`;
    refreshArcSelection();
    layoutArc();
    initImmPointer();
}

function refreshArcSelection() {
    document.querySelectorAll("#arc-track .arc-card").forEach(card => {
        card.classList.toggle("is-picked", Number(card.dataset.id) === appState.podiumPastryId);
    });
}

function layoutArc() {
    const stage = document.getElementById("arc-wheel-stage");
    const track = document.getElementById("arc-track");
    if (!stage || !track) return;
    const w = stage.clientWidth || 1024;
    const mobile = w < 640;
    const gap = mobile ? 70 : 104;
    track.querySelectorAll(".imm-card").forEach(card => {
        const o = Number(card.dataset.idx) - carouselPos, a = Math.abs(o);
        const x = o * gap + Math.sign(o) * Math.min(a, 1) * (mobile ? 14 : 26);
        const rot = -Math.max(-1, Math.min(1, o)) * 38;
        const z = -Math.min(a, 3) * 70;
        const lift = a < .5 ? (mobile ? -10 : -16) : 0;
        card.style.transform = `translateX(${x.toFixed(1)}px) translateY(${lift}px) translateZ(${z.toFixed(1)}px) rotateY(${rot.toFixed(1)}deg) scale(${a < .5 ? 1.12 : 1})`;
        card.style.zIndex = String(100 - Math.round(a * 10));
        card.style.opacity = a > 4.5 ? "0" : String(Math.max(.25, 1 - a * .16));
        card.style.pointerEvents = a > 4.5 ? "none" : "auto";
        card.classList.toggle("is-center", a < .5);
    });
    const act = Math.max(0, Math.min(IMM.n - 1, Math.round(carouselPos)));
    if (act !== IMM.active) immShow(act);
}

function immShow(i) {
    const track = document.getElementById("arc-track");
    if (!track) return;
    const prev = IMM.active, dir = prev < 0 ? 1 : (i > prev ? 1 : -1);
    IMM.active = i;
    const dishes = track.querySelectorAll(".imm-dish");
    const old = prev >= 0 ? dishes[prev] : null, cur = dishes[i];
    if (old && old !== cur) {
        old.classList.remove("is-on", "out-front", "out-back");
        old.classList.add(dir > 0 ? "out-front" : "out-back");
        setTimeout(() => old.classList.remove("out-front", "out-back"), 1300);
    }
    if (cur) {
        cur.classList.remove("out-front", "out-back", "is-on");
        cur.style.transition = "none";
        cur.classList.add(dir > 0 || prev < 0 ? "from-back" : "from-front");
        void cur.offsetWidth;
        cur.style.transition = "";
        cur.classList.remove("from-back", "from-front");
        cur.classList.add("is-on");
    }
    track.querySelectorAll(".imm-bg img, .imm-text").forEach(el => el.classList.toggle("is-on", Number(el.dataset.i) === i));
    const price = track.querySelector(`.imm-text[data-i="${i}"] .imm-price`);
    if (price) countUp(price, Number(price.dataset.price), v => convertFromFcfa(Math.round(v / 50) * 50));
    const c = track.querySelector(".imm-count b");
    if (c) { c.textContent = String(i + 1).padStart(2, "0"); c.classList.remove("spin-flip"); void c.offsetWidth; c.classList.add("spin-flip"); }
    const bar = track.querySelector(".imm-prog i");
    if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
    track.classList.remove("pulse"); void track.offsetWidth; track.classList.add("pulse");
}

function onArcCardClick(idx, pastryId) {
    if (wheelDragDistance >= 8) return;
    if (Math.round(carouselPos) === idx) { immOpen(idx); return; }
    carouselPos = idx;
    layoutArc();
}

function immAdd(id) {
    addToCart(id, 0);
    const img = document.querySelector("#arc-track .imm-dish.is-on img");
    if (img && typeof flyToCart === "function") flyToCart(img);
}

// Inclinaison du plat et profondeur du décor selon la souris
function initImmPointer() {
    const stage = document.getElementById("arc-wheel-stage");
    if (!stage || stage.dataset.immPointer || REDUCED_MOTION) return;
    stage.dataset.immPointer = "1";
    let raf = 0;
    stage.addEventListener("mousemove", e => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            const r = stage.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            stage.style.setProperty("--mx", x.toFixed(3));
            stage.style.setProperty("--my", y.toFixed(3));
        });
    });
    stage.addEventListener("mouseleave", () => { stage.style.setProperty("--mx", 0); stage.style.setProperty("--my", 0); stage.classList.remove("hover-dish"); });
    stage.addEventListener("mouseover", e => stage.classList.toggle("hover-dish", !!e.target.closest(".imm-dish.is-on")));
}

// ---- Entrer dans le plat : l'image s'agrandit jusqu'à remplir l'écran ----
function immOpen(i) {
    const items = getFilteredPastries(), p = items[i];
    if (!p) return;
    if (Math.round(carouselPos) !== i) { carouselPos = i; layoutArc(); }
    autoplayPaused = true;
    const srcImg = document.querySelector(`#arc-track .imm-dish[data-i="${i}"] img`) || document.querySelector(`#arc-track .imm-card[data-idx="${i}"] img`);
    const r = srcImg ? srcImg.getBoundingClientRect() : { left: innerWidth / 2 - 100, top: innerHeight / 2 - 100, width: 200, height: 200 };
    document.getElementById("imm-overlay")?.remove();
    const ings = typeof splitIngredients === "function" ? splitIngredients(p) : [];
    const ov = document.createElement("div");
    ov.id = "imm-overlay";
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", p.name);
    ov.innerHTML = `
        <div class="imo-shade"></div>
        <div class="imo-frame"><div class="imo-ken"><img src="${p.images[0]}" alt="${escapeHTML(p.name)}"></div></div>
        <div class="imo-grad"></div>
        <div class="imo-sparks">${Array.from({ length: 22 }, (_, k) => `<span style="--k:${k};--x:${(k * 41) % 100}%;--s:${3 + (k * 5) % 7}px;--t:${6 + (k * 3) % 6}s"></span>`).join("")}</div>
        <button type="button" class="imo-close" onclick="immClose()" aria-label="Fermer">×</button>
        <div class="imo-content">
            <span class="imo-l text-xs font-extrabold tracking-[.2em] text-brass" style="--d:0">${escapeHTML(p.catLabel)}</span>
            <h2 class="imo-title font-serif font-bold text-white">${escapeHTML(p.name).split(" ").map((w, k) => `<span class="w-mask"><span class="w-in" style="--w:${k}">${w}</span></span>`).join(" ")}</h2>
            <p class="imo-l text-base text-white/80 max-w-lg leading-relaxed" style="--d:3">${escapeHTML(p.desc)}</p>
            <div class="imo-l flex flex-wrap gap-2" style="--d:4">${ings.map((g, k) => `<span class="imo-chip" style="--k:${k}">${escapeHTML(g)}</span>`).join("")}</div>
            <div class="imo-l flex flex-wrap items-center gap-3" style="--d:5">
                <span class="font-serif text-4xl font-extrabold text-brass">${convertFromFcfa(p.sizes[0].price)}</span>
                <span class="text-xs font-bold text-white/75 border border-white/25 rounded-full px-3 py-1.5">${escapeHTML(p.leadTime)}</span>
                <span class="imo-allerg text-xs font-bold text-white/75 border border-white/25 rounded-full px-3 py-1.5">Allergènes : ${escapeHTML(p.allergens || "à préciser")}</span>
            </div>
            <div class="imo-l flex flex-wrap gap-2" style="--d:6">
                <button type="button" onclick="immClose(); detachPastryToPodium(${p.id}); setTimeout(() => document.getElementById('podium-showcase-card')?.scrollIntoView({behavior:'smooth', block:'start'}), 650)" class="bg-brass hover:bg-white text-darkChoc font-extrabold px-6 py-3.5 rounded-full text-sm">Choisir mes parts</button>
                <button type="button" onclick="immAdd(${p.id}); this.textContent='Ajouté au panier'" class="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-6 py-3.5 rounded-full text-sm">+ Ajouter au panier</button>
            </div>
        </div>
        <div class="imo-nav">
            <button type="button" onclick="immStep(-1)" aria-label="Plat précédent" ${i === 0 ? "disabled" : ""}>‹</button>
            <span>${i + 1} / ${items.length}</span>
            <button type="button" onclick="immStep(1)" aria-label="Plat suivant" ${i === items.length - 1 ? "disabled" : ""}>›</button>
        </div>`;
    ov.dataset.i = i;
    document.body.appendChild(ov);
    document.documentElement.classList.add("imm-lock");
    const frame = ov.querySelector(".imo-frame");
    const from = { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: "50%" };
    const to = { left: "0px", top: "0px", width: `${innerWidth}px`, height: `${immFrameH()}px`, borderRadius: "0px" };
    ov.dataset.from = JSON.stringify(from);
    if (REDUCED_MOTION || !frame.animate) { Object.assign(frame.style, to); ov.classList.add("open"); return; }
    Object.assign(frame.style, from);
    const anim = frame.animate([from, { ...to, offset: 1 }], { duration: 1150, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" });
    requestAnimationFrame(() => ov.classList.add("open"));
    anim.onfinish = () => { Object.assign(frame.style, to); anim.cancel(); ov.classList.add("settled"); ov.querySelector(".imo-title")?.classList.add("split-in"); };
    setTimeout(() => ov.querySelector(".imo-close")?.focus({ preventScroll: true }), 1200);
}
function immFrameH() { return innerWidth < 768 ? Math.round(innerHeight * .56) : innerHeight; }
function immClose() {
    const ov = document.getElementById("imm-overlay");
    if (!ov || ov.classList.contains("closing")) return;
    ov.classList.add("closing"); ov.classList.remove("open", "settled");
    document.documentElement.classList.remove("imm-lock");
    const frame = ov.querySelector(".imo-frame");
    const i = Number(ov.dataset.i);
    const target = document.querySelector(`#arc-track .imm-dish[data-i="${i}"] img`);
    const r = target && target.offsetParent ? target.getBoundingClientRect() : null;
    const to = r ? { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: "50%", opacity: 1 } : { opacity: 0 };
    if (REDUCED_MOTION || !frame.animate) { ov.remove(); autoplayPaused = false; return; }
    const a = frame.animate([{ left: frame.style.left, top: frame.style.top, width: frame.style.width, height: frame.style.height, borderRadius: "0px", opacity: 1 }, to], { duration: 850, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" });
    a.onfinish = () => { ov.remove(); autoplayPaused = false; };
}
function immStep(d) {
    const ov = document.getElementById("imm-overlay");
    if (!ov) return;
    const n = getFilteredPastries().length, i = Math.max(0, Math.min(n - 1, Number(ov.dataset.i) + d));
    carouselPos = i; layoutArc();
    ov.classList.add("swap");
    setTimeout(() => { ov.remove(); immOpenInstant(i); }, 380);
}
function immOpenInstant(i) {
    immOpen(i);
    const ov = document.getElementById("imm-overlay");
    if (!ov) return;
    ov.getAnimations({ subtree: true }).forEach(a => a.finish());
}
document.addEventListener("keydown", e => {
    if (!document.getElementById("imm-overlay")) return;
    if (e.key === "Escape") immClose();
    if (e.key === "ArrowRight") { e.stopImmediatePropagation(); immStep(1); }
    if (e.key === "ArrowLeft") { e.stopImmediatePropagation(); immStep(-1); }
}, true);
window.addEventListener("resize", () => {
    const ov = document.getElementById("imm-overlay"), f = ov?.querySelector(".imo-frame");
    if (f && ov.classList.contains("settled")) Object.assign(f.style, { width: `${innerWidth}px`, height: `${immFrameH()}px` });
});

function spinWheel(dir) {
    const n = getFilteredPastries().length;
    carouselPos = Math.max(0, Math.min(n - 1, Math.round(carouselPos) + dir));
    layoutArc();
}

function initWheelGestures() {
    const stage = document.getElementById("arc-wheel-stage");
    if (!stage) return;
    let startPos = 0;
    const unit = () => (stage.clientWidth < 560 ? 115 : 190);
    const onStart = x => { isWheelDragging = true; wheelDragStartX = x; startPos = carouselPos; wheelDragDistance = 0; };
    const onMove = x => {
        if (!isWheelDragging) return;
        const dx = x - wheelDragStartX;
        wheelDragDistance = Math.abs(dx);
        if (wheelDragDistance > 4) stage.classList.add("dragging");
        const n = getFilteredPastries().length;
        carouselPos = Math.max(-0.4, Math.min(n - 0.6, startPos - dx / unit()));
        layoutArc();
    };
    const onEnd = () => {
        if (!isWheelDragging) return;
        isWheelDragging = false;
        stage.classList.remove("dragging");
        const n = getFilteredPastries().length;
        carouselPos = Math.max(0, Math.min(n - 1, Math.round(carouselPos)));
        layoutArc();
        setTimeout(() => { wheelDragDistance = 0; }, 50);
    };
    stage.addEventListener("mousedown", e => onStart(e.clientX));
    window.addEventListener("mousemove", e => onMove(e.clientX));
    window.addEventListener("mouseup", onEnd);
    stage.addEventListener("touchstart", e => { if (e.touches[0]) onStart(e.touches[0].clientX); }, { passive: true });
    stage.addEventListener("touchmove", e => { if (e.touches[0]) onMove(e.touches[0].clientX); }, { passive: true });
    stage.addEventListener("touchend", onEnd);
    window.addEventListener("resize", () => { if (appState.activeFormat === IMM_FMT) layoutArc(); });
    document.addEventListener("keydown", e => {
        if (appState.activeFormat !== IMM_FMT || document.getElementById("view-client").classList.contains("hidden")) return;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
        if (e.key === "ArrowLeft") spinWheel(-1);
        if (e.key === "ArrowRight") spinWheel(1);
    });
}

function setCurrency(curr) {
    if (!CURRENCY_META[curr]) return;
    appState.currency = curr;
    saveAppState();
    updateCurrencyButtonsUI();
    renderAll();
}
