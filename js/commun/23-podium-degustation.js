// AYO — PODIUM DÉGUSTATION
// ==================== PODIUM DÉGUSTATION ====================
function detachPastryToPodium(pastryId) {
    const pastry = PASTRIES.find(p => p.id === pastryId);
    if (!pastry) return;
    appState.podiumPastryId = pastry.id;
    appState.podiumPortionIdx = 0;
    appState.podiumImageIdx = 0;
    saveAppState();
    renderMobilePills();
    if (appState.activeFormat === IMM_FMT) {
        centerOnPastry(pastry.id);
        if (document.getElementById("arc-track")) { refreshArcSelection(); layoutArc(); }
        else renderArcCarousel();
    } else renderAlternativeFormat();
    renderPodiumShowcase();

    const card = document.getElementById("podium-showcase-card");
    card.classList.remove("podium-detach-anim");
    void card.offsetWidth;
    card.classList.add("podium-detach-anim");
}

function renderPodiumShowcase() {
    const avail = PASTRIES.filter(p => p.available !== false);
    const pastry = avail.find(p => p.id === appState.podiumPastryId) || avail[0];
    const podiumCard = document.getElementById("podium-showcase-card");
    podiumCard.classList.toggle("hidden", !pastry);
    if (!pastry) return;
    const portion = pastry.sizes[appState.podiumPortionIdx] || pastry.sizes[0];
    const imgSrc = pastry.images[appState.podiumImageIdx] || pastry.images[0];
    const stock = appState.stocks[pastry.ingredientIdx] || appState.stocks[0];

    document.getElementById("podium-lead-badge").textContent = pastry.leadTime;
    document.getElementById("podium-category").textContent = pastry.catLabel;
    document.getElementById("podium-stock-info").textContent = stock && pastry.recipeBom?.length ? `Stock matière : ${stock.qty} ${stock.unit}` : "";
    document.getElementById("podium-title").textContent = pastry.name;
    document.getElementById("podium-desc").textContent = pastry.desc;
    document.getElementById("podium-allergens").textContent = `${pastry.allergens} • Délai : ${pastry.leadTime}`;
    document.getElementById("podium-img").src = imgSrc;
    document.getElementById("podium-img").alt = pastry.name;
    document.getElementById("podium-price").textContent = convertFromFcfa(portion.price);
    document.getElementById("podium-equiv-price").textContent =
        appState.currency === "FCFA"
            ? `≈ ${(portion.price / EUR_RATE).toFixed(2)} € • ${(portion.price / USD_RATE).toFixed(2)} $`
            : `Tarif de base : ${formatFcfaOnly(portion.price)}`;

    // Multi-view gallery thumbnails
    document.getElementById("podium-gallery-thumbs").innerHTML = pastry.images.map((src, idx) => `
        <button type="button" onclick="appState.podiumImageIdx=${idx}; saveAppState(); renderPodiumShowcase();"
            class="w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === appState.podiumImageIdx ? 'border-darkChoc scale-105' : 'border-beech/35 opacity-75'}">
            <img src="${src}" alt="Vue ${idx + 1}" class="w-full h-full object-cover">
        </button>`).join("");

    // Portion selector (Individuel, 4 parts, 6 parts, 8 parts)
    document.getElementById("podium-portions-row").innerHTML = pastry.sizes.map((sz, idx) => {
        const selected = idx === appState.podiumPortionIdx;
        return `
        <button type="button" onclick="appState.podiumPortionIdx=${idx}; saveAppState(); renderPodiumShowcase();"
            class="px-3 py-2.5 rounded-xl text-left text-xs font-bold border transition-all ${selected ? 'bg-darkChoc text-brass border-darkChoc shadow' : 'bg-vanilla text-darkChoc border-beech/35 hover:border-brass'}">
            <span class="block">${escapeHTML(sz.label)}</span>
            <span class="text-[10px] opacity-85">${convertFromFcfa(sz.price)}</span>
        </button>`;
    }).join("");

    document.getElementById("podium-add-to-cart-btn").onclick = () => {
        const plaque = document.getElementById("podium-plaque-text").value.trim();
        const giftOpt = document.getElementById("podium-gift-option").value;
        addToCart(pastry.id, appState.podiumPortionIdx, plaque, giftOpt);
        document.getElementById("podium-plaque-text").value = "";
    };
}
