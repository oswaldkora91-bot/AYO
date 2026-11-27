// AYO — CATALOGUE & RECIPE BOM (BILL OF MATERIALS)
// ==================== CATALOGUE & RECIPE BOM (BILL OF MATERIALS) ====================
const PASTRIES = [
    {
        id: 1,
        name: "Royal Chocolat Grand Cru 70%",
        category: "entremets",
        catLabel: "Entremets Signature",
        leadTime: "Précommande 24h",
        desc: "Biscuit cacao, croustillant praliné noisette et mousse chocolat noir 70%.",
        allergens: "Gluten, Lait, Œufs, Noisette",
        ingredientIdx: 1,
        recipeBom: [
            { idx: 1, qty: 0.25 }, // 250g Chocolat 70%
            { idx: 0, qty: 0.18 }, // 180g Beurre AOP
            { idx: 3, qty: 0.12 }  // 120g Poudre d'amande/noisette
        ],
        materialCost: 4800,
        laborCost: 1400,
        images: PASTRY_ART[1],
        sizes: [
            { label: "Individuel", price: 3500 },
            { label: "4 parts", price: 12000 },
            { label: "6 parts", price: 17500 },
            { label: "8 parts", price: 22000 }
        ]
    },
    {
        id: 2,
        name: "Tarte Citron Vert Meringuée",
        category: "tartes",
        catLabel: "Tartes Fines",
        leadTime: "Prêt 2h",
        desc: "Pâte sablée amande, crémeux citron vert frais et meringue italienne.",
        allergens: "Gluten, Lait, Œufs, Amande",
        ingredientIdx: 2,
        recipeBom: [
            { idx: 2, qty: 0.20 },
            { idx: 0, qty: 0.15 },
            { idx: 3, qty: 0.10 }
        ],
        materialCost: 1100,
        laborCost: 550,
        images: PASTRY_ART[2],
        sizes: [
            { label: "Individuel", price: 3000 },
            { label: "4 parts", price: 10500 },
            { label: "6 parts", price: 15000 },
            { label: "8 parts", price: 19500 }
        ]
    },
    {
        id: 3,
        name: "Fraisier Vanille & Pistache",
        category: "entremets",
        catLabel: "Entremets Signature",
        leadTime: "Précommande 24h",
        desc: "Mousseline vanille bourbon, éclats de pistache torréfiée et fraises.",
        allergens: "Gluten, Lait, Œufs, Pistache",
        ingredientIdx: 4,
        recipeBom: [
            { idx: 4, qty: 0.15 },
            { idx: 0, qty: 0.20 },
            { idx: 3, qty: 0.12 }
        ],
        materialCost: 1450,
        laborCost: 650,
        images: PASTRY_ART[3],
        sizes: [
            { label: "Individuel", price: 3800 },
            { label: "4 parts", price: 13500 },
            { label: "6 parts", price: 19000 },
            { label: "8 parts", price: 24500 }
        ]
    },
    {
        id: 4,
        name: "Croissant Bicolore Framboise",
        category: "viennoiseries",
        catLabel: "Viennoiseries",
        leadTime: "Prêt 2h",
        desc: "Feuilletage pur beurre AOP doré au four avec cœur framboise.",
        allergens: "Gluten, Lait, Œufs",
        ingredientIdx: 0,
        recipeBom: [
            { idx: 0, qty: 0.12 }
        ],
        materialCost: 650,
        laborCost: 350,
        images: PASTRY_ART[4],
        sizes: [
            { label: "Individuel", price: 1800 },
            { label: "4 parts", price: 6500 },
            { label: "6 parts", price: 9500 },
            { label: "8 parts", price: 12000 }
        ]
    },
    {
        id: 5,
        name: "Coffret Macarons Mangue-Passion",
        category: "coffrets",
        catLabel: "Coffrets Prestige",
        leadTime: "Sur-mesure 48h",
        desc: "Coques lisses aux amandes et ganaches tropicales mangue, passion & chocolat.",
        allergens: "Œufs, Lait, Amande",
        ingredientIdx: 3,
        recipeBom: [
            { idx: 3, qty: 0.25 },
            { idx: 5, qty: 0.20 },
            { idx: 1, qty: 0.10 }
        ],
        materialCost: 3900,
        laborCost: 1600,
        images: PASTRY_ART[5],
        sizes: [
            { label: "Individuel", price: 6000 },
            { label: "4 parts", price: 11500 },
            { label: "6 parts", price: 16500 },
            { label: "8 parts", price: 21500 }
        ]
    },
    {
        id: 6,
        name: "Tartelette Mangue Rôtie & Vanille",
        category: "tartes",
        catLabel: "Tartes Fines",
        leadTime: "Prêt 2h",
        desc: "Sablé breton, crème vanille légère et mangue fraîche rôtie.",
        allergens: "Gluten, Lait, Œufs",
        ingredientIdx: 5,
        recipeBom: [
            { idx: 5, qty: 0.22 },
            { idx: 0, qty: 0.14 }
        ],
        materialCost: 1150,
        laborCost: 500,
        images: PASTRY_ART[6],
        sizes: [
            { label: "Individuel", price: 3200 },
            { label: "4 parts", price: 11000 },
            { label: "6 parts", price: 16000 },
            { label: "8 parts", price: 20500 }
        ]
    }
];

const SITE_FORMATS = [
    {
        id: 1,
        title: "1. Éditorial chic",
        badge: "Format 1 — Style magazine",
        desc: "Comme une grande maison de pâtisserie : beaucoup de blanc, une typographie fine, une création en double page puis une grille de portraits. La deuxième photo apparaît au survol.",
        highlights: ["Fond blanc, noir et beige", "Création phare en double page", "Deuxième photo au survol"]
    },
    {
        id: 2,
        title: "2. Coloré & gourmand",
        badge: "Format 2 — Style delice.ca",
        desc: "Rouge vif, tampons ronds et photos en arche. Une création par écran : en faisant défiler, le plateau tourne et la création suivante roule au centre.",
        highlights: ["Couleur forte et tampons ronds", "Une création par écran", "Ajout au panier sans quitter la scène"]
    },
    {
        id: 3,
        title: "3. Sombre cinématique",
        badge: "Format 3 — Style grand restaurant",
        desc: "Fond noir, touches d'or, grands titres fins. Le plat flotte dans sa lumière et un clic fait entrer le client dedans, en plein écran.",
        highlights: ["Noir profond et or", "Plat géant, entrée plein écran", "Photos qui se colorent au survol"]
    },
    {
        id: 4,
        title: "4. Commande express",
        badge: "Format 4 — Style appli de livraison",
        desc: "Comme une appli de livraison : catégories collées en haut, une liste claire avec un bouton « + » sur chaque photo et le panier toujours visible en bas.",
        highlights: ["Catégories toujours visibles", "Ajout en un geste", "Panier collé en bas de l'écran"]
    },
    {
        id: 5,
        title: "5. Luxe en chapitres",
        badge: "Format 5 — Style maison de luxe",
        desc: "Chaque création est un chapitre plein écran qui glisse sur le précédent : bordeaux et ivoire en alternance, capitales géantes derrière la création, feuilles d'or qui tombent.",
        highlights: ["Un chapitre plein écran par création", "Création qui flotte devant le titre", "Feuilles d'or animées"]
    }
];
