// AYO — EN-TÊTE DU SERVICE OUVERT
// ==================== EN-TÊTE DU SERVICE OUVERT ====================
const BO_META = {
    gallery: ["① Mon site", "Choisissez le modèle de votre boutique, vos photos, et partagez son lien."],
    catalog: ["① Mon site", "Prix par format, délais de fabrication et produits visibles en boutique."],
    company: ["② Gestion du compte", "Vos numéros officiels (IFU, RCCM), vos coordonnées et les sites ou réseaux reliés à votre entreprise."],
    account: ["② Gestion du compte", "Enregistrez vos achats (le stock se met à jour), vos produits et votre profil."],
    stocks: ["② Gestion du compte", "Niveaux de stock, seuils d'alerte et réapprovisionnement."],
    invoices: ["② Gestion du compte", "Factures normalisées e-MECeF et avoirs, émis à chaque vente."],
    costs: ["② Gestion du compte", "Coût de revient, marge par produit et effet d'une remise."],
    campaigns: ["③ Publicité & services", "Publiez vos créations sur les réseaux, avec ou sans promotion : c'est vous qui décidez."],
    orders: ["③ Publicité & services", "Toutes vos commandes et leur statut ; le client est prévenu à chaque changement."],
    payments: ["③ Publicité & services", "Moyens de paiement proposés aux clients et suivi des encaissements."],
    notifs: ["③ Publicité & services", "Messages WhatsApp, SMS et e-mail envoyés à vos clients."],
    feedback: ["③ Publicité & services", "Commentaires des réseaux et avis du site, résumés automatiquement."],
    tickets: ["③ Publicité & services", "Réservations d'événements, devis et demandes de contact."],
    code: ["Outils", "Extraits de code pour une intégration WordPress / MariaDB."]
};
function renderBoPageHeader(tabKey) {
    const meta = BO_META[tabKey] || ["Espace entreprise", ""];
    const label = document.querySelector(`#bo-btn-${tabKey} span`)?.textContent || "";
    document.getElementById("bo-crumb").textContent = `${meta[0]}  ›  ${label}`;
    document.getElementById("bo-page-desc").textContent = meta[1];
}
