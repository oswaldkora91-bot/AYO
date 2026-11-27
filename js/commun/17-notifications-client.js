// AYO — NOTIFICATIONS CLIENT
// ==================== NOTIFICATIONS CLIENT ====================
const STATUS_MESSAGES = {
    "En attente": (n, ref) => `Bonjour ${n}, votre commande ${ref} est bien reçue et en attente de validation par l'atelier.`,
    "En préparation": (n, ref) => `Bonjour ${n}, votre commande ${ref} est en préparation à l'atelier Délices Sucrés.`,
    "Prête": (n, ref) => `Bonjour ${n}, bonne nouvelle : votre commande ${ref} est prête ! Retrait à l'atelier ou livreur en route.`,
    "Livrée": (n, ref) => `Bonjour ${n}, votre commande ${ref} a été livrée. Merci ! Votre avis compte : répondez à ce message ou notez-nous sur le site.`
};

function pushNotification(to, ref, event, message, forcedChannel) {
    const s = appState.notifSettings;
    const channel = forcedChannel || (s.whatsapp ? "WhatsApp" : s.sms ? "SMS" : s.email ? "E-mail" : "");
    if (!channel) return null;
    const n = { id: `NTF-${Math.floor(100 + Math.random() * 900)}`, at: nowStamp(), channel, to, ref, event, message, status: "Envoyé" };
    appState.notifications.unshift(n);
    appState.notifications = appState.notifications.slice(0, 60);
    return n;
}

function notifyOrderStatus(order) {
    const fn = STATUS_MESSAGES[order.status];
    if (!fn) return;
    pushNotification(order.client, order.ref, `Statut : ${order.status}`, fn(clientName(order.client).split(" ")[0], order.ref));
}

function renderNotifications() {
    const list = document.getElementById("bo-notif-list");
    if (!list) return;
    document.getElementById("bo-notif-count").textContent = appState.notifications.length;
    const s = appState.notifSettings;
    document.getElementById("bo-notif-channels").innerHTML = [["whatsapp", "WhatsApp"], ["sms", "SMS"], ["email", "E-mail"]].map(([k, label]) => `
        <label class="flex items-center justify-between text-xs font-bold text-darkChoc cursor-pointer">
            <span>${label}</span>
            <input type="checkbox" ${s[k] ? "checked" : ""} onchange="toggleNotifChannel('${k}', this.checked)" class="w-4 h-4 accent-[#2E6F40]">
        </label>`).join("");

    const chanStyle = { WhatsApp: "bg-[#25D366] text-white", SMS: "bg-darkChoc text-brass", "E-mail": "bg-caramel text-white", "Alerte interne": "bg-red-600 text-white" };
    list.innerHTML = appState.notifications.map(n => {
        const link = n.channel === "WhatsApp" ? waLink(clientPhone(n.to), n.message) : "";
        return `
        <div class="p-3.5 rounded-2xl bg-vanilla border border-beech/30 text-xs space-y-1.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${chanStyle[n.channel] || "bg-white"}">${escapeHTML(n.channel)}</span>
                    <strong class="text-darkChoc">${escapeHTML(n.to)}</strong>
                    ${n.ref ? `<span class="font-mono text-cocoaSoft">${escapeHTML(n.ref)}</span>` : ""}
                </div>
                <span class="text-[10px] text-cocoaSoft">${escapeHTML(n.at)} • ${escapeHTML(n.event)}</span>
            </div>
            <p class="text-cocoaSoft">${escapeHTML(n.message)}</p>
            <div class="flex items-center justify-between">
                <span class="text-[10px] font-extrabold text-sage">✓ ${escapeHTML(n.status)}</span>
                ${link ? `<a href="${link}" target="_blank" rel="noopener" class="text-[11px] font-bold text-[#128C7E] underline">Ouvrir dans WhatsApp</a>` : ""}
            </div>
        </div>`;
    }).join("") || `<p class="text-xs text-cocoaSoft">Aucune notification envoyée.</p>`;
}

function toggleNotifChannel(key, on) {
    appState.notifSettings[key] = !!on;
    saveAppState();
    renderNotifications();
}

function sendManualNotification(e) {
    e.preventDefault();
    const to = document.getElementById("notif-to").value.trim();
    const channel = document.getElementById("notif-channel").value;
    const msg = document.getElementById("notif-msg").value.trim();
    pushNotification(to, "", "Message manuel", msg, channel);
    saveAppState();
    e.target.reset();
    renderNotifications();
    renderCustomerAccount();
    showToast(`Message ${channel} envoyé à ${clientName(to)}.`, "success");
}
