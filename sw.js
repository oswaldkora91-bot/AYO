// AYO — mode hors connexion (service worker)
// Garde une copie des fichiers du site sur le téléphone : l'application s'ouvre même sans réseau.
// Les données (Supabase) ne sont jamais mises en cache : elles viennent toujours du réseau.
const VERSION = "ayo-d14445c406";
const CDN_CACHE = "ayo-cdn-v1";
const CORE = [
  "./",
  "index.html",
  "boutique.html",
  "manifest-entreprise.webmanifest",
  "manifest-boutique.webmanifest",
  "css/00-base.css",
  "css/01-animations-du-site.css",
  "css/02-animations-partout.css",
  "css/03-formats-modernes-animes.css",
  "css/04-format-2-la-carte-qui-tourne.css",
  "css/05-format-4-coffret-a-composer.css",
  "css/06-motion-v3-site-vivant.css",
  "css/07-demo-en-direct-ayo-construit-un.css",
  "css/08-format-1-vitrine-immersive.css",
  "css/09-services-generes-ils-tombent-du-generateur.css",
  "css/10-modern-v4-finitions-sur-tout-le.css",
  "css/11-back-office.css",
  "css/12-ecran-plein-connexion-inscription.css",
  "css/13-4-styles-de-site-un-par.css",
  "css/14-telephone-android-application-installee.css",
  "css/15-modele-delice-pour-la-boutique.css",
  "css/16-back-office-style-delice-ca.css",
  "css/17-back-office-menu-lateral.css",
  "js/config.js",
  "js/tailwind-config.js",
  "js/boutique/01-separation-boutique-espace-entreprise.js",
  "js/boutique/19-retours-clients-reseaux-sociaux.js",
  "js/boutique/30-comptes-inscription-connexion-2fa-facultative.js",
  "js/boutique/32-agenda-reviews-contact-tickets.js",
  "js/boutique/42-boite-de-reception-en-ligne.js",
  "js/commun/00-demarrage.js",
  "js/commun/02-security-html-escaping-anti-xss.js",
  "js/commun/03-constants-storage-key.js",
  "js/commun/04-illustrations-vectorielles-integrees-nettes-sans.js",
  "js/commun/05-catalogue-recipe-bom-bill-of-materials.js",
  "js/commun/06-4-styles-de-site-un-vrai.js",
  "js/commun/07-default-persistent-state.js",
  "js/commun/08-outils-communs-espace-entreprise.js",
  "js/commun/09-catalogue.js",
  "js/commun/10-espaces-separes-par-entreprise.js",
  "js/commun/11-etape-1-galerie-mon-site.js",
  "js/commun/12-etape-2-gestion-du-compte-achats.js",
  "js/commun/13-en-tete-du-service-ouvert.js",
  "js/commun/14-guide-des-3-etapes.js",
  "js/commun/15-facturation-normalisee-e-mecef-benin-mode.js",
  "js/commun/16-paiements-en-ligne.js",
  "js/commun/17-notifications-client.js",
  "js/commun/18-publicite-reseaux-sociaux.js",
  "js/commun/20-carrousel.js",
  "js/commun/21-format-1-vitrine-immersive.js",
  "js/commun/22-brand-view-navigation.js",
  "js/commun/23-podium-degustation.js",
  "js/commun/24-social-media-deep-links.js",
  "js/commun/25-4-dynamic-site-formats.js",
  "js/commun/26-format-2-la-carte-qui-tourne.js",
  "js/commun/27-format-4-coffret-a-composer-on.js",
  "js/commun/28-create-tenant-modal.js",
  "js/commun/29-auth-modal-2fa-live-sha-256.js",
  "js/commun/31-cart-2-step-hybrid-checkout.js",
  "js/commun/33-customer-account-enterprise-back-office.js",
  "js/commun/34-animations-apparition-au-defilement-carrousel-au.js",
  "js/commun/35-services-generes-un-service-par-ecran.js",
  "js/commun/36-motion-v3-site-vivant.js",
  "js/commun/37-back-office-services-presentes-dans-le.js",
  "js/commun/38-format-5-luxe-en-chapitres.js",
  "js/commun/39-entreprise-sites-connectes.js",
  "js/commun/40-modele-delice-remplissage-et-mouvements-de.js",
  "js/commun/41-cloud-base-de-donnees-supabase.js",
  "js/commun/43-application-android-pwa.js",
  "js/espace-entreprise/01-separation-boutique-espace-entreprise.js",
  "js/espace-entreprise/19-retours-clients-reseaux-sociaux.js",
  "js/espace-entreprise/30-comptes-inscription-connexion-2fa-facultative.js",
  "js/espace-entreprise/32-agenda-reviews-contact-tickets.js",
  "js/espace-entreprise/42-boite-de-reception-en-ligne.js",
  "icons/ayo-192.png",
  "icons/ayo-512.png",
  "icons/ayo-apple-180.png",
  "icons/ayo-maskable-512.png",
  "icons/boutique-192.png",
  "icons/boutique-512.png",
  "icons/boutique-apple-180.png",
  "icons/boutique-maskable-512.png",
  "icons/favicon-64.png"
];

// Une page redirigée (Vercel : /boutique.html → /boutique) est recopiée sans la redirection
const clean = r => r.redirected ? r.blob().then(b => new Response(b, { status: r.status, statusText: r.statusText, headers: r.headers })) : r;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => fetch(u, { cache: "no-cache" }).then(clean).then(r => r.ok ? c.put(u, r) : null).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== CDN_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (/supabase\.(co|in)$/.test(url.hostname)) return; // données : toujours en direct
  if (url.origin === location.origin) {
    // Fichiers du site : d'abord le réseau (pour avoir la dernière version), sinon la copie
    e.respondWith(fetch(req).then(clean).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    }).catch(async () => {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === "navigate") return (await caches.match(/boutique/.test(url.pathname) ? "boutique.html" : "index.html")) || Response.error();
      return Response.error();
    }));
    return;
  }
  // Bibliothèques et polices (Tailwind, Lucide, Google Fonts…) : la copie d'abord, mise à jour en arrière-plan
  if (/(cdn\.tailwindcss\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    e.respondWith(caches.open(CDN_CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
