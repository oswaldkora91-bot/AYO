// AYO — MODÈLE « DÉLICE » : remplissage et mouvements de la boutique
// ==================== MODÈLE « DÉLICE » : remplissage et mouvements de la boutique ====================
const DL_SPLASH = ["#F4B9C2", "#F6D99A", "#B9DCC3", "#C9B6E4", "#F7C59F", "#A8D0E6", "#F2A7A0", "#D8E7A8"];
const DL = { items: [], bound: false, active: -1 };

function dlScrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY - (document.querySelector("header")?.offsetHeight || 60) - 8;
    window.scrollTo({ top, behavior: REDUCED_MOTION ? "auto" : "smooth" });
}
function dlShort(t, n = 90) { t = String(t || "").split(/(?<=[.!?])\s/)[0]; return t.length > n ? t.slice(0, n - 1) + "…" : t; }
function dlLeadHours(s) { const m = String(s || "").match(/(\d+)\s*(h|j)/i); return m ? Number(m[1]) * (m[2].toLowerCase() === "j" ? 24 : 1) : null; }

function renderDelice() {
    if (!document.getElementById("dl-hero")) return;
    const items = PASTRIES.filter(p => p.available !== false);
    const img = i => items.length ? items[i % items.length].images[0] : "";
    const t = appState.tenant || {};
    const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
    set("dl-overline", el => { el.textContent = t.city ? `À ${t.city}` : "Bienvenue"; });
    set("dl-hero-img", el => { el.src = img(0); el.parentElement.style.display = items.length ? "" : "none"; });
    set("dl-hero-img2", el => { el.src = img(1); el.parentElement.style.display = items.length > 1 ? "" : "none"; });
    set("dl-hero-count", el => { el.textContent = items.length; el.parentElement.parentElement.style.display = items.length ? "" : "none"; });
    set("dl-cta-img1", el => { el.src = img(2); el.parentElement.style.display = items.length ? "" : "none"; });
    set("dl-cta-img2", el => { el.src = img(3); el.parentElement.style.display = items.length ? "" : "none"; });
    ["dl-callout", "dl-specials", "dl-stamps"].forEach(id => set(id, el => { el.style.display = items.length ? "" : "none"; }));
    if (!items.length) return;

    // Bande « La carte »
    set("dl-callout-gallery", el => {
        const speeds = [.12, .28, .42, .2];
        el.innerHTML = [0, 1, 2, 3].map(i => `<div class="dl-ph" data-plx="${speeds[i]}"><img src="${img(i + 1)}" alt="" loading="lazy"></div>`).join("");
    });
    const cats = [...new Set(items.map(p => p.catLabel).filter(Boolean))];
    set("dl-callout-text", el => { el.textContent = `${cats.slice(0, 4).join(", ") || "Nos créations"}, préparés à la commande. Choisissez, payez en ligne, nous nous occupons du reste.`; });

    // Plaisirs du moment : d'abord les offres actives, complétées par les créations
    const offers = (appState.campaigns || []).filter(c => c.active !== false).map(c => {
        const p = PASTRIES.find(x => x.id === c.pastryId);
        return p ? { p, title: c.title.split("—")[0].trim(), line: dlShort(p.desc), when: c.pct > 0 ? `−${c.pct} % avec le code ${c.promo}` : `${convertFromFcfa(p.sizes[0].price)} · ${p.leadTime}` } : null;
    }).filter(Boolean);
    const used = new Set(offers.map(o => o.p.id));
    items.filter(p => !used.has(p.id)).forEach(p => offers.push({ p, title: p.name, line: dlShort(p.desc), when: `${convertFromFcfa(p.sizes[0].price)} · ${p.leadTime}` }));
    DL.items = offers.slice(0, 8);
    set("dl-track", el => {
        el.innerHTML = DL.items.map((o, i) => `
            <article class="dl-item" data-i="${i}">
                <div class="dl-item-img"><img src="${o.p.images[0]}" alt="${escapeHTML(o.p.name)}" loading="lazy"></div>
                <h3>${escapeHTML(o.title)}</h3>
                <p>${escapeHTML(o.line)}</p>
                <span class="dl-when">${escapeHTML(o.when)}</span><br>
                <button type="button" class="dl-btn" onclick="addToCart(${o.p.id}, 0); if (typeof flyToCart === 'function') flyToCart(this.closest('.dl-item').querySelector('img'))">+ Ajouter</button>
            </article>`).join("");
    });
    set("dl-dots", el => { el.innerHTML = DL.items.map(() => "<i></i>").join(""); });

    // Chiffres : uniquement ce que la boutique sait vraiment
    const leads = items.map(p => dlLeadHours(p.leadTime)).filter(v => v != null);
    const minLead = leads.length ? Math.min(...leads) : null;
    const stamps = [
        { b: items.length, s: items.length > 1 ? "créations à la carte" : "création à la carte", c: "#C8324A" },
        { b: cats.length, s: cats.length > 1 ? "catégories" : "catégorie", c: "#231712" },
        minLead != null ? { b: minLead >= 24 ? `${Math.round(minLead / 24)} j` : `${minLead} h`, s: "délai le plus court", c: "#A0522D" } : null
    ].filter(Boolean);
    set("dl-stamps-grid", el => {
        const cells = [];
        const ph = (i, sp) => `<div class="dl-st-photo" data-plx="${sp}"><img src="${img(i)}" alt="" loading="lazy"></div>`;
        const st = (x, sp) => `<div class="dl-stamp" data-plx="${sp}" style="background:${x.c}"><b>${escapeHTML(String(x.b))}</b><span>${escapeHTML(x.s)}</span></div>`;
        cells.push(ph(4, .1));
        stamps.forEach((x, k) => { cells.push(st(x, .25 + k * .12)); if (k === 0) cells.push(ph(5, .35)); });
        cells.push(ph(0, .5));
        el.innerHTML = cells.join("");
    });
    DL.active = -1;
    dlSetup();
}

function dlSetup() {
    const sec = document.getElementById("dl-specials");
    if (!sec) return;
    const desktop = innerWidth >= 768;
    sec.style.height = desktop ? `calc(100vh + ${Math.max(0, DL.items.length - 1) * 42}vh)` : "";
    if (!DL.bound) {
        DL.bound = true;
        let raf = 0;
        const tick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(dlUpdate); };
        addEventListener("scroll", tick, { passive: true });
        addEventListener("resize", () => { dlSetup(); tick(); });
        document.getElementById("dl-track")?.addEventListener("scroll", tick, { passive: true });
        if ("IntersectionObserver" in window) new IntersectionObserver(es => es.forEach(e => sec.classList.toggle("in", e.isIntersecting)), { threshold: .15 }).observe(sec);
        else sec.classList.add("in");
    }
    dlUpdate();
}

function dlUpdate() {
    const sec = document.getElementById("dl-specials");
    if (!sec || !sec.offsetParent) return;
    // Parallaxe : chaque photo et chaque tampon monte à sa propre vitesse
    if (!REDUCED_MOTION) document.querySelectorAll("[data-plx]").forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const d = (r.top + r.height / 2 - innerHeight / 2);
        el.style.transform = `translate3d(0, ${(-d * Number(el.dataset.plx)).toFixed(1)}px, 0)`;
    });
    const track = document.getElementById("dl-track");
    const n = DL.items.length;
    if (!track || !n) return;
    let act;
    if (innerWidth >= 768) {
        const r = sec.getBoundingClientRect();
        const sticky = sec.querySelector(".dl-specials-sticky");
        const travel = Math.max(1, sec.offsetHeight - sticky.offsetHeight);
        const top = parseFloat(getComputedStyle(sticky).top) || 0;
        const p = Math.min(1, Math.max(0, (top - r.top) / travel));
        const max = Math.max(0, track.scrollWidth - innerWidth);
        track.style.transform = `translate3d(${(-p * max).toFixed(1)}px, 0, 0)`;
        act = Math.round(p * (n - 1));
    } else {
        const w = track.firstElementChild ? track.firstElementChild.offsetWidth : 1;
        act = Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / (w + 16))));
    }
    if (act !== DL.active) {
        DL.active = act;
        document.getElementById("dl-splash")?.style.setProperty("--splash", DL_SPLASH[act % DL_SPLASH.length]);
        track.querySelectorAll(".dl-item").forEach((el, i) => el.classList.toggle("is-on", i === act));
        document.querySelectorAll("#dl-dots i").forEach((el, i) => el.classList.toggle("on", i === act));
    }
}

const _renderAllDl = renderAll;
renderAll = function () { const r = _renderAllDl.apply(this, arguments); try { renderDelice(); } catch (e) { console.warn(e); } return r; };
