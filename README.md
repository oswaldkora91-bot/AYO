# AYO

AYO crée le site web d'un commerce et lui donne les services pour le faire tourner : boutique en ligne, paiement Mobile Money, commandes, agenda, stock, facture normalisée, publicité et retours clients.

Le projet est un site statique : du HTML, du CSS et du JavaScript, sans étape de compilation. Les données sont enregistrées dans **Supabase**.

## Les deux pages

| Fichier | Pour qui | Contenu |
|---|---|---|
| `index.html` | Les commerçants | Accueil d'AYO, inscription, connexion et back-office de l'entreprise |
| `boutique.html` | Les clients du commerce | La boutique en ligne, dans l'un des 5 formats |

L'adresse d'une boutique est `boutique.html#nom-de-la-boutique`.

## Ouvrir et modifier le projet

- **Dans le navigateur, sans rien installer :** sur la page GitHub du dépôt, appuyez sur la touche `.` (point). L'éditeur s'ouvre en ligne (github.dev).
- **Voir le site :** ouvrez `index.html` dans un navigateur, ou mettez le dossier en ligne (voir plus bas).

## Réglages Supabase

Les variables sont dans **`js/config.js`** :

```js
const SB_URL = "https://votre-projet.supabase.co";
const SB_KEY = "votre-cle-publique";
```

Prenez-les dans Supabase › *Project Settings* › *API* (« Project URL » et « Publishable key »).
**Ne mettez jamais la clé `service_role` / `secret`** : ce fichier est envoyé à tous les visiteurs.

Pour un nouveau projet Supabase, collez `supabase/schema.sql` dans *SQL Editor* puis cliquez sur *Run*.
Dans *Authentication* › *URL Configuration*, mettez l'adresse du site en ligne dans « Site URL ».

## Mettre en ligne

Le dossier se publie tel quel sur Vercel, Netlify ou tout hébergeur de fichiers statiques. `vercel.json` sert `boutique.html` à l'adresse `/boutique`.

**Avec GitHub Pages (gratuit pour un dépôt public) :** *Settings* › *Pages* › *Build and deployment* : Source « Deploy from a branch », branche `main`, dossier `/ (root)`, puis *Save*. Le site est en ligne après une ou deux minutes à l'adresse `https://oswaldkora91-bot.github.io/AYO/`. Mettez cette adresse dans Supabase › *Authentication* › *URL Configuration* (« Site URL » et « Redirect URLs »).

## Les 5 formats de boutique

| N° | Nom | Style |
|---|---|---|
| 1 | Éditorial chic | Blanc et noir, double page puis grille de portraits |
| 2 | Coloré & gourmand | Rouge vif et tampons ronds, une création par écran |
| 3 | Sombre cinématique | Noir et or, plat géant en plein écran |
| 4 | Commande express | Façon appli de livraison, panier collé en bas |
| 5 | Luxe en chapitres | Bordeaux et ivoire, un chapitre plein écran par création |

## Organisation des fichiers

Les fichiers sont chargés **dans l'ordre de leur numéro** : l'ordre compte, ne le changez pas.
Le code de `js/commun/` sert aux deux pages. Quand une partie est différente entre les deux pages, elle existe en deux versions portant le même nom : une dans `js/espace-entreprise/` (pour `index.html`) et une dans `js/boutique/` (pour `boutique.html`).

**`css/`**

- `00-base.css` — Base : couleurs, typographie, éléments communs
- `01-animations-du-site.css` — ANIMATIONS DU SITE
- `02-animations-partout.css` — ANIMATIONS PARTOUT
- `03-formats-modernes-animes.css` — FORMATS MODERNES & ANIMÉS
- `04-format-2-la-carte-qui-tourne.css` — Format 2 : « La carte qui tourne »
- `05-format-4-coffret-a-composer.css` — Format 4 : « Coffret à composer »
- `06-motion-v3-site-vivant.css` — MOTION v3 : site vivant
- `07-demo-en-direct-ayo-construit-un.css` — Démo en direct : AYO construit un site
- `08-format-1-vitrine-immersive.css` — Format 1 : « Vitrine immersive »
- `09-services-generes-ils-tombent-du-generateur.css` — Services générés : ils tombent du générateur et s'ouvrent
- `10-modern-v4-finitions-sur-tout-le.css` — MODERN v4 : finitions sur tout le site
- `11-back-office.css` — Back-office
- `12-ecran-plein-connexion-inscription.css` — Écran plein connexion / inscription
- `13-4-styles-de-site-un-par.css` — 4 STYLES DE SITE (un par format)
- `14-modele-delice-pour-la-boutique.css` — MODÈLE « DÉLICE » pour la boutique
- `15-back-office-style-delice-ca.css` — Back-office, style delice.ca
- `16-back-office-menu-lateral.css` — BACK-OFFICE : MENU LATÉRAL

**`js/`**

- `config.js` — ============================================================
- `tailwind-config.js` — Couleurs et polices de Tailwind (les couleurs suivent les variables CSS de css/00-base.css)

**`js/commun/`**

- `00-demarrage.js` — debut
- `02-security-html-escaping-anti-xss.js` — SECURITY: HTML ESCAPING (ANTI-XSS)
- `03-constants-storage-key.js` — CONSTANTS & STORAGE KEY
- `04-illustrations-vectorielles-integrees-nettes-sans.js` — ILLUSTRATIONS VECTORIELLES INTÉGRÉES (NETTES, SANS IMAGE EXTERNE)
- `05-catalogue-recipe-bom-bill-of-materials.js` — CATALOGUE & RECIPE BOM (BILL OF MATERIALS)
- `06-4-styles-de-site-un-vrai.js` — 4 STYLES DE SITE : un vrai site différent par format
- `07-default-persistent-state.js` — DEFAULT PERSISTENT STATE
- `08-outils-communs-espace-entreprise.js` — OUTILS COMMUNS ESPACE ENTREPRISE
- `09-catalogue.js` — CATALOGUE
- `10-espaces-separes-par-entreprise.js` — ESPACES SÉPARÉS PAR ENTREPRISE
- `11-etape-1-galerie-mon-site.js` — ÉTAPE 1 : GALERIE & MON SITE
- `12-etape-2-gestion-du-compte-achats.js` — ÉTAPE 2 : GESTION DU COMPTE (ACHATS, STOCK, PRODUITS, PROFIL)
- `13-en-tete-du-service-ouvert.js` — EN-TÊTE DU SERVICE OUVERT
- `14-guide-des-3-etapes.js` — GUIDE DES 3 ÉTAPES
- `15-facturation-normalisee-e-mecef-benin-mode.js` — FACTURATION NORMALISÉE (e-MECeF BÉNIN — MODE SIMULATION)
- `16-paiements-en-ligne.js` — PAIEMENTS EN LIGNE
- `17-notifications-client.js` — NOTIFICATIONS CLIENT
- `18-publicite-reseaux-sociaux.js` — PUBLICITÉ RÉSEAUX SOCIAUX
- `20-carrousel.js` — CARROUSEL
- `21-format-1-vitrine-immersive.js` — FORMAT 1 : « VITRINE IMMERSIVE »
- `22-brand-view-navigation.js` — BRAND & VIEW NAVIGATION
- `23-podium-degustation.js` — PODIUM DÉGUSTATION
- `24-social-media-deep-links.js` — SOCIAL MEDIA DEEP-LINKS
- `25-4-dynamic-site-formats.js` — 4 DYNAMIC SITE FORMATS
- `26-format-2-la-carte-qui-tourne.js` — FORMAT 2 : « LA CARTE QUI TOURNE » (une création par écran, pilotée par le défilement)
- `27-format-4-coffret-a-composer-on.js` — FORMAT 4 : « COFFRET À COMPOSER » (on remplit une boîte)
- `28-create-tenant-modal.js` — CREATE TENANT MODAL
- `29-auth-modal-2fa-live-sha-256.js` — AUTH MODAL (2FA + LIVE SHA-256)
- `31-cart-2-step-hybrid-checkout.js` — CART & 2-STEP HYBRID CHECKOUT
- `33-customer-account-enterprise-back-office.js` — CUSTOMER ACCOUNT & ENTERPRISE BACK-OFFICE
- `34-animations-apparition-au-defilement-carrousel-au.js` — ANIMATIONS : APPARITION AU DÉFILEMENT, CARROUSEL AUTO, COMPTEURS
- `35-services-generes-un-service-par-ecran.js` — Services générés : un service par écran, puis la grille complète
- `36-motion-v3-site-vivant.js` — MOTION v3 : site vivant
- `37-back-office-services-presentes-dans-le.js` — BACK-OFFICE : services présentés dans le style delice.ca
- `38-format-5-luxe-en-chapitres.js` — FORMAT 5 : LUXE EN CHAPITRES
- `39-entreprise-sites-connectes.js` — ENTREPRISE & SITES CONNECTÉS
- `40-modele-delice-remplissage-et-mouvements-de.js` — MODÈLE « DÉLICE » : remplissage et mouvements de la boutique
- `41-cloud-base-de-donnees-supabase.js` — CLOUD : base de données Supabase

**`js/espace-entreprise/`**

- `01-separation-boutique-espace-entreprise.js` — SÉPARATION BOUTIQUE / ESPACE ENTREPRISE
- `19-retours-clients-reseaux-sociaux.js` — RETOURS CLIENTS & RÉSEAUX SOCIAUX
- `30-comptes-inscription-connexion-2fa-facultative.js` — COMPTES : INSCRIPTION, CONNEXION, 2FA FACULTATIVE
- `32-agenda-reviews-contact-tickets.js` — AGENDA, REVIEWS & CONTACT TICKETS
- `42-boite-de-reception-en-ligne.js` — BOÎTE DE RÉCEPTION EN LIGNE

**`js/boutique/`**

- `01-separation-boutique-espace-entreprise.js` — SÉPARATION BOUTIQUE / ESPACE ENTREPRISE
- `19-retours-clients-reseaux-sociaux.js` — RETOURS CLIENTS & RÉSEAUX SOCIAUX
- `30-comptes-inscription-connexion-2fa-facultative.js` — COMPTES : INSCRIPTION, CONNEXION, 2FA FACULTATIVE
- `32-agenda-reviews-contact-tickets.js` — AGENDA, REVIEWS & CONTACT TICKETS
- `42-boite-de-reception-en-ligne.js` — BOÎTE DE RÉCEPTION EN LIGNE

**`supabase/`**

- `schema.sql` — -- =====================================================================

## Données enregistrées dans Supabase

| Table | Contenu |
|---|---|
| `workspaces` | Une ligne par entreprise : tout le back-office (produits, stock, factures, campagnes, réseaux…) et ce que la boutique affiche |
| `orders` | Commandes passées sur la boutique |
| `bookings` | Réservations de l'agenda |
| `reviews` | Avis clients (« publié » ou « masqué ») |
| `messages` | Demandes envoyées par le formulaire de contact |
| `customers` | Fichier clients, rempli à chaque commande, réservation ou message |

Les visiteurs ne peuvent qu'ajouter des données, par les fonctions `place_order`, `book_slot`, `post_review` et `send_message`. Seul le propriétaire d'une entreprise peut lire et modifier ses données.
