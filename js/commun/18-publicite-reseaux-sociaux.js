// AYO — PUBLICITÉ RÉSEAUX SOCIAUX
// ==================== PUBLICITÉ RÉSEAUX SOCIAUX ====================
function campaignStats(c) {
    const attributed = appState.orders.filter(o => o.source === c.id);
    const orders = (c.seedOrders || 0) + attributed.length;
    const revenue = (c.seedRevenue || 0) + attributed.reduce((s, o) => s + o.amountFcfa, 0);
    const roas = c.budget > 0 ? revenue / c.budget : 0;
    const conv = c.clicks > 0 ? (orders / c.clicks) * 100 : 0;
    return { orders, revenue, roas, conv };
}
function hasPromo(c) { return Number(c.pct) > 0 && !!c.promo; }
function campaignLink(c) {
    const promo = hasPromo(c) ? `&promo=${encodeURIComponent(c.promo)}` : "";
    return `${siteUrl()}?creation=${c.pastryId}${promo}&utm_source=${c.network.toLowerCase()}&utm_campaign=${c.id}`;
}
function campaignShareText(c) {
    return `${c.caption || c.title}\n${campaignLink(c)}`;
}
function onCampPctChange() {
    const pct = parseInt(document.getElementById("camp-pct").value, 10) || 0;
    const code = document.getElementById("camp-code");
    code.disabled = pct <= 0;
    code.required = pct > 0;
    code.placeholder = pct > 0 ? "Ex : NOEL20" : "Sans promo";
    if (pct <= 0) code.value = "";
    suggestCaption();
}
function suggestCaption() {
    const box = document.getElementById("camp-caption");
    if (!box || box.dataset.touched === "1") return;
    const p = PASTRIES.find(x => x.id === parseInt(document.getElementById("camp-pastry").value, 10));
    if (!p) { box.value = ""; return; }
    const pct = parseInt(document.getElementById("camp-pct").value, 10) || 0;
    const code = document.getElementById("camp-code").value.trim().toUpperCase();
    box.value = `${p.name} — disponible chez ${appState.tenant.name} (${p.leadTime}).` + (pct > 0 ? ` Profitez de -${pct} % avec le code ${code || "…"} !` : " Commandez en ligne 👇");
}

function renderCampaigns() {
    const grid = document.getElementById("bo-campaigns-grid");
    if (!grid) return;
    const sel = document.getElementById("camp-pastry");
    if (sel) {
        const prevSel = sel.value;
        sel.innerHTML = PASTRIES.length ? PASTRIES.map(p => `<option value="${p.id}">${escapeHTML(p.name)}</option>`).join("") : `<option value="">Ajoutez d'abord une création</option>`;
        if ([...sel.options].some(o => o.value === prevSel)) sel.value = prevSel;
        suggestCaption();
    }

    const stats = appState.campaigns.map(campaignStats);
    const budget = appState.campaigns.reduce((s, c) => s + (c.budget || 0), 0);
    const revenue = stats.reduce((s, x) => s + x.revenue, 0);
    const clicks = appState.campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
    document.getElementById("bo-camp-kpis").innerHTML =
        kpiCard("Publications", String(appState.campaigns.length)) +
        kpiCard("CA généré", convertFromFcfa(revenue), "text-sage") +
        kpiCard("Budget sponsorisé", budget ? convertFromFcfa(budget) : "0 (gratuit)", "text-caramel") +
        kpiCard("Clics cumulés", clicks.toLocaleString("fr-FR"));

    if (!appState.campaigns.length) { grid.innerHTML = `<p class="col-span-full text-xs text-cocoaSoft p-4 rounded-2xl bg-vanilla border border-beech/30">Aucune campagne. Lancez votre première publicité avec le formulaire ci-dessus.</p>`; return; }
    grid.innerHTML = appState.campaigns.map((c, i) => {
        const st = stats[i];
        const pastry = PASTRIES.find(p => p.id === c.pastryId);
        return `
        <div class="p-4 rounded-2xl bg-vanilla border ${c.active ? "border-beech/35" : "border-beech/20 opacity-70"} space-y-2.5">
            <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-caramel"><i data-lucide="${NETWORK_ICONS[c.network] || "share-2"}" class="w-3.5 h-3.5"></i>${escapeHTML(c.network)}</span>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${c.active ? "bg-sageLight text-sage" : "bg-white text-cocoaSoft border border-beech/30"}">${c.active ? "Active" : "En pause"}</span>
            </div>
            <div class="flex items-center gap-2.5">
                ${pastry ? `<img src="${pastry.images[0]}" alt="" class="w-12 h-9 rounded-lg object-cover">` : ""}
                <h4 class="font-bold text-xs text-darkChoc leading-snug">${escapeHTML(c.title)}</h4>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div class="bg-white rounded-lg p-1.5"><strong class="block text-xs text-darkChoc">${(c.clicks || 0).toLocaleString("fr-FR")}</strong>clics</div>
                <div class="bg-white rounded-lg p-1.5"><strong class="block text-xs text-darkChoc">${st.orders}</strong>commandes</div>
                <div class="bg-white rounded-lg p-1.5"><strong class="block text-xs text-sage">${c.budget > 0 ? st.roas.toFixed(1) + "x" : "—"}</strong>ROAS</div>
            </div>
            ${c.caption ? `<p class="text-[11px] text-darkChoc bg-white rounded-lg border border-beech/30 p-2 leading-snug">${escapeHTML(c.caption)}</p>` : ""}
            <p class="text-[11px] text-cocoaSoft">${hasPromo(c) ? `Promotion : code <strong class="text-darkChoc">${escapeHTML(c.promo)}</strong> (-${c.pct} %)` : `<strong class="text-darkChoc">Sans promotion</strong>`} • ${c.budget > 0 ? `Sponsorisé ${convertFromFcfa(c.budget)}` : "Publication gratuite"} • CA ${convertFromFcfa(st.revenue)}</p>
            <code class="block text-[9.5px] bg-white border border-beech/30 rounded-lg px-2 py-1.5 break-all text-cocoaSoft">${escapeHTML(campaignLink(c))}</code>
            <div class="grid grid-cols-2 gap-1.5">
                ${c.network === "Facebook" ? `<a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignLink(c))}" target="_blank" rel="noopener" class="text-center bg-[#1877F2] text-white font-bold py-2 rounded-xl text-[10.5px]">Partager sur Facebook</a>`
                : c.network === "WhatsApp" ? `<a href="https://wa.me/?text=${encodeURIComponent(campaignShareText(c))}" target="_blank" rel="noopener" class="text-center bg-[#25D366] text-white font-bold py-2 rounded-xl text-[10.5px]">Partager sur WhatsApp</a>`
                : `<button type="button" onclick="copyCampaignText('${c.id}')" class="bg-darkChoc text-brass font-bold py-2 rounded-xl text-[10.5px]">Copier texte + lien</button>`}
                <button type="button" onclick="shareCampaign('${c.id}')" class="col-span-2 bg-caramel text-white font-bold py-2.5 rounded-xl text-[11px]">Partager sur ${escapeHTML(c.network)} (image + texte)</button>
                <button type="button" onclick="triggerSocialDeepLink('${c.id}')" class="bg-white border border-beech/35 text-darkChoc font-bold py-2 rounded-xl text-[10.5px]">Tester le lien</button>
                <button type="button" onclick="copyCampaignLink('${c.id}')" class="bg-white border border-beech/35 text-darkChoc font-bold py-2 rounded-xl text-[10.5px]">Copier le lien</button>
                <button type="button" onclick="toggleCampaign('${c.id}')" class="bg-white border border-beech/35 text-darkChoc font-bold py-2 rounded-xl text-[10.5px]">${c.active ? "Mettre en pause" : "Réactiver"}</button>
            </div>
        </div>`;
    }).join("");
}

function renderSocialBar() {
    const box = document.getElementById("social-deeplinks-buttons");
    if (!box) return;
    const active = appState.campaigns.filter(c => c.active && PASTRIES.find(p => p.id === c.pastryId)?.available !== false).slice(0, 4);
    document.getElementById("social-deeplinks-bar").classList.toggle("hidden", active.length === 0);
    box.innerHTML = active.map(c => {
        const p = PASTRIES.find(x => x.id === c.pastryId);
        return `<button type="button" onclick="triggerSocialDeepLink('${c.id}')" class="bg-white/10 hover:bg-brass hover:text-darkChoc text-vanilla border border-brass/40 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5">
            <i data-lucide="${NETWORK_ICONS[c.network] || "share-2"}" class="w-3.5 h-3.5 text-brass"></i>
            <span>${escapeHTML(c.network)} : ${escapeHTML(p ? p.name.split(" ").slice(0, 2).join(" ") : c.title)}${hasPromo(c) ? ` (-${c.pct}%)` : ""}</span>
        </button>`;
    }).join("");
}

function createCampaign(e) {
    e.preventDefault();
    const network = document.getElementById("camp-network").value;
    const pastryId = parseInt(document.getElementById("camp-pastry").value, 10);
    if (!pastryId) { showToast("Ajoutez d'abord une création dans « Gestion du compte ».", "info"); return; }
    const pct = Math.min(50, Math.max(0, parseInt(document.getElementById("camp-pct").value, 10) || 0));
    const promo = pct > 0 ? document.getElementById("camp-code").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
    if (pct > 0 && !promo) { showToast("Vous avez choisi une remise : donnez-lui un code promo (lettres et chiffres).", "info"); return; }
    const budget = Math.max(0, parseInt(document.getElementById("camp-budget").value, 10) || 0);
    const caption = document.getElementById("camp-caption").value.trim();
    const p = PASTRIES.find(x => x.id === pastryId);
    appState.campaigns.unshift({
        id: `PUB-${Date.now().toString(36).toUpperCase()}`,
        network, title: `${p.name} — ${network}`, pastryId, promo, pct: promo ? pct : 0, budget, caption,
        clicks: 0, seedOrders: 0, seedRevenue: 0, active: true
    });
    saveAppState();
    e.target.reset();
    const cap = document.getElementById("camp-caption"); cap.dataset.touched = "";
    onCampPctChange();
    renderCampaigns();
    renderSocialBar();
    refreshIcons();
    showToast(`Publication ${network} prête${promo ? ` avec le code ${promo} (-${pct} %)` : ", sans promotion"}.`, "success");
}

// ---- Partage en un clic : image + texte + lien, vers l'appli du réseau ----
// Sur téléphone, la fenêtre de partage ouvre Instagram, TikTok, Facebook ou WhatsApp avec le visuel prêt.
// Sur ordinateur : le texte est copié, le visuel téléchargé et le réseau ouvert.
async function campaignImageFile(c) {
    const p = PASTRIES.find(x => x.id === c.pastryId);
    const src = p && p.images && p.images[0];
    if (!src) return null;
    const img = await new Promise((ok, ko) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = ko; i.src = src; }).catch(() => null);
    if (!img) return null;
    const W = 1080, H = c.network === "TikTok" ? 1920 : 1350;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    g.fillStyle = "#231712"; g.fillRect(0, 0, W, H);
    const r = Math.max(W / (img.naturalWidth || W), (H * 0.78) / (img.naturalHeight || H));
    const iw = (img.naturalWidth || W) * r, ih = (img.naturalHeight || H) * r;
    try { g.drawImage(img, (W - iw) / 2, 0, iw, ih); } catch (e) { return null; }
    const grad = g.createLinearGradient(0, H * 0.55, 0, H); grad.addColorStop(0, "rgba(35,23,18,0)"); grad.addColorStop(0.45, "rgba(35,23,18,.92)"); grad.addColorStop(1, "#231712");
    g.fillStyle = grad; g.fillRect(0, H * 0.55, W, H * 0.45);
    g.fillStyle = "#FBF7F0"; g.font = "700 64px 'Playfair Display', Georgia, serif";
    const title = (p.name || "").slice(0, 40); g.fillText(title, 64, H - 230, W - 128);
    g.fillStyle = "#D4A373"; g.font = "600 40px Inter, sans-serif";
    g.fillText(hasPromo(c) ? `-${c.pct} % avec le code ${c.promo}` : (appState.tenant.name || "").slice(0, 40), 64, H - 160, W - 128);
    g.fillStyle = "rgba(251,247,240,.75)"; g.font = "500 32px Inter, sans-serif";
    g.fillText("Commandez en ligne · lien dans la description", 64, H - 96, W - 128);
    let blob = null;
    try { blob = await new Promise(ok => cv.toBlob(ok, "image/png")); } catch (e) { blob = null; }
    return blob ? new File([blob], `${(p.name || "publication").replace(/[^\w-]+/g, "-").slice(0, 40)}.png`, { type: "image/png" }) : null;
}
const NETWORK_WEB = { Instagram: "https://www.instagram.com/", TikTok: "https://www.tiktok.com/upload", Facebook: null, WhatsApp: null };
async function shareCampaign(id) {
    const c = appState.campaigns.find(x => x.id === id); if (!c) return;
    const text = campaignShareText(c), link = campaignLink(c);
    const file = await campaignImageFile(c);
    if (navigator.share) {
        const data = { title: c.title, text };
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
        try { await navigator.share(data); c.shared = (c.shared || 0) + 1; saveAppState(); showToast(`Choisissez ${c.network} dans la liste, puis publiez.`, "success"); return; }
        catch (err) { if (err && err.name === "AbortError") return; }
    }
    // Ordinateur : texte copié + visuel téléchargé + réseau ouvert
    try { await navigator.clipboard.writeText(text); } catch (e) {}
    if (file) { const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
    const url = c.network === "Facebook" ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
        : c.network === "WhatsApp" ? `https://wa.me/?text=${encodeURIComponent(text)}` : NETWORK_WEB[c.network];
    if (url) window.open(url, "_blank", "noopener");
    c.shared = (c.shared || 0) + 1; saveAppState();
    showToast(c.network === "Instagram" || c.network === "TikTok"
        ? `Visuel téléchargé et texte copié : sur ${c.network}, ajoutez l'image puis collez le texte.`
        : `Texte copié${file ? " et visuel téléchargé" : ""} : publiez sur ${c.network}.`, "success");
}

async function copyCampaignText(id) {
    const c = appState.campaigns.find(x => x.id === id);
    if (!c) return;
    try { await navigator.clipboard.writeText(campaignShareText(c)); showToast(`Texte copié : collez-le dans ${c.network}.`, "success"); }
    catch (err) { showToast("Copie impossible ici : sélectionnez le texte affiché.", "info"); }
}

function toggleCampaign(id) {
    const c = appState.campaigns.find(x => x.id === id);
    if (!c) return;
    c.active = !c.active;
    saveAppState();
    renderCampaigns();
    renderSocialBar();
    refreshIcons();
}

async function copyCampaignLink(id) {
    const c = appState.campaigns.find(x => x.id === id);
    if (!c) return;
    try {
        await navigator.clipboard.writeText(campaignLink(c));
        showToast("Lien de campagne copié.", "success");
    } catch (err) {
        showToast("Copie impossible ici : sélectionnez le lien affiché.", "info");
    }
}
