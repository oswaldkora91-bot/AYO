// AYO — CREATE TENANT MODAL
// ==================== CREATE TENANT MODAL ====================
function openCreateTenantModal() {
    const m = document.getElementById("create-tenant-modal");
    m.classList.remove("hidden");
    m.classList.add("flex");
}
function closeCreateTenantModal() {
    const m = document.getElementById("create-tenant-modal");
    m.classList.add("hidden");
    m.classList.remove("flex");
}
function createNewTenantSite(e) {
    e.preventDefault();
    appState.tenant.name = document.getElementById("new-tenant-name").value.trim();
    appState.tenant.city = document.getElementById("new-tenant-city").value.trim();
    appState.tenant.specialty = document.getElementById("new-tenant-spec").value.trim();
    const fmtId = parseInt(document.getElementById("new-tenant-format").value, 10);
    saveAppState();
    updateBrandHeaderUI();
    closeCreateTenantModal();
    applyFormat(fmtId, true);
    showToast(`Nouveau site "${appState.tenant.name}" déployé !`, "success");
}
