// AYO — 4 STYLES DE SITE : un vrai site différent par format
// ==================== 4 STYLES DE SITE : un vrai site différent par format ====================
const IMM_FMT = 3; // la scène immersive (plat géant) habille désormais le format sombre cinématique
const SITE_STYLES = { 1: "editorial", 2: "delice", 3: "cinema", 4: "app", 5: "luxe" };
function applySiteStyle(id) {
    const root = document.documentElement;
    root.dataset.sstyle = SITE_STYLES[id] || "delice";
    root.dataset.app = (typeof APP_MODE !== "undefined" && APP_MODE) ? APP_MODE : "biz";
    requestAnimationFrame(apMeasureTop);
}
// Hauteur réelle des barres collées en haut, pour que les catégories du format 4 se collent juste dessous
function apMeasureTop() {
    let top = 0;
    const head = document.querySelector("header.ayo-head") || document.querySelector("body > header");
    if (head && getComputedStyle(head).position === "sticky") top = head.offsetHeight;
    const nav = document.querySelector("#view-client > nav");
    if (nav && getComputedStyle(nav).position === "sticky" && nav.offsetHeight) top = Math.max(top, (parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight);
    document.documentElement.style.setProperty("--ap-top", top + "px");
}
window.addEventListener("resize", () => requestAnimationFrame(apMeasureTop));

const PARAM_ROWS = [
    { name: "Style du site", f1: "Blanc, noir, typographie fine", f2: "Rouge vif, tampons ronds", f3: "Noir profond et or", f4: "Vert et jaune, façon appli", f5: "Bordeaux, ivoire et or", state: "Actif" },
    { name: "Affichage Catalogue", f1: "Double page + grille de portraits", f2: "Plein écran, une création à la fois", f3: "Plat géant + ligne en perspective", f4: "Liste par catégorie", f5: "Un chapitre plein écran par création", state: "Actif" },
    { name: "Sélection Création", f1: "Clic sur la photo", f2: "Défilement ou point de navigation", f3: "Clic = entrer dans le plat", f4: "Bouton « + » sur la photo", f5: "« Découvrir » sous chaque création", state: "Actif" },
    { name: "Devises & Paiement", f1: "FCFA / EUR / USD + Local & Intl", f2: "FCFA / EUR / USD + Local & Intl", f3: "FCFA / EUR / USD + Local & Intl", f4: "FCFA / EUR / USD + Local & Intl", f5: "FCFA / EUR / USD + Local & Intl", state: "Actif" },
    { name: "Sécurité & Stocks", f1: "2FA + SHA-256 + Stock BOM", f2: "2FA + SHA-256 + Stock BOM", f3: "2FA + SHA-256 + Stock BOM", f4: "2FA + SHA-256 + Stock BOM", f5: "2FA + SHA-256 + Stock BOM", state: "Actif" }
];

const PHP_SNIPPET = `<?php
// AYO — Custom Post Types & AJAX Order Handler (Délices Sucrés)
add_action( 'init', function () {
    register_post_type( 'ayo_order', [
'labels' => [ 'name' => 'Commandes AYO' ],
'public' => false,
'show_ui' => true,
'supports' => [ 'title', 'custom-fields' ]
    ] );
} );

add_action( 'wp_ajax_nopriv_ayo_checkout', function () {
    check_ajax_referer( 'ayo_nonce', 'nonce' );
    $total_fcfa = intval( $_POST['total_fcfa'] ?? 0 );
    $gateway    = sanitize_text_field( $_POST['gateway'] ?? 'MTN MoMo' );
    wp_send_json_success( [ 'status' => 'paid', 'total_fcfa' => $total_fcfa, 'gateway' => $gateway ] );
} );`;

const SQL_SNIPPET = `-- Schéma MariaDB Multi-Tenant AYO × Délices Sucrés
CREATE TABLE IF NOT EXISTS wp_ayo_tenants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(120) NOT NULL,
    city VARCHAR(120) NOT NULL,
    active_format TINYINT UNSIGNED DEFAULT 1,
    currency VARCHAR(10) DEFAULT 'FCFA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wp_ayo_stocks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ingredient_name VARCHAR(120) NOT NULL,
    qty DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    min_alert DECIMAL(10,2) NOT NULL DEFAULT 3
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
