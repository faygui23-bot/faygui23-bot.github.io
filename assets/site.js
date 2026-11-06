/* FGA Innovations — shared behaviour: language switch, menu, logo draw-in, pointer glow, contact form.
   Main pages exist twice (English, and a French twin under /fr/ linked with hreflang); the EN/FR
   switch moves between them. Other pages are bilingual in place: English lives in the HTML
   (data-i18n / data-i18n-html / data-i18n-attr, data-href-fr for links) and French comes from the
   page's window.I18N_FR, set in an inline script before this file. */
(function () {
  "use strict";

  function remember(lang) { try { localStorage.setItem("fga-lang", lang); } catch (e) {} }
  var twins = {};
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function (l) { twins[l.hreflang] = new URL(l.href).pathname; });
  var buttons = document.querySelectorAll(".lang button");

  if (twins.en && twins.fr) {
    /* The early script in <head> already sent the visitor to their language; here the switch just navigates. */
    var pageLang = document.documentElement.lang;
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === pageLang));
      b.addEventListener("click", function () {
        remember(b.dataset.lang);
        if (b.dataset.lang !== pageLang) location.href = twins[b.dataset.lang] + location.hash;
      });
    });
  } else {
    var FR = window.I18N_FR || {};
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-i18n], [data-i18n-html], [data-i18n-attr], [data-href-fr]"));
    var EN = new Map();
    nodes.forEach(function (el) {
      var o = {}, htmlKey = el.getAttribute("data-i18n-html"), key = el.getAttribute("data-i18n"), attr = el.getAttribute("data-i18n-attr");
      if (htmlKey) { o.html = el.innerHTML; o.key = htmlKey; }
      else if (key) { o.text = el.textContent; o.key = key; }
      if (attr) { var parts = attr.split(":"); o.attrName = parts[0]; o.attrKey = parts[1]; o.attrVal = el.getAttribute(parts[0]); }
      if (el.hasAttribute("data-href-fr")) { o.href = el.getAttribute("href"); o.hrefFr = el.getAttribute("data-href-fr"); }
      EN.set(el, o);
    });

    var setLang = function (lang) {
      var fr = lang === "fr";
      nodes.forEach(function (el) {
        var o = EN.get(el);
        if (o.html !== undefined) el.innerHTML = fr && FR[o.key] ? FR[o.key] : o.html;
        if (o.text !== undefined) el.textContent = fr && FR[o.key] ? FR[o.key] : o.text;
        if (o.attrName) el.setAttribute(o.attrName, fr && FR[o.attrKey] ? FR[o.attrKey] : o.attrVal);
        if (o.href) el.setAttribute("href", fr ? o.hrefFr : o.href);
      });
      document.documentElement.lang = lang;
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    };
    var saved = null;
    try { saved = localStorage.getItem("fga-lang"); } catch (e) {}
    var initial = saved || ((navigator.language || "").toLowerCase().indexOf("fr") === 0 ? "fr" : "en");
    if (initial === "fr") setLang("fr");
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.dataset.lang); remember(b.dataset.lang); });
    });
  }

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
