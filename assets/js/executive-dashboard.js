/**
 * AI Governance Hub — Executive Intelligence Dashboard v24.0
 */
(function () {
  "use strict";

  var FORMAT_LABELS = { html: "HTML", pdf: "PDF", docx: "Word", pptx: "PowerPoint", text: "Text" };
  var portfolioData = null;
  var reportsData = [];

  function ux() {
    return window.AGHUX || null;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, isError) {
    var el = $("dashboard-status");
    if (!el) return;
    var api = ux();
    if (api) api.setStatusEl(el, msg, isError ? "error" : msg ? "info" : null);
    else el.textContent = msg || "";
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function bindTabs() {
    document.querySelectorAll(".exec-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-tab");
        document.querySelectorAll(".exec-tab").forEach(function (t) {
          t.classList.toggle("active", t === tab);
        });
        document.querySelectorAll(".exec-tab-panel").forEach(function (p) {
          p.hidden = p.getAttribute("data-panel") !== name;
        });
      });
    });
  }

  function kpiCard(label, value, sub) {
    return (
      '<article class="exec-kpi-card"><span class="exec-kpi-label">' +
      escapeHtml(label) +
      '</span><span class="exec-kpi-value">' +
      escapeHtml(value) +
      "</span>" +
      (sub ? '<span class="exec-kpi-sub">' + escapeHtml(sub) + "</span>" : "") +
      "</article>"
    );
  }

  function renderOverview(intel) {
    if (!intel || intel.empty) {
      $("kpi-grid").innerHTML = '<p class="microcopy">Complete a guided assessment to activate intelligence.</p>';
      return;
    }
    var ex = intel.executiveDashboard;
    var kpi = intel.kpiDashboard;
    $("kpi-grid").innerHTML =
      kpiCard("Governance Score", String(kpi.governanceScore ?? "—"), "/100 portfolio avg") +
      kpiCard("AI Readiness", String(kpi.aiReadiness ?? "—"), "/100") +
      kpiCard("Portfolio Score", String(ex.portfolioScore ?? "—"), ex.trend.label + " (" + (ex.trend.delta || 0) + ")") +
      kpiCard("Overall Risk", ex.overallRisk.level, ex.overallRisk.summary) +
      kpiCard("Critical Risks", String(kpi.criticalRisks || 0), "across portfolio") +
      kpiCard("Assessments", String(intel.assessmentCount), "historical uploads");

    var recent = ex.recentAssessments || [];
    $("recent-assessments").innerHTML =
      "<h2>Recent assessments</h2><ul class=\"exec-list\">" +
      recent
        .map(function (r) {
          return (
            "<li><strong>" +
            escapeHtml(r.label) +
            "</strong> — Score " +
            r.governanceScore +
            "/100 · " +
            new Date(r.assessedAt).toLocaleDateString() +
            "</li>"
          );
        })
        .join("") +
      "</ul>";

    $("top-risks-panel").innerHTML =
      "<h2>Top risks</h2><ul class=\"exec-list\">" +
      (ex.topRisks || [])
        .slice(0, 6)
        .map(function (r) {
          return "<li>" + escapeHtml(r.text) + (r.severity ? " <em>(" + r.severity + ")</em>" : "") + "</li>";
        })
        .join("") +
      "</ul>";

    $("top-opportunities-panel").innerHTML =
      "<h2>Top AI opportunities</h2><ul class=\"exec-list\">" +
      (ex.topOpportunities || [])
        .slice(0, 6)
        .map(function (o) {
          return "<li>" + escapeHtml(o.text) + "</li>";
        })
        .join("") +
      "</ul>";
  }

  function renderPortfolio(intel) {
    if (!intel || intel.empty) return;
    var pa = intel.portfolioAnalytics;
    var projects = pa.projectComparison || [];
    $("project-comparison").innerHTML =
      "<h2>Project comparison</h2><div class=\"exec-table-wrap\"><table class=\"exec-table\"><thead><tr><th>Assessment</th><th>Governance</th><th>AI Readiness</th><th>Critical</th><th>High</th></tr></thead><tbody>" +
      projects
        .map(function (p) {
          return (
            "<tr><td>" +
            escapeHtml(p.label) +
            "</td><td>" +
            p.governanceScore +
            "</td><td>" +
            p.aiReadiness +
            "</td><td>" +
            p.criticalRisks +
            "</td><td>" +
            p.highRisks +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table></div>";

    var heat = pa.portfolioHeatmap || {};
    $("portfolio-heatmap").innerHTML =
      "<h2>Portfolio risk heatmap</h2><div class=\"exec-heatmap\">" +
      ["critical", "high", "medium", "low"]
        .map(function (band) {
          var n = heat[band] || 0;
          return (
            '<div class="exec-heat-cell exec-heat-' +
            band +
            '"><span class="exec-heat-count">' +
            n +
            '</span><span class="exec-heat-label">' +
            band +
            "</span></div>"
          );
        })
        .join("") +
      "</div>";

    var depts = intel.executiveDashboard.departmentRankings || [];
    $("department-rankings").innerHTML =
      "<h2>Department rankings</h2><div class=\"exec-table-wrap\"><table class=\"exec-table\"><thead><tr><th>Department</th><th>Avg score</th><th>Work items</th><th>AI-related items</th></tr></thead><tbody>" +
      depts
        .map(function (d) {
          return (
            "<tr><td>" +
            escapeHtml(d.name) +
            "</td><td>" +
            d.avgScore +
            "</td><td>" +
            d.workItems +
            "</td><td>" +
            d.aiCandidates +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table></div>";
  }

  function renderTrendChart(period) {
    if (!portfolioData || portfolioData.intelligence.empty) return;
    var charts = portfolioData.intelligence.trendAnalysis.charts;
    var series = charts[period] || [];
    var max = Math.max.apply(null, series.map(function (p) {
      return p.governanceScore || 0;
    }).concat([100]));
    $("trend-chart").innerHTML =
      "<h2>Governance trend — " +
      period +
      '</h2><div class="exec-bar-chart" role="img" aria-label="Governance score trend">' +
      series
        .map(function (p) {
          var h = max ? Math.round(((p.governanceScore || 0) / max) * 100) : 0;
          return (
            '<div class="exec-bar-col"><div class="exec-bar" style="height:' +
            h +
            '%" title="' +
            p.governanceScore +
            '"></div><span class="exec-bar-label">' +
            escapeHtml(p.label) +
            "</span></div>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderTrends(intel) {
    if (!intel || intel.empty) return;
    var t = intel.trendAnalysis.lastVsCurrent;
    $("trend-summary").innerHTML =
      "<h2>Trend analysis</h2><p><strong>Current:</strong> " +
      (t.current.governanceScore ?? "—") +
      "/100 (" +
      escapeHtml(t.current.label) +
      ")</p>" +
      (t.last
        ? "<p><strong>Previous:</strong> " +
          t.last.governanceScore +
          "/100 (" +
          escapeHtml(t.last.label) +
          ")</p>"
        : "<p>Upload another assessment to enable trend comparison.</p>") +
      '<p class="exec-trend-badge exec-trend-' +
      t.trend.direction +
      '">' +
      escapeHtml(t.trend.label) +
      (t.trend.delta ? " · Δ " + t.trend.delta : "") +
      "</p>";
    renderTrendChart("monthly");
    document.querySelectorAll(".exec-chart-period").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".exec-chart-period").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        renderTrendChart(btn.getAttribute("data-period"));
      });
    });
  }

  function renderActions(tracker) {
    var items = (tracker && tracker.items) || [];
    if (!items.length) {
      $("action-tracker-table").innerHTML = "<h2>Action tracker</h2><p>Recommendations appear here after your first assessment.</p>";
      return;
    }
    $("action-tracker-table").innerHTML =
      "<h2>Action tracker</h2><div class=\"exec-table-wrap\"><table class=\"exec-table\"><thead><tr><th>Recommendation</th><th>Owner</th><th>Priority</th><th>Status</th><th>Progress</th><th>Target</th></tr></thead><tbody>" +
      items
        .map(function (a) {
          return (
            "<tr data-action-id=\"" +
            escapeHtml(a.id) +
            "\"><td>" +
            escapeHtml(a.recommendationTitle) +
            '</td><td><input type="text" class="exec-action-owner" value="' +
            escapeHtml(a.owner) +
            '" aria-label="Owner" /></td><td>' +
            escapeHtml(a.priority) +
            '</td><td><select class="exec-action-status" aria-label="Status"><option value="not_started"' +
            (a.status === "not_started" ? " selected" : "") +
            '>Not started</option><option value="in_progress"' +
            (a.status === "in_progress" ? " selected" : "") +
            '>In progress</option><option value="completed"' +
            (a.status === "completed" ? " selected" : "") +
            '>Completed</option><option value="blocked"' +
            (a.status === "blocked" ? " selected" : "") +
            '>Blocked</option></select></td><td><input type="range" min="0" max="100" value="' +
            a.progress +
            '" class="exec-action-progress" aria-label="Progress" /></td><td><input type="date" class="exec-action-date" value="' +
            (a.targetDate ? a.targetDate.slice(0, 10) : "") +
            '" aria-label="Target date" /></td></tr>"
          );
        })
        .join("") +
      "</tbody></table></div>";

    $("action-tracker-table").querySelectorAll("tr[data-action-id]").forEach(function (row) {
      var id = row.getAttribute("data-action-id");
      function patch(data) {
        fetch("/api/action-tracker", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.assign({ id: id }, data)),
        }).catch(function () {});
      }
      row.querySelector(".exec-action-status").addEventListener("change", function (e) {
        patch({ status: e.target.value });
      });
      row.querySelector(".exec-action-progress").addEventListener("change", function (e) {
        patch({ progress: Number(e.target.value) });
      });
      row.querySelector(".exec-action-owner").addEventListener("blur", function (e) {
        patch({ owner: e.target.value });
      });
      row.querySelector(".exec-action-date").addEventListener("change", function (e) {
        patch({ targetDate: e.target.value || null });
      });
    });
  }

  function renderValue(intel) {
    if (!intel || intel.empty) return;
    var v = intel.customerValue;
    $("customer-value-panel").innerHTML =
      "<h2>Customer value</h2><div class=\"exec-kpi-grid\">" +
      kpiCard("Reports generated", String(v.reportsGenerated), "") +
      kpiCard("Time saved (hrs/yr)", v.estimatedTimeSavedHours.low + "–" + v.estimatedTimeSavedHours.high, "estimated") +
      kpiCard("Actions completed", v.recommendationsCompleted + " / " + v.recommendationsTotal, v.completionRate + "%") +
      kpiCard("Governance Δ", String(v.governanceImprovement), "since first assessment") +
      kpiCard("AI adoption Δ", String(v.aiAdoptionProgress), "readiness trend") +
      "</div>";

    var b = intel.benchmarking;
    $("benchmark-panel").innerHTML =
      "<h2>Benchmarking</h2><p>" +
      escapeHtml(b.reason) +
      '</p><p class="microcopy">Schema v' +
      escapeHtml(b.schemaVersion) +
      " — opt-in only, no fabricated peer data.</p>";
  }

  function download(token, format) {
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
      return response.blob().then(function (blob) {
        return { blob: blob, filename: match ? match[1] : "report.html" };
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

  function renderReports(reports) {
    var list = $("dashboard-reports");
    if (!list) return;
    list.innerHTML = "";
    if (!reports.length) {
      var api = ux();
      if (api) {
        api.showEmptyState(list, {
          title: "No purchased reports yet",
          body: "Start a guided assessment to generate your first executive intelligence report.",
          ctaLabel: "Start assessment",
          ctaHref: "pricing.html#assessment-wizard",
        });
      }
      return;
    }
    reports.forEach(function (report) {
      var card = document.createElement("article");
      card.className = "recover-report-card";
      card.innerHTML =
        "<h3>" +
        escapeHtml(report.projectLabel || report.planLabel) +
        "</h3><p><strong>Score:</strong> " +
        (report.governanceScore ?? "—") +
        "/100 · <strong>Ref:</strong> " +
        report.orderRef +
        "</p><p><strong>Purchased:</strong> " +
        new Date(report.purchasedAt).toLocaleString() +
        '</p><div class="report-format-row"></div>';
      var actions = card.querySelector(".report-format-row");
      if (!report.downloadDisabled && report.downloadReady && report.availableFormats) {
        report.availableFormats.forEach(function (fmt) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = fmt === "html" ? "btn btn-primary" : "btn btn-secondary";
          btn.textContent = "Download " + (FORMAT_LABELS[fmt] || fmt);
          btn.addEventListener("click", function () {
            download(report.recoveryToken, fmt)
              .then(triggerDownload)
              .catch(function (e) {
                setStatus(e.message, true);
              });
          });
          actions.appendChild(btn);
        });
      }
      list.appendChild(card);
    });
  }

  function loadAll() {
    setStatus("Loading executive intelligence…", false);
    Promise.all([
      fetch("/api/dashboard", { credentials: "include" }).then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok, data: d };
        });
      }),
      fetch("/api/portfolio", { credentials: "include" }).then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok, data: d };
        });
      }),
    ])
      .then(function (results) {
        if (!results[0].ok) {
          if (results[0].data && results[0].data.error === "Sign in required.") {
            window.location.href = "login.html?redirect=" + encodeURIComponent("/dashboard.html");
            return;
          }
          throw new Error((results[0].data && results[0].data.error) || "Could not load dashboard.");
        }
        $("dashboard-email").textContent = results[0].data.email;
        reportsData = results[0].data.reports || [];
        portfolioData = results[1].ok ? results[1].data : { intelligence: { empty: true } };
        var intel = portfolioData.intelligence;
        renderOverview(intel);
        renderPortfolio(intel);
        renderTrends(intel);
        renderActions(portfolioData.actionTracker);
        renderValue(intel);
        renderReports(reportsData);
        setStatus("", false);
      })
      .catch(function (e) {
        setStatus(e.message, true);
      });
  }

  bindTabs();
  var exportCsv = $("export-actions-csv");
  if (exportCsv) {
    exportCsv.addEventListener("click", function () {
      fetch("/api/action-tracker?export=csv", { credentials: "include" })
        .then(function (r) {
          if (!r.ok) throw new Error("Export could not be completed.");
          return r.blob();
        })
        .then(function (blob) {
          triggerDownload({ blob: blob, filename: "ai-governance-actions.csv" });
        })
        .catch(function (e) {
          setStatus(e.message, true);
        });
    });
  }
  var logout = $("dashboard-logout");
  if (logout) {
    logout.addEventListener("click", function () {
      fetch("/api/auth-logout", { method: "POST", credentials: "include" }).finally(function () {
        window.location.href = "login.html";
      });
    });
  }
  loadAll();
})();
