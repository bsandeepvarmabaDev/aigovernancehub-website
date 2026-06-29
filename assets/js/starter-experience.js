/**
 * AI Governance Hub — Starter Experience (visible customer journey polish)
 */
(function (global) {
  "use strict";

  var STEP_META = {
    1: {
      title: "Choose your data source",
      now: "Tell us where your work items come from so we can validate the right export format.",
      next: "Next: step-by-step export instructions and sample files.",
    },
    2: {
      title: "Export your work items",
      now: "Follow the instructions for your platform — we show exactly which columns we need.",
      next: "Next: upload your file for server-side validation.",
    },
    3: {
      title: "Upload your export",
      now: "Your file is sent securely. We validate structure, encoding, and required fields on our servers.",
      next: "Next: compatibility check and a free AI governance preview.",
    },
    4: {
      title: "Validation complete",
      now: "We counted your work items server-side and checked compatibility — never from the browser.",
      next: "Next: review your executive preview and order summary.",
    },
    5: {
      title: "Your assessment preview",
      now: "This is a live sample of what our engine found — governance score, AI-related work items, and risk signals.",
      next: "Next: confirm your order and open Secure Checkout.",
    },
    6: {
      title: "Secure Checkout",
      now: "Review the server-calculated total, confirm your details, then pay via Razorpay.",
      next: "After payment: instant report generation in HTML, PDF, Word, and PowerPoint.",
    },
  };

  var TOTAL_STEPS = 6;

  function $(id) {
    return document.getElementById(id);
  }

  function updateProgress(step) {
    var bar = $("sx-progress-bar");
    var label = $("sx-progress-label");
    var pct = Math.min(100, Math.round((step / TOTAL_STEPS) * 100));
    if (bar) {
      bar.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", String(pct));
    }
    if (label) label.textContent = "Step " + step + " of " + TOTAL_STEPS + " · " + Math.round(pct) + "% complete";
  }

  function updateBanner(step) {
    var banner = $("sx-journey-banner");
    var meta = STEP_META[step];
    if (!banner || !meta) return;
    banner.classList.add("sx-banner-animate");
    banner.innerHTML =
      '<div class="sx-banner-inner">' +
      '<span class="sx-banner-step">Step ' + step + '</span>' +
      "<h3>" + meta.title + "</h3>" +
      '<p class="sx-banner-now"><strong>Right now:</strong> ' + meta.now + "</p>" +
      '<p class="sx-banner-next"><strong>Up next:</strong> ' + meta.next + "</p>" +
      "</div>";
    window.setTimeout(function () {
      banner.classList.remove("sx-banner-animate");
    }, 400);
  }

  function pulseWizardCard() {
    var card = document.querySelector(".assessment-wizard-card");
    if (!card) return;
    card.classList.remove("sx-card-pulse");
    void card.offsetWidth;
    card.classList.add("sx-card-pulse");
  }

  function animateCount(el, target, suffix) {
    if (!el) return;
    suffix = suffix || "";
    var start = 0;
    var end = Number(target) || 0;
    var duration = 900;
    var t0 = performance.now();
    function frame(t) {
      var p = Math.min(1, (t - t0) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (end - start) * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function onPreviewReady(preview) {
    if (!preview) return;
    var ring = $("preview-score-ring");
    var score = Number(preview.governanceScore) || 0;
    if (ring) {
      ring.hidden = false;
      ring.style.setProperty("--sx-score", score);
      var ringVal = ring.querySelector(".sx-score-value");
      if (ringVal) animateCount(ringVal, score, "%");
    }
    animateCount($("preview-total-records"), preview.totalRecords);
    animateCount($("preview-ai-related-count"), preview.aiCandidates);
    animateCount($("preview-risk-high"), preview.riskSummary && preview.riskSummary.high);
    animateCount($("preview-risk-medium"), preview.riskSummary && preview.riskSummary.medium);
    animateCount($("preview-risk-low"), preview.riskSummary && preview.riskSummary.low);

    var panel = $("starter-preview-panel");
    if (panel) {
      panel.classList.add("sx-preview-reveal");
      window.setTimeout(function () {
        panel.classList.remove("sx-preview-reveal");
      }, 1200);
    }
    celebrate("preview");
  }

  function celebrate(kind) {
    var host = $("sx-celebration");
    if (!host) return;
    host.innerHTML = "";
    host.hidden = false;
    host.className = "sx-celebration sx-celebration-" + (kind || "default");
    for (var i = 0; i < 24; i += 1) {
      var bit = document.createElement("span");
      bit.className = "sx-confetti";
      bit.style.setProperty("--sx-i", String(i));
      host.appendChild(bit);
    }
    window.setTimeout(function () {
      host.hidden = true;
      host.innerHTML = "";
    }, 2200);
  }

  function initDropZone() {
    var zone = $("sx-dropzone");
    var input = $("starter-report-file");
    var btn = $("starter-upload-btn");
    if (!zone || !input) return;

    function highlight(on) {
      zone.classList.toggle("sx-dropzone-active", on);
    }

    zone.addEventListener("dragover", function (e) {
      e.preventDefault();
      highlight(true);
    });
    zone.addEventListener("dragleave", function () {
      highlight(false);
    });
    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      highlight(false);
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    zone.addEventListener("click", function (e) {
      if (e.target === btn || (btn && btn.contains(e.target))) return;
      input.click();
    });
  }

  function onStepChange(step) {
    updateProgress(step);
    updateBanner(step);
    pulseWizardCard();
    document.querySelectorAll("[data-wizard-step]").forEach(function (el) {
      var n = Number(el.getAttribute("data-wizard-step"));
      el.classList.toggle("sx-step-current", n === step);
    });
  }

  function onValidationSuccess() {
    celebrate("validate");
    var compat = $("compatibility-panel");
    if (compat) compat.classList.add("sx-compat-success");
  }

  function initHomeJourney() {
    var strip = document.querySelector(".sx-home-journey");
    if (!strip) return;
    strip.querySelectorAll(".sx-home-step").forEach(function (step, idx) {
      window.setTimeout(function () {
        step.classList.add("sx-home-step-visible");
      }, 120 + idx * 100);
    });
  }

  function initSuccessCelebration() {
    var verified = $("success-verified");
    if (!verified || verified.hidden) return;
    document.body.classList.add("sx-success-page");
    celebrate("success");
  }

  function init() {
    initDropZone();
    initHomeJourney();
    onStepChange(1);
  }

  global.AGHStarterExperience = {
    onStepChange: onStepChange,
    onPreviewReady: onPreviewReady,
    onValidationSuccess: onValidationSuccess,
    celebrate: celebrate,
    initSuccessCelebration: initSuccessCelebration,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
