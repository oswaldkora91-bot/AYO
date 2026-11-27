// AYO — SOCIAL MEDIA DEEP-LINKS
// ==================== SOCIAL MEDIA DEEP-LINKS ====================
function triggerSocialDeepLink(campaignId) {
    if (APP_MODE === "business") { ssSet("ayo_campaign", campaignId); openShop(); return; }
    const c = appState.campaigns.find(x => x.id === campaignId);
    if (!c) return;
    const pastry = PASTRIES.find(p => p.id === c.pastryId);
    if (!pastry || pastry.available === false) { showToast("Cette création n'est plus disponible : mettez la publication en pause.", "info"); return; }
    c.clicks = (c.clicks || 0) + 1;
    appState.activeCampaignId = c.id;
    if (document.getElementById("view-client").classList.contains("hidden")) switchView("client");
    detachPastryToPodium(pastry.id);
    if (hasPromo(c)) {
        appState.promoCode = c.promo;
        appState.promoPct = c.pct;
        appState.promoApplied = true;
        document.getElementById("promo-code-input").value = c.promo;
        addToCart(pastry.id, 0);
        saveAppState();
        renderCartUI();
        renderCampaigns();
        toggleCartDrawer(true);
        showToast(`${c.network} : ${pastry.name} + code ${c.promo} (-${c.pct} %) appliqué.`, "success");
    } else {
        saveAppState();
        renderCampaigns();
        document.getElementById("podium-showcase-card").scrollIntoView({ behavior: "smooth", block: "start" });
        showToast(`${c.network} : le client arrive sur « ${pastry.name} » (sans promotion).`, "success");
    }
}
