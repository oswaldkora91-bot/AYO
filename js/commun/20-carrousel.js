// AYO — CARROUSEL
// ==================== CARROUSEL ====================
let wheelAngle = 0;

function getFilteredPastries() {
    const avail = PASTRIES.filter(p => p.available !== false);
    return appState.activeCategory === "all"
        ? avail
        : avail.filter(p => p.category === appState.activeCategory);
}

function filterCategory(cat) {
    appState.activeCategory = cat;
    carouselPos = Math.floor((getFilteredPastries().length - 1) / 2);
    saveAppState();
    document.querySelectorAll(".cat-btn").forEach(btn => {
        const active = btn.dataset.cat === cat;
        btn.className = active
            ? "cat-btn px-4 py-2 rounded-full text-xs font-bold bg-darkChoc text-brass shadow-sm"
            : "cat-btn px-4 py-2 rounded-full text-xs font-semibold bg-white text-darkChoc border border-beech/35";
    });
    renderMobilePills();
    if (appState.activeFormat === IMM_FMT) renderArcCarousel();
    else renderAlternativeFormat();
}

function renderMobilePills() {
    const box = document.getElementById("mobile-quick-selector");
    if (!box) return;
    box.innerHTML = getFilteredPastries().map(p => {
        const active = appState.podiumPastryId === p.id;
        return `<button type="button" onclick="detachPastryToPodium(${p.id})"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all ${active ? 'bg-darkChoc text-brass border-darkChoc' : 'bg-white text-darkChoc border-beech/40'}">
            ${escapeHTML(p.name.split(" ")[0])} ${escapeHTML(p.name.split(" ")[1] || "")}
        </button>`;
    }).join("");
}

let carouselPos = 0;

function centerOnPastry(pastryId) {
    const idx = getFilteredPastries().findIndex(p => p.id === pastryId);
    if (idx >= 0) carouselPos = idx;
}
