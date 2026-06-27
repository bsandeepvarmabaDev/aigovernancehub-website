/**
 * AI Governance Hub — Enterprise UX v25.6
 * Shared loading, empty states, alerts, and human-readable messages.
 */
(function (global) {
  "use strict";

  var ERROR_MAP = [
    {
      match: /invalid upload|session is invalid|session not found/i,
      title: "Your session expired",
      message: "For security, upload sessions expire after a short period.",
      fix: "Upload your export file again to continue.",
      next: "Return to the assessment wizard and choose your file.",
    },
    {
      match: /couldn't be processed|doesn't match a supported|Upload a CSV/i,
      title: "This file format isn't supported",
      message: "We couldn't read this as a Jira, Azure DevOps, Excel, or CSV export.",
      fix: "Download the sample template for your source in Step 2, or re-export from your project tool using CSV with all fields.",
      next: "Return to Step 2 for export instructions and sample files.",
    },
    {
      match: /missing required columns|required columns/i,
      title: "Required columns are missing",
      message: "Your export is missing columns needed for governance analysis.",
      fix: "Re-export from Jira or Azure DevOps using “All fields”, or download our sample template.",
      next: "Upload the corrected file in Step 3.",
    },
    {
      match: /couldn't find any work items|No work items/i,
      title: "No work items found",
      message: "The file uploaded but contains no data rows we can analyze.",
      fix: "Export again and confirm the file has a header row plus at least one work item row.",
      next: "Try the sample file in Step 2 to verify your format.",
    },
    {
      match: /enterprise assessment|self-service limit|1,000 work items|sales@aigovernancehub/i,
      title: "Enterprise Assessment recommended",
      message: "Your portfolio is larger than our self-service limit of 1,000 work items — this is normal for enterprise teams.",
      fix: "Submit your details below and our sales team will scope a dedicated assessment with a custom quote.",
      next: "Expect a response within 1–2 business days. Reference your Request ID in any follow-up.",
    },
    {
      match: /5 MB|exceeds the 5/i,
      title: "File is too large for self-serve upload",
      message: "Self-serve assessments accept exports up to 5 MB.",
      fix: "Filter your export to fewer projects, or contact sales for Enterprise processing.",
      next: "Email sales@aigovernancehub.ai for large portfolio assessments.",
    },
    {
      match: /payment verification|verification failed/i,
      title: "Payment could not be verified",
      message: "We could not confirm your payment with our payment provider.",
      fix: "If funds were deducted, use Recover My Report or contact support with your payment reference.",
      next: "Visit Recover My Report or email support@aigovernancehub.ai.",
    },
    {
      match: /sign.?in|magic link|token/i,
      title: "Sign-in link issue",
      message: "The sign-in link may have expired or already been used.",
      fix: "Request a new magic link from the sign-in page.",
      next: "Links expire after 15 minutes for your security.",
    },
    {
      match: /download not authorized|token is invalid/i,
      title: "Download link expired",
      message: "Secure download links expire to protect your report.",
      fix: "Sign in to My Reports or recover your report with your checkout email.",
      next: "Go to My Reports or Recover My Report.",
    },
    {
      match: /rate limit|too many/i,
      title: "Please wait a moment",
      message: "Too many requests were received in a short time.",
      fix: "Wait one minute and try again.",
      next: "This protects your account and our platform.",
    },
    {
      match: /still being prepared|report is still|409/i,
      title: "Your report is almost ready",
      message: "Payment is verified. Report generation is finishing on our servers.",
      fix: "Wait a moment and try download again, or use My Reports / Recover My Report.",
      next: "Reports are usually ready within a few minutes. Contact support@aigovernancehub.ai if this persists beyond 30 minutes.",
    },
    {
      match: /network|fetch|failed to fetch/i,
      title: "Connection interrupted",
      message: "We could not reach our servers.",
      fix: "Check your internet connection and try again.",
      next: "If the issue continues, contact support@aigovernancehub.ai.",
    },
  ];

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeError(raw, fallbackTitle) {
    var text = String(raw || "Something unexpected happened.");
    for (var i = 0; i < ERROR_MAP.length; i += 1) {
      if (ERROR_MAP[i].match.test(text)) {
        return {
          title: ERROR_MAP[i].title,
          message: ERROR_MAP[i].message,
          fix: ERROR_MAP[i].fix,
          next: ERROR_MAP[i].next,
          raw: text,
        };
      }
    }
    return {
      title: fallbackTitle || "We need your attention",
      message: text,
      fix: "Review the details below and try the suggested next step.",
      next: "Contact support@aigovernancehub.ai if you need assistance.",
      raw: text,
    };
  }

  function renderAlert(type, err, options) {
    options = options || {};
    var normalized = typeof err === "string" ? normalizeError(err, options.title) : err;
    var cls = "agh-alert agh-alert-" + (type || "info");
    return (
      '<div class="' +
      cls +
      '" role="' +
      (type === "error" ? "alert" : "status") +
      '">' +
      '<p class="agh-alert-title">' +
      escapeHtml(normalized.title || options.title || "") +
      "</p>" +
      '<p class="agh-alert-body">' +
      escapeHtml(normalized.message || normalized.raw || "") +
      "</p>" +
      (normalized.fix
        ? '<p class="agh-alert-fix"><strong>How to fix:</strong> ' + escapeHtml(normalized.fix) + "</p>"
        : "") +
      (normalized.next
        ? '<p class="agh-alert-next"><strong>Next step:</strong> ' + escapeHtml(normalized.next) + "</p>"
        : "") +
      "</div>"
    );
  }

  function setStatusEl(el, message, type) {
    if (!el) return;
    if (!message) {
      el.innerHTML = "";
      el.className = el.dataset.baseClass || "microcopy starter-recover-status";
      return;
    }
    if (!el.dataset.baseClass) el.dataset.baseClass = el.className;
    if (type === "error") {
      el.innerHTML = renderAlert("error", message);
      el.className = "agh-status-host";
    } else if (type === "success") {
      el.innerHTML = renderAlert("success", { title: "Complete", message: message, fix: "", next: "" });
      el.className = "agh-status-host";
    } else if (type === "loading") {
      el.innerHTML =
        '<div class="agh-loading-inline" role="status" aria-live="polite">' +
        '<span class="agh-spinner" aria-hidden="true"></span>' +
        "<span>" +
        escapeHtml(message) +
        "</span></div>";
      el.className = "agh-status-host";
    } else {
      el.innerHTML = renderAlert("info", { title: "", message: message, fix: "", next: "" });
      el.className = "agh-status-host";
    }
  }

  function showEmptyState(container, config) {
    if (!container) return;
    container.innerHTML =
      '<div class="agh-empty-state">' +
      '<div class="agh-empty-icon" aria-hidden="true">' +
      (config.icon || "📋") +
      "</div>" +
      "<h2>" +
      escapeHtml(config.title || "Nothing here yet") +
      "</h2>" +
      "<p>" +
      escapeHtml(config.body || "") +
      "</p>" +
      (config.ctaHref
        ? '<a class="btn btn-primary" href="' +
          escapeHtml(config.ctaHref) +
          '">' +
          escapeHtml(config.ctaLabel || "Get started") +
          "</a>"
        : "") +
      (config.secondaryHref
        ? ' <a class="btn btn-secondary" href="' +
          escapeHtml(config.secondaryHref) +
          '">' +
          escapeHtml(config.secondaryLabel || "Learn more") +
          "</a>"
        : "") +
      "</div>";
  }

  function showSuccessPanel(container, config) {
    if (!container) return;
    container.innerHTML =
      '<div class="agh-success-panel">' +
      '<h2>' +
      escapeHtml(config.title || "Success") +
      "</h2>" +
      "<p>" +
      escapeHtml(config.message || "") +
      "</p>" +
      (config.links || "") +
      "</div>";
  }

  var progressTimers = {};

  function showProgress(hostId, steps, estimatedSeconds) {
    var host = typeof hostId === "string" ? document.getElementById(hostId) : hostId;
    if (!host) return function () {};

    var id = host.id || "agh-progress";
    if (progressTimers[id]) clearInterval(progressTimers[id]);

    var stepIndex = 0;
    var pct = 0;
    var stepMs = Math.max(400, ((estimatedSeconds || 8) * 1000) / Math.max(steps.length, 1));

    function render() {
      host.innerHTML =
        '<div class="agh-progress" role="status" aria-live="polite">' +
        '<div class="agh-progress-header">' +
        '<span class="agh-spinner" aria-hidden="true"></span>' +
        "<span>" +
        escapeHtml(steps[stepIndex] || steps[steps.length - 1]) +
        "</span>" +
        "</div>" +
        '<div class="agh-progress-track"><div class="agh-progress-bar" style="width:' +
        Math.min(pct, 95) +
        '%"></div></div>' +
        '<p class="agh-progress-eta">' +
        escapeHtml(
          estimatedSeconds
            ? "Estimated time remaining: about " + Math.max(1, Math.ceil(estimatedSeconds * (1 - pct / 100))) + " seconds"
            : "This usually takes a few seconds"
        ) +
        "</p></div>";
      host.className = "agh-status-host";
    }

    render();
    progressTimers[id] = setInterval(function () {
      pct += 100 / (steps.length * 2);
      if (pct >= (stepIndex + 1) * (100 / steps.length) && stepIndex < steps.length - 1) {
        stepIndex += 1;
      }
      render();
    }, stepMs);

    return function complete(finalMessage) {
      if (progressTimers[id]) {
        clearInterval(progressTimers[id]);
        delete progressTimers[id];
      }
      host.innerHTML =
        '<div class="agh-progress agh-progress-done" role="status">' +
        '<span class="agh-check" aria-hidden="true">✓</span> ' +
        escapeHtml(finalMessage || "Complete") +
        "</div>";
    };
  }

  function setBusy(button, busy, busyLabel) {
    if (!button) return;
    if (busy) {
      if (!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.textContent = busyLabel || "Please wait…";
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      if (button.dataset.defaultLabel) button.textContent = button.dataset.defaultLabel;
    }
  }

  function showToast(message, type) {
    var existing = document.getElementById("agh-toast");
    if (existing) existing.remove();
    var toast = document.createElement("div");
    toast.id = "agh-toast";
    toast.className = "agh-toast agh-toast-" + (type || "info");
    toast.setAttribute("role", "alert");
    toast.innerHTML = renderAlert(type === "error" ? "error" : "info", message);
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 8000);
  }

  global.AGHUX = {
    normalizeError: normalizeError,
    renderAlert: renderAlert,
    setStatusEl: setStatusEl,
    showEmptyState: showEmptyState,
    showSuccessPanel: showSuccessPanel,
    showProgress: showProgress,
    setBusy: setBusy,
    showToast: showToast,
    escapeHtml: escapeHtml,
  };
})(window);
