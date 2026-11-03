/* FGA Innovations — shared behaviour: language switch, menu, logo draw-in, pointer glow, contact form.
   English lives in the HTML (data-i18n / data-i18n-html). French comes from COMMON_FR below plus the
   page's own window.I18N_FR, set in an inline script before this file. */
(function () {
  "use strict";

  var COMMON_FR = {
    "nav.services": "Services", "nav.apps": "Applications", "nav.approach": "Méthode", "nav.contact": "Contact",
    "nav.cta": "Demander un devis", "nav.menu": "Menu", "skip": "Aller au contenu",
    "foot.tagline": "Innover. Améliorer. Réussir.",
    "foot.company": "Entreprise", "foot.apps": "Applications", "foot.help": "Aide",
    "foot.services": "Services", "foot.approach": "Notre méthode", "foot.contact": "Contact",
    "foot.allapps": "Toutes les applications", "foot.dy": "Dumuni Yala", "foot.cb": "Carnet Boutique", "foot.ak": "Aventurier K",
    "foot.support": "Aide et contact", "foot.privacy": "Confidentialité des applications", "foot.cbsupport": "Support Carnet Boutique", "foot.cbprivacy": "Confidentialité Carnet Boutique",
    "foot.rights": "Tous droits réservés.",
    "st.live": "Sur l’App Store", "st.soon": "Bientôt disponible", "st.dev": "En développement"
  };
  var FR = Object.assign({}, COMMON_FR, window.I18N_FR || {});

  var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-i18n], [data-i18n-html], [data-i18n-attr]"));
  var EN = new Map();
  nodes.forEach(function (el) {
    var htmlKey = el.getAttribute("data-i18n-html"), key = el.getAttribute("data-i18n"), attr = el.getAttribute("data-i18n-attr");
    if (htmlKey) EN.set(el, { html: el.innerHTML, key: htmlKey });
    else if (key) EN.set(el, { text: el.textContent, key: key });
    if (attr) { var parts = attr.split(":"); EN.set(el, Object.assign(EN.get(el) || {}, { attrName: parts[0], attrKey: parts[1], attrVal: el.getAttribute(parts[0]) })); }
  });

  function setLang(lang) {
    nodes.forEach(function (el) {
      var o = EN.get(el); if (!o) return;
      if (o.html !== undefined) el.innerHTML = lang === "fr" && FR[o.key] ? FR[o.key] : o.html;
      if (o.text !== undefined) el.textContent = lang === "fr" && FR[o.key] ? FR[o.key] : o.text;
      if (o.attrName) el.setAttribute(o.attrName, lang === "fr" && FR[o.attrKey] ? FR[o.attrKey] : o.attrVal);
    });
    document.documentElement.lang = lang;
    document.querySelectorAll(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    try { localStorage.setItem("fga-lang", lang); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem("fga-lang"); } catch (e) {}
  var initial = saved || ((navigator.language || "").toLowerCase().indexOf("fr") === 0 ? "fr" : "en");
  if (initial === "fr") setLang("fr");
  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang); });
  });

  /* Mobile menu */
  var menuBtn = document.querySelector(".menu-btn"), links = document.getElementById("nav-links");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.focus(); }
    });
  }

  /* Logo draw-in: once per browser session */
  try {
    if (!sessionStorage.getItem("fga-logo-drawn")) {
      document.documentElement.classList.add("draw-logo");
      sessionStorage.setItem("fga-logo-drawn", "1");
    }
  } catch (e) {}

  /* Pointer glow on dark cards (precise pointers only) */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".glow-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* Contact form: keep aria-invalid in step with :user-invalid, then open the visitor's email app */
  var form = document.getElementById("contact-form");
  if (form) {
    var supportsUserInvalid = CSS.supports && CSS.supports("selector(:user-invalid)");
    var sync = function (el) {
      if (!el.matches || !el.matches("input, textarea, select")) return;
      var bad = supportsUserInvalid ? el.matches(":user-invalid") : !el.checkValidity();
      if (bad) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
    };
    form.addEventListener("blur", function (e) { sync(e.target); }, true);
    form.addEventListener("input", function (e) { if (e.target.hasAttribute("aria-invalid")) sync(e.target); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      Array.prototype.forEach.call(form.elements, sync);
      if (!form.checkValidity()) { form.querySelector(":invalid").focus(); return; }
      var f = form.elements;
      var subject = "[" + f.service.value + "] " + f.name.value;
      var body = f.message.value + "\n\n" + f.name.value + "\n" + f.email.value;
      window.location.href = "mailto:info@fga-innovations.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
