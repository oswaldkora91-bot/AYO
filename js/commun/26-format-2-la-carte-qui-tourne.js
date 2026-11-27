// AYO — FORMAT 2 : « LA CARTE QUI TOURNE » (une création par écran, pilotée par le défilement)
// ==================== FORMAT 2 : « LA CARTE QUI TOURNE » (une création par écran, pilotée par le défilement) ====================
const SPIN = { wrap: null, stage: null, n: 0, pos: 0, active: -1, raf: 0, bound: false };

function splitIngredients(p) {
    return String(p.desc || "").replace(/\.$/, "").split(/,|\set\s|\s&\s/).map(s => s.trim()).filter(s => s.length > 2)
        .slice(0, 4).map(s => (s[0].toUpperCase() + s.slice(1)).slice(0, 26));
}
const SPIN_GARNISH = [
    `<svg viewBox="0 0 40 40"><path d="M20 3C30 10 34 22 20 37C6 22 10 10 20 3Z" fill="#4E9A43"/><path d="M20 6V34" stroke="#2F6F2A" stroke-width="1.6"/></svg>`,
    `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="13" fill="#D4A373"/><circle cx="16" cy="16" r="4" fill="#F6D99A"/></svg>`,
    `<svg viewBox="0 0 40 40"><path d="M6 24C10 10 30 8 34 18C28 30 12 34 6 24Z" fill="#C8324A"/><circle cx="16" cy="20" r="1.6" fill="#FCE3B0"/><circle cx="24" cy="17" r="1.6" fill="#FCE3B0"/></svg>`,
    `<svg viewBox="0 0 40 40"><rect x="10" y="10" width="20" height="20" rx="4" transform="rotate(20 20 20)" fill="#6B3D27"/></svg>`,
    `<svg viewBox="0 0 40 40"><path d="M20 4L24 16L36 20L24 24L20 36L16 24L4 20L16 16Z" fill="#F6D99A"/></svg>`,
    `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="15" ry="8" transform="rotate(-25 20 20)" fill="#F7A12E"/></svg>`
];

function renderSpinFormat(items) {
    const n = items.length;
    const pad = i => String(i + 1).padStart(2, "0");
    const chipPos = [[-215, -120], [205, -95], [-220, 115], [195, 140]];
    const garnishPos = [[-190, -20], [175, -150], [190, 40], [-150, 160], [30, -200], [-40, 205]];
    return `
    <div class="spin-wrap relative" style="height:${Math.max(1, n) * 78 + 30}vh">
        <div class="spin-stage sticky rounded-[2rem] overflow-hidden text-vanilla shadow-2xl">
            <div class="spin-bg absolute inset-0"></div>
            <div class="spin-grain absolute inset-0"></div>
            <div class="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-5">
                <span class="text-[10px] font-extrabold uppercase tracking-[.3em] text-brass">La carte · ${escapeHTML(appState.tenant.name)}</span>
                <span class="font-mono text-xs text-vanilla/60"><span class="spin-count inline-block text-brass font-extrabold">01</span> / ${pad(n - 1)}</span>
            </div>
            <div class="spin-body relative z-10 h-[calc(100%-110px)] flex flex-col-reverse md:grid md:grid-cols-12">
                <div class="spin-texts relative md:col-span-5 h-[46%] md:h-full">
                    ${items.map((p, i) => `
                    <div class="spin-text absolute inset-0 flex flex-col justify-center px-5 sm:px-8 md:pl-10" data-i="${i}">
                        <span class="spin-line text-[10px] font-extrabold uppercase tracking-[.25em] text-brass" style="--d:0">${escapeHTML(p.catLabel)} · ${escapeHTML(p.leadTime)}</span>
                        <h3 class="font-serif text-3xl sm:text-5xl font-bold leading-[1.02] mt-2">${escapeHTML(p.name).split(" ").map((w, k) => `<span class="spin-w"><span style="--d:${k + 1}">${w}</span></span>`).join(" ")}</h3>
                        <p class="spin-line text-xs sm:text-sm text-vanilla/70 mt-3 max-w-sm leading-relaxed" style="--d:4">${escapeHTML(p.desc)}</p>
                        <div class="spin-line flex items-center gap-3 mt-4 sm:mt-5" style="--d:5">
                            <span class="font-serif text-2xl sm:text-3xl font-extrabold text-brass">${convertFromFcfa(p.sizes[0].price)}</span>
                            <button type="button" onclick="detachPastryToPodium(${p.id}); document.getElementById('podium-showcase-card').scrollIntoView({behavior:'smooth', block:'start'})" class="bg-white/10 hover:bg-white/20 border border-white/25 px-4 py-2.5 rounded-full text-xs font-bold">Voir & choisir</button>
                            <button type="button" onclick="spinAdd(${p.id}, this)" class="spin-add bg-brass hover:bg-white text-darkChoc px-4 py-2.5 rounded-full text-xs font-extrabold">+ Ajouter</button>
                        </div>
                    </div>`).join("")}
                </div>
                <div class="spin-scene relative md:col-span-7 h-[54%] md:h-full flex items-center justify-center">
                    <div class="spin-plate"></div>
                    <div class="spin-orbit absolute inset-0 z-30 pointer-events-none">
                        ${items.map((p, i) => splitIngredients(p).map((ing, k) => `
                        <span class="spin-chip" data-i="${i}" style="--x:${chipPos[k][0]}px;--y:${chipPos[k][1]}px;--fx:${chipPos[k][0] * 3.2}px;--fy:${chipPos[k][1] * 3.2}px;--k:${k}">${escapeHTML(ing)}</span>`).join("")
                            + garnishPos.map((g, k) => `<span class="spin-garnish" data-i="${i}" style="--x:${g[0]}px;--y:${g[1]}px;--fx:${g[0] * 2.6}px;--fy:${g[1] * 2.6}px;--k:${k};--r:${(k * 67) % 360}deg">${SPIN_GARNISH[(k + i) % SPIN_GARNISH.length]}</span>`).join("")).join("")}
                    </div>
                    ${items.map((p, i) => `
                    <button type="button" class="spin-med" data-i="${i}" onclick="spinGoTo(${i}, ${p.id})" aria-label="${escapeHTML(p.name)}">
                        <img src="${p.images[0]}" alt="${escapeHTML(p.name)}" draggable="false">
                    </button>`).join("")}
                </div>
            </div>
            <div class="absolute z-10 left-5 right-5 sm:left-8 sm:right-8 bottom-4 flex items-center gap-4">
                <div class="flex items-center gap-1.5">${items.map((p, i) => `<button type="button" class="spin-dot" data-i="${i}" onclick="spinGoTo(${i})" aria-label="Aller à ${escapeHTML(p.name)}"></button>`).join("")}</div>
                <div class="flex-1 h-[2px] bg-white/10 rounded-full overflow-hidden"><div class="spin-progress h-full bg-brass origin-left"></div></div>
                <span class="spin-hint text-[10px] font-bold uppercase tracking-widest text-vanilla/50">Défilez ↓</span>
            </div>
        </div>
    </div>`;
}

function initSpin() {
    SPIN.wrap = document.querySelector("#alt-formats-layer .spin-wrap");
    SPIN.stage = SPIN.wrap?.querySelector(".spin-stage");
    SPIN.n = SPIN.wrap ? SPIN.wrap.querySelectorAll(".spin-med").length : 0;
    SPIN.active = -1;
    setSpinStick();
    if (!SPIN.bound) {
        SPIN.bound = true;
        const tick = () => { cancelAnimationFrame(SPIN.raf); SPIN.raf = requestAnimationFrame(updateSpin); };
        window.addEventListener("scroll", tick, { passive: true });
        window.addEventListener("resize", () => { setSpinStick(); tick(); });
    }
    updateSpin();
}
function setSpinStick() {
    if (!SPIN.wrap) return;
    const h = document.querySelector("header")?.offsetHeight || 50;
    const sub = document.querySelector("#view-client > nav");
    const stick = h + (sub && getComputedStyle(sub).position === "sticky" ? sub.offsetHeight : 0) + 10;
    SPIN.wrap.style.setProperty("--stick", `${stick}px`);
}
function updateSpin() {
    const { wrap, stage, n } = SPIN;
    if (!wrap || !wrap.isConnected || appState.activeFormat !== 2) return;
    const stick = parseFloat(getComputedStyle(wrap).getPropertyValue("--stick")) || 100;
    const r = wrap.getBoundingClientRect();
    const travel = Math.max(1, wrap.offsetHeight - stage.offsetHeight);
    const prog = Math.min(1, Math.max(0, (stick - r.top) / travel));
    // Maintien sur chaque création, puis bascule rapide vers la suivante
    const raw = prog * Math.max(0, n - 1), base = Math.min(Math.floor(raw), Math.max(0, n - 1));
    const f = Math.min(1, Math.max(0, (raw - base - .22) / .56));
    const pos = base + f * f * (3 - 2 * f);
    SPIN.pos = pos;
    wrap.querySelectorAll(".spin-med").forEach(m => {
        const d = Number(m.dataset.i) - pos, a = Math.abs(d);
        m.style.transform = `translate(-50%, -50%) translateX(${d * 78}%) translateY(${a * 6}%) rotate(${d * 150}deg) scale(${Math.max(.45, 1 - a * .42)})`;
        m.style.opacity = String(Math.max(0, 1 - a * .85));
        m.style.zIndex = String(20 - Math.round(a * 4));
        m.style.filter = a > .5 ? `blur(${Math.min(4, (a - .5) * 4)}px)` : "none";
    });
    const plate = wrap.querySelector(".spin-plate");
    if (plate) plate.style.transform = `translate(-50%, -50%) rotate(${pos * 150}deg)`;
    const orbit = wrap.querySelector(".spin-orbit");
    if (orbit) orbit.style.setProperty("--orbit", `${(pos % 1) * 40 - 20}deg`);
    const bar = wrap.querySelector(".spin-progress");
    if (bar) bar.style.transform = `scaleX(${n > 1 ? pos / (n - 1) : 1})`;
    const hint = wrap.querySelector(".spin-hint");
    if (hint) hint.style.opacity = prog > .97 ? "0" : "1";
    const act = Math.round(pos);
    if (act !== SPIN.active) {
        SPIN.active = act;
        wrap.querySelectorAll("[data-i]").forEach(el => el.classList.toggle("is-on", Number(el.dataset.i) === act));
        const c = wrap.querySelector(".spin-count");
        if (c) { c.textContent = String(act + 1).padStart(2, "0"); c.classList.remove("spin-flip"); void c.offsetWidth; c.classList.add("spin-flip"); }
    }
}
function spinGoTo(i, pastryId) {
    const { wrap, stage, n } = SPIN;
    if (!wrap) return;
    if (i === SPIN.active && pastryId) {
        detachPastryToPodium(pastryId);
        document.getElementById("podium-showcase-card").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }
    const stick = parseFloat(getComputedStyle(wrap).getPropertyValue("--stick")) || 100;
    const travel = Math.max(1, wrap.offsetHeight - stage.offsetHeight);
    const top = wrap.getBoundingClientRect().top + window.scrollY - stick + (n > 1 ? (i / (n - 1)) * travel : 0);
    window.scrollTo({ top: top + 2, behavior: REDUCED_MOTION ? "auto" : "smooth" });
}
function spinAdd(id, btn) {
    addToCart(id, 0);
    const med = SPIN.wrap?.querySelector(`.spin-med.is-on img`);
    if (med) flyToCart(med);
    if (btn) { btn.textContent = "✓ Ajouté"; setTimeout(() => { btn.textContent = "+ Ajouter"; }, 1400); }
}

// Vol d'une image vers une cible (panier, case du coffret)
function flyImage(srcEl, target, opts = {}) {
    if (!srcEl || !target || REDUCED_MOTION || !srcEl.animate) { opts.done && opts.done(); return; }
    const a = srcEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const size = opts.size || Math.min(a.width, a.height, 140);
    const clone = document.createElement("img");
    clone.src = srcEl.currentSrc || srcEl.src;
    clone.className = "fly-clone";
    Object.assign(clone.style, { left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px` });
    document.body.appendChild(clone);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const end = Math.max(.12, Math.min(b.width, b.height) / size);
    const anim = clone.animate([
        { transform: "translate(0,0) scale(1) rotate(0)", opacity: 1 },
        { transform: `translate(${dx * .5}px, ${dy * .5 - 120}px) scale(${(1 + end) / 2 * 1.1}) rotate(200deg)`, opacity: 1, offset: .55 },
        { transform: `translate(${dx}px, ${dy}px) scale(${end}) rotate(360deg)`, opacity: opts.fade === false ? 1 : .35 }
    ], { duration: 720, easing: "cubic-bezier(.45,0,.2,1)" });
    anim.onfinish = () => { clone.remove(); opts.done && opts.done(); };
}
function flyToCart(srcEl) {
    const target = document.getElementById("topbar-cart-count");
    flyImage(srcEl, target, { size: 90 });
}
