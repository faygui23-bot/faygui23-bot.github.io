/* FGA Innovations — language switch (EN/FR) and mobile menu.
   Each page sets window.I18N_FR = { key: "French text" } before loading this file.
   English stays in the HTML; elements carry data-i18n="key" (text) or data-i18n-html="key". */
(function () {
  var FR = window.I18N_FR || {};
  var nodes = document.querySelectorAll("[data-i18n], [data-i18n-html]");
  var EN = {};
  nodes.forEach(function (el) {
    var key = el.getAttribute("data-i18n") || el.getAttribute("data-i18n-html");
    if (!(key in EN)) EN[key] = el.hasAttribute("data-i18n-html") ? el.innerHTML : el.textContent;
  });

  function setLang(lang) {
    var dict = lang === "fr" ? FR : EN;
    nodes.forEach(function (el) {
      var htmlKey = el.getAttribute("data-i18n-html");
      if (htmlKey) { if (dict[htmlKey]) el.innerHTML = dict[htmlKey]; return; }
      var key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
    document.documentElement.lang = lang;
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    try { localStorage.setItem("fga-lang", lang); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem("fga-lang"); } catch (e) {}
  var initial = saved || ((navigator.language || "").toLowerCase().indexOf("fr") === 0 ? "fr" : "en");
  if (initial === "fr") setLang("fr");

  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
  });

  var toggle = document.querySelector(".menu-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
