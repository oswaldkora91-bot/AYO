// AYO — AGENDA, REVIEWS & CONTACT TICKETS
// Version de l'espace entreprise (index.html)
// ==================== AGENDA, REVIEWS & CONTACT TICKETS ====================
function renderAgendaCalendar() {
    const cells = document.getElementById("agenda-calendar-cells");
    if (!cells) return;
    const closedDays = [7, 14, 21, 28];
    let html = "";
    for (let d = 1; d <= 30; d++) {
        const closed = closedDays.includes(d);
        const selected = d === appState.selectedAgendaDay;
        let cls = "py-2 rounded-xl text-xs font-bold transition-all ";
        if (closed) cls += "bg-red-50 text-red-700 line-through cursor-not-allowed";
        else if (selected) cls += "bg-darkChoc text-brass ring-2 ring-brass";
        else cls += "bg-sageLight/65 text-darkChoc hover:bg-sage hover:text-white cursor-pointer";
        html += `<button type="button" ${closed ? "disabled" : `onclick="selectAgendaDay(${d})"`} class="${cls}">${d}</button>`;
    }
    cells.innerHTML = html;
    document.getElementById("agenda-date-display").textContent = `${appState.selectedAgendaDay} Novembre 2026`;
}

function selectAgendaDay(day) {
    appState.selectedAgendaDay = day;
    saveAppState();
    renderAgendaCalendar();
}

function updateAgendaEstimate() {
    const type = document.getElementById("agenda-event-type").value;
    const guests = Math.max(4, parseInt(document.getElementById("agenda-guests").value || "30", 10));
    const rates = { wedding: 2500, birthday: 2000, corporate: 1800, tearoom: 3500 };
    const totalFcfa = guests * (rates[type] || 2500);
    document.getElementById("agenda-estimate-display").textContent = convertFromFcfa(totalFcfa);
    return totalFcfa;
}

function submitAgendaBooking(e) {
    e.preventDefault();
    const name = document.getElementById("agenda-name").value.trim();
    const phone = document.getElementById("agenda-phone").value.trim();
    const guests = document.getElementById("agenda-guests").value;
    const slot = document.getElementById("agenda-slot").value;
    const typeLabel = document.getElementById("agenda-event-type").selectedOptions[0].text.split("(")[0].trim();
    const totalFcfa = updateAgendaEstimate();
    const id = `AGD-${Math.floor(200 + Math.random() * 799)}`;

    appState.tickets.unshift({
        id,
        type: "Agenda",
        from: `${name} (${phone})`,
        message: `${appState.selectedAgendaDay} Nov 2026 • ${typeLabel} (${guests} pers. • ${slot})`,
        status: "Confirmé"
    });
    appState.orders.unshift({
        ref: id,
        client: `${name} (${phone})`,
        details: `Agenda ${appState.selectedAgendaDay} Nov • ${typeLabel} (${guests} pers.)`,
        payment: "Devis Agenda",
        amountFcfa: totalFcfa,
        status: "En attente"
    });
    pushNotification(`${name} (${phone})`, id, "Réservation agenda",
        `Bonjour ${name.split(" ")[0]}, votre réservation ${id} du ${appState.selectedAgendaDay} novembre (${typeLabel}, ${guests} pers., ${slot}) est enregistrée. Estimation : ${formatFcfaOnly(totalFcfa)}.`);
    saveAppState();
    renderBackOfficeAll();
    e.target.reset();
    updateAgendaEstimate();
    showToast(`Réservation ${id} enregistrée sur l'agenda.`, "success");
}

function renderReviewsSummary() {
    const total = appState.reviews.length;
    const avg = total ? (appState.reviews.reduce((s, r) => s + r.stars, 0) / total).toFixed(1) : "—";
    document.getElementById("avg-rating-score").textContent = avg;
    document.getElementById("total-reviews-count").textContent = total;
    const rec = document.getElementById("reviews-recommend");
    if (rec) {
        rec.classList.toggle("hidden", !total);
        rec.textContent = `${Math.round(appState.reviews.filter(r => r.stars >= 4).length / Math.max(1, total) * 100)}% recommandent`;
    }
    if (!total) {
        document.getElementById("rating-breakdown-bars").innerHTML = "";
        document.getElementById("reviews-grid").innerHTML = `<p class="col-span-full text-xs text-cocoaSoft p-5 rounded-2xl bg-white border border-beech/30">Aucun avis pour l'instant. Soyez le premier à donner le vôtre.</p>`;
        return;
    }

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    appState.reviews.forEach(r => { starCounts[r.stars] = (starCounts[r.stars] || 0) + 1; });

    document.getElementById("rating-breakdown-bars").innerHTML = [5, 4, 3, 2, 1].map(st => {
        const pct = Math.round(((starCounts[st] || 0) / total) * 100);
        return `
        <div class="flex items-center gap-2">
            <span class="w-8 font-bold">${st} ★</span>
            <div class="flex-1 h-2 bg-vanilla rounded-full overflow-hidden border border-beech/25">
                <div class="h-full bg-brass" style="width:${pct}%"></div>
            </div>
            <span class="w-9 text-right text-cocoaSoft font-semibold">${pct}%</span>
        </div>`;
    }).join("");

    document.getElementById("reviews-grid").innerHTML = appState.reviews.slice(0, 4).map(r => `
        <div class="bg-white rounded-2xl p-4 border border-beech/30 shadow-sm">
            <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-xs text-darkChoc">${escapeHTML(r.author)}</span>
                <span class="text-brass text-xs font-bold">${"★".repeat(r.stars)}</span>
            </div>
            <span class="inline-block bg-sageLight text-sage text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">${escapeHTML(r.item)}</span>
            <p class="text-xs text-cocoaSoft">"${escapeHTML(r.comment)}"</p>
        </div>`).join("");
}

function addClientReview(e) {
    e.preventDefault();
    const author = document.getElementById("rev-author").value.trim();
    const stars = Math.min(5, Math.max(1, parseInt(document.getElementById("rev-stars").value || "5", 10)));
    const item = document.getElementById("rev-item").value.trim();
    const comment = document.getElementById("rev-comment").value.trim();
    appState.reviews.unshift({ author, stars, item, comment });
    saveAppState();
    renderReviewsSummary();
    e.target.reset();
    showToast("Merci ! Votre retour client a été publié.", "success");
}

function submitContactTicket(e) {
    e.preventDefault();
    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const topic = document.getElementById("contact-topic").value;
    const msg = document.getElementById("contact-msg").value.trim();
    const ticketId = `TCK-${Math.floor(500 + Math.random() * 499)}`;

    appState.tickets.unshift({
        id: ticketId,
        type: "Contact",
        from: `${name} (${email})`,
        message: `[${topic}] ${msg}`,
        status: "Nouveau"
    });
    pushNotification(`${name} (${email})`, ticketId, "Accusé de réception",
        `Bonjour ${name.split(" ")[0]}, nous avons bien reçu votre demande (${topic}). Ticket ${ticketId} : réponse sous 24 h.`, /@/.test(email) ? "E-mail" : undefined);
    saveAppState();
    renderBackOfficeAll();
    e.target.reset();

    const banner = document.getElementById("last-ticket-banner");
    banner.classList.remove("hidden");
    banner.textContent = `Ticket généré : ${ticketId} — Enregistré dans le Back-Office.`;
    showToast(`Ticket ${ticketId} créé avec succès.`, "success");
}
