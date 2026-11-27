// AYO — FORMAT 4 : « COFFRET À COMPOSER » (on remplit une boîte)
// ==================== FORMAT 4 : « COFFRET À COMPOSER » (on remplit une boîte) ====================
const BOX = { size: 6, items: [] };
const BOX_TINTS = { entremets: "#F4E1E6", tartes: "#F6EFC9", viennoiseries: "#F7E3C8", coffrets: "#E9E0F3" };

function renderBoxFormat(items) {
    return `
    <div class="box-fmt grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="box-grid lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            ${items.map((p, i) => `
            <article class="box-card group relative rounded-[1.6rem] p-3 pb-4 cursor-pointer" style="--tint:${BOX_TINTS[p.category] || "#F1E7D6"};--i:${i}" onclick="boxAdd(${p.id}, this.querySelector('img'))">
                <span class="box-num absolute top-3 left-4 font-mono text-[10px] font-extrabold text-darkChoc/40">${String(i + 1).padStart(2, "0")}</span>
                <div class="box-img-wrap aspect-square rounded-full overflow-hidden mx-auto w-[82%] mt-3 shadow-[0_18px_30px_-14px_rgba(35,23,18,.5)]">
                    <img src="${p.images[0]}" alt="${escapeHTML(p.name)}" draggable="false" class="w-full h-full object-cover">
                </div>
                <h4 class="font-serif text-sm sm:text-base font-bold text-darkChoc text-center mt-3 leading-tight line-clamp-2">${escapeHTML(p.name)}</h4>
                <div class="flex items-center justify-center gap-2 mt-1.5">
                    <span class="text-xs font-extrabold text-caramel">${convertFromFcfa(p.sizes[0].price)}</span>
                    <span class="box-plus w-7 h-7 rounded-full bg-darkChoc text-brass font-extrabold flex items-center justify-center text-sm">+</span>
                </div>
            </article>`).join("")}
        </div>
        <aside class="box-panel lg:col-span-5 sticky bottom-3 lg:bottom-auto z-20" style="top:var(--stick, 120px)">
            <div id="box-panel-inner"></div>
        </aside>
    </div>`;
}

function renderBoxPanel(popIndex = -1) {
    const el = document.getElementById("box-panel-inner");
    if (!el) return;
    const cols = BOX.size === 4 ? 2 : BOX.size === 6 ? 3 : 4;
    const total = BOX.items.reduce((s, id) => s + (PASTRIES.find(p => p.id === id)?.sizes[0].price || 0), 0);
    const slot = (k, compact) => {
        const p = PASTRIES.find(x => x.id === BOX.items[k]);
        return `<button type="button" class="box-slot ${compact ? "w-9 h-9" : "aspect-square"} ${p ? "is-full" : ""} ${k === popIndex ? "box-pop" : ""}" data-slot="${k}" ${p ? `onclick="boxRemove(${k})" aria-label="Retirer ${escapeHTML(p.name)}"` : 'tabindex="-1"'}>
            ${p ? `<img src="${p.images[0]}" alt="">` : `<span>${k + 1}</span>`}
        </button>`;
    };
    const full = BOX.items.length >= BOX.size;
    el.innerHTML = `
        <div class="hidden lg:block bg-white rounded-[1.8rem] border border-beech/35 shadow-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <span class="text-[10px] font-extrabold uppercase tracking-[.25em] text-caramel">Votre coffret</span>
                    <h3 class="font-serif text-2xl font-bold text-darkChoc">Composez votre boîte</h3>
                </div>
                <div class="flex bg-vanilla rounded-full p-1 border border-beech/35">
                    ${[4, 6, 12].map(s => `<button type="button" onclick="boxSetSize(${s})" class="px-3 py-1.5 rounded-full text-xs font-extrabold ${BOX.size === s ? "bg-darkChoc text-brass" : "text-darkChoc"}">${s}</button>`).join("")}
                </div>
            </div>
            <div class="box-3d ${BOX.closing ? "is-closed" : ""}">
                <div class="box-lid"><span>${escapeHTML(appState.tenant.name)}</span></div>
                <div class="box-base grid gap-2.5 p-4" style="grid-template-columns:repeat(${cols},1fr)">
                    ${Array.from({ length: BOX.size }, (_, k) => slot(k, false)).join("")}
                </div>
            </div>
            <div class="flex items-center justify-between text-sm">
                <span class="text-cocoaSoft"><strong class="text-darkChoc">${BOX.items.length}</strong> / ${BOX.size} création${BOX.size > 1 ? "s" : ""}</span>
                <strong class="font-serif text-xl text-caramel">${convertFromFcfa(total)}</strong>
            </div>
            <button type="button" onclick="boxCommit()" ${BOX.items.length ? "" : "disabled"} class="w-full bg-darkChoc hover:bg-caramel disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-full text-sm">${full ? "Boîte complète — " : ""}Mettre le coffret au panier</button>
            <p class="text-[11px] text-cocoaSoft text-center">Touchez une création pour l'envoyer dans la boîte, touchez une case pour la retirer.</p>
        </div>
        <div class="lg:hidden bg-darkChoc text-vanilla rounded-2xl shadow-2xl border border-brass/40 p-3 flex items-center gap-3">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">${Array.from({ length: BOX.size }, (_, k) => slot(k, true)).join("")}</div>
                <span class="block text-[11px] text-vanilla/70 mt-1">${BOX.items.length}/${BOX.size} • <strong class="text-brass">${convertFromFcfa(total)}</strong> • <button type="button" onclick="boxSetSize(${BOX.size === 4 ? 6 : BOX.size === 6 ? 12 : 4})" class="underline">boîte de ${BOX.size}</button></span>
            </div>
            <button type="button" onclick="boxCommit()" ${BOX.items.length ? "" : "disabled"} class="shrink-0 bg-brass disabled:opacity-40 text-darkChoc font-extrabold px-4 py-3 rounded-full text-xs">Au panier</button>
        </div>`;
}

function visibleSlot(k) {
    return [...document.querySelectorAll(`#box-panel-inner [data-slot="${k}"]`)].find(s => s.offsetParent) || null;
}
function boxAdd(id, imgEl) {
    if (BOX.items.length >= BOX.size) {
        const panel = document.getElementById("box-panel-inner");
        panel?.classList.remove("box-shake"); void panel?.offsetWidth; panel?.classList.add("box-shake");
        showToast(`Boîte pleine (${BOX.size}) : retirez une création ou prenez une boîte plus grande.`, "info");
        return;
    }
    const k = BOX.items.length;
    const target = visibleSlot(k);
    BOX.items.push(id);
    flyImage(imgEl, target, { fade: false, done: () => renderBoxPanel(k) });
    if (REDUCED_MOTION || !target) renderBoxPanel(k);
}
function boxRemove(k) {
    BOX.items.splice(k, 1);
    renderBoxPanel();
}
function boxSetSize(s) {
    BOX.size = s;
    BOX.items = BOX.items.slice(0, s);
    renderBoxPanel();
}
function boxCommit() {
    if (!BOX.items.length) return;
    const ids = BOX.items.slice();
    window.__quietToast = true;
    ids.forEach(id => addToCart(id, 0));
    window.__quietToast = false;
    BOX.closing = true;
    renderBoxPanel();
    showToast(`Coffret de ${ids.length} création${ids.length > 1 ? "s" : ""} ajouté au panier.`, "success");
    setTimeout(() => {
        BOX.closing = false;
        BOX.items = [];
        renderBoxPanel();
        toggleCartDrawer(true);
    }, REDUCED_MOTION ? 50 : 1300);
}
function initBox() {
    setBoxStick();
    renderBoxPanel();
    if (REDUCED_MOTION || !("IntersectionObserver" in window)) { document.querySelectorAll(".box-card").forEach(c => c.classList.add("in")); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .2 });
    document.querySelectorAll(".box-card").forEach(c => io.observe(c));
}
function setBoxStick() {
    const fmt = document.querySelector("#alt-formats-layer .box-fmt");
    if (!fmt) return;
    const h = document.querySelector("header")?.offsetHeight || 50;
    const sub = document.querySelector("#view-client > nav");
    fmt.style.setProperty("--stick", `${h + (sub ? sub.offsetHeight : 0) + 14}px`);
}


function oneClickAdd(id, btn) {
    addToCart(id, 0);
    if (btn && !REDUCED_MOTION) {
        const r = btn.getBoundingClientRect();
        const dot = document.createElement("span");
        dot.className = "fmt-fly";
        dot.style.left = `${r.left + r.width / 2}px`;
        dot.style.top = `${r.top + r.height / 2}px`;
        const target = document.getElementById("topbar-cart-count").getBoundingClientRect();
        dot.style.setProperty("--dx", `${target.left - r.left - r.width / 2}px`);
        dot.style.setProperty("--dy", `${target.top - r.top - r.height / 2}px`);
        document.body.appendChild(dot);
        setTimeout(() => dot.remove(), 750);
    }
    renderAlternativeFormat();
}

function initBentoTilt() {
    if (REDUCED_MOTION || !window.matchMedia("(hover: hover)").matches) return;
    document.querySelectorAll(".fmt-bento").forEach(card => {
        card.addEventListener("mousemove", e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
            card.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
            card.style.setProperty("--my", `${(y + 0.5) * 100}%`);
        });
        card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
}

function renderFormatsAndTable() {
    const grid = document.getElementById("formats-cards-grid");
    if (grid) {
        grid.innerHTML = SITE_FORMATS.map(fmt => {
            const isActive = fmt.id === appState.activeFormat;
            return `
            <div class="bg-white rounded-3xl p-6 border ${isActive ? 'border-sage ring-2 ring-sage/25' : 'border-beech/35'} shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="bg-darkChoc text-brass text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">${fmt.badge}</span>
                        ${isActive ? '<span class="bg-sageLight text-sage text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Actif</span>' : ''}
                    </div>
                    <h3 class="font-serif text-xl font-bold text-darkChoc">${fmt.title}</h3>
                    <p class="text-xs text-cocoaSoft mt-2">${fmt.desc}</p>
                    <ul class="mt-3 space-y-1 text-xs">
                        ${fmt.highlights.map(h => `<li>✓ ${h}</li>`).join("")}
                    </ul>
                </div>
                <button type="button" onclick="applyFormat(${fmt.id}, true)" class="mt-5 w-full ${isActive ? 'bg-sage text-white' : 'bg-darkChoc hover:bg-caramel text-white'} font-extrabold py-3 rounded-xl text-xs">
                    ${isActive ? 'Format Actif — Voir Vitrine' : 'Appliquer ce Format'}
                </button>
            </div>`;
        }).join("");
    }

    const tbody = document.getElementById("params-table-body");
    if (tbody) {
        tbody.innerHTML = PARAM_ROWS.map(r => `
            <tr>
                <td class="py-3 px-4 font-bold text-darkChoc">${r.name}</td>
                <td class="py-3 px-4 ${appState.activeFormat === 1 ? 'bg-sageLight/40 font-bold' : ''}">${r.f1}</td>
                <td class="py-3 px-4 ${appState.activeFormat === 2 ? 'bg-sageLight/40 font-bold' : ''}">${r.f2}</td>
                <td class="py-3 px-4 ${appState.activeFormat === 3 ? 'bg-sageLight/40 font-bold' : ''}">${r.f3}</td>
                <td class="py-3 px-4 ${appState.activeFormat === 4 ? 'bg-sageLight/40 font-bold' : ''}">${r.f4}</td>
                <td class="py-3 px-4 ${appState.activeFormat === 5 ? 'bg-sageLight/40 font-bold' : ''}">${r.f5 || ""}</td>
                <td class="py-3 px-4 text-right"><span class="bg-sageLight text-sage font-extrabold px-2.5 py-1 rounded-full text-[10px]">${r.state}</span></td>
            </tr>`).join("");
    }
}
