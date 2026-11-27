// AYO — GUIDE DES 3 ÉTAPES
// ==================== GUIDE DES 3 ÉTAPES ====================
const GUIDE_GROUPS = { gallery: 1, company: 2, account: 2, catalog: 2, stocks: 2, invoices: 2 };
function renderGuide(tabKey) {
    const step = GUIDE_GROUPS[tabKey] || 3;
    document.querySelectorAll(".guide-step").forEach(btn => {
        const n = Number(btn.dataset.step);
        const on = n === step;
        btn.className = `guide-step text-left p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 ${on ? "bg-darkChoc border-darkChoc text-vanilla" : "bg-white border-beech/35 text-darkChoc hover:border-brass"}`;
        btn.querySelector(".guide-num").className = `guide-num w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-extrabold text-sm ${on ? "bg-brass text-darkChoc" : "bg-vanilla text-darkChoc border border-beech/40"}`;
    });
}
