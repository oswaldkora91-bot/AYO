// AYO — 4 DYNAMIC SITE FORMATS
// ==================== 4 DYNAMIC SITE FORMATS ====================
function applyFormat(formatId, goToStorefront = true) {
    const fmt = SITE_FORMATS.find(f => f.id === formatId);
    if (!fmt) return;
    appState.activeFormat = fmt.id;
    saveAppState();

    document.getElementById("topbar-format-chip").textContent = fmt.title;
    document.getElementById("hero-format-badge").textContent = fmt.badge;
    document.getElementById("hero-format-name").textContent = fmt.title;

    document.querySelectorAll(".fmt-pill").forEach(btn => {
        const active = parseInt(btn.dataset.fmtBtn, 10) === fmt.id;
        btn.className = active
            ? "fmt-pill px-3 py-1.5 rounded-xl text-[11px] font-bold bg-darkChoc text-brass"
            : "fmt-pill px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-vanilla text-darkChoc border border-beech/30";
    });

    const wheelStage = document.getElementById("arc-wheel-stage");
    const wheelArrows = document.getElementById("wheel-nav-arrows");
    const altLayer = document.getElementById("alt-formats-layer");

    applySiteStyle(fmt.id);
    if (fmt.id === IMM_FMT) {
        wheelStage.classList.remove("hidden");
        wheelArrows.classList.remove("hidden");
        altLayer.classList.add("hidden");
        renderArcCarousel();
    } else {
        wheelStage.classList.add("hidden");
        wheelArrows.classList.add("hidden");
        altLayer.classList.remove("hidden");
        renderAlternativeFormat();
    }

    renderFormatsAndTable();
    if (goToStorefront) {
        switchView("client");
        showToast(`Format "${fmt.title}" activé en direct.`, "success");
    }
}

function renderAlternativeFormat() {
    const altLayer = document.getElementById("alt-formats-layer");
    const items = getFilteredPastries();
    const sig = `${appState.activeFormat}|${appState.activeCategory}|${items.map(p => p.id).join(",")}`;
    altLayer.classList.toggle("no-enter", altLayer.dataset.sig === sig);
    altLayer.dataset.sig = sig;
    if (items.length === 0) { altLayer.innerHTML = `<div class="bg-white rounded-3xl border border-beech/35">${emptyShopHtml(true)}</div>`; return; }
    const sel = id => appState.podiumPastryId === id;

    if (appState.activeFormat === 2) {
        // Format 2 : La carte qui tourne — une création par écran, pilotée par le défilement
        altLayer.innerHTML = renderSpinFormat(items);
        initSpin();
        return;
    }

    if (appState.activeFormat === 1) {
        // Format 1 : Éditorial chic — double page puis grille de portraits
        altLayer.innerHTML = renderEditorialFormat(items);
        initEditorial();
        return;
    }

    if (appState.activeFormat === 5) {
        // Format 5 : Luxe en chapitres — un chapitre plein écran par création
        altLayer.innerHTML = renderLuxeFormat(items);
        initLuxe();
        return;
    }

    // Format 4 : Commande express — liste façon appli de livraison
    altLayer.innerHTML = renderAppFormat(items);
    if (window.lucide) lucide.createIcons();
    refreshAppCart();
}
