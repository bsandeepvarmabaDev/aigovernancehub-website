/**
 * Product maturity — breadcrumbs, next-step guidance (v25.17)
 */
(function () {
  "use strict";

  var SITE_VERSION = "25.17";

  var PAGE = {
    "/": {
      crumbs: [{ label: "Home", href: null }],
      next: "Start your guided assessment",
      href: "pricing.html#assessment-wizard",
    },
    "/index.html": {
      crumbs: [{ label: "Home", href: null }],
      next: "Start your guided assessment",
      href: "pricing.html#assessment-wizard",
    },
    "/features.html": {
      crumbs: [
        { label: "Home", href: "index.html" },
        { label: "Features", href: null },
      ],
      next: "Download sample files or start the assessment wizard",
      href: "sample-files.html",
    },
    "/features": {
      crumbs: [
        { label: "Home", href: "index.html" },
        { label: "Features", href: null },
      ],
      next: "Download sample files or start the assessment wizard",
      href: "sample-files.html",
    },
    "/sample-files.html": {
      crumbs: [
        { label: "Home", href: "index.html" },
        { label: "Sample Files", href: null },
      ],
      next: "Upload your export in the assessment wizard",
      href: "pricing.html#assessment-wizard",
    },
    "/sample-files": {
      crumbs: [
        { label: "Home", href: "index.html" },
        { label: "Sample Files", href: null },
      ],
      next: "Upload your export in the assessment wizard",
      href: "pricing.html#assessment-wizard",
    },
    "/pricing.html": {
      crumbs: [
        { label: "Home", href: "index.html" },
        { label: "Assessment", href: null },
      ],
      next: "Choose your source in Step 1, then follow the wizard",
      href: "#assessment-wizard",
    },
    "/pricing": {
      crumbs: [
        { label: "Home", href: "index.html" },
        { label: "Assessment", href: null },
      ],
      next: "Choose your source in Step 1, then follow the wizard",
      href: "#assessment-wizard",
    },
    "/login.html": {
      crumbs: [
        { label: "Home", href: "index.html" },
        { label: "My Reports", href: null },
      ],
      next: "Sign in with your checkout email to access reports",
      href: null,
    },
    "/recover-report.html": {
      crumbs: [
        { label: "Home", href: "index.html" },
        { label: "Recover Report", href: null },
      ],
      next: "Enter the email used at checkout",
      href: null,
    },
    "/enterprise-procurement.html": {
      crumbs: [
        { label: "Home", href: "index.html" },
        { label: "Enterprise Procurement", href: null },
      ],
      next: "Contact sales for enterprise assessments over 1,000 work items",
      href: "mailto:sales@aigovernancehub.ai?subject=Enterprise%20Procurement",
    },
  };

  function pathKey() {
    var p = window.location.pathname.replace(/\\/g, "/");
    if (p.endsWith("/") && p.length > 1) p = p.slice(0, -1);
    return p || "/";
  }

  function renderBreadcrumb(crumbs, mount) {
    if (!crumbs || !crumbs.length) return;
    var nav = document.createElement("nav");
    nav.className = "pm-breadcrumb";
    nav.setAttribute("aria-label", "Breadcrumb");
    var ol = document.createElement("ol");
    crumbs.forEach(function (c) {
      var li = document.createElement("li");
      if (c.href) {
        var a = document.createElement("a");
        a.href = c.href;
        a.textContent = c.label;
        li.appendChild(a);
      } else {
        li.textContent = c.label;
        li.setAttribute("aria-current", "page");
      }
      ol.appendChild(li);
    });
    nav.appendChild(ol);
    mount.insertBefore(nav, mount.firstChild);
  }

  function renderNextStep(cfg, mount) {
    if (!cfg || !cfg.next) return;
    var aside = document.createElement("aside");
    aside.className = "pm-next-step";
    aside.setAttribute("aria-label", "Suggested next step");
    var html = "<strong>What to do next:</strong> <span>" + cfg.next + "</span>";
    if (cfg.href) {
      html += ' — <a href="' + cfg.href + '">Continue</a>';
    }
    aside.innerHTML = html;
    var main = mount.querySelector("main") || mount;
    var first = main.querySelector(".pm-breadcrumb") || main.firstElementChild;
    if (first && first.nextSibling) {
      main.insertBefore(aside, first.nextSibling);
    } else {
      main.insertBefore(aside, main.firstChild);
    }
  }

  function init() {
    var key = pathKey();
    if (key === "/" || key === "/index.html") return;
    var cfg = PAGE[key];
    if (!cfg) return;
    var main = document.querySelector("main") || document.body;
    if (cfg.crumbs && !(cfg.crumbs.length === 1 && !cfg.crumbs[0].href)) {
      renderBreadcrumb(cfg.crumbs, main);
    }
    renderNextStep(cfg, main);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
