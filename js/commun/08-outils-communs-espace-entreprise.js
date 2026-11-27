// AYO — OUTILS COMMUNS ESPACE ENTREPRISE
// ==================== OUTILS COMMUNS ESPACE ENTREPRISE ====================
const NETWORK_ICONS = { Instagram: "instagram", TikTok: "video", Facebook: "facebook", WhatsApp: "message-circle", Google: "star", Site: "store" };
const LEAD_OPTIONS = ["Prêt 2h", "Précommande 24h", "Sur-mesure 48h"];

function nowStamp() {
    return new Date().toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function clientName(clientStr) { return String(clientStr || "").split(" (")[0].trim(); }
function clientPhone(clientStr) { const m = String(clientStr || "").match(/\(([^)]+)\)/); return m ? m[1] : ""; }
function waLink(contact, text) {
    const digits = String(contact || "").replace(/\D/g, "");
    if (digits.length < 8) return "";
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
function kpiCard(label, value, color = "text-darkChoc") {
    return `<div class="bg-vanilla p-4 rounded-2xl border border-beech/30"><span class="text-[10px] font-bold text-cocoaSoft uppercase">${escapeHTML(label)}</span><p class="font-serif text-xl font-extrabold ${color} mt-0.5">${value}</p></div>`;
}
function refreshIcons() { if (window.lucide) lucide.createIcons(); }
