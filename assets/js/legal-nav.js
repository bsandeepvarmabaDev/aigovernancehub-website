/** Mobile nav toggle for legal-hero pages — v25.6 */
(function () {
  "use strict";
  var toggle = document.querySelector(".legal-nav-toggle");
  var links = document.getElementById("legalNavLinks");
  if (!toggle || !links) return;
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();
