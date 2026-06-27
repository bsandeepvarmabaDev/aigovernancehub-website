/**
 * AI Governance Hub — customer dashboard v23.0
 */
(function () {
  "use strict";

  var FORMAT_LABELS = {
    html: "HTML",
    pdf: "PDF",
    docx: "Word (DOCX)",
    pptx: "PowerPoint",
    text: "Plain Text",
  };

  function ux() {
    return window.AGHUX || null;
  }

  function setStatus(msg, isError) {
    var el = document.getElementById("dashboard-status");
    if (!el) return;
    var api = ux();
    if (api) {
      api.setStatusEl(el, msg, isError ? "error" : msg ? "success" : null);
      return;
    }
    el.textContent = msg || "";
    el.classList.toggle("starter-upload-error", Boolean(isError));
  }

  function download(token, format) {
    var statusEl = document.getElementById("dashboard-status");
    var api = ux();
    if (api && statusEl) {
      api.setStatusEl(statusEl, "Preparing your " + (FORMAT_LABELS[format] || format) + " download…", "loading");
    }
    return fetch("/api/download-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ recoveryToken: token, format: format }),
    }).then(function (response) {
      if (!response.ok) {
        return response.json().then(function (d) {
          throw new Error((d && d.error) || "Download could not be completed.");
        });
      }
      var disposition = response.headers.get("Content-Disposition") || "";
      var match = disposition.match(/filename=\"([^\"]+)\"/);
      var filename = match ? match[1] : "report.html";
      return response.blob().then(function (blob) {
        return { blob: blob, filename: filename };
      });
    });
  }

  function triggerDownload(payload) {
    var url = URL.createObjectURL(payload.blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = payload.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderEmptyState(list) {
    var api = ux();
    if (api) {
      api.showEmptyState(list, {
        icon: "📊",
        title: "Welcome to My Reports",
        body: "Your executive AI governance assessments appear here after purchase. Start with a guided upload — we validate your export, show a free preview, and deliver HTML, PDF, Word, and PowerPoint formats.",
        ctaLabel: "Start Guided Assessment",
        ctaHref: "pricing.html#assessment-wizard",
        secondaryLabel: "Recover a past purchase",
        secondaryHref: "recover-report.html",
      });
    } else {
      list.innerHTML = "<p>No purchased reports yet.</p>";
    }
  }

  function renderDashboard(data) {
    var emailEl = document.getElementById("dashboard-email");
    var list = document.getElementById("dashboard-reports");
    var scoreSummary = document.getElementById("dashboard-score-summary");
    if (emailEl) emailEl.textContent = data.email;
    if (!list) return;
    list.innerHTML = "";

    if (data.reports && data.reports.length && scoreSummary) {
      var latest = data.reports[0];
      if (latest.governanceScore != null) {
        scoreSummary.hidden = false;
        scoreSummary.innerHTML =
          "<p><strong>Latest Governance Score:</strong> " +
          latest.governanceScore +
          "/100 · <strong>Plan:</strong> " +
          (latest.planLabel || "Executive Assessment") +
          " · <strong>Version:</strong> v" +
          (latest.reportVersion || "22.0") +
          "</p>";
      }
    }

    if (!data.reports || !data.reports.length) {
      renderEmptyState(list);
      return;
    }

    data.reports.forEach(function (report) {
      var card = document.createElement("article");
      card.className = "recover-report-card";
      var scoreLine =
        report.governanceScore != null
          ? "<p><strong>Governance Score:</strong> " + report.governanceScore + "/100</p>"
          : "";
      card.innerHTML =
        "<h3>" +
        (report.planLabel || "Executive Assessment") +
        "</h3>" +
        scoreLine +
        "<p><strong>Reference:</strong> " +
        report.orderRef +
        "</p>" +
        "<p><strong>Purchased:</strong> " +
        new Date(report.purchasedAt).toLocaleString() +
        "</p>" +
        "<p><strong>Status:</strong> " +
        (report.statusLabel || report.reportStatus || report.paymentStatus) +
        "</p>" +
        "<p><strong>Downloads:</strong> " +
        report.downloadCount +
        "</p>" +
        '<div class="report-action-row report-format-row"></div>';
      var actions = card.querySelector(".report-format-row");

      if (!report.downloadDisabled && report.downloadReady && report.availableFormats) {
        report.availableFormats.forEach(function (fmt) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = fmt === "html" ? "btn btn-primary" : "btn btn-secondary";
          btn.textContent = "Download " + (FORMAT_LABELS[fmt] || fmt.toUpperCase());
          btn.addEventListener("click", function () {
            download(report.recoveryToken, fmt)
              .then(function (payload) {
                triggerDownload(payload);
                setStatus("Download started. Check your downloads folder.", false);
              })
              .catch(function (e) {
                setStatus(e.message, true);
              });
          });
          actions.appendChild(btn);
        });
      }

      if (report.invoiceAvailable) {
        var inv = document.createElement("button");
        inv.type = "button";
        inv.className = "btn btn-secondary";
        inv.textContent = "Download Invoice";
        inv.addEventListener("click", function () {
          fetch("/api/invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ recoveryToken: report.recoveryToken }),
          })
            .then(function (r) {
              if (!r.ok) throw new Error("Invoice download could not be completed.");
              return r.blob();
            })
            .then(function (blob) {
              triggerDownload({ blob: blob, filename: "invoice.html" });
              setStatus("Invoice download started.", false);
            })
            .catch(function (e) {
              setStatus(e.message, true);
            });
        });
        actions.appendChild(inv);
      }

      if (report.customerPaymentState === "generation_failed") {
        var failNote = document.createElement("p");
        failNote.className = "microcopy";
        failNote.textContent =
          "Report generation failed. Use Recover My Report to sign in and retry, or contact support@aigovernancehub.ai.";
        actions.appendChild(failNote);
      }

      if (report.downloadDisabled) {
        var note = document.createElement("p");
        note.className = "microcopy";
        note.textContent = "Download has been disabled for this report. Contact support@aigovernancehub.ai for assistance.";
        actions.appendChild(note);
      }
      list.appendChild(card);
    });
  }

  function loadDashboard() {
    var list = document.getElementById("dashboard-reports");
    var api = ux();
    if (api && list) {
      list.innerHTML =
        '<div class="agh-loading-inline" role="status"><span class="agh-spinner"></span>Loading your reports…</div>';
    }
    fetch("/api/dashboard", { credentials: "include" })
      .then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok, data: d };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          if (result.data && result.data.error === "Sign in required.") {
            window.location.href = "login.html?redirect=" + encodeURIComponent("/dashboard.html");
            return;
          }
          throw new Error((result.data && result.data.error) || "We could not load your reports.");
        }
        renderDashboard(result.data);
      })
      .catch(function (e) {
        if (list && api) list.innerHTML = "";
        setStatus(e.message, true);
      });
  }

  var logout = document.getElementById("dashboard-logout");
  if (logout) {
    logout.addEventListener("click", function () {
      fetch("/api/auth-logout", { method: "POST", credentials: "include" }).finally(function () {
        window.location.href = "login.html";
      });
    });
  }

  loadDashboard();
})();
