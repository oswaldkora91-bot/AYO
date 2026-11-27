// AYO — ILLUSTRATIONS VECTORIELLES INTÉGRÉES (NETTES, SANS IMAGE EXTERNE)
// ==================== ILLUSTRATIONS VECTORIELLES INTÉGRÉES (NETTES, SANS IMAGE EXTERNE) ====================
const PASTRY_ART = (() => {
    const uri = svg => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const f = n => Math.round(n * 10) / 10;

    // Bande cylindrique vue de face (bord avant courbé en haut et en bas)
    const cyl = (cx, rx, ry, yTop, yBot, fill, extra = "") =>
        `<path d="M${f(cx - rx)} ${f(yTop)} L${f(cx - rx)} ${f(yBot)} A${rx} ${ry} 0 0 0 ${f(cx + rx)} ${f(yBot)} L${f(cx + rx)} ${f(yTop)} A${rx} ${ry} 0 0 1 ${f(cx - rx)} ${f(yTop)} Z" fill="${fill}" ${extra}/>`;

    // Cannelures d'une pâte sablée
    const flutes = (cx, rx, ry, yTop, yBot, color) => {
        let out = "";
        for (let a = -1.45; a <= 1.46; a += 0.145) {
            const x = cx + rx * Math.sin(a);
            const dy = ry * Math.cos(a);
            out += `<line x1="${f(x)}" y1="${f(yTop + dy)}" x2="${f(x)}" y2="${f(yBot + dy)}" stroke="${color}" stroke-width="${f(2.6 * Math.cos(a) + 0.6)}" stroke-opacity=".55" stroke-linecap="round"/>`;
        }
        return out;
    };

    const commonDefs = `
        <linearGradient id="cylShade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stop-color="#000" stop-opacity=".42"/>
            <stop offset=".22" stop-color="#000" stop-opacity=".05"/>
            <stop offset=".40" stop-color="#fff" stop-opacity=".16"/>
            <stop offset=".62" stop-color="#000" stop-opacity="0"/>
            <stop offset="1" stop-color="#000" stop-opacity=".46"/>
        </linearGradient>
        <filter id="soft" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>`;

    function scene(view, defs, body, groundY = 236) {
        const bg = view === 0
            ? `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0" stop-color="#FCF6EC"/><stop offset=".6" stop-color="#F3E5D0"/>
                   <stop offset=".6" stop-color="#E9D3B4"/><stop offset="1" stop-color="#DCC09B"/>
               </linearGradient>`
            : `<radialGradient id="bg" cx=".5" cy=".4" r=".8">
                   <stop offset="0" stop-color="#5C4033"/><stop offset=".55" stop-color="#2F1F18"/><stop offset="1" stop-color="#160D09"/>
               </radialGradient>`;
        const plate = view === 0
            ? `<ellipse cx="200" cy="${groundY}" rx="170" ry="36" fill="#FFFFFF" stroke="#E2D2BC" stroke-width="2"/>
               <ellipse cx="200" cy="${groundY - 2}" rx="140" ry="27" fill="#F6EFE4"/>`
            : `<ellipse cx="200" cy="${groundY}" rx="170" ry="36" fill="#2A201B" stroke="#7A604E" stroke-width="2"/>
               <ellipse cx="200" cy="${groundY - 2}" rx="140" ry="27" fill="#362A23"/>`;
        const glow = view === 1 ? `<ellipse cx="200" cy="110" rx="200" ry="120" fill="#D4A373" opacity=".10"/>` : "";
        const zoom = view === 1 ? ` transform="translate(200 175) scale(1.1) translate(-200 -175)"` : "";
        return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="800" height="600" shape-rendering="geometricPrecision"><defs>${bg}${commonDefs}${defs}</defs><rect width="400" height="300" fill="url(#bg)"/>${glow}<g${zoom}>${plate}<ellipse cx="200" cy="${groundY - 6}" rx="124" ry="17" fill="#000" opacity=".25" filter="url(#soft)"/>${body}</g></svg>`);
    }

    // ---------- 1. Royal Chocolat ----------
    function royal() {
        const cx = 200, rx = 112, ry = 24;
        let dots = "";
        for (let i = 0; i < 26; i++) {
            const a = -1.4 + i * 0.112;
            const x = cx + rx * Math.sin(a) * 0.97;
            const y = 196 + ry * Math.cos(a) + ((i * 7) % 5) - 2;
            dots += `<circle cx="${f(x)}" cy="${f(y)}" r="${1.3 + (i % 3) * 0.5}" fill="#E7BA78"/>`;
        }
        let drips = "";
        [-1.2, -0.85, -0.45, -0.1, 0.3, 0.7, 1.05].forEach((a, i) => {
            const x = cx + rx * Math.sin(a);
            const y = 122 + ry * Math.cos(a);
            const len = 10 + ((i * 11) % 14);
            drips += `<path d="M${f(x - 6)} ${f(y - 2)} L${f(x - 4)} ${f(y + len - 4)} Q${f(x)} ${f(y + len + 3)} ${f(x + 4)} ${f(y + len - 4)} L${f(x + 6)} ${f(y - 2)} Z" fill="#241109"/>`;
        });
        const defs = `<radialGradient id="glaze" cx=".42" cy=".35" r=".75"><stop offset="0" stop-color="#5A3324"/><stop offset=".6" stop-color="#2B150C"/><stop offset="1" stop-color="#1A0B05"/></radialGradient>`;
        const body =
            cyl(cx, rx, ry, 206, 226, "#4E2D1E") +
            cyl(cx, rx, ry, 190, 206, "#B27A3C") + dots +
            cyl(cx, rx, ry, 122, 190, "#3B2117") +
            cyl(cx, rx, ry, 122, 226, "url(#cylShade)") +
            drips +
            `<ellipse cx="${cx}" cy="122" rx="${rx}" ry="${ry}" fill="url(#glaze)"/>
             <ellipse cx="172" cy="114" rx="52" ry="8" fill="#fff" opacity=".16"/>
             <path d="M150 116 C158 92 190 92 196 110 C186 100 166 102 160 118 Z" fill="#6B3D27" stroke="#3B2117" stroke-width="1"/>
             <path d="M156 114 C164 100 182 100 188 110" fill="none" stroke="#A0674A" stroke-width="1.4" opacity=".8"/>
             <polygon points="214,106 230,100 238,110 226,118 212,114" fill="#E8BC6A" stroke="#C58F45" stroke-width="1"/>
             <polygon points="222,104 230,102 233,108" fill="#F6D99A"/>
             <circle cx="246" cy="122" r="3" fill="#5B3322"/><circle cx="254" cy="128" r="2.2" fill="#5B3322"/><circle cx="240" cy="130" r="2" fill="#7A4A30"/>`;
        return [scene(0, defs, body), scene(1, defs, body)];
    }

    // ---------- 2. Tarte Citron Vert Meringuée ----------
    function citron() {
        const cx = 200, rx = 132, ry = 30;
        const peaks = [];
        for (let i = 0; i < 9; i++) {
            const t = (i / 9) * Math.PI * 2;
            peaks.push({ x: cx + 78 * Math.cos(t), y: 172 + 15 * Math.sin(t), s: 1 });
        }
        [[-26, -4], [26, -4], [0, 8], [0, -10]].forEach(([dx, dy]) => peaks.push({ x: cx + dx, y: 170 + dy, s: 1.2 }));
        peaks.sort((a, b) => a.y - b.y);
        const peakSvg = peaks.map(p =>
            `<g transform="translate(${f(p.x)} ${f(p.y)}) scale(${p.s})"><path d="M0 12 C-15 12 -13 -2 -2 -18 C-1 -21 1 -21 2 -18 C13 -2 15 12 0 12 Z" fill="url(#mer)" stroke="#E9CFA9" stroke-width=".8"/><path d="M-4 6 C-6 -2 -3 -8 0 -13" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7" stroke-linecap="round"/></g>`
        ).join("");
        let segs = "";
        for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            segs += `<line x1="0" y1="0" x2="${f(11 * Math.cos(a))}" y2="${f(11 * Math.sin(a))}" stroke="#F7FBD9" stroke-width="1.2"/>`;
        }
        const defs = `
            <radialGradient id="lime" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#F2F7A6"/><stop offset="1" stop-color="#C8D94E"/></radialGradient>
            <linearGradient id="mer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9622A"/><stop offset=".22" stop-color="#DFA463"/><stop offset=".48" stop-color="#FFF5E6"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>`;
        const body =
            cyl(cx, rx, ry, 178, 214, "#D49A52") + flutes(cx, rx, ry, 180, 212, "#9C6428") +
            cyl(cx, rx, ry, 178, 214, "url(#cylShade)") +
            `<ellipse cx="${cx}" cy="178" rx="${rx}" ry="${ry}" fill="#E5B26C"/>
             <ellipse cx="${cx}" cy="180" rx="116" ry="25" fill="url(#lime)"/>
             <ellipse cx="${cx}" cy="180" rx="116" ry="25" fill="none" stroke="#B98444" stroke-width="2" opacity=".6"/>` +
            peakSvg +
            `<g transform="translate(286 172) scale(1 .55)"><circle r="15" fill="#86B22E" stroke="#5E8A1C" stroke-width="2"/><circle r="11.5" fill="#D9EA86"/>${segs}<circle r="2" fill="#F7FBD9"/></g>
             <path d="M118 170 C124 160 138 158 142 166 C134 166 126 168 118 170 Z" fill="#7FAE3A"/>`;
        return [scene(0, defs, body), scene(1, defs, body)];
    }

    // ---------- 3. Fraisier Vanille & Pistache ----------
    function fraisier() {
        const cx = 200, rx = 106, ry = 24;
        let halves = "";
        for (let k = 0; k < 7; k++) {
            const a = -1.2 + k * 0.4;
            const x = cx + rx * Math.sin(a) * 0.985;
            const y = 180 + ry * Math.cos(a) * 0.55;
            const sx = Math.max(0.35, Math.cos(a));
            halves += `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sx)} 1)">
                <path d="M0 -21 C16 -21 16 4 0 21 C-16 4 -16 -21 0 -21 Z" fill="#D7263D"/>
                <path d="M0 -15 C9 -15 9 2 0 14 C-9 2 -9 -15 0 -15 Z" fill="#F6A3AE"/>
                <path d="M0 -12 L0 10" stroke="#FFFFFF" stroke-width="1.4" opacity=".7"/>
                <circle cx="-9" cy="-8" r="1" fill="#FCE3B0"/><circle cx="9" cy="-8" r="1" fill="#FCE3B0"/><circle cx="-6" cy="6" r="1" fill="#FCE3B0"/><circle cx="6" cy="6" r="1" fill="#FCE3B0"/></g>`;
        }
        const berry = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})">
            <path d="M0 -22 C5 -20 14 -10 14 1 C14 10 -14 10 -14 1 C-14 -10 -5 -20 0 -22 Z" fill="url(#berry)"/>
            <circle cx="-5" cy="-6" r="1.1" fill="#FCE3B0"/><circle cx="4" cy="-10" r="1.1" fill="#FCE3B0"/><circle cx="6" cy="0" r="1.1" fill="#FCE3B0"/><circle cx="-6" cy="2" r="1.1" fill="#FCE3B0"/><circle cx="0" cy="-3" r="1.1" fill="#FCE3B0"/>
            <path d="M-12 5 L-4 2 L0 9 L4 2 L12 5 L6 -1 L0 1 L-6 -1 Z" fill="#3F8F3A"/></g>`;
        let crumbs = "";
        for (let i = 0; i < 22; i++) {
            const t = i * 2.4;
            const rr = 30 + (i * 13) % 60;
            crumbs += `<circle cx="${f(cx + rr * Math.cos(t))}" cy="${f(132 + rr * 0.2 * Math.sin(t))}" r="${1.4 + (i % 3) * 0.6}" fill="${i % 2 ? '#6E9E3A' : '#9CC35A'}"/>`;
        }
        const defs = `<radialGradient id="berry" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FF5A6A"/><stop offset="1" stop-color="#B5172C"/></radialGradient>
                      <radialGradient id="pista" cx=".45" cy=".4" r=".75"><stop offset="0" stop-color="#C9E08E"/><stop offset="1" stop-color="#93B95B"/></radialGradient>`;
        const body =
            cyl(cx, rx, ry, 212, 226, "#E7C27F") +
            cyl(cx, rx, ry, 148, 212, "#FFF4E2") + halves +
            cyl(cx, rx, ry, 138, 148, "#E7C27F") +
            cyl(cx, rx, ry, 132, 138, "#A9CB6C") +
            cyl(cx, rx, ry, 132, 226, "url(#cylShade)") +
            `<ellipse cx="${cx}" cy="132" rx="${rx}" ry="${ry}" fill="url(#pista)"/>
             <ellipse cx="178" cy="126" rx="46" ry="7" fill="#fff" opacity=".18"/>` +
            crumbs + berry(176, 128, -14) + berry(222, 126, 12) + berry(200, 136, 0) +
            `<ellipse cx="248" cy="138" rx="7" ry="4" fill="#FFF9EF"/><ellipse cx="152" cy="140" rx="7" ry="4" fill="#FFF9EF"/>`;
        return [scene(0, defs, body), scene(1, defs, body)];
    }

    // ---------- 4. Croissant Bicolore Framboise ----------
    function croissant() {
        const lobes = [
            { x: 90, y: 214, rx: 16, ry: 13, r: -62 }, { x: 310, y: 214, rx: 16, ry: 13, r: 62 },
            { x: 114, y: 196, rx: 27, ry: 23, r: -44 }, { x: 286, y: 196, rx: 27, ry: 23, r: 44 },
            { x: 152, y: 180, rx: 37, ry: 32, r: -22 }, { x: 248, y: 180, rx: 37, ry: 32, r: 22 },
            { x: 200, y: 172, rx: 47, ry: 40, r: 0 }
        ];
        const body = lobes.map(l => `<g transform="translate(${l.x} ${l.y}) rotate(${l.r})">
            <ellipse rx="${l.rx}" ry="${l.ry}" fill="url(#crust)" stroke="#9A5718" stroke-width="1.2"/>
            <ellipse cy="${f(-l.ry * 0.3)}" rx="${f(l.rx * 0.8)}" ry="${f(l.ry * 0.13)}" fill="#C8324A"/>
            <ellipse cy="${f(l.ry * 0.22)}" rx="${f(l.rx * 0.86)}" ry="${f(l.ry * 0.12)}" fill="#C8324A"/>
            <ellipse cy="${f(l.ry * 0.62)}" rx="${f(l.rx * 0.62)}" ry="${f(l.ry * 0.1)}" fill="#B02840"/>
            <ellipse cx="${f(-l.rx * 0.2)}" cy="${f(-l.ry * 0.58)}" rx="${f(l.rx * 0.45)}" ry="${f(l.ry * 0.14)}" fill="#fff" opacity=".35"/></g>`).join("") +
            `<circle cx="292" cy="230" r="5" fill="#C8324A"/><circle cx="300" cy="226" r="4" fill="#D94860"/><circle cx="108" cy="232" r="4" fill="#C8324A"/>`;
        const defs = `<radialGradient id="crust" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#F6CF7A"/><stop offset=".6" stop-color="#E0A04A"/><stop offset="1" stop-color="#B0661F"/></radialGradient>`;
        return [scene(0, defs, body), scene(1, defs, body)];
    }

    // ---------- 5. Coffret Macarons Mangue-Passion ----------
    function macarons() {
        const colors = [["#F4A53B", "#FFD27A"], ["#F2D04A", "#FFF0A8"], ["#6B3D27", "#3A1F14"]];
        const mac = (x, y, w, i) => {
            const [shell, fill] = colors[i % 3];
            const h = w * 0.3;
            return `<g transform="translate(${f(x)} ${f(y)})">
                <path d="M${-w / 2} 0 C${-w / 2} ${f(-h)} ${w / 2} ${f(-h)} ${w / 2} 0 Z" fill="${shell}"/>
                <rect x="${-w / 2 + 1}" y="-1" width="${w - 2}" height="4" rx="2" fill="${shell}" opacity=".75"/>
                <rect x="${-w / 2 + 4}" y="3" width="${w - 8}" height="${f(w * 0.16)}" rx="2" fill="${fill}"/>
                <path d="M${-w / 2} ${f(3 + w * 0.16)} L${w / 2} ${f(3 + w * 0.16)} C${w / 2} ${f(3 + w * 0.16 + h * 0.8)} ${-w / 2} ${f(3 + w * 0.16 + h * 0.8)} ${-w / 2} ${f(3 + w * 0.16)} Z" fill="${shell}"/>
                <ellipse cx="${f(-w * 0.15)}" cy="${f(-h * 0.55)}" rx="${f(w * 0.2)}" ry="${f(h * 0.18)}" fill="#fff" opacity=".35"/></g>`;
        };
        let back = "", front = "";
        for (let i = 0; i < 6; i++) back += mac(97 + i * 41, 150, 38, i + 1);
        for (let i = 0; i < 5; i++) front += mac(96 + i * 52, 180, 48, i);
        const body =
            `<path d="M70 146 L330 146 L346 206 L54 206 Z" fill="#3E2B22"/>` + back + front +
            `<rect x="54" y="206" width="292" height="30" rx="6" fill="#231712"/>
             <rect x="54" y="210" width="292" height="5" fill="#D4A373"/>
             <rect x="54" y="206" width="292" height="30" rx="6" fill="none" stroke="#D4A373" stroke-width="1.5"/>
             <text x="200" y="230" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="13" fill="#D4A373">Délices Sucrés</text>`;
        return [scene(0, "", body), scene(1, "", body)];
    }

    // ---------- 6. Tartelette Mangue Rôtie & Vanille ----------
    function tartelette() {
        const cx = 200, rx = 100, ry = 24;
        const petals = [];
        [{ rx: 60, ry: 12, n: 12, lift: 0, s: 1 }, { rx: 40, ry: 8, n: 9, lift: 7, s: 0.85 }, { rx: 20, ry: 5, n: 6, lift: 13, s: 0.7 }].forEach((ring, ri) => {
            for (let k = 0; k < ring.n; k++) {
                const t = (k / ring.n) * Math.PI * 2 + ri * 0.3;
                petals.push({ x: cx + ring.rx * Math.cos(t), y: 180 - ring.lift + ring.ry * Math.sin(t), rot: (t * 180 / Math.PI) + 90, s: ring.s, order: ri * 10 + Math.sin(t) });
            }
        });
        petals.sort((a, b) => a.order - b.order);
        const petalSvg = petals.map(p => `<g transform="translate(${f(p.x)} ${f(p.y)}) scale(${p.s} ${f(p.s * 0.62)}) rotate(${f(p.rot)})"><ellipse rx="12" ry="17" fill="url(#mango)" stroke="#D9761A" stroke-width=".9"/><path d="M0 -13 L0 13" stroke="#FFE08A" stroke-width="1.1" opacity=".7"/></g>`).join("");
        const defs = `<linearGradient id="mango" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD25A"/><stop offset=".6" stop-color="#F7A12E"/><stop offset="1" stop-color="#E27A1C"/></linearGradient>`;
        const body =
            cyl(cx, rx, ry, 188, 216, "#D7A05A") + flutes(cx, rx, ry, 190, 214, "#9C6428") +
            cyl(cx, rx, ry, 188, 216, "url(#cylShade)") +
            `<ellipse cx="${cx}" cy="188" rx="${rx}" ry="${ry}" fill="#E6B46E"/>
             <ellipse cx="${cx}" cy="189" rx="86" ry="19" fill="#FFF1D2"/>` +
            petalSvg +
            `<circle cx="${cx}" cy="166" r="5" fill="#F7A12E" stroke="#D9761A" stroke-width="1"/>
             <path d="M232 194 C252 184 270 186 282 192" fill="none" stroke="#3A2015" stroke-width="3.5" stroke-linecap="round"/>
             <path d="M140 186 C146 174 160 172 164 180 C156 182 148 184 140 186 Z" fill="#4E9A43"/>
             <path d="M141 185 L162 179" stroke="#2F6F2A" stroke-width=".8"/>`;
        return [scene(0, defs, body), scene(1, defs, body)];
    }

    return { 1: royal(), 2: citron(), 3: fraisier(), 4: croissant(), 5: macarons(), 6: tartelette() };
})();
