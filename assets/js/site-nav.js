/**
 * Mobile navigation toggle — external script for CSP (v25.14).
 */
(function () {
  "use strict";

  function initNavToggle() {
    var navToggle = document.querySelector(".nav-toggle");
    var navLinks = document.getElementById("navLinks");
    if (!navToggle || !navLinks) return;

    navToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        var firstLink = navLinks.querySelector("a");
        if (firstLink) firstLink.focus();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavToggle);
  } else {
    initNavToggle();
  }
})();
