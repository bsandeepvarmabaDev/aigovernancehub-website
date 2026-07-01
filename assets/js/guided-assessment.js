/**
 * AI Governance Hub — Guided Enterprise Assessment v25.6
 */
(function () {
  "use strict";

  function ux() {
    return window.AGHUX || null;
  }

  function track(event, metadata) {
    if (window.AGHAnalytics && typeof window.AGHAnalytics.track === "function") {
      window.AGHAnalytics.track(event, metadata);
    }
  }

  var UPLOAD_URL = "/api/upload-report";
  var ORDER_QUOTE_URL = "/api/order-quote";
  var CREATE_ORDER_URL = "/api/create-order";
  var VERIFY_PAYMENT_URL = "/api/verify-payment";
  var ENTERPRISE_SALES_URL = "/api/enterprise-sales-request";
  var ENTERPRISE_STATUS_URL = "/api/enterprise-request-status";
  var PRICING_URL = "/api/pricing";
  var CURRENCY_FALLBACK = [
    { code: "INR" },
    { code: "USD" },
    { code: "EUR" },
    { code: "GBP" },
    { code: "AUD" },
    { code: "SGD" },
  ];
  var PRODUCT_NAME = "AI Governance Hub";
  var PRODUCT_DESCRIPTION = "Complete AI Governance Assessment";
  var SUCCESS_URL = "starter-success.html";
  var PENDING_URL = "starter-pending.html";
  var ALLOWED_EXTENSIONS = [".csv", ".txt", ".tsv", ".xlsx", ".xls"];

  var selectedSource = "";
  var selectedCurrency = "INR";
  var uploadSession = null;
  var currentQuote = null;

  var SOURCES = {
    jira: {
      label: "Jira Cloud",
      supported: true,
      accept: ".csv,.txt,.tsv",
      instructions: [
        "Open your Jira Cloud project",
        "Use Issues → Search for issues (JQL) or project backlog",
        "Click Export → Export Excel CSV (All fields)",
        "Save the CSV file to your computer",
        "Upload the export below",
      ],
      sample: "samples/sample-jira-export.csv",    },
    "azure-devops": {
      label: "Azure DevOps",
      supported: true,
      accept: ".csv,.txt,.tsv",
      instructions: [
        "Open your Azure DevOps project",
        "Go to Boards → Queries",
        "Create or run a query for your backlog items",
        "Export results to CSV",
        "Upload the CSV file below",
      ],
      sample: "samples/sample-azure-devops.csv",    },
    excel: {
      label: "Excel (export as CSV)",
      supported: true,
      accept: ".xlsx,.xls,.csv",
      instructions: [
        "Use our Excel-compatible CSV template",
        "Fill required columns for each work item",
        "In Excel: File → Save As → CSV UTF-8 (Comma delimited)",
        "Upload the .csv file below",
      ],
      sample: "samples/sample-governance-template.csv",    },
    csv: {
      label: "CSV",
      supported: true,
      accept: ".csv,.txt,.tsv",
      instructions: [
        "Prepare a UTF-8 CSV with required columns",
        "Include one row per work item",
        "Use the sample template if unsure",
        "Upload your CSV below",
      ],
      sample: "samples/sample-governance-template.csv",    },
    github: { label: "GitHub", supported: false },
    servicenow: { label: "ServiceNow", supported: false },
    monday: { label: "Monday.com", supported: false },
    asana: { label: "Asana", supported: false },
    clickup: { label: "ClickUp", supported: false },
  };

  var REQUIRED_FIELDS = [
    { label: "Issue Key", why: "Uniquely identifies each work item." },
    { label: "Summary", why: "Used to identify AI opportunities." },
    { label: "Description", why: "Provides business context for AI signals." },
    { label: "Issue Type", why: "Classifies governance maturity." },
    { label: "Status", why: "Shows lifecycle stage for prioritization." },
    { label: "Project", why: "Generates project-level insights." },
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, isError) {
    var el = $("assessment-upload-status");
    if (!el) return;
    var api = ux();
    if (api) {
      api.setStatusEl(el, msg, isError ? "error" : msg ? "info" : null);
      return;
    }
    el.textContent = msg || "";
    el.classList.toggle("starter-upload-error", Boolean(isError));
  }

  function showSafeError(message) {
    var api = ux();
    var normalized = api ? api.normalizeError(message) : { message: message };
    var text = normalized.title ? normalized.title + ": " + normalized.message : (normalized.message || message);
    if (api) {
      api.showToast(text, "error");
      setStatus(text, true);
      return;
    }
    setStatus(text, true);
  }

  function setStepActive(step) {
    document.querySelectorAll("[data-wizard-step]").forEach(function (el) {
      var n = Number(el.getAttribute("data-wizard-step"));
      el.classList.toggle("active", n === step);
      el.classList.toggle("done", n < step);
      if (n === step) {
        el.setAttribute("aria-current", "step");
      } else {
        el.removeAttribute("aria-current");
      }
    });
    if (window.AGHStarterExperience && typeof window.AGHStarterExperience.onStepChange === "function") {
      window.AGHStarterExperience.onStepChange(step);
    }
  }

  function scrollToWizard() {
    var w = $("assessment-wizard");
    if (w) w.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderSourceInstructions() {
    var cfg = SOURCES[selectedSource];
    var box = $("source-instructions");
    if (!box || !cfg) return;
    var sampleBlock = cfg.sample
      ? '<p class="microcopy"><a class="btn btn-secondary" href="' +
        cfg.sample +
        '" download>Download sample for ' +
        cfg.label +
        '</a> · <a href="samples/sample-governance-report.html" target="_blank" rel="noopener">View example report</a></p>'
      : "";
    box.innerHTML =
      "<h4>How to export from " +
      cfg.label +
      "</h4>" +
      '<p class="microcopy"><strong>What happens next:</strong> We validate your export, show a free preview, then you confirm your order before Secure Checkout.</p>' +
      "<ol>" +
      cfg.instructions.map(function (s) {
        return "<li>" + s + "</li>";
      }).join("") +
      "</ol>" +
      sampleBlock +
      '<details class="faq-item"><summary>Validation expectations</summary>' +
      "<p>Your file must include Issue Key, Summary, Description, Issue Type, Status, and Project. " +
      "We detect duplicate keys, count work items server-side, and recommend the correct plan automatically.</p></details>";
    var samples = document.querySelector(".sample-downloads");
    if (samples && cfg.sample) {
      samples.querySelectorAll("a[data-source-sample]").forEach(function (a) {
        a.hidden = a.getAttribute("data-source-sample") !== selectedSource && a.getAttribute("data-source-sample") !== "all";
      });
    }
    var fileInput = $("starter-report-file");
    if (fileInput && cfg.accept) {
      fileInput.setAttribute("accept", cfg.accept);
    }
  }

  function showPanel(id) {
    document.querySelectorAll("[data-wizard-panel]").forEach(function (panel) {
      panel.hidden = panel.id !== id;
    });
  }

  function renderRequiredFields() {
    var list = $("required-fields-list");
    if (!list) return;
    list.innerHTML = REQUIRED_FIELDS.map(function (f) {
      return (
        '<div class="field-requirement"><strong>' +
        f.label +
        "</strong><p class='microcopy'>" +
        f.why +
        "</p></div>"
      );
    }).join("");
  }

  function bindSourceSelection() {
    document.querySelectorAll("[data-source]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var source = btn.getAttribute("data-source");
        var cfg = SOURCES[source];
        if (!cfg || !cfg.supported) return;
        selectedSource = source;
        document.querySelectorAll("[data-source]").forEach(function (b) {
          b.classList.toggle("selected", b.getAttribute("data-source") === source);
          b.setAttribute("aria-pressed", b.getAttribute("data-source") === source ? "true" : "false");
        });
        renderSourceInstructions();
        if (window.BusinessTerminology && window.BusinessTerminology.updatePreviewStatLabels) {
          window.BusinessTerminology.updatePreviewStatLabels(source);
        }
        showPanel("wizard-step-export");
        setStepActive(2);
        track("source_selected", { source: source });
      });
    });
  }

  function renderCompatibility(data) {
    var panel = $("compatibility-panel");
    if (!panel || !data) return;
    var c = data.compatibility || data.preview?.compatibility || {};
    var scoreEl = $("compat-score");
    var detailEl = $("compat-details");
    if (scoreEl) scoreEl.textContent = (c.score || 0) + "% Compatible";
    if (detailEl) {
      detailEl.innerHTML =
        "<ul>" +
        "<li>Detected platform: <strong>" + (c.detectedPlatform || "—") + "</strong></li>" +
        "<li>Encoding: <strong>" + (c.encoding || "UTF-8") + "</strong></li>" +
        "<li>Work items: <strong>" + (c.workItems || 0) + "</strong></li>" +
        (c.uniqueWorkItems != null
          ? "<li>Unique work items: <strong>" + c.uniqueWorkItems + "</strong></li>"
          : "") +
        (c.duplicateRecords != null && c.duplicateRecords > 0
          ? "<li>Duplicate records: <strong>" + c.duplicateRecords + "</strong></li>"
          : "") +
        "<li>Projects: <strong>" + (c.projectCount || 1) + "</strong></li>" +
        "<li>Required fields: <strong>" + (c.requiredPresent ? "Present" : "Missing") + "</strong></li>" +
        "<li>Optional fields: <strong>" + (c.optionalCount || 0) + "</strong></li>" +
        "<li>Estimated analysis: <strong>" + (c.estimatedAnalysisTime || "—") + "</strong></li>" +
        "<li>Status: <strong>" + (c.ready ? "Ready for Assessment" : "Needs fixes") + "</strong></li>" +
        "</ul>";
    }
    panel.hidden = false;
  }

  function renderOrderSummary(quote, metrics, formats, detectedPlan) {
    var box = $("order-summary");
    if (!box || !quote || !quote.checkoutAvailable) {
      if (box) box.hidden = true;
      return;
    }
    currentQuote = quote;
    box.hidden = false;
    var brandNote = "Secure Checkout — amount verified server-side before payment";
    var workItems = metrics && metrics.totalWorkItems != null ? metrics.totalWorkItems.toLocaleString() : "—";
    var projectCount = metrics && metrics.projectCount != null ? metrics.projectCount.toLocaleString() : "—";
    var formatList = (formats || ["html", "pdf", "docx", "pptx", "text"]).join(", ").toUpperCase();
    var deliverables = (quote.reportDeliverables || []).join(" · ");
    box.innerHTML =
      "<h4>Order summary</h4>" +
      "<div class='order-tier-detection' role='region' aria-label='Detected assessment tier'>" +
      "<p class='microcopy'><strong>Detected from your upload (server-validated):</strong></p>" +
      "<table class='order-summary-table order-tier-table'><tbody>" +
      "<tr><th scope='row'>Projects</th><td>" + projectCount + "</td></tr>" +
      "<tr><th scope='row'>Work items</th><td>" + workItems + "</td></tr>" +
      "<tr><th scope='row'>Assessment tier</th><td>" + (detectedPlan?.label || quote.plan.label) + "</td></tr>" +
      "<tr><th scope='row'>Why this tier</th><td>" + (uploadSession?.plan?.reason || "Based on work items and project count in your upload.") + "</td></tr>" +
      "</tbody></table></div>" +
      "<p class='microcopy'><strong>What you're buying:</strong> A complete AI governance assessment for your uploaded portfolio, including executive-ready deliverables.</p>" +
      "<p class='microcopy'><strong>Pricing note:</strong> Total is based on your plan tier (work item count only), not a per-item fee.</p>" +
      "<p class='microcopy'><strong>" + brandNote + "</strong></p>" +
      "<table class='order-summary-table'><tbody>" +
      "<tr><th scope='row'>Plan</th><td>" + (detectedPlan?.label || quote.plan.label) + "</td></tr>" +
      "<tr><th scope='row'>Work items (server)</th><td>" + workItems + "</td></tr>" +
      "<tr><th scope='row'>Projects (server)</th><td>" + projectCount + "</td></tr>" +
      "<tr><th scope='row'>Base price</th><td>" + quote.baseDisplay + "</td></tr>" +
      "<tr><th scope='row'>Convenience fee</th><td>" + quote.convenienceFeeDisplay + "</td></tr>" +
      "<tr><th scope='row'>" + quote.taxLabel + "</th><td>" + quote.taxDisplay + "</td></tr>" +
      (quote.discountMinor ? "<tr><th scope='row'>Discount</th><td>-" + quote.discountDisplay + "</td></tr>" : "") +
      "<tr class='order-total-row'><th scope='row'>Total payable</th><td><strong>" + quote.totalDisplay + " " + quote.currency + "</strong></td></tr>" +
      "<tr><th scope='row'>Report formats</th><td>" + formatList + "</td></tr>" +
      (deliverables ? "<tr><th scope='row'>What you receive</th><td>" + deliverables + "</td></tr>" : "") +
      "</tbody></table>" +
      "<p class='microcopy'>" + quote.paymentMethodsNote + "</p>" +
      (quote.refundPolicyNote
        ? "<p class='microcopy'>Refund policy: " + quote.refundPolicyNote + ' <a href="' + (quote.refundPolicyUrl || "refund-policy.html") + '">Details</a>. Support: <a href="mailto:' + (quote.supportEmail || "support@aigovernancehub.ai") + '">' + (quote.supportEmail || "support@aigovernancehub.ai") + "</a>.</p>"
        : "") +
      "<label class='order-confirm-label'><input type='checkbox' id='order-confirm-checkbox' /> I confirm this order summary and total payable amount.</label>";
    var totalEl = $("order-summary-total");
    if (totalEl) totalEl.textContent = quote.totalDisplay;
    var btn = document.querySelector("[data-starter-checkout]");
    if (btn) btn.textContent = "Secure Checkout — " + quote.totalDisplay;
  }

  async function refreshEnterpriseStatus() {
    if (!uploadSession) return;
    var statusEl = $("enterprise-gate-status");
    try {
      var response = await fetch(ENTERPRISE_STATUS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: uploadSession.sessionId,
          sessionToken: uploadSession.sessionToken,
        }),
      });
      var data = await response.json().catch(function () { return {}; });
      if (statusEl && data.request) {
        statusEl.hidden = false;
        statusEl.textContent =
          "Request ID: " + data.request.secureReference +
          " · Status: " + (data.request.statusLabel || data.request.status);
      }
    } catch (_) {}
  }

  async function loadOrderQuote() {
    if (!uploadSession) return;
    var response = await fetch(ORDER_QUOTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: uploadSession.sessionId,
        sessionToken: uploadSession.sessionToken,
        currency: selectedCurrency,
      }),
    });
    var data = await response.json().catch(function () { return {}; });
    if (response.ok && data.quote) {
      renderOrderSummary(data.quote, data.workItemMetrics, data.reportFormats, data.detectedPlan);
    }
  }

  function renderPlanGate(plan, compatibility, salesRequestRef) {
    var gate = $("enterprise-gate");
    var checkout = $("checkout-section");
    if (!plan || !gate) return;
    var blocked = !plan.selfServe;
    gate.hidden = !blocked;
    if (checkout) checkout.hidden = blocked;
    if (blocked) {
      var isEnterpriseGate = plan.enterpriseGate === true;
      $("enterprise-gate-title").textContent = isEnterpriseGate
        ? "Enterprise Assessment"
        : plan.tier === "enterprise_plus"
          ? "Enterprise Plus Assessment"
          : "Enterprise Assessment";
      $("enterprise-gate-reason").textContent =
        plan.blockReason || plan.reason ||
        "Your portfolio qualifies for a dedicated Enterprise Assessment with custom scoping and executive deliverables.";
      var metricsEl = $("enterprise-gate-metrics");
      if (metricsEl && compatibility) {
        metricsEl.hidden = false;
        metricsEl.innerHTML =
          "<p><strong>Your upload contains:</strong></p><ul>" +
          "<li>Work items (server): <strong>" + (compatibility.workItems || 0).toLocaleString() + "</strong></li>" +
          "<li>Unique work items: <strong>" + (compatibility.uniqueWorkItems || 0).toLocaleString() + "</strong></li>" +
          (compatibility.duplicateRecords > 0
            ? "<li>Duplicate records: <strong>" + compatibility.duplicateRecords.toLocaleString() + "</strong></li>"
            : "") +
          "<li>Projects: <strong>" + (compatibility.projectCount || 1) + "</strong></li>" +
          "<li>Platform: <strong>" + (compatibility.detectedPlatform || "—") + "</strong></li>" +
          "</ul>";
      }
      var statusEl = $("enterprise-gate-status");
      if (statusEl && salesRequestRef) {
        statusEl.hidden = false;
        statusEl.textContent =
          "Request ID: " + (salesRequestRef.secureReference || "—") +
          " · Current status: " + (salesRequestRef.statusLabel || "Assessment received — sales review pending");
      }
      var benefits = $("enterprise-gate-benefits");
      if (benefits) {
        benefits.innerHTML =
          "<p><strong>Your Enterprise Assessment includes:</strong></p><ul>" +
          "<li>Dedicated sales consultant and portfolio scoping</li>" +
          "<li>Large-portfolio processing (1,001+ work items)</li>" +
          "<li>Executive board-ready reports (HTML, PDF, Word, PowerPoint)</li>" +
          "<li>Custom commercial quote and secure payment link</li>" +
          "<li>Procurement and invoice coordination via sales</li>" +
          "<li>Priority support and security review assistance</li></ul>" +
          "<p class='microcopy'><strong>Expected response:</strong> 1–2 business days after you submit your details.</p>" +
          "<p class='microcopy'>Questions? Email <a href='mailto:sales@aigovernancehub.ai'>sales@aigovernancehub.ai</a> and include your Request ID.</p>";
      }
      refreshEnterpriseStatus();
    } else if (checkout) {
      loadOrderQuote();
    }
  }

  async function submitEnterpriseContact(event) {
    event.preventDefault();
    if (!uploadSession) return;
    var name = ($("enterprise-contact-name") && $("enterprise-contact-name").value.trim()) || "";
    var email = ($("enterprise-contact-email") && $("enterprise-contact-email").value.trim()) || "";
    var company = ($("enterprise-contact-company") && $("enterprise-contact-company").value.trim()) || "";
    var statusEl = $("enterprise-contact-status");
    var submitBtn = $("enterprise-contact-submit");
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (statusEl) statusEl.textContent = "Enter your name and a valid work email.";
      return;
    }
    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) statusEl.textContent = "Submitting your enterprise request…";
    try {
      var response = await fetch(ENTERPRISE_SALES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: uploadSession.sessionId,
          sessionToken: uploadSession.sessionToken,
          name: name,
          email: email,
          company: company,
        }),
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(data.error || "Unable to submit request.");
      if (statusEl) {
        var msg =
          data.message ||
          "Request submitted. Our sales team will contact you with a secure payment link.";
        if (data.emailConfigured === false) {
          msg +=
            " Note: automated sales email is not configured — your request is saved securely. Email sales@aigovernancehub.ai with Request ID " +
            (data.secureReference || "above") +
            " if you do not hear back within 2 business days.";
        }
        statusEl.textContent = msg;
      }
      if (submitBtn) submitBtn.disabled = true;
      refreshEnterpriseStatus();
      track("enterprise_contact_submitted", { ref: data.secureReference });
    } catch (error) {
      if (statusEl) statusEl.textContent = error.message;
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function renderPreview(preview) {
    var panel = $("starter-preview-panel");
    if (!panel || !preview) return;

    $("preview-total-records").textContent = String(preview.totalRecords);
    $("preview-ai-related-count").textContent = String(preview.aiCandidates);
    $("preview-risk-high").textContent = String(preview.riskSummary.high);
    $("preview-risk-medium").textContent = String(preview.riskSummary.medium);
    $("preview-risk-low").textContent = String(preview.riskSummary.low);
    $("preview-governance-score").textContent = preview.governanceScore + "%";
    var ratingEl = $("preview-governance-rating");
    if (ratingEl) ratingEl.textContent = preview.governanceRating || "Live preview from your upload.";

    var exec = $("preview-executive-summary");
    if (exec) exec.textContent = preview.executiveSummary || "";

    var opps = $("preview-opportunities");
    if (opps && preview.topOpportunities) {
      opps.innerHTML = preview.topOpportunities.map(function (o) {
        return "<li>" + o + "</li>";
      }).join("");
    }

    var fw = $("preview-frameworks");
    if (fw && preview.frameworkMapping) {
      fw.innerHTML = preview.frameworkMapping
        .map(function (f) {
          return "<li><strong>" + f.title + ":</strong> " + f.readiness + "</li>";
        })
        .join("");
    }

    panel.hidden = false;
    showPanel("wizard-step-preview");
    setStepActive(5);

    var unlockBtn = document.querySelector("[data-starter-checkout]");
    if (unlockBtn && preview.plan && preview.plan.selfServe) {
      unlockBtn.disabled = false;
    }
    if (preview.plan && preview.plan.selfServe) {
      loadOrderQuote();
    }
    setStepActive(6);
    track("preview_viewed");
    if (window.AGHStarterExperience && typeof window.AGHStarterExperience.onPreviewReady === "function") {
      window.AGHStarterExperience.onPreviewReady(preview);
    }
  }

  function hidePreview() {
    var panel = $("starter-preview-panel");
    if (panel) panel.hidden = true;
    var compat = $("compatibility-panel");
    if (compat) compat.hidden = true;
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Unable to read file."));
          return;
        }
        resolve((result.split(",")[1] || ""));
      };
      reader.onerror = function () {
        reject(new Error("Unable to read file."));
      };
      reader.readAsDataURL(file);
    });
  }

  function validateSelectedFile(file) {
    if (!selectedSource) return "Choose your project source before uploading.";
    if (!file) return "Choose a file to upload.";
    var lower = file.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some(function (ext) {
      return lower.endsWith(ext);
    })) {
      return "Upload a CSV, TSV, TXT, or Excel export file.";
    }
    if (file.size <= 0) return "The selected file is empty.";
    if (file.size > 5 * 1024 * 1024) {
      return "File exceeds the 5 MB limit. Contact sales@aigovernancehub.ai for Enterprise assessment.";
    }
    return "";
  }

  async function uploadReportFile(file) {
    var err = validateSelectedFile(file);
    if (err) throw new Error(err);
    var contentBase64 = await readFileAsBase64(file);
    var industryEl = $("assessment-industry");
    var industry = industryEl ? industryEl.value : "general";
    var response = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentBase64: contentBase64,
        source: selectedSource,
        industry: industry,
      }),
    });
    var data = await response.json().catch(function () {
      return {};
    });
    if (!response.ok) {
      if (data.validation) {
        var missing = (data.validation.compatibility && data.validation.compatibility.missingRequired) || [];
        if (missing.length) {
          throw new Error(
            "Missing required columns: " +
              missing.join(", ") +
              ". Download a sample template and re-export."
          );
        }
      }
      throw new Error(data.error || "Upload validation failed.");
    }
    if (!data.sessionId || !data.sessionToken) {
      throw new Error("Invalid upload response from server.");
    }
    return data;
  }

  async function handleFileSelected(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var uploadBtn = $("starter-upload-btn");
    var api = ux();
    if (api) api.setBusy(uploadBtn, true, "Processing…");
    else if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.setAttribute("aria-busy", "true");
    }

    uploadSession = null;
    hidePreview();

    var completeProgress = null;
    var statusEl = $("assessment-upload-status");
    if (api && statusEl) {
      completeProgress = api.showProgress(
        statusEl,
        [
          "Uploading your export securely…",
          "Validating structure and required fields…",
          "Checking compatibility and security…",
          "Analyzing AI governance signals…",
          "Preparing your executive preview…",
        ],
        Math.max(8, Math.ceil(file.size / 50000))
      );
    } else {
      setStatus("Validating file structure and running compatibility check…", false);
    }

    try {
      var result = await uploadReportFile(file);
      uploadSession = {
        sessionId: result.sessionId,
        sessionToken: result.sessionToken,
        preview: result.preview,
        plan: result.plan,
        filename: file.name,
        enterpriseGate: result.enterpriseGate,
        salesRequestRef: result.salesRequestRef,
      };
      renderCompatibility(result);
      renderPlanGate(result.plan, result.compatibility, result.salesRequestRef);
      if (window.AGHStarterExperience && typeof window.AGHStarterExperience.onValidationSuccess === "function") {
        window.AGHStarterExperience.onValidationSuccess();
      }
      renderPreview(result.preview);
      if (completeProgress) {
        completeProgress("Compatibility check complete — review your assessment preview.");
      } else {
        setStatus("Compatibility check passed. Review your assessment preview below.", false);
      }
      track("upload_completed", { source: selectedSource, plan: result.plan && result.plan.tier });
      setStepActive(4);
    } catch (error) {
      if (completeProgress) completeProgress("");
      setStatus(error.message, true);
      showPanel("wizard-step-upload");
    } finally {
      if (api) api.setBusy(uploadBtn, false);
      else if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.removeAttribute("aria-busy");
      }
      event.target.value = "";
    }
  }

  function getCheckoutDetails() {
    var details = {
      name: ($("starter-buyer-name") && $("starter-buyer-name").value.trim()) || "",
      email: ($("starter-buyer-email") && $("starter-buyer-email").value.trim()) || "",
    };
    var company = $("starter-buyer-company") && $("starter-buyer-company").value.trim();
    if (company) details.company = company;
    return details;
  }

  function validateCheckoutDetails(details) {
    if (!details.name) return "Please enter your name — we include it on your report and invoice.";
    if (!details.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      return "Please enter a valid email — your report and recovery link are sent here.";
    }
    return "";
  }

  async function createOrder(session, details) {
    var response = await fetch(CREATE_ORDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.sessionId,
        sessionToken: session.sessionToken,
        currency: selectedCurrency,
        orderConfirmed: true,
        name: details.name,
        email: details.email,
      }),
    });
    var data = await response.json().catch(function () {
      return {};
    });
    if (!response.ok) throw new Error(data.error || "Unable to start checkout.");
    return data;
  }

  async function verifyPayment(paymentResponse, details, session) {
    var payload = {
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      name: details.name,
      email: details.email,
      sessionId: session.sessionId,
      sessionToken: session.sessionToken,
    };
    if (details.company) payload.company = details.company;
    var response = await fetch(VERIFY_PAYMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    var data = await response.json().catch(function () {
      return {};
    });
    if (response.status === 202 && data.success === true && data.confirmationToken) {
      return data;
    }
    if (data.success === true && data.confirmationToken) {
      return data;
    }
    if (data.verification_pending === true) {
      // Razorpay amount API was unreachable — HMAC already proved payment.
      // Signal caller to redirect to pending page (not an error state).
      var pendingErr = new Error(
        data.message || "Payment received — verifying with Razorpay. Check your inbox shortly."
      );
      pendingErr.verificationPending = true;
      pendingErr.orderId = data.orderId;
      throw pendingErr;
    }
    if (!response.ok || data.success !== true || !data.confirmationToken) {
      var err = new Error(data.error || data.message || "Payment verification failed.");
      err.statusCode = response.status;
      err.serverData = data;
      throw err;
    }
    return data;
  }

  function redirectToPendingState(state, paymentResponse, details, message) {
    var params = new URLSearchParams();
    params.set("state", state);
    if (state === "processing" || state === "paid") {
      params.set("paid", "1");
    }
    if (paymentResponse && paymentResponse.razorpay_payment_id) {
      params.set("payment", paymentResponse.razorpay_payment_id);
    }
    if (paymentResponse && paymentResponse.razorpay_order_id) {
      params.set("order", paymentResponse.razorpay_order_id);
    }
    if (details && details.email) {
      params.set("email", details.email);
    }
    if (message) {
      params.set("msg", message.slice(0, 240));
    }
    window.location.href = PENDING_URL + "?" + params.toString();
  }

  async function openCheckout() {
    if (!uploadSession || !uploadSession.preview) {
      showSafeError("Complete the guided upload and preview before unlocking.");
      scrollToWizard();
      return;
    }
    if (uploadSession.enterpriseGate || (uploadSession.plan && !uploadSession.plan.selfServe)) {
      showSafeError("Enterprise Assessment Required. Submit your details above or email sales@aigovernancehub.ai.");
      return;
    }
    var confirmBox = $("order-confirm-checkbox");
    if (confirmBox && !confirmBox.checked) {
      showSafeError("Please check the box below the order summary to confirm before payment.");
      var confirmLabel = confirmBox.closest(".order-confirm-label");
      if (confirmLabel) {
        confirmLabel.scrollIntoView({ behavior: "smooth", block: "center" });
        confirmLabel.classList.add("sx-confirm-highlight");
        setTimeout(function () {
          confirmLabel.classList.remove("sx-confirm-highlight");
        }, 2800);
      }
      confirmBox.focus();
      return;
    }
    var details = getCheckoutDetails();
    var validationError = validateCheckoutDetails(details);
    if (validationError) {
      showSafeError(validationError);
      return;
    }

    if (typeof Razorpay === "undefined") {
      showSafeError("Payment service is temporarily unavailable.");
      return;
    }

    // Captured once per checkout attempt: uploadSession is a shared mutable
    // variable that can be reassigned (e.g. re-uploading a file) while the
    // Razorpay modal is open. Reading it fresh inside the handler below —
    // which fires whenever the user completes payment — sent the WRONG
    // session to verify-payment in production, orphaning a successful
    // payment (session never had this order in pendingCheckout).
    var checkoutSession = uploadSession;

    var order;
    try {
      order = await createOrder(checkoutSession, details);
      track("checkout_started");
    } catch (error) {
      showSafeError(error.message);
      return;
    }

    var rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: PRODUCT_NAME,
      description: PRODUCT_DESCRIPTION,
      order_id: order.orderId,
      prefill: { name: details.name, email: details.email },
      handler: function (paymentResponse) {
        track("payment_submitted");
        verifyPayment(paymentResponse, details, checkoutSession)
          .then(function (result) {
            window.location.href =
              SUCCESS_URL + "?confirmation=" + encodeURIComponent(result.confirmationToken);
          })
          .catch(function (e) {
            if (e.verificationPending) {
              // Amount API was unreachable — payment is real, webhook will confirm.
              // Go straight to pending page without showing an error.
              redirectToPendingState("paid", paymentResponse, details, e.message);
              return;
            }
            showSafeError(e.message);
            redirectToPendingState("processing", paymentResponse, details, e.message);
          });
      },
      modal: {
        ondismiss: function () {
          redirectToPendingState("cancelled", null, details, "Checkout was closed before payment completed.");
        },
      },
      theme: { color: "#2563eb" },
    });
    rzp.on("payment.failed", function () {
      redirectToPendingState("failed", null, details, "Razorpay could not complete this payment.");
    });
    rzp.open();
  }

  function bindWizard() {
    bindSourceSelection();
    renderRequiredFields();

    document.querySelectorAll("[data-starter-scroll-checkout]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        scrollToWizard();
      });
    });

    var continueExport = $("wizard-continue-upload");
    if (continueExport) {
      continueExport.addEventListener("click", function () {
        if (!selectedSource) return;
        showPanel("wizard-step-upload");
        setStepActive(3);
      });
    }

    var fileInput = $("starter-report-file");
    if (fileInput) fileInput.addEventListener("change", handleFileSelected);

    var uploadBtn = $("starter-upload-btn");
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", function () {
        if (!selectedSource) {
          setStatus("Choose your project source first.", true);
          showPanel("wizard-step-source");
          setStepActive(1);
          return;
        }
        fileInput.click();
      });
    }

    var entForm = $("enterprise-contact-form");
    if (entForm) entForm.addEventListener("submit", submitEnterpriseContact);

    document.querySelectorAll("[data-starter-checkout]").forEach(function (btn) {
      btn.disabled = true;
      btn.textContent = "Secure Checkout";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        openCheckout();
      });
    });

    var currencySelect = $("currency-select");
    if (currencySelect) {
      function applyDefaultCurrency() {
        selectedCurrency = "INR";
        currencySelect.innerHTML = CURRENCY_FALLBACK.map(function (c) {
          return (
            "<option value='" +
            c.code +
            "'" +
            (c.code === selectedCurrency ? " selected" : "") +
            ">" +
            c.code +
            "</option>"
          );
        }).join("");
        currencySelect.title =
          "Multi-currency pricing service unavailable — showing standard currencies. Checkout uses server-side quotes in INR or your selected currency.";
      }
      applyDefaultCurrency();
      fetch(PRICING_URL)
        .then(function (r) {
          if (!r.ok) throw new Error("unavailable");
          return r.json();
        })
        .then(function (data) {
          selectedCurrency = data.currency || "INR";
          currencySelect.innerHTML = (data.currencies || [{ code: "INR" }]).map(function (c) {
            return "<option value='" + c.code + "'" + (c.code === selectedCurrency ? " selected" : "") + ">" + c.code + "</option>";
          }).join("");
          currencySelect.title = "";
        })
        .catch(function () {
          applyDefaultCurrency();
        });
      currencySelect.addEventListener("change", function () {
        selectedCurrency = currencySelect.value;
        if (uploadSession && uploadSession.plan && uploadSession.plan.selfServe) {
          loadOrderQuote();
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindWizard);
  } else {
    bindWizard();
  }
})();
