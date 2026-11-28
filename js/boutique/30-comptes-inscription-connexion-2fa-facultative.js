// AYO — COMPTES : INSCRIPTION, CONNEXION, 2FA FACULTATIVE
// Version de la boutique client (boutique.html)
// ==================== COMPTES : INSCRIPTION, CONNEXION, 2FA FACULTATIVE ====================
// Les mots de passe ne sont jamais stockés : seulement sel + empreinte SHA-256.
const DEMO_ACCOUNTS = [
    {
        type: "business", name: "Direction Délices Sucrés", email: "direction@delicessucres.bj", phone: "+229 01 97 00 00 56",
        salt: "ds-demo-2026", hash: "2e8791f4df9cebf223bde5c52fccae7631cb40fa6ce6694dbf51896e48973e1e", twoFA: false, demo: true,
        business: { name: "Délices Sucrés", city: "Cotonou — Haie Vive", specialty: "Haute Pâtisserie Artisanale & Événements", format: 1 }
    },
    {
        type: "customer", name: "Amina Soglo", email: "amina.soglo@cotonou.bj", phone: "+229 01 97 12 34 56",
        salt: "ds-cust-2026", hash: "6cb7c00066a6bd53ad142fae1c8878f35a1a079ab78bfdc6e75de33aa67840a7", twoFA: false, demo: true
    }
];
const OTP_VALIDITY_MS = 5 * 60 * 1000;
const OTP_MAX_TRIES = 5;
const PASS_MAX_TRIES = 8;
const LOCK_MS = 30 * 1000;
const RESEND_COOLDOWN_MS = 20 * 1000;
const SESSION_IDLE_MS = 30 * 60 * 1000;

const authGuard = { passFails: 0, lockedUntil: 0, otpExpires: 0, otpTriesLeft: OTP_MAX_TRIES, resendAt: 0, timer: null };
let adminLastActivity = 0;
let pendingProService = null;
let loginCandidate = null;
let pendingSignup = null;
let authMode = "login";

function allAccounts() {
    const own = Array.isArray(appState.accounts) ? appState.accounts : [];
    return [...own, ...DEMO_ACCOUNTS];
}
function currentAccount() {
    return allAccounts().find(a => a.email === appState.currentAccountEmail && a.type === "business") || null;
}

function handleAuthButton() { openProSpace(); }

// Carte de connexion : dans la page Espace Entreprise (inline) ou en fenêtre (compte client)
function mountAuthCard(inline) {
    const card = document.getElementById("auth-card");
    const target = inline ? (document.getElementById("ayo-auth-right") || document.getElementById("pro-login-slot")) : document.getElementById("auth-modal");
    if (card.parentElement !== target) target.appendChild(card);
    card.classList.toggle("max-w-md", !inline);
    card.classList.toggle("shadow-2xl", !inline);
    card.classList.toggle("shadow-lg", inline);
    document.getElementById("auth-close-btn").classList.toggle("hidden", inline);
    document.getElementById("auth-type-row").classList.toggle("hidden", inline);
}

function setAuthError(id, msg) {
    const el = document.getElementById(id === 2 ? "auth-error2" : `auth-error-${id}`);
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("hidden", !msg);
}

function showAuthMode(mode) {
    authMode = mode;
    clearInterval(authGuard.timer);
    const isCustomer = authAccountType === "customer";
    if (isCustomer) mode = "login";
    ["auth-login", "auth-signup1", "auth-signup2", "auth-step2"].forEach(id => document.getElementById(id).classList.add("hidden"));
    document.getElementById("sms-sim").classList.add("hidden");
    document.getElementById("auth-mode-tabs").classList.toggle("hidden", isCustomer);
    const tl = document.getElementById("auth-tab-login"), ts = document.getElementById("auth-tab-signup");
    const on = "py-2.5 rounded-xl text-xs font-extrabold bg-darkChoc text-brass", off = "py-2.5 rounded-xl text-xs font-bold text-darkChoc";
    tl.className = mode === "login" ? on : off;
    ts.className = mode === "signup" ? on : off;
    ["login", "su1", "su2"].forEach(k => setAuthError(k, "")); setAuthError(2, "");
    if (mode === "signup") {
        document.getElementById("auth-title").textContent = "Créer votre compte";
        showSignupStep(1);
    } else {
        document.getElementById("auth-title").textContent = isCustomer ? "Connexion client" : "Connexion à votre espace";
        document.getElementById("auth-login").classList.remove("hidden");
        document.getElementById("auth-demo-block").classList.toggle("hidden", isCustomer);
    }
}

function showSignupStep(step) {
    document.getElementById("auth-signup1").classList.toggle("hidden", step !== 1);
    document.getElementById("auth-signup2").classList.toggle("hidden", step !== 2);
    document.getElementById("auth-title").textContent = step === 1 ? "Créer votre compte" : "Votre entreprise";
}

function resetAuthForm(type) {
    selectAuthAccountType(type);
    ["auth-password", "su-pass", "su-pass2"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    updatePwdStrength();
    showAuthMode(type === "customer" ? "login" : authMode);
}

function openProSpace() {
    if (appState.isAdminAuthenticated) { goToProService("home"); return; }
    switchView("pro");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openProService(key) {
    if (!appState.isAdminAuthenticated) {
        pendingProService = key;
        const label = document.querySelector(`.pro-service[onclick*="'${key}'"] strong`)?.textContent || "ce service";
        showToast(`Connectez-vous ou créez votre compte pour ouvrir « ${label} ».`, "info");
        document.getElementById("pro-login-slot").scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }
    goToProService(key);
}

function goToProService(key) {
    if (key === "formats") { switchView("formats"); return; }
    switchView("admin");
    switchBoTab(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function maskPhone(phone) {
    const d = String(phone).replace(/\D/g, "");
    return d.length > 4 ? `+${d.slice(0, 3)} •• •• •• ${d.slice(-2)}` : phone;
}

function openAuthModal(type = "business") {
    if (type === "business") { openProSpace(); return; }
    mountAuthCard(false);
    resetAuthForm(type);
    const m = document.getElementById("auth-modal");
    m.classList.remove("hidden");
    m.classList.add("flex");
}
function closeAuthModal() {
    clearInterval(authGuard.timer);
    const m = document.getElementById("auth-modal");
    m.classList.add("hidden");
    m.classList.remove("flex");
}
function selectAuthAccountType(type) {
    authAccountType = type;
    const active = "py-2 rounded-xl text-xs font-bold bg-darkChoc text-vanilla";
    const idle = "py-2 rounded-xl text-xs font-semibold text-darkChoc";
    document.getElementById("auth-type-business").className = type === "business" ? active : idle;
    document.getElementById("auth-type-customer").className = type === "customer" ? active : idle;
    document.getElementById("auth-kicker").textContent = type === "customer" ? "Compte client" : "Espace Entreprise";
    document.getElementById("auth-email").value = type === "customer" ? DEMO_ACCOUNTS[1].email : "";
    showAuthMode(type === "customer" ? "login" : authMode);
}

function togglePwd(id, btn) {
    const el = document.getElementById(id);
    const show = el.type === "password";
    el.type = show ? "text" : "password";
    btn.textContent = show ? "Masquer" : "Afficher";
}

function passwordScore(p) {
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/\d/.test(p)) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
}
function updatePwdStrength() {
    const el = document.getElementById("su-pass");
    const bar = document.getElementById("su-strength-bar");
    const label = document.getElementById("su-strength-label");
    if (!el || !bar) return;
    const p = el.value;
    const sc = p ? passwordScore(p) : 0;
    const levels = [["", "0%", ""], ["Faible", "25%", "bg-red-500"], ["Moyen", "50%", "bg-amber-500"], ["Bon", "75%", "bg-sage"], ["Excellent", "100%", "bg-sage"], ["Excellent", "100%", "bg-sage"]];
    const [txt, w, color] = levels[p ? Math.max(1, sc) : 0];
    bar.className = `h-full transition-all ${color}`;
    bar.style.width = w;
    label.textContent = txt;
}

async function sha256Hex(text) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function randomSalt() {
    const a = new Uint8Array(12);
    crypto.getRandomValues(a);
    return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ---------- Connexion ----------
async function submitLogin(e) {
    e.preventDefault();
    setAuthError("login", "");
    if (Date.now() < authGuard.lockedUntil) {
        setAuthError("login", `Trop de tentatives. Réessayez dans ${Math.ceil((authGuard.lockedUntil - Date.now()) / 1000)} s.`);
        return;
    }
    const email = document.getElementById("auth-email").value.trim().toLowerCase();
    const pass = document.getElementById("auth-password").value;
    const acc = allAccounts().find(a => a.email === email && a.type === authAccountType);
    let ok = false;
    if (acc) { try { ok = (await sha256Hex(`${acc.salt}|${pass}`)) === acc.hash; } catch (err) { ok = false; } }
    if (!ok) {
        authGuard.passFails += 1;
        if (authGuard.passFails >= PASS_MAX_TRIES) {
            authGuard.passFails = 0;
            authGuard.lockedUntil = Date.now() + LOCK_MS;
            setAuthError("login", "Trop d'essais : réessayez dans 30 secondes.");
        } else {
            setAuthError("login", acc ? "Mot de passe incorrect." : "Aucun compte avec cet e-mail. Créez votre compte.");
        }
        return;
    }
    authGuard.passFails = 0;
    if (acc.twoFA) {
        loginCandidate = acc;
        document.getElementById("auth-login").classList.add("hidden");
        document.getElementById("auth-mode-tabs").classList.add("hidden");
        document.getElementById("auth-step2").classList.remove("hidden");
        document.getElementById("auth-title").textContent = "Vérification";
        sendOtp(acc);
        return;
    }
    completeLogin(acc);
}

function startSignup() {
    if (appState.isAdminAuthenticated) { goToProService("account"); return; }
    switchView("pro");
    showAuthMode("signup");
    document.getElementById("pro-login-slot").scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => document.getElementById("su-name").focus(), 300);
}

function demoLogin() {
    completeLogin(DEMO_ACCOUNTS[0]);
}

// ---------- Inscription ----------
function submitSignupStep1(e) {
    e.preventDefault();
    const name = document.getElementById("su-name").value.trim();
    const email = document.getElementById("su-email").value.trim().toLowerCase();
    const phone = document.getElementById("su-phone").value.trim();
    const pass = document.getElementById("su-pass").value;
    const pass2 = document.getElementById("su-pass2").value;
    if (allAccounts().some(a => a.email === email && a.type === "business")) {
        setAuthError("su1", "Un compte existe déjà avec cet e-mail. Connectez-vous."); return;
    }
    if (phone.replace(/\D/g, "").length < 8) { setAuthError("su1", "Numéro de téléphone incomplet."); return; }
    if (pass.length < 8 || !/\d/.test(pass)) { setAuthError("su1", "Le mot de passe doit faire au moins 8 caractères et contenir un chiffre."); return; }
    if (pass !== pass2) { setAuthError("su1", "Les deux mots de passe ne sont pas identiques."); return; }
    setAuthError("su1", "");
    pendingSignup = { name, email, phone, pass, twoFA: document.getElementById("su-2fa").checked };
    showSignupStep(2);
    setTimeout(() => document.getElementById("su-biz-name").focus(), 50);
}

async function submitSignupStep2(e) {
    e.preventDefault();
    if (!pendingSignup) { showSignupStep(1); return; }
    const bizName = document.getElementById("su-biz-name").value.trim();
    const city = document.getElementById("su-biz-city").value.trim();
    const specialty = document.getElementById("su-biz-spec").value;
    const format = parseInt(document.querySelector('input[name="su-format"]:checked')?.value || "1", 10);
    if (!bizName || !city) { setAuthError("su2", "Indiquez le nom et la ville de l'entreprise."); return; }
    const salt = randomSalt();
    let hash = "";
    try { hash = await sha256Hex(`${salt}|${pendingSignup.pass}`); }
    catch (err) { setAuthError("su2", "Votre navigateur ne permet pas le chiffrement. Essayez un autre navigateur."); return; }
    const acc = {
        type: "business", name: pendingSignup.name, email: pendingSignup.email, phone: pendingSignup.phone,
        salt, hash, twoFA: pendingSignup.twoFA, createdAt: new Date().toISOString(),
        business: { name: bizName, city, specialty, format }
    };
    appState.accounts = [acc, ...(appState.accounts || [])];
    pendingSignup = null;
    ["su-name", "su-email", "su-phone", "su-pass", "su-pass2", "su-biz-name", "su-biz-city"].forEach(id => { document.getElementById(id).value = ""; });
    document.getElementById("su-2fa").checked = false;
    updatePwdStrength();
    saveAppState();
    completeLogin(acc, true);
}

// ---------- Ouverture de session ----------
function completeLogin(acc, isNew = false) {
    clearInterval(authGuard.timer);
    loginCandidate = null;
    closeAuthModal();
    if (acc.type === "business") {
        switchWorkspace(acc.demo ? "demo" : `acc:${acc.email}`, acc);
        appState.isAdminAuthenticated = true;
        appState.currentAccountEmail = acc.email;
        adminLastActivity = Date.now();
        if (acc.business && isNew) {
            appState.tenant = { name: acc.business.name, city: acc.business.city, specialty: acc.business.specialty };
            if (acc.business.format) appState.activeFormat = acc.business.format;
        }
        saveAppState();
        renderAll();
        updateAdminAccessUI();
        updateBrandHeaderUI();
        applyFormat(appState.activeFormat, false);
        const target = pendingProService;
        pendingProService = null;
        goToProService(target || "home");
        showToast(isNew ? `Bienvenue ${acc.name.split(" ")[0]} ! L'espace « ${acc.business.name} » est prêt.` : `Connecté : ${acc.business?.name || acc.name}.`, "success");
    } else {
        document.getElementById("topbar-auth-badge").textContent = acc.name;
        switchView("customer");
        showToast(`Bienvenue ${acc.name} !`, "success");
    }
    showAuthMode("login");
}

// ---------- Code SMS (si la double authentification est activée) ----------
function generateOtp() {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return String(100000 + (buf[0] % 900000));
}
function sendOtp(acc) {
    current2faOtp = generateOtp();
    authGuard.otpExpires = Date.now() + OTP_VALIDITY_MS;
    authGuard.otpTriesLeft = OTP_MAX_TRIES;
    authGuard.resendAt = Date.now() + RESEND_COOLDOWN_MS;
    document.getElementById("auth-otp-dest").innerHTML = `Code à 6 chiffres envoyé par SMS au <span id="auth-masked-phone" class="font-mono">${escapeHTML(maskPhone(acc.phone))}</span> (démonstration).`;
    document.getElementById("sms-sim-code").textContent = current2faOtp;
    document.getElementById("sms-sim").classList.remove("hidden");
    document.querySelectorAll(".otp-box").forEach(b => { b.value = ""; });
    setAuthError(2, "");
    clearInterval(authGuard.timer);
    authGuard.timer = setInterval(tickOtpTimer, 500);
    tickOtpTimer();
    setTimeout(() => document.querySelector(".otp-box")?.focus(), 50);
}
function tickOtpTimer() {
    const left = Math.max(0, authGuard.otpExpires - Date.now());
    const sec = Math.ceil(left / 1000);
    document.getElementById("auth-otp-timer").textContent = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
    document.getElementById("auth-otp-left").textContent = authGuard.otpTriesLeft;
    const resend = document.getElementById("auth-resend-btn");
    const wait = Math.ceil(Math.max(0, authGuard.resendAt - Date.now()) / 1000);
    resend.disabled = wait > 0;
    resend.textContent = wait > 0 ? `Renvoyer le code (${wait} s)` : "Renvoyer le code";
    if (left === 0 && current2faOtp) {
        current2faOtp = null;
        setAuthError(2, "Code expiré : cliquez sur « Renvoyer le code ».");
    }
}
function resendOtp() {
    if (Date.now() < authGuard.resendAt || !loginCandidate) return;
    sendOtp(loginCandidate);
    showToast("Nouveau code envoyé.", "success");
}
function submitAuthStep2(e) {
    e.preventDefault();
    const code = Array.from(document.querySelectorAll(".otp-box")).map(b => b.value).join("");
    if (!current2faOtp) { setAuthError(2, "Code expiré : cliquez sur « Renvoyer le code »."); return; }
    if (code !== current2faOtp) {
        authGuard.otpTriesLeft -= 1;
        document.querySelectorAll(".otp-box").forEach(b => { b.value = ""; });
        document.querySelector(".otp-box")?.focus();
        if (authGuard.otpTriesLeft <= 0) { showAuthMode("login"); setAuthError("login", "Trop de codes erronés : reconnectez-vous."); return; }
        setAuthError(2, `Code incorrect. Essais restants : ${authGuard.otpTriesLeft}.`);
        tickOtpTimer();
        return;
    }
    completeLogin(loginCandidate);
}

function initOtpBoxes() {
    const boxes = Array.from(document.querySelectorAll(".otp-box"));
    boxes.forEach((box, i) => {
        box.addEventListener("input", () => {
            box.value = box.value.replace(/\D/g, "").slice(-1);
            if (box.value && boxes[i + 1]) boxes[i + 1].focus();
            if (boxes.every(b => b.value)) document.getElementById("auth-step2").requestSubmit();
        });
        box.addEventListener("keydown", ev => {
            if (ev.key === "Backspace" && !box.value && boxes[i - 1]) boxes[i - 1].focus();
        });
        box.addEventListener("paste", ev => {
            const digits = (ev.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
            if (!digits) return;
            ev.preventDefault();
            digits.split("").forEach((d, k) => { if (boxes[k]) boxes[k].value = d; });
            (boxes[digits.length] || boxes[5]).focus();
            if (digits.length === 6) document.getElementById("auth-step2").requestSubmit();
        });
    });
}

// Session entreprise : jamais conservée au rechargement, fermée après 30 min d'inactivité
function initAdminSessionGuard() {
    ["click", "keydown", "touchstart", "mousemove"].forEach(ev =>
        window.addEventListener(ev, () => { if (appState.isAdminAuthenticated) adminLastActivity = Date.now(); }, { passive: true }));
    setInterval(() => {
        const badge = document.getElementById("bo-session-timer");
        if (!appState.isAdminAuthenticated) return;
        const left = Math.max(0, SESSION_IDLE_MS - (Date.now() - adminLastActivity));
        if (badge) {
            const sec = Math.ceil(left / 1000);
            badge.textContent = `Session : ${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
        }
        if (left === 0) {
            logoutAdmin();
            showToast("Session fermée après 30 min d'inactivité. Reconnectez-vous.", "info");
        }
    }, 1000);
}
