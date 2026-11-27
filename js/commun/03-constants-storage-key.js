// AYO — CONSTANTS & STORAGE KEY
// ==================== CONSTANTS & STORAGE KEY ====================
const STORAGE_KEY = "GASTROLIEN_DELICES_SAAS_V4";
const FREE_SHIPPING_THRESHOLD = 35000;
const EUR_RATE = 655.957; // 1 EUR = 655.957 FCFA
const USD_RATE = 605;     // 1 USD = 605 FCFA
const CURRENCY_META = {
    FCFA: { symbol: "FCFA", rate: 1, decimals: 0 },
    EUR: { symbol: "€", rate: 1 / EUR_RATE, decimals: 2 },
    USD: { symbol: "$", rate: 1 / USD_RATE, decimals: 2 }
};
const LOCAL_PAYMENT_METHODS = [
    "MTN MoMo (Bénin)",
    "Moov Money (Flooz)",
    "Celtiis Cash",
    "FedaPay Checkout",
    "KKiaPay Checkout",
    "Paiement à la livraison / Retrait atelier"
];
const INTL_PAYMENT_METHODS = [
    "Carte Visa / Mastercard (Stripe)",
    "PayPal International",
    "Apple Pay / Google Pay"
];
