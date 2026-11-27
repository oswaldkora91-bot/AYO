// AYO — SECURITY: HTML ESCAPING (ANTI-XSS)
// ==================== SECURITY: HTML ESCAPING (ANTI-XSS) ====================
function escapeHTML(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
