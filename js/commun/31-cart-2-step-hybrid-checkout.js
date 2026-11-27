// AYO — CART & 2-STEP HYBRID CHECKOUT
// ==================== CART & 2-STEP HYBRID CHECKOUT ====================
function setCartStep(step) {
    const p1 = document.getElementById("cart-step-1-panel");
    const p2 = document.getElementById("cart-step-2-panel");
    const b1 = document.getElementById("cart-step-btn-1");
    const b2 = document.getElementById("cart-step-btn-2");
    if (step === 2) {
        p1.classList.add("hidden");
        p2.classList.remove("hidden");
        b2.className = "py-1.5 rounded-lg font-extrabold bg-darkChoc text-brass";
        b1.className = "py-1.5 rounded-lg font-bold text-darkChoc";
    } else {
        p2.classList.add("hidden");
        p1.classList.remove("hidden");
        b1.className = "py-1.5 rounded-lg font-extrabold bg-darkChoc text-brass";
        b2.className = "py-1.5 rounded-lg font-bold text-darkChoc";
    }
}

function toggleCartDrawer(open) {
    const drawer = document.getElementById("cart-drawer");
    if (open) {
        document.getElementById("tx-receipt-box").classList.add("hidden");
        setCartStep(1);
        setPaymentRegion(appState.paymentRegion);
        validateDeliverySlotQuota();
        renderCartUI();
        drawer.classList.remove("hidden");
        drawer.classList.add("flex");
    } else {
        drawer.classList.add("hidden");
        drawer.classList.remove("flex");
    }
}

function addToCart(pastryId, portionIdx = 0, plaqueText = "", giftOption = "Standard") {
    const pastry = PASTRIES.find(p => p.id === pastryId);
    if (!pastry) return;
    if (pastry.available === false) { showToast(`${pastry.name} est momentanément en rupture.`, "info"); return; }
    const sz = pastry.sizes[portionIdx] || pastry.sizes[0];
    const cleanPlaque = plaqueText.trim();
    const key = `${pastry.id}-${portionIdx}-${cleanPlaque}-${giftOption}`;
    const existing = appState.cart.find(c => c.key === key);
    if (existing) existing.qty += 1;
    else appState.cart.push({
        key,
        pastryId: pastry.id,
        ingredientIdx: pastry.ingredientIdx,
        name: pastry.name,
        portionLabel: sz.label,
        plaqueText: cleanPlaque,
        giftOption,
        priceFcfa: sz.price,
        qty: 1
    });
    saveAppState();
    renderCartUI();
    bumpEl("topbar-cart-count"); bumpEl("nav-cart-count");
    showToast(`${pastry.name} (${sz.label}) ajouté au panier.`, "success");
}

function changeCartQty(key, delta) {
    const idx = appState.cart.findIndex(c => c.key === key);
    if (idx === -1) return;
    appState.cart[idx].qty += delta;
    if (appState.cart[idx].qty <= 0) appState.cart.splice(idx, 1);
    saveAppState();
    renderCartUI();
}

function applyPromoCode() {
    const code = document.getElementById("promo-code-input").value.trim().toUpperCase();
    const statusEl = document.getElementById("promo-status-text");
    statusEl.classList.remove("hidden");
    const camp = code ? appState.campaigns.find(c => c.active && hasPromo(c) && c.promo === code) : null;
    if (camp) {
        appState.promoCode = code;
        appState.promoPct = camp.pct;
        appState.activeCampaignId = camp.id;
        appState.promoApplied = true;
        statusEl.textContent = `Code ${code} appliqué (-${appState.promoPct}%) !`;
        statusEl.className = "text-[11px] mt-1 font-bold text-sage";
    } else {
        appState.promoApplied = false;
        statusEl.textContent = "Code inconnu ou campagne en pause.";
        statusEl.className = "text-[11px] mt-1 font-bold text-red-600";
    }
    saveAppState();
    recalculateTotals();
}

function setPaymentRegion(region) {
    appState.paymentRegion = region;
    saveAppState();
    const localBtn = document.getElementById("pay-reg-local");
    const intlBtn = document.getElementById("pay-reg-intl");
    const sel = document.getElementById("checkout-payment-method");

    if (region === "international") {
        intlBtn.className = "py-1.5 rounded-lg text-[11px] font-extrabold bg-darkChoc text-brass";
        localBtn.className = "py-1.5 rounded-lg text-[11px] font-bold text-darkChoc";
        sel.innerHTML = enabledMethods("international").map(m => `<option value="${m}">${m}</option>`).join("");
    } else {
        localBtn.className = "py-1.5 rounded-lg text-[11px] font-extrabold bg-darkChoc text-brass";
        intlBtn.className = "py-1.5 rounded-lg text-[11px] font-bold text-darkChoc";
        sel.innerHTML = enabledMethods("local").map(m => `<option value="${m}">${m}</option>`).join("");
    }
    recalculateTotals();
}

function validateDeliverySlotQuota() {
    const slotEl = document.getElementById("checkout-slot");
    const dateVal = document.getElementById("checkout-date").value;
    const rem = parseInt(slotEl.selectedOptions[0]?.dataset.rem || "4", 10);
    const alertEl = document.getElementById("slot-quota-alert");
    alertEl.textContent = `Date ${dateVal} • Créneau ${slotEl.value} : ${rem} places labo disponibles.`;
    alertEl.className = "text-[11px] text-sage font-semibold";
    return true;
}

function recalculateTotals() {
    const subtotalFcfa = appState.cart.reduce((sum, item) => sum + item.priceFcfa * item.qty, 0);
    const mode = document.querySelector('input[name="fulfillment"]:checked')?.value || "pickup";
    const zoneBox = document.getElementById("delivery-zone-box");
    let shippingFcfa = 0;

    // Update free shipping progress bar
    const pct = Math.min(100, Math.round((subtotalFcfa / FREE_SHIPPING_THRESHOLD) * 100));
    const remFcfa = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalFcfa);
    document.getElementById("free-ship-bar").style.width = `${pct}%`;
    document.getElementById("free-ship-pct").textContent = `${pct}%`;
    document.getElementById("free-ship-label").textContent = remFcfa === 0
        ? "Livraison offerte débloquée !"
        : `Plus que ${convertFromFcfa(remFcfa)} pour la livraison offerte`;

    if (mode === "delivery") {
        zoneBox.classList.remove("hidden");
        shippingFcfa = subtotalFcfa > 0 && subtotalFcfa < FREE_SHIPPING_THRESHOLD
            ? parseInt(document.getElementById("delivery-zone").value, 10)
            : 0;
    } else {
        zoneBox.classList.add("hidden");
    }

    const promoPct = Number(appState.promoPct) || 15;
    const discountFcfa = appState.promoApplied ? Math.round(subtotalFcfa * promoPct / 100) : 0;
    const discLabel = document.getElementById("sum-discount-label");
    if (discLabel) discLabel.textContent = `Remise ${appState.promoCode || "Promo"} (-${promoPct}%) :`;
    const totalFcfa = Math.max(0, subtotalFcfa - discountFcfa + shippingFcfa);

    document.getElementById("sum-subtotal").textContent = convertFromFcfa(subtotalFcfa);
    document.getElementById("sum-shipping").textContent = convertFromFcfa(shippingFcfa);
    document.getElementById("sum-total").textContent = convertFromFcfa(totalFcfa);
    document.getElementById("sum-total-intl").textContent =
        appState.paymentRegion === "international"
            ? `Facturation Diaspora : ${(totalFcfa / EUR_RATE).toFixed(2)} € / ${(totalFcfa / USD_RATE).toFixed(2)} $`
            : `Règlement Local : ${formatFcfaOnly(totalFcfa)}`;

    const discRow = document.getElementById("sum-discount-row");
    if (discountFcfa > 0) {
        discRow.classList.remove("hidden");
        document.getElementById("sum-discount").textContent = "-" + convertFromFcfa(discountFcfa);
    } else {
        discRow.classList.add("hidden");
    }
    return totalFcfa;
}

function renderCartUI() {
    const inCart = new Set(appState.cart.map(c => c.pastryId));
    const sugg = PASTRIES.find(p => p.available !== false && !inCart.has(p.id));
    document.getElementById("cart-upsell").classList.toggle("hidden", !sugg);
    if (sugg) {
        document.getElementById("cart-upsell-name").textContent = sugg.name;
        document.getElementById("cart-upsell-btn").onclick = () => addToCart(sugg.id, 0);
    }
    const totalCount = appState.cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById("topbar-cart-count").textContent = totalCount;
    document.getElementById("nav-cart-count").textContent = totalCount;

    const container = document.getElementById("cart-items-container");
    if (appState.cart.length === 0) {
        container.innerHTML = `<p class="text-xs text-cocoaSoft text-center py-6 bg-white rounded-2xl border border-beech/30">Panier vide. Sélectionnez une création pour commander.</p>`;
    } else {
        container.innerHTML = appState.cart.map(item => `
            <div class="bg-white p-3 rounded-2xl border border-beech/30 flex items-center justify-between gap-2">
                <div>
                    <h4 class="font-bold text-xs text-darkChoc">${escapeHTML(item.name)}</h4>
                    <span class="text-[11px] text-cocoaSoft block">${escapeHTML(item.portionLabel)} • ${convertFromFcfa(item.priceFcfa)}</span>
                    ${item.plaqueText ? `<span class="text-[10px] font-bold text-caramel block">Plaque : "${escapeHTML(item.plaqueText)}"</span>` : ""}
                    ${item.giftOption && item.giftOption !== "Standard" ? `<span class="text-[10px] text-sage font-semibold block">${escapeHTML(item.giftOption)}</span>` : ""}
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="changeCartQty('${escapeHTML(item.key)}', -1)" class="w-7 h-7 rounded-lg bg-vanilla border border-beech/35 font-bold text-xs">-</button>
                    <span class="text-xs font-extrabold px-1">${item.qty}</span>
                    <button type="button" onclick="changeCartQty('${escapeHTML(item.key)}', 1)" class="w-7 h-7 rounded-lg bg-darkChoc text-white font-bold text-xs">+</button>
                </div>
            </div>`).join("");
    }
    recalculateTotals();
}

function submitCheckoutPayment(e) {
    e.preventDefault();
    if (appState.cart.length === 0) {
        showToast("Ajoutez au moins une création au panier.", "info");
        return;
    }
    const name = document.getElementById("checkout-client-name").value.trim();
    const phone = document.getElementById("checkout-client-phone").value.trim();
    const method = document.getElementById("checkout-payment-method").value;
    const dateVal = document.getElementById("checkout-date").value;
    const slotVal = document.getElementById("checkout-slot").value;
    const mode = document.querySelector('input[name="fulfillment"]:checked')?.value === "delivery"
        ? `Livraison ${document.getElementById("delivery-zone").selectedOptions[0].text.split("—")[0].trim()}`
        : "Retrait Atelier";
    const totalFcfa = recalculateTotals();
    const itemsSummary = appState.cart.map(i => {
        const extra = i.plaqueText ? ` [Plaque: ${i.plaqueText}]` : "";
        return `${i.qty}x ${i.name} (${i.portionLabel})${extra}`;
    }).join(", ");
    const ref = `CMD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const subtotalFcfa = appState.cart.reduce((s, i) => s + i.priceFcfa * i.qty, 0);
    const discountFcfa = appState.promoApplied ? Math.round(subtotalFcfa * (Number(appState.promoPct) || 0) / 100) : 0;
    const shippingFcfa = Math.max(0, totalFcfa - subtotalFcfa + discountFcfa);
    const orderItems = appState.cart.map(i => ({ name: `${i.name} (${i.portionLabel})`, qty: i.qty, unitTtc: i.priceFcfa }));

    // Multi-ingredient Recipe BOM stock deduction
    const wasLow = appState.stocks.map(st => st.qty <= st.minAlert);
    appState.cart.forEach(item => {
        const pastry = PASTRIES.find(p => p.id === item.pastryId);
        const bom = pastry?.recipeBom || [{ idx: item.ingredientIdx, qty: 0.5 }];
        bom.forEach(b => {
            const st = appState.stocks[b.idx];
            if (st) st.qty = Math.max(0, Number((st.qty - item.qty * b.qty).toFixed(2)));
        });
    });

    appState.orders.unshift({
        ref,
        client: `${name} (${phone})`,
        details: `${itemsSummary} • ${mode} • ${dateVal} ${slotVal}`,
        payment: `${method} (${appState.paymentRegion === "international" ? "Intl" : "Local"})`,
        amountFcfa: totalFcfa,
        status: "En préparation",
        source: appState.activeCampaignId || null,
        items: orderItems, discount: discountFcfa, shipping: shippingFcfa
    });
    const autoInvoice = appState.billing?.auto !== false && billingReady() ? createInvoiceForOrder(ref, true) : null;

    pushNotification(`${name} (${phone})`, ref, "Confirmation de commande",
        `Bonjour ${name.split(" ")[0]}, merci pour votre commande ${ref} (${itemsSummary}). Total : ${formatFcfaOnly(totalFcfa)} via ${method}. ${mode} le ${dateVal} (${slotVal}).${autoInvoice ? ` Facture normalisée : ${autoInvoice.id}.` : ""}`);
    appState.stocks.forEach((st, i) => {
        if (!wasLow[i] && st.qty <= st.minAlert) {
            pushNotification(`Atelier ${appState.tenant.name}`, "", "Stock bas", `${st.name} : ${st.qty} ${st.unit} restants (seuil ${st.minAlert} ${st.unit}). Prévoir réapprovisionnement.`, "Alerte interne");
        }
    });
    appState.activeCampaignId = null;
    appState.promoPct = 15;

    appState.customer.points += Math.floor(totalFcfa / 100);
    appState.cart = [];
    appState.promoApplied = false;
    appState.promoCode = "";
    document.getElementById("promo-code-input").value = "";
    saveAppState();

    renderCartUI();
    renderBackOfficeAll();
    renderCustomerAccount();
    if (appState.activeFormat === IMM_FMT) renderArcCarousel();
    else renderAlternativeFormat();

    const waText = encodeURIComponent(`Bonjour ${appState.tenant.name}, je confirme ma commande ${ref} (${itemsSummary}) pour le ${dateVal} (${slotVal}). Total : ${formatFcfaOnly(totalFcfa)}.`);
    const coWa = String(appState.company?.whatsapp || appState.company?.phone || "").replace(/\D/g, "");
    document.getElementById("tx-whatsapp-link").href = `https://wa.me/${coWa.length >= 8 ? coWa : "2290197000000"}?text=${waText}`;
    document.getElementById("tx-receipt-ref").textContent = ref;
    document.getElementById("tx-receipt-details").textContent = `${convertFromFcfa(totalFcfa)} payé via ${method}.`;
    const invBtn = document.getElementById("tx-invoice-btn");
    invBtn.classList.toggle("hidden", !autoInvoice);
    if (autoInvoice) { invBtn.textContent = `Voir la facture ${autoInvoice.id}`; invBtn.onclick = () => openInvoice(autoInvoice.id); }
    document.getElementById("tx-receipt-box").classList.remove("hidden");
    showToast(`Commande ${ref} confirmée et sauvegardée !`, "success");
}
