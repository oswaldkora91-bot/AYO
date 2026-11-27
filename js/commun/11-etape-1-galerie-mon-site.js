// AYO — ÉTAPE 1 : GALERIE & MON SITE
// ==================== ÉTAPE 1 : GALERIE & MON SITE ====================
function siteSlug() {
    return String(appState.tenant.name || "mon-site").normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mon-site";
}
function siteUrl() { return `https://ayo.io/${siteSlug()}`; }

function templatePreview(id) {
    const imgs = PASTRIES.filter(p => p.available !== false).map(p => p.images[0]);
    const im = (i, cls) => imgs.length
        ? `<img src="${imgs[i % imgs.length]}" alt="" class="${cls} object-cover">`
        : `<div class="${cls} bg-gradient-to-br from-beech/30 to-brass/30"></div>`;
    if (id === 1) {
        return `<div class="h-full relative overflow-hidden bg-[#1a100c]"><div class="absolute right-6 top-1/2 -translate-y-[60%] w-24 h-24 rounded-full" style="background:radial-gradient(circle,rgba(246,217,154,.35),transparent 70%)"></div><div class="tp-float absolute right-8 top-1/2 -translate-y-[62%] w-20 h-20 rounded-full overflow-hidden border-[3px] border-vanilla shadow-xl">${im(0, "w-full h-full")}</div><div class="absolute left-3 top-1/2 -translate-y-[70%] space-y-1"><div class="h-1 w-8 bg-brass rounded"></div><div class="h-2.5 w-16 bg-vanilla/85 rounded"></div><div class="h-2.5 w-11 bg-vanilla/85 rounded"></div><div class="h-2 w-9 bg-brass/80 rounded-full mt-1"></div></div><div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1" style="perspective:200px">${[0, 1, 2, 3, 4].map(i => `<div class="w-5 h-5 rounded-full overflow-hidden border ${i === 2 ? "border-brass scale-125" : "border-white/30 opacity-60"}" style="transform:rotateY(${(2 - i) * 30}deg)">${im(i, "w-full h-full")}</div>`).join("")}</div></div>`;
    }
    if (id === 2) {
        const disc = (i, deg) => `<div class="absolute left-1/2 top-1/2 w-16 h-16 -ml-8 -mt-8 rounded-full overflow-hidden border-2 border-white shadow-lg" style="transform:rotate(${deg}deg) translateY(-34px) rotate(${-deg}deg)">${im(i, "w-full h-full")}</div>`;
        return `<div class="h-full relative overflow-hidden bg-[#1b110d] flex items-center"><div class="pl-3 space-y-1 z-10"><div class="h-1 w-8 bg-brass rounded"></div><div class="h-2 w-14 bg-vanilla/80 rounded"></div><div class="h-1.5 w-10 bg-vanilla/40 rounded"></div><div class="h-2 w-7 bg-brass/80 rounded-full mt-1"></div></div><div class="absolute right-2 top-1/2 -translate-y-1/2 w-28 h-28"><div class="tp-spin absolute inset-0 rounded-full border border-brass/30" style="background:radial-gradient(circle,#3a2519 0 55%,transparent 56%)">${disc(0, 0)}${disc(1, 120)}${disc(2, 240)}</div></div></div>`;
    }
    if (id === 3) {
        return `<div class="tp-bento h-full grid grid-cols-3 grid-rows-2 gap-1.5 p-2.5">${im(0, "col-span-2 w-full h-full rounded-md")}${im(1, "w-full h-full rounded-md")}${im(2, "w-full h-full rounded-md")}${im(3, "col-span-2 w-full h-full rounded-md")}</div>`;
    }
    return `<div class="h-full flex items-center gap-2 p-3"><div class="grid grid-cols-2 gap-1.5 flex-1">${[0, 1, 2, 3].map(i => `<div class="rounded-lg p-1" style="background:${["#F4E1E6", "#F6EFC9", "#F7E3C8", "#E9E0F3"][i]}">${im(i, "w-full aspect-square rounded-full")}</div>`).join("")}</div><div class="tp-box w-16 grid grid-cols-2 gap-1 p-1.5 rounded-lg" style="background:linear-gradient(160deg,#E8C9A0,#C99C6B)">${[0, 1, 2, 3].map(i => `<span class="block aspect-square rounded-full overflow-hidden border border-white" style="animation-delay:${i * .35}s">${im(i, "w-full h-full")}</span>`).join("")}</div></div>`;
}

function renderGallery() {
    const box = document.getElementById("bo-gallery-templates");
    if (!box) return;
    document.getElementById("gal-site-name").textContent = appState.tenant.name;
    document.getElementById("gal-site-url").textContent = shopShareLink();
    const fut = _getById("gal-site-future");
    if (fut) fut.textContent = `Adresse future : ${siteUrl()}`;
    document.getElementById("gal-site-meta").textContent = `${appState.tenant.specialty} • ${appState.tenant.city}`;
    box.innerHTML = SITE_FORMATS.map(f => {
        const active = f.id === appState.activeFormat;
        return `
        <div class="rounded-2xl overflow-hidden border-2 ${active ? "border-sage" : "border-beech/35"} bg-white flex flex-col">
            <div class="h-36 bg-gradient-to-b from-vanilla to-vanillaDark relative">
                ${templatePreview(f.id)}
                ${active ? `<span class="absolute top-2 right-2 bg-sage text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">Modèle actif</span>` : ""}
            </div>
            <div class="p-3.5 flex-1 flex flex-col justify-between gap-3">
                <div>
                    <h4 class="font-serif text-base font-bold text-darkChoc">${escapeHTML(f.title.replace(/^\d\.\s*/, ""))}</h4>
                    <p class="text-[11px] text-cocoaSoft mt-0.5 leading-snug">${escapeHTML(f.desc)}</p>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                    <button type="button" onclick="previewTemplate(${f.id})" class="bg-vanilla border border-beech/40 text-darkChoc font-bold py-2 rounded-xl text-[11px]">Aperçu</button>
                    <button type="button" onclick="chooseTemplate(${f.id})" class="${active ? "bg-sage text-white" : "bg-darkChoc hover:bg-caramel text-white"} font-bold py-2 rounded-xl text-[11px]">${active ? "Utilisé ✓" : "Utiliser"}</button>
                </div>
            </div>
        </div>`;
    }).join("");

    if (!PASTRIES.length) {
        document.getElementById("bo-gallery-products").innerHTML = `<div class="col-span-full rounded-2xl border-2 border-dashed border-beech/50 bg-vanilla p-8 text-center">
            <p class="font-serif text-lg font-bold text-darkChoc">Aucune création pour l'instant</p>
            <p class="text-xs text-cocoaSoft mt-1">Ajoutez votre premier produit avec sa photo : il apparaîtra ici et sur votre site.</p>
            <button type="button" onclick="switchBoTab('account'); setTimeout(() => document.getElementById('np-name').focus(), 100)" class="mt-3 bg-darkChoc hover:bg-caramel text-white font-bold px-4 py-2.5 rounded-xl text-xs">+ Ajouter ma première création</button>
        </div>`;
        return;
    }
    document.getElementById("bo-gallery-products").innerHTML = PASTRIES.map(p => `
        <div class="rounded-2xl overflow-hidden border border-beech/35 bg-white ${p.available === false ? "opacity-60" : ""}">
            <div class="relative aspect-[4/3] bg-vanillaDark">
                <img src="${p.images[0]}" alt="${escapeHTML(p.name)}" class="w-full h-full object-cover">
                <label class="absolute bottom-2 right-2 bg-darkChoc/90 hover:bg-caramel text-white text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer">
                    Changer la photo
                    <input type="file" accept="image/*" class="hidden" onchange="changeProductPhoto(${p.id}, this)">
                </label>
                ${p.available === false ? `<span class="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">En rupture</span>` : ""}
            </div>
            <div class="p-2.5">
                <h5 class="text-xs font-bold text-darkChoc line-clamp-1">${escapeHTML(p.name)}</h5>
                <span class="text-[11px] font-extrabold text-caramel">${convertFromFcfa(p.sizes[0].price)}</span>
            </div>
        </div>`).join("");
}

function chooseTemplate(id) {
    applyFormat(id, false);
    const acc = currentAccount();
    if (acc?.business) acc.business.format = id;
    saveAppState();
    renderGallery();
    renderGuide("gallery");
    showToast(`Votre site utilise maintenant « ${SITE_FORMATS.find(f => f.id === id).title.replace(/^\d\.\s*/, "")} ».`, "success");
}
function previewTemplate(id) {
    applyFormat(id, false);
    openMySite();
}
function openMySite() { openShop(); }
async function copySiteLink() {
    try { await navigator.clipboard.writeText(shopShareLink()); showToast("Lien de la boutique copié : il s'ouvre sur un téléphone.", "success"); }
    catch (err) { showToast("Copie impossible ici : sélectionnez le lien affiché.", "info"); }
}

function readImageFile(file, maxW = 720) {
    return new Promise((resolve, reject) => {
        if (!file || !/^image\//.test(file.type)) { reject(new Error("type")); return; }
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const sc = Math.min(1, maxW / img.width);
                const c = document.createElement("canvas");
                c.width = Math.round(img.width * sc);
                c.height = Math.round(img.height * sc);
                c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
                resolve(c.toDataURL("image/jpeg", 0.82));
            };
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
async function changeProductPhoto(id, input) {
    try {
        const url = await readImageFile(input.files[0]);
        catalogEntry(id).image = url;
        afterCatalogChange("Photo mise à jour sur votre site.");
    } catch (err) {
        showToast("Ce fichier n'est pas une image reconnue.", "info");
    }
}
