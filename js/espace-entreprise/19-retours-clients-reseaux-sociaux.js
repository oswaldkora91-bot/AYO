// AYO — RETOURS CLIENTS & RÉSEAUX SOCIAUX
// Version de l'espace entreprise (index.html)
// ==================== RETOURS CLIENTS & RÉSEAUX SOCIAUX ====================
const POSITIVE_WORDS = ["excellent", "parfait", "délicieux", "superbe", "top", "bon", "bonne", "frais", "ponctuel", "rapide", "magnifique", "merci", "adore", "incroyable", "fluide", "recommande", "tuerie", "équilibré", "croustillant", "pro", "à l'heure", "beau", "réussi"];
const NEGATIVE_WORDS = ["retard", "cher", "sec", "sèche", "déçu", "déçue", "froid", "cassé", "écrasé", "écrasée", "attente", "trop sucré", "lent", "pas reçu", "problème", "dommage", "fondu", "oubli"];
const POSITIVE_PHRASES = ["pas trop sucré", "pas cher", "pas de retard", "aucun problème", "sans problème"];
const wordRegex = {};
function hasWord(text, w) {
    if (!wordRegex[w]) {
        const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        wordRegex[w] = new RegExp(`(^|[^a-zà-ÿœ])${esc}(e?s)?(?=[^a-zà-ÿœ]|$)`, "i");
    }
    return wordRegex[w].test(text);
}
const THEMES = [
    { key: "taste", label: "Goût & saveurs", words: ["goût", "saveur", "délicieux", "sucré", "chocolat", "frais", "sec", "sèche", "équilibré", "tuerie", "croustillant", "bon", "macaron", "fraisier", "tarte", "croissant"], action: "Revoir la recette ou la fraîcheur des pièces citées (contrôle qualité avant mise en vitrine)." },
    { key: "delivery", label: "Délais & livraison", words: ["livraison", "livré", "livrée", "retard", "ponctuel", "rapide", "attente", "heure", "minutes", "calavi"], action: "Ajouter une marge sur les créneaux éloignés (Calavi, Parakou) et prévenir le client par WhatsApp en cas de retard." },
    { key: "price", label: "Prix", words: ["prix", "cher", "chers", "promo", "abordable", "tarif"], action: "Mettre en avant les formats individuels et un code promo ciblé sur les coffrets." },
    { key: "packaging", label: "Présentation & coffret", words: ["coffret", "présentation", "beau", "magnifique", "boîte", "écrasé", "écrasée", "cassé", "superbe"], action: "Renforcer les boîtes de transport (cales carton) pour les entremets en livraison." },
    { key: "service", label: "Service & paiement", words: ["service", "accueil", "paiement", "momo", "carte", "whatsapp", "réponse", "devis", "commande"], action: "Garder des réponses WhatsApp sous 1 h et confirmer chaque paiement par message." }
];

function analyzeText(text) {
    let t = String(text).toLowerCase();
    let pos = 0;
    POSITIVE_PHRASES.forEach(ph => { if (t.includes(ph)) { pos++; t = t.split(ph).join(" "); } });
    const has = w => hasWord(t, w);
    pos += POSITIVE_WORDS.filter(has).length;
    const neg = NEGATIVE_WORDS.filter(has).length;
    const sentiment = pos > 0 && neg > 0 ? "mixed" : neg > 0 ? "negative" : pos > 0 ? "positive" : "neutral";
    const full = String(text).toLowerCase();
    const themes = THEMES.filter(th => th.words.some(w => hasWord(full, w))).map(th => th.key);
    return { sentiment, themes };
}

function collectFeedback() {
    const social = appState.socialFeedback.map(f => ({ ...f }));
    const site = appState.reviews.map(r => ({ network: "Site", cid: r.cid, author: r.author, text: `${r.comment} (${r.item})`, date: "", stars: r.stars }));
    return [...social, ...site].map(f => ({ ...f, ...analyzeText(f.text) }));
}

function renderFeedback() {
    const kpis = document.getElementById("bo-fb-kpis");
    if (!kpis) return;
    const filter = document.getElementById("fb-filter").value;
    const all = collectFeedback();
    const items = filter === "all" ? all : all.filter(f => f.network === filter);
    const n = items.length || 1;
    const posCount = items.filter(f => f.sentiment === "positive").length;
    const negCount = items.filter(f => f.sentiment === "negative" || f.sentiment === "mixed").length;
    const byNet = {};
    all.forEach(f => { byNet[f.network] = (byNet[f.network] || 0) + 1; });
    const topNet = Object.entries(byNet).sort((a, b) => b[1] - a[1])[0];
    const avgStars = appState.reviews.length ? (appState.reviews.reduce((s, r) => s + r.stars, 0) / appState.reviews.length).toFixed(1) : "—";

    kpis.innerHTML =
        kpiCard("Retours analysés", String(items.length)) +
        kpiCard("Positifs", `${Math.round(posCount / n * 100)}%`, "text-sage") +
        kpiCard("À traiter", String(negCount), negCount ? "text-red-600" : "text-sage") +
        kpiCard("Source la plus active", topNet ? `${escapeHTML(topNet[0])} (${topNet[1]})` : "—", "text-caramel");

    const themeStats = THEMES.map(th => {
        const hits = items.filter(f => f.themes.includes(th.key));
        const neg = hits.filter(f => f.sentiment === "negative" || f.sentiment === "mixed").length;
        return { ...th, count: hits.length, neg, pos: hits.length - neg, examples: hits.filter(f => f.sentiment !== "positive").slice(0, 1) };
    }).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

    const maxCount = Math.max(1, ...themeStats.map(t => t.count));
    document.getElementById("bo-fb-themes").innerHTML = themeStats.map(t => `
        <div class="text-xs">
            <div class="flex justify-between font-bold text-darkChoc"><span>${escapeHTML(t.label)}</span><span class="text-cocoaSoft font-semibold">${t.count} mention${t.count > 1 ? "s" : ""}</span></div>
            <div class="flex w-full h-2.5 rounded-full overflow-hidden bg-white border border-beech/25 mt-1" style="width:${Math.max(18, Math.round(t.count / maxCount * 100))}%">
                <div class="h-full bg-sage" style="width:${Math.round(t.pos / t.count * 100)}%"></div>
                <div class="h-full bg-red-400" style="width:${Math.round(t.neg / t.count * 100)}%"></div>
            </div>
        </div>`).join("") + `<div class="flex gap-3 text-[10px] font-bold text-cocoaSoft pt-1"><span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-sage"></span>Positif</span><span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>Négatif / mitigé</span></div>`;

    const strengths = themeStats.filter(t => t.pos >= t.neg && t.pos > 0).slice(0, 2);
    const issues = themeStats.filter(t => t.neg > 0).sort((a, b) => b.neg - a.neg).slice(0, 2);
    const netList = Object.entries(byNet).filter(([k]) => filter === "all" || k === filter).map(([k, v]) => `${k} ${v}`).join(", ");
    document.getElementById("bo-fb-summary").innerHTML = `
        <span class="inline-flex items-center gap-1.5 bg-brass text-darkChoc text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">Résumé automatique</span>
        <p>Sur <strong class="text-brass">${items.length} retours</strong> (${escapeHTML(netList)}), <strong class="text-brass">${Math.round(posCount / n * 100)}%</strong> sont positifs${avgStars !== "—" && filter === "all" ? ` et la note moyenne du site est de <strong class="text-brass">${avgStars}/5</strong>` : ""}.</p>
        ${strengths.length ? `<p><strong>Points forts :</strong> ${strengths.map(t => `${t.label.toLowerCase()} (${t.pos} retour${t.pos > 1 ? "s" : ""} positif${t.pos > 1 ? "s" : ""})`).join(" et ")}.</p>` : ""}
        ${issues.length ? `<p><strong>À surveiller :</strong> ${issues.map(t => `${t.label.toLowerCase()} (${t.neg} retour${t.neg > 1 ? "s" : ""} négatif${t.neg > 1 ? "s" : ""} ou mitigé${t.neg > 1 ? "s" : ""})`).join(" et ")}.</p>
        <ul class="list-disc pl-4 space-y-1 text-vanilla/90">${issues.map(t => `<li>${t.action}</li>`).join("")}</ul>` : `<p>Aucun point négatif récurrent sur cette période.</p>`}`;

    const sentStyle = { positive: ["Positif", "bg-sageLight text-sage"], negative: ["Négatif", "bg-red-100 text-red-700"], mixed: ["Mitigé", "bg-amber-100 text-amber-800"], neutral: ["Neutre", "bg-white text-cocoaSoft border border-beech/30"] };
    if (!items.length) {
        document.getElementById("bo-fb-list").innerHTML = `<p class="text-xs text-cocoaSoft p-4 rounded-2xl bg-vanilla border border-beech/30">Aucun retour pour l'instant. Importez les commentaires reçus sur vos réseaux avec le formulaire ci-dessus.</p>`;
        document.getElementById("bo-fb-summary").innerHTML = `<span class="inline-flex items-center gap-1.5 bg-brass text-darkChoc text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">Résumé automatique</span><p>Le résumé apparaîtra dès vos premiers retours clients.</p>`;
        document.getElementById("bo-fb-themes").innerHTML = `<p class="text-xs text-cocoaSoft">Pas encore de données.</p>`;
        return;
    }
    document.getElementById("bo-fb-list").innerHTML = items.map(f => {
        const [label, cls] = sentStyle[f.sentiment];
        return `
        <div class="p-3 rounded-2xl bg-vanilla border border-beech/30 text-xs space-y-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="inline-flex items-center gap-1.5 font-bold text-darkChoc"><i data-lucide="${NETWORK_ICONS[f.network] || "message-circle"}" class="w-3.5 h-3.5 text-caramel"></i>${escapeHTML(f.network)} • ${escapeHTML(f.author)}${f.stars ? ` <span class="text-brass">${"★".repeat(f.stars)}</span>` : ""}</span>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cls}">${label}</span>
            </div>
            <p class="text-cocoaSoft">${escapeHTML(f.text)}</p>
            ${f.cid ? `<button type="button" onclick="hideReview('${escapeHTML(f.cid)}')" class="text-[10.5px] font-extrabold text-red-700 underline underline-offset-2">Masquer sur la boutique</button>` : ""}
            ${f.themes.length ? `<div class="flex flex-wrap gap-1">${f.themes.map(k => `<span class="text-[9.5px] font-bold bg-white border border-beech/30 px-1.5 py-0.5 rounded-full text-cocoaSoft">${THEMES.find(t => t.key === k).label}</span>`).join("")}</div>` : ""}
        </div>`;
    }).join("");
    refreshIcons();
}

function addSocialFeedback(e) {
    e.preventDefault();
    appState.socialFeedback.unshift({
        network: document.getElementById("fb-network").value,
        author: document.getElementById("fb-author").value.trim(),
        text: document.getElementById("fb-text").value.trim(),
        date: new Date().toISOString().slice(0, 10)
    });
    saveAppState();
    e.target.reset();
    renderFeedback();
    showToast("Retour importé et analysé.", "success");
}

function logoutAdmin() {
    appState.isAdminAuthenticated = false;
    appState.currentAccountEmail = null;
    adminLastActivity = 0;
    ssSet("ayo_session", null);
    switchWorkspace("demo");
    saveAppState();
    renderAll();
    updateAdminAccessUI();
    switchView("pro");
    showToast("Déconnecté de l'Espace Pro.", "info");
}
