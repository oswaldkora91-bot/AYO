// AYO — DEFAULT PERSISTENT STATE
// ==================== DEFAULT PERSISTENT STATE ====================
function getDefaultState() {
    return {
        brandIdentity: "delices",
        isAdminAuthenticated: false,
        activeFormat: 1,
        currency: "FCFA",
        activeCategory: "all",
        podiumPastryId: 1,
        podiumPortionIdx: 0,
        podiumImageIdx: 0,
        paymentRegion: "local",
        promoCode: "",
        promoApplied: false,
        selectedAgendaDay: 24,
        tenant: {
            name: "Délices Sucrés",
            city: "Cotonou — Haie Vive",
            specialty: "Haute Pâtisserie Artisanale & Événements"
        },
        customer: {
            name: "Amina Soglo",
            email: "amina.soglo@cotonou.bj",
            phone: "+229 01 97 12 34 56",
            points: 450
        },
        cart: [],
        orders: [
            { ref: "DS-2026-804", client: "Amina Soglo (+229 01 97 12 34 56)", details: "1x Royal Chocolat (6 parts) • Livraison Haie Vive • 24 Nov 12h–15h", payment: "MTN MoMo (Bénin) (Local)", amountFcfa: 18500, status: "En préparation" },
            { ref: "DS-2026-803", client: "Koffi Mensah (+33 6 42 18 90 11)", details: "2x Coffret Macarons (4 parts) • Livraison Fidjrossè • 25 Nov 16h–19h", payment: "Carte Visa / Mastercard (Stripe) (Intl)", amountFcfa: 24200, status: "Prête" },
            { ref: "DS-2026-802", client: "Clarisse Houngbédji (+229 01 66 54 32 10)", details: "1x Fraisier Pistache (8 parts) • Retrait Atelier • 26 Nov 09h–11h", payment: "FedaPay Checkout (Local)", amountFcfa: 24500, status: "En attente" },
            { ref: "DS-2026-801", client: "Jean-Marc Dossou (+229 01 95 44 21 09)", details: "4x Croissant Bicolore • Retrait Atelier • 21 Nov 09h–11h", payment: "KKiaPay Checkout (Local)", amountFcfa: 7200, status: "Livrée" }
        ],
        stocks: [
            { name: "Beurre AOP Charentes-Poitou", qty: 14.5, max: 25, unit: "kg", minAlert: 5 },
            { name: "Chocolat Noir Valrhona 70%", qty: 3.5, max: 20, unit: "kg", minAlert: 4 },
            { name: "Citrons Verts & Zestes Frais", qty: 12.0, max: 20, unit: "kg", minAlert: 4 },
            { name: "Poudre d'Amande Blanche", qty: 2.5, max: 15, unit: "kg", minAlert: 3 },
            { name: "Pistaches Torréfiées d'Iran", qty: 6.0, max: 12, unit: "kg", minAlert: 2 },
            { name: "Mangues Gouverneur Mûres", qty: 18.0, max: 30, unit: "kg", minAlert: 5 }
        ],
        campaigns: [
            { id: "CMP-1", network: "Instagram", title: "Royal Chocolat 70% — Édition Week-End", pastryId: 1, promo: "DELICES15", pct: 15, budget: 25000, clicks: 1420, seedOrders: 9, seedRevenue: 120000, active: true },
            { id: "CMP-2", network: "TikTok", title: "Coffret Macarons Mangue-Passion", pastryId: 5, promo: "DELICES15", pct: 15, budget: 30000, clicks: 2190, seedOrders: 13, seedRevenue: 156000, active: true },
            { id: "CMP-3", network: "Facebook", title: "Petit-Déjeuner Croissants AOP", pastryId: 4, promo: "DELICES15", pct: 15, budget: 15000, clicks: 890, seedOrders: 7, seedRevenue: 58500, active: true }
        ],
        catalog: {},
        gateways: {},
        notifSettings: { whatsapp: true, sms: true, email: false },
        notifications: [
            { id: "NTF-103", at: "22/11 09:14", channel: "WhatsApp", to: "Amina Soglo (+229 01 97 12 34 56)", ref: "DS-2026-804", event: "Statut : En préparation", message: "Bonjour Amina, votre commande DS-2026-804 est en préparation à l'atelier Délices Sucrés.", status: "Envoyé" },
            { id: "NTF-102", at: "22/11 08:40", channel: "Alerte interne", to: "Atelier Haie Vive", ref: "", event: "Stock bas", message: "Chocolat Noir Valrhona 70% : 3.5 kg restants (seuil 4 kg). Prévoir réapprovisionnement.", status: "Envoyé" },
            { id: "NTF-101", at: "21/11 17:02", channel: "SMS", to: "Koffi Mensah (+33 6 42 18 90 11)", ref: "DS-2026-803", event: "Statut : Prête", message: "Bonjour Koffi, bonne nouvelle : votre commande DS-2026-803 est prête ! Retrait à l'atelier ou livreur en route.", status: "Envoyé" }
        ],
        socialFeedback: [
            { network: "Instagram", author: "@mireille.bj", text: "Le Royal Chocolat est une tuerie, délicieux et pas trop sucré !", date: "2026-11-20" },
            { network: "Instagram", author: "@kevin_ctn", text: "Coffret magnifique pour l'anniversaire de ma mère, la présentation est superbe.", date: "2026-11-19" },
            { network: "TikTok", author: "@foodie229", text: "Les macarons mangue-passion sont incroyables mais un peu chers pour le format 4 parts.", date: "2026-11-21" },
            { network: "TikTok", author: "@ablaa", text: "Livraison en retard de 45 minutes à Calavi, gâteau bon mais j'étais déçue de l'attente.", date: "2026-11-18" },
            { network: "Facebook", author: "Rodrigue A.", text: "Croissants frais et croustillants, accueil top au comptoir de Haie Vive.", date: "2026-11-17" },
            { network: "Facebook", author: "Nadège K.", text: "Commande depuis Lyon payée par carte, livrée à l'heure à Cotonou. Merci !", date: "2026-11-16" },
            { network: "WhatsApp", author: "Client WhatsApp", text: "Le paiement MoMo a été rapide, mais la boîte du fraisier était un peu écrasée.", date: "2026-11-21" },
            { network: "Google", author: "Serge H.", text: "Très bon fraisier, frais et bien équilibré. Je recommande.", date: "2026-11-15" },
            { network: "Instagram", author: "@dossou.events", text: "Réponse rapide sur WhatsApp pour notre devis mariage, service pro.", date: "2026-11-14" },
            { network: "TikTok", author: "@tata.gourmande", text: "Tarte citron un peu sèche ce weekend, dommage car d'habitude c'est parfait.", date: "2026-11-20" }
        ],
        activeCampaignId: null,
        promoPct: 15,
        accounts: [],
        currentAccountEmail: null,
        customProducts: [],
        builtinCatalog: true,
        billing: { ifu: "1234567890123", rccm: "RB/COT/26 B 00000 (démo)", address: "Haie Vive, Cotonou", regime: "B", auto: true },
        company: {
            phone: "+229 01 97 00 00 56", whatsapp: "+229 01 97 00 00 56", email: "contact@delicessucres.bj",
            links: [
                { type: "facebook", url: "https://facebook.com/delicessucres.cotonou", show: true },
                { type: "instagram", url: "https://instagram.com/delices.sucres", show: true },
                { type: "tiktok", url: "https://tiktok.com/@delices.sucres", show: true },
                { type: "google", url: "https://g.page/delices-sucres-cotonou", show: false }
            ]
        },
        invoices: [],
        workspaces: {},
        activeWorkspace: "demo",
        purchases: [
            { id: "ACH-3", date: "2026-11-20", supplier: "Erevan Cotonou", item: "Beurre AOP Charentes-Poitou", qty: 10, unit: "kg", total: 65000 },
            { id: "ACH-2", date: "2026-11-18", supplier: "Marché Dantokpa", item: "Mangues Gouverneur Mûres", qty: 20, unit: "kg", total: 16000 },
            { id: "ACH-1", date: "2026-11-15", supplier: "Import Valrhona", item: "Chocolat Noir Valrhona 70%", qty: 5, unit: "kg", total: 60000 }
        ],
        reviews: [
            { author: "Amina Soglo", stars: 5, item: "Royal Chocolat 70%", comment: "Un équilibre parfait entre le croustillant praliné et la mousse cacao. Livraison ponctuelle à Haie Vive !" },
            { author: "Koffi Mensah", stars: 5, item: "Coffret Macarons Mangue-Passion", comment: "Commandé depuis Paris pour l'anniversaire de ma sœur à Cotonou : paiement fluide et coffret superbe." },
            { author: "Clarisse Houngbédji", stars: 4, item: "Fraisier Vanille & Pistache", comment: "Très frais et bien équilibré en sucre, parfait pour notre réception familiale." }
        ],
        tickets: [
            { id: "TCK-412", type: "Contact", from: "Sènan Tossou (+229 01 90 11 22 33)", message: "[Devis Mariage / Événement] Besoin d'une pièce montée 80 parts pour décembre.", status: "Nouveau" },
            { id: "AGD-218", type: "Agenda", from: "Clarisse Houngbédji (+229 01 66 54 32 10)", message: "24 Nov 2026 • Gâteau Anniversaire (30 pers. • 14h30)", status: "Confirmé" }
        ]
    };
}

function loadAppState() {
    const fallback = getDefaultState();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return {
            ...fallback,
            ...parsed,
            isAdminAuthenticated: false,
            tenant: { ...fallback.tenant, ...(parsed.tenant || {}) },
            customer: { ...fallback.customer, ...(parsed.customer || {}) },
            cart: Array.isArray(parsed.cart) ? parsed.cart : fallback.cart,
            orders: Array.isArray(parsed.orders) ? parsed.orders : fallback.orders,
            stocks: Array.isArray(parsed.stocks) ? parsed.stocks : fallback.stocks,
            campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : fallback.campaigns,
            reviews: Array.isArray(parsed.reviews) ? parsed.reviews : fallback.reviews,
            tickets: Array.isArray(parsed.tickets) ? parsed.tickets : fallback.tickets,
            notifications: Array.isArray(parsed.notifications) ? parsed.notifications : fallback.notifications,
            socialFeedback: Array.isArray(parsed.socialFeedback) ? parsed.socialFeedback : fallback.socialFeedback,
            catalog: parsed.catalog && typeof parsed.catalog === "object" ? parsed.catalog : {},
            gateways: parsed.gateways && typeof parsed.gateways === "object" ? parsed.gateways : {},
            notifSettings: { ...fallback.notifSettings, ...(parsed.notifSettings || {}) },
            accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
            customProducts: Array.isArray(parsed.customProducts) ? parsed.customProducts : [],
            workspaces: parsed.workspaces && typeof parsed.workspaces === "object" ? parsed.workspaces : {},
            billing: { ...fallback.billing, ...(parsed.billing || {}) },
            invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
            purchases: Array.isArray(parsed.purchases) ? parsed.purchases : fallback.purchases
        };
    } catch (err) {
        return fallback;
    }
}

function saveAppState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...appState, isAdminAuthenticated: false }));
    } catch (err) {
        // Ignore storage quota errors in restricted contexts
    }
}

function resetPersistentDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    appState = getDefaultState();
    saveAppState();
    renderAll();
    showToast("Données locales réinitialisées.", "success");
}

function formatFcfaOnly(amountFcfa) {
    return `${Math.round(Number(amountFcfa || 0)).toLocaleString("fr-FR")} FCFA`;
}

function convertFromFcfa(amountFcfa) {
    const meta = CURRENCY_META[appState.currency] || CURRENCY_META.FCFA;
    const converted = Number(amountFcfa || 0) * meta.rate;
    if (appState.currency === "FCFA") {
        return `${Math.round(converted).toLocaleString("fr-FR")} FCFA`;
    }
    const formatted = converted.toLocaleString("fr-FR", {
        minimumFractionDigits: meta.decimals,
        maximumFractionDigits: meta.decimals
    });
    return appState.currency === "EUR" ? `${formatted} €` : `$${formatted}`;
}

function updateCurrencyButtonsUI() {
    document.querySelectorAll(".curr-btn").forEach(btn => {
        const active = btn.dataset.curr === appState.currency;
        btn.className = active
            ? "curr-btn px-2 py-1 rounded-full font-extrabold text-[10px] bg-brass text-darkChoc"
            : "curr-btn px-2 py-1 rounded-full font-semibold text-[10px] text-vanilla/80 hover:text-white";
    });
}

let appState = loadAppState();
let authAccountType = "business";
let current2faOtp = null;
let activeCodeExplorerTab = "php";
let isWheelDragging = false;
let wheelDragStartX = 0;
let wheelDragStartAngle = 0;
let wheelDragDistance = 0;
