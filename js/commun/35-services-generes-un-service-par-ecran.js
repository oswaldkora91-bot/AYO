// AYO — Services générés : un service par écran, puis la grille complète
// ==================== Services générés : un service par écran, puis la grille complète ====================
const SVC = { cards: [], gen: null, stage: null, panels: [], chips: [], bound: false, n: 0, state: [] };
const SVC_DETAILS = {
    gallery: ["5 modèles de site animés au choix", "Vos photos, vos couleurs, votre logo", "Un lien de boutique à partager"],
    account: ["Achats et fournisseurs enregistrés", "Stock mis à jour à chaque vente", "Profil et sécurité du compte"],
    catalog: ["Ajout d'un plat ou d'un produit avec photo", "Prix par format et délai de fabrication", "Produits visibles ou masqués en un clic"],
    orders: ["Chaque nouvelle commande signalée", "Statuts : reçue, en préparation, prête", "Facture normalisée en un clic"],
    payments: ["MTN MoMo, Moov Money, Celtiis Cash", "FedaPay, KKiaPay et carte bancaire", "Encaissements suivis jour par jour"],
    notifs: ["Confirmation de commande sur WhatsApp", "Rappel de retrait par SMS", "Reçu envoyé par e-mail"],
    campaigns: ["Publication Instagram, TikTok, Facebook", "Code promo facultatif : 0 % = simple publication", "Lien direct vers votre boutique"],
    feedback: ["Avis du site et des réseaux réunis", "Résumé automatique de ce qui plaît", "Points à améliorer mis en avant"],
    stocks: ["Ingrédients déduits à chaque commande", "Alerte quand un seuil est atteint", "Liste de réapprovisionnement prête"],
    costs: ["Coût de revient de chaque création", "Marge calculée automatiquement", "Remise simulée avant de la lancer"],
    tickets: ["Réservations d'événements dans l'agenda", "Demandes de devis au même endroit", "Réponse au client en un clic"]
};

function initServiceGenerator() {
    const gen = _getByIdSafe("svc-gen"), grid = _getByIdSafe("pro-services-grid");
    if (!gen || !grid) return;
    SVC.gen = gen; SVC.stage = gen.querySelector(".svc-stage");
    const tick = '<span class="svc-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg></span>';
    SVC.cards = [...grid.querySelectorAll(".pro-service")];
    const data = SVC.cards.map(b => ({
        key: (b.getAttribute("onclick") || "").match(/'([a-z]+)'/)?.[1] || "",
        icon: b.querySelector("span:first-child")?.innerHTML || "",
        title: b.querySelector("strong")?.textContent || "",
        desc: b.querySelector("strong + span")?.textContent || ""
    }));
    // Grille finale : cartes à deux faces qui tombent et s'ouvrent à l'arrivée à l'écran
    SVC.cards.forEach((b, i) => {
        if (b.classList.contains("svc-card")) return;
        const front = document.createElement("span");
        front.className = "svc-face svc-front";
        while (b.firstChild) front.appendChild(b.firstChild);
        front.insertAdjacentHTML("beforeend", tick);
        const flip = document.createElement("span");
        flip.className = "svc-flip";
        flip.appendChild(front);
        flip.insertAdjacentHTML("beforeend", `<span class="svc-face svc-back"><b>AYO</b>${data[i].icon}</span>`);
        b.className = "pro-service svc-card";
        b.style.setProperty("--r", `${[-7, 5, -4, 8, -6][i % 5]}deg`);
        b.appendChild(flip);
    });
    // Un écran par service
    SVC.n = data.length;
    const theatre = gen.querySelector(".svc-theatre"), dock = gen.querySelector(".svc-dock");
    theatre.insertAdjacentHTML("beforeend", data.map((d, i) => `
        <div class="svp" data-i="${i}">
            <div class="svp-flip">
                <div class="svp-face svp-back"><b>AYO</b><span class="svp-back-ico">${d.icon}</span><em>Génération du service…</em></div>
                <div class="svp-face svp-front">
                    <div class="svp-text">
                        <span class="svp-ico">${d.icon}</span>
                        <h3 class="svp-title font-serif">${escapeHTML(d.title).split(" ").map((w, k) => `<span class="w-mask"><span class="w-in" style="--w:${k}">${w}</span></span>`).join(" ")}</h3>
                        <p class="svp-desc">${escapeHTML(d.desc)}</p>
                        <ul class="svp-list">${(SVC_DETAILS[d.key] || []).map((t, k) => `<li style="--k:${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg>${escapeHTML(t)}</li>`).join("")}</ul>
                        <button type="button" class="svp-cta" onclick="openProService('${d.key}')">Ouvrir ce service</button>
                    </div>
                    <div class="svp-art" aria-hidden="true"><span class="svp-orbit"></span><span class="svp-orbit o2"></span><span class="svp-disc">${d.icon}</span></div>
                </div>
            </div>
        </div>`).join(""));
    dock.innerHTML = data.map((d, i) => `<button type="button" class="svc-chip" data-i="${i}" onclick="svcGoTo(${i})" aria-label="${escapeHTML(d.title)}">${d.icon}</button>`).join("");
    SVC.panels = [...theatre.querySelectorAll(".svp")];
    SVC.chips = [...dock.querySelectorAll(".svc-chip")];
    SVC.state = SVC.panels.map(() => "");
    _getByIdSafe("svc-total") && (_getByIdSafe("svc-total").textContent = SVC.n);
    if (window.lucide) lucide.createIcons();
    if (REDUCED_MOTION) {
        SVC.gen.classList.add("svc-static");
        SVC.cards.forEach(c => c.classList.add("landed"));
        return;
    }
    setupSvc();
    if (!SVC.bound) {
        SVC.bound = true;
        let raf = 0;
        const t = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(updateSvc); };
        addEventListener("scroll", t, { passive: true });
        addEventListener("resize", () => { setupSvc(); t(); });
    }
    updateSvc();
}

function setupSvc() {
    const h = document.querySelector("header")?.offsetHeight || 60;
    SVC.gen.style.setProperty("--stick", `${h + 8}px`);
    SVC.gen.style.height = `${SVC.stage.offsetHeight + SVC.n * innerHeight * .72}px`;
}

function svcGoTo(i) {
    const stick = parseFloat(SVC.gen.style.getPropertyValue("--stick")) || 80;
    const travel = SVC.gen.offsetHeight - SVC.stage.offsetHeight;
    const f = i + .2, p = (f + .5) / (SVC.n + .5);
    const top = SVC.gen.getBoundingClientRect().top + scrollY - stick + p * travel;
    window.scrollTo({ top, behavior: "smooth" });
}

function updateSvc() {
    if (!SVC.gen || !SVC.gen.isConnected || !SVC.gen.offsetParent) return;
    // la grille finale : une carte tombe dès qu'elle arrive à l'écran
    SVC.cards.forEach(c => { if (!c.classList.contains("landed") && c.getBoundingClientRect().top < innerHeight * .85) c.classList.add("landed"); });
    if (REDUCED_MOTION) return;
    const want = SVC.stage.offsetHeight + SVC.n * innerHeight * .72;
    if (Math.abs(SVC.gen.offsetHeight - want) > 4) SVC.gen.style.height = `${want}px`;
    const stick = parseFloat(SVC.gen.style.getPropertyValue("--stick")) || 80;
    const r = SVC.gen.getBoundingClientRect();
    const travel = Math.max(1, SVC.gen.offsetHeight - SVC.stage.offsetHeight);
    const p = Math.min(1, Math.max(0, (stick - r.top) / travel));
    const f = p * (SVC.n + .5) - .5;
    const theatre = SVC.gen.querySelector(".svc-theatre");
    const th = theatre.getBoundingClientRect();
    let ready = 0, current = -1;
    SVC.panels.forEach((el, i) => {
        const d = f - i;
        let st;
        if (d < -.5) st = "wait";
        else if (d < -.1) st = "fall";
        else if (d < .5) st = "open";
        else st = "gone";
        if (st === "fall") {
            const t = (d + .5) / .4, g = 1 - t * t;
            el.classList.remove("open", "gone", "anim");
            el.style.opacity = "1";
            el.style.transform = `translateY(${(-g * (th.height + 60)).toFixed(1)}px) rotate(${(g * [-9, 7, -6, 10, -8][i % 5]).toFixed(1)}deg)`;
        } else if (st !== SVC.state[i]) {
            if (st === "wait") { el.classList.remove("open", "gone", "anim"); el.style.opacity = "0"; el.style.transform = `translateY(${-(th.height + 60)}px)`; }
            if (st === "open") { el.classList.add("anim", "open"); el.classList.remove("gone"); el.style.opacity = "1"; el.style.transform = ""; }
            if (st === "gone") {
                const chip = SVC.chips[i].getBoundingClientRect(), pr = el.getBoundingClientRect();
                const cx = chip.left + chip.width / 2 - (pr.left + pr.width / 2), cy = chip.top + chip.height / 2 - (pr.top + pr.height / 2);
                el.classList.add("anim", "gone");
                el.style.transform = `translate(${cx.toFixed(0)}px, ${cy.toFixed(0)}px) scale(.05) rotate(-25deg)`;
                el.style.opacity = "0";
            }
        }
        SVC.state[i] = st;
        if (st === "gone") ready++;
        if (st === "open") current = i;
        const chip = SVC.chips[i];
        const on = st === "gone";
        if (on !== chip.classList.contains("on")) chip.classList.toggle("on", on);
        chip.classList.toggle("now", st === "open" || st === "fall");
    });
    const shown = current >= 0 ? current + 1 : ready;
    const c = _getByIdSafe("svc-count"); if (c) c.textContent = String(Math.min(SVC.n, Math.max(0, shown))).padStart(2, "0");
    const bar = SVC.gen.querySelector(".svc-bar i"); if (bar) bar.style.transform = `scaleX(${Math.max(0, Math.min(1, (f + .5) / (SVC.n + .5))).toFixed(3)})`;
    const txt = _getByIdSafe("svc-text");
    const msg = ready >= SVC.n ? "Vos services sont prêts. Retrouvez-les tous juste en dessous." : f < -.1 && current < 0 && ready === 0 ? "Faites défiler : AYO génère vos services un par un." : "Génération en cours…";
    if (txt && txt.textContent !== msg) txt.textContent = msg;
    SVC.gen.classList.toggle("svc-done", ready >= SVC.n);
    SVC.gen.classList.toggle("svc-emitting", SVC.state.includes("fall"));
}

// ---- Menu de l'en-tête sur téléphone ----
function toggleHdrMenu(force) {
    const h = document.querySelector("header"), b = document.getElementById("hdr-burger");
    if (!h || !b) return;
    const open = typeof force === "boolean" ? force : !h.classList.contains("menu-open");
    h.classList.toggle("menu-open", open);
    b.setAttribute("aria-expanded", String(open));
    b.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
}
document.addEventListener("click", e => {
    const h = document.querySelector("header.menu-open");
    if (!h) return;
    if (!h.contains(e.target) || e.target.closest("#hdr-menu button")) setTimeout(() => toggleHdrMenu(false), 120);
});
document.addEventListener("keydown", e => { if (e.key === "Escape") toggleHdrMenu(false); });
