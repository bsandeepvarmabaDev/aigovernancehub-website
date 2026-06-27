/**
 * AI Governance Hub — admin portal v25.14 (operations + reconciliation)
 */
(function () {
  "use strict";

  var adminKey = sessionStorage.getItem("agh_admin_key") || "";

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + adminKey,
    };
  }

  function setStatus(msg, isError) {
    var el = document.getElementById("admin-status");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("starter-upload-error", Boolean(isError));
  }

  function adminAction(payload) {
    return fetch("/api/admin-actions", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    }).then(function (r) {
      return r.json().then(function (d) {
        return { ok: r.ok, data: d };
      });
    });
  }

  function bindKeyForm() {
    var form = document.getElementById("admin-key-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      adminKey = document.getElementById("admin-key").value.trim();
      sessionStorage.setItem("agh_admin_key", adminKey);
      document.getElementById("admin-panel").hidden = false;
      form.hidden = true;
      loadAnalytics();
      loadEnterpriseRequests();
      loadOperationsDashboard();
    });
    if (adminKey) {
      document.getElementById("admin-panel").hidden = false;
      form.hidden = true;
      loadAnalytics();
      loadEnterpriseRequests();
      loadOperationsDashboard();
    }
  }

  function loadDiagnostics() {
    adminAction({ action: "diagnostics" })
      .then(function (result) {
        var el = document.getElementById("admin-diagnostics");
        if (!el) return;
        if (result.ok) {
          el.textContent = JSON.stringify(result.data, null, 2);
        } else {
          el.textContent = (result.data && result.data.error) || "Diagnostics failed.";
        }
      })
      .catch(function () {});
  }

  function loadOperationsDashboard() {
    adminAction({ action: "operations_dashboard" })
      .then(function (result) {
        var el = document.getElementById("admin-ops-dashboard");
        if (!el || !result.ok) return;
        var dash = result.data.dashboard || {};
        var ops = dash.operations || {};
        var summary = {
          readiness: dash.readiness,
          services: dash.services,
          queue: dash.queue,
          reportGeneration: dash.reportGeneration,
          pendingUploads: ops.pendingUploads,
          pendingPayments: ops.pendingPayments,
          failedPayments: ops.failedPayments,
          failedReportGenerations: ops.failedReportGenerations,
          failedEmails: ops.failedEmails,
          rateLimitViolations: ops.rateLimitViolations,
          avgPaymentVerifyMs: ops.averages && ops.averages.payment_verify_ms,
          avgUploadMs: ops.averages && ops.averages.upload_ms,
          avgHealthCheckMs: ops.averages && ops.averages.health_check_ms,
          errorsByCategory: ops.errorsByCategory,
          recentIssues: ops.recentIssues,
        };
        el.textContent = JSON.stringify(summary, null, 2);
      })
      .catch(function () {});
  }

  function loadAnalytics() {
    fetch("/api/admin-analytics?days=14", { headers: { Authorization: "Bearer " + adminKey } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var el = document.getElementById("admin-analytics");
        if (el && data.summary) {
          el.textContent = JSON.stringify({ funnel: data.summary, platform: data.platform }, null, 2);
        }
      })
      .catch(function () {});
  }

  function loadEnterpriseRequests() {
    fetch("/api/admin-enterprise-requests", { headers: { Authorization: "Bearer " + adminKey } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderEnterpriseRequests(data.requests || []);
      })
      .catch(function () {
        adminAction({ action: "list_enterprise_requests" }).then(function (result) {
          if (result.ok) renderEnterpriseRequests(result.data.requests || []);
        });
      });
  }

  function renderEnterpriseRequests(requests) {
    var list = document.getElementById("admin-enterprise-list");
    if (!list) return;
    list.innerHTML = "";
    if (!requests.length) {
      list.innerHTML = "<p class='microcopy'>No enterprise requests.</p>";
      return;
    }
    requests.forEach(function (req) {
      var card = document.createElement("article");
      card.className = "recover-report-card";
      card.innerHTML =
        "<h3>" + (req.secureReference || req.requestId) + "</h3>" +
        "<p>Status: <strong>" + (req.statusLabel || req.status) + "</strong></p>" +
        "<p>Customer: " + (req.buyerName || "—") + " &lt;" + (req.buyerEmail || "pending") + "&gt;</p>" +
        "<p>Company: " + (req.company || "—") + " · Country: " + (req.country || "—") + "</p>" +
        "<p>Tasks: " + (req.rawTaskCount || req.workItemMetrics?.totalWorkItems || "—") +
        " · Projects: " + (req.projectCount || "—") + "</p>" +
        "<p>Platform: " + (req.detectedPlatform || req.source || "—") + "</p>" +
        "<p>File ref: " + (req.uploadStorageKey || "—") + "</p>" +
        '<div class="report-action-row ent-actions"></div>' +
        '<label>Quote amount (minor)<input type="number" class="ent-amount" min="1" /></label>' +
        '<label>Currency<input type="text" class="ent-currency" value="INR" /></label>' +
        '<label>Sales note<input type="text" class="ent-note" placeholder="Internal note" /></label>';
      var actions = card.querySelector(".ent-actions");

      function btn(label, handler) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn btn-secondary";
        b.textContent = label;
        b.addEventListener("click", handler);
        actions.appendChild(b);
      }

      btn("Set quote", function () {
        var amount = Number(card.querySelector(".ent-amount").value);
        var currency = card.querySelector(".ent-currency").value.trim() || "INR";
        adminAction({
          action: "enterprise_set_quote",
          requestId: req.requestId,
          amountMinor: amount,
          currency: currency,
        }).then(function (r) {
          setStatus(r.ok ? "Quote saved." : (r.data.error || "Failed"), !r.ok);
          loadEnterpriseRequests();
        });
      });

      btn("Create payment link", function () {
        var amount = Number(card.querySelector(".ent-amount").value);
        var currency = card.querySelector(".ent-currency").value.trim() || "INR";
        adminAction({
          action: "create_enterprise_payment",
          requestId: req.requestId,
          amountMinor: amount,
          currency: currency,
        }).then(function (r) {
          if (r.ok && r.data.checkoutUrl) {
            setStatus("Payment link: " + r.data.checkoutUrl, false);
          } else {
            setStatus(r.data.error || "Failed", true);
          }
          loadEnterpriseRequests();
        });
      });

      btn("Add note", function () {
        var note = card.querySelector(".ent-note").value.trim();
        adminAction({ action: "enterprise_add_note", requestId: req.requestId, note: note }).then(function () {
          loadEnterpriseRequests();
        });
      });

      btn("Mark delivered", function () {
        adminAction({ action: "enterprise_mark_delivered", requestId: req.requestId }).then(function () {
          loadEnterpriseRequests();
        });
      });

      btn("Close", function () {
        adminAction({ action: "enterprise_close", requestId: req.requestId }).then(function () {
          loadEnterpriseRequests();
        });
      });

      list.appendChild(card);
    });
  }

  function bindSearch() {
    var form = document.getElementById("admin-search-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var query = document.getElementById("admin-query").value.trim();
      setStatus("Searching…", false);
      fetch("/api/admin-search", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ query: query }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (result) {
          if (!result.ok) throw new Error((result.data && result.data.error) || "Search failed.");
          renderResults(result.data.results || []);
        })
        .catch(function (err) { setStatus(err.message, true); });
    });
  }

  function renderResults(results) {
    var list = document.getElementById("admin-results");
    if (!list) return;
    list.innerHTML = "";
    if (!results.length) {
      setStatus("No results found.", true);
      return;
    }
    setStatus("", false);
    results.forEach(function (item) {
      if (item.type === "session") return;
      var card = document.createElement("article");
      card.className = "recover-report-card";
      card.innerHTML =
        "<h3>" + (item.orderRef || "Report") + "</h3>" +
        "<p>Email: " + (item.buyerEmail || "—") + "</p>" +
        "<p>Payment: " + (item.paymentStatus || item.paymentState || "—") + "</p>" +
        "<p>Report: " + (item.reportStatus || "—") + "</p>" +
        '<div class="report-action-row"></div>';
      var actions = card.querySelector(".report-action-row");
      var actionList = [
        "resend_email",
        "retry_generation",
        "enable_download",
        "disable_download",
        "mark_refunded",
        "delete_expired",
      ];
      actionList.forEach(function (action) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-secondary";
        btn.textContent = action.replace(/_/g, " ");
        btn.addEventListener("click", function () {
          adminAction({ orderId: item.orderId, action: action }).then(function (r) {
            setStatus(r.ok ? "Action completed: " + action : ((r.data && r.data.error) || "Failed"), !r.ok);
          });
        });
        actions.appendChild(btn);
      });
      list.appendChild(card);
    });
  }

  var refreshBtn = document.getElementById("admin-load-enterprise");
  if (refreshBtn) refreshBtn.addEventListener("click", loadEnterpriseRequests);

  var opsBtn = document.getElementById("admin-load-ops");
  if (opsBtn) opsBtn.addEventListener("click", loadOperationsDashboard);

  var diagBtn = document.getElementById("admin-load-diagnostics");
  if (diagBtn) diagBtn.addEventListener("click", loadDiagnostics);

  bindKeyForm();
  bindSearch();
})();
