/**
 * Production trust footer — version + health probe (v25.20). Factual only; no fake badges.
 */
(function () {
  "use strict";

  var SITE_VERSION = "25.23";
  var BUILD_LABEL = "2026-06-27";

  function injectTrustFooter() {
    var footers = document.querySelectorAll(".site-footer .footer-inner");
    if (!footers.length) return;

    footers.forEach(function (inner) {
      if (inner.querySelector(".et-production-trust")) return;
      var el = document.createElement("p");
      el.className = "et-production-trust";
      el.setAttribute("aria-label", "Platform trust information");
      el.innerHTML =
        "Platform v" +
        SITE_VERSION +
        " · Build " +
        BUILD_LABEL +
        ' · <a href="trust-center.html">Trust Center</a> · ' +
        '<a href="security-policy.html">Responsible disclosure</a> · ' +
        '<a href="mailto:security@aigovernancehub.ai">security@aigovernancehub.ai</a> · ' +
        "Support SLA: general 1 business day · enterprise 1–2 business days · " +
        '<span id="et-health-status">API status: checking…</span>';
      inner.appendChild(el);
    });

    fetch("/api/health", { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        var nodes = document.querySelectorAll("#et-health-status");
        var text = data && data.version
          ? "API v" + data.version + " · " + (data.status || "ok")
          : "API unavailable — deploy may be pending";
        nodes.forEach(function (n) {
          n.textContent = text;
        });
      })
      .catch(function () {
        document.querySelectorAll("#et-health-status").forEach(function (n) {
          n.textContent = "API unavailable — deploy may be pending";
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectTrustFooter);
  } else {
    injectTrustFooter();
  }
})();
