/**
 * AI Governance Hub — Governance Workspace v25.0
 */
(function () {
  "use strict";

  var wsData = null;
  var reportsData = [];
  var selectedTaskId = null;
  var FORMAT_LABELS = { html: "HTML", pdf: "PDF", docx: "Word", pptx: "PowerPoint", text: "Text" };

  function ux() {
    return window.AGHUX || null;
  }
  function $(id) {
    return document.getElementById(id);
  }
  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function setStatus(msg, isError) {
    var el = $("dashboard-status");
    if (!el) return;
    var api = ux();
    if (api) api.setStatusEl(el, msg, isError ? "error" : msg ? "info" : null);
    else el.textContent = msg || "";
  }

  function bindTabs() {
    var tablist = document.querySelector(".exec-tabs.ws-tabs");
    if (tablist) tablist.setAttribute("role", "tablist");
    document.querySelectorAll(".exec-tab").forEach(function (tab, index) {
      var name = tab.getAttribute("data-tab");
      var panel = document.querySelector('[data-panel="' + name + '"]');
      var panelId = panel ? panel.id || "tab-" + name : "tab-" + name;
      if (panel && !panel.id) panel.id = panelId;
      tab.setAttribute("role", "tab");
      tab.setAttribute("id", "tab-btn-" + name);
      tab.setAttribute("aria-controls", panelId);
      tab.setAttribute("tabindex", tab.classList.contains("active") ? "0" : "-1");
      tab.setAttribute("aria-selected", tab.classList.contains("active") ? "true" : "false");
      if (panel) {
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", "tab-btn-" + name);
      }
      tab.addEventListener("click", function () {
        document.querySelectorAll(".exec-tab").forEach(function (t) {
          var active = t === tab;
          t.classList.toggle("active", active);
          t.setAttribute("aria-selected", active ? "true" : "false");
          t.setAttribute("tabindex", active ? "0" : "-1");
        });
        document.querySelectorAll(".exec-tab-panel").forEach(function (p) {
          p.hidden = p.getAttribute("data-panel") !== name;
        });
      });
      tab.addEventListener("keydown", function (e) {
        var tabs = Array.prototype.slice.call(document.querySelectorAll(".exec-tab"));
        var i = tabs.indexOf(tab);
        if (e.key === "ArrowRight" && tabs[i + 1]) tabs[i + 1].click();
        if (e.key === "ArrowLeft" && tabs[i - 1]) tabs[i - 1].click();
      });
    });
    document.querySelectorAll("[data-ws-view]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var view = btn.getAttribute("data-ws-view");
        document.querySelectorAll("[data-ws-view]").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        ["kanban", "timeline", "calendar", "list"].forEach(function (v) {
          var el = $("ws-" + v);
          if (el) el.hidden = v !== view;
        });
        if (view === "kanban") $("ws-kanban").hidden = false;
      });
    });
    document.querySelectorAll("[data-tab-jump]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-tab-jump");
        var tab = document.querySelector('.exec-tab[data-tab="' + name + '"]');
        if (tab) tab.click();
      });
    });
  }

  function kpiCard(label, value, sub) {
    return (
      '<article class="exec-kpi-card"><span class="exec-kpi-label">' +
      esc(label) +
      '</span><span class="exec-kpi-value">' +
      esc(String(value)) +
      "</span>" +
      (sub ? '<span class="exec-kpi-sub">' + esc(sub) + "</span>" : "") +
      "</article>"
    );
  }

  function patchTask(taskId, patch) {
    return fetch("/api/workspace", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ id: taskId }, patch)),
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error((d && d.error) || "Update failed.");
        return d;
      });
    });
  }

  function renderKanban(data) {
    var board = $("ws-kanban");
    if (!board || !data.kanban) return;
    board.innerHTML = data.kanban
      .map(function (col) {
        return (
          '<div class="ws-kanban-col"><h3 class="ws-col-title">' +
          esc(col.label) +
          ' <span class="ws-col-count">' +
          col.tasks.length +
          "</span></h3>" +
          col.tasks
            .map(function (t) {
              return (
                '<article class="ws-task-card" data-task-id="' +
                esc(t.id) +
                '" draggable="true"><strong>' +
                esc(t.title) +
                '</strong><span class="ws-task-meta">' +
                esc(t.priority) +
                (t.owner ? " · " + esc(t.owner) : "") +
                "</span>" +
                (t.dueDate ? '<span class="ws-task-due">Due ' + esc(t.dueDate.slice(0, 10)) + "</span>" : "") +
                "</article>"
              );
            })
            .join("") +
          "</div>"
        );
      })
      .join("");

    board.querySelectorAll(".ws-task-card").forEach(function (card) {
      card.addEventListener("click", function () {
        openTaskDetail(card.getAttribute("data-task-id"));
      });
    });
  }

  function openTaskDetail(taskId) {
    selectedTaskId = taskId;
    var task = (wsData.tasks || []).find(function (t) {
      return t.id === taskId;
    });
    if (!task) return;
    var panel = $("ws-task-detail");
    var body = $("ws-task-detail-body");
    panel.hidden = false;
    body.innerHTML =
      "<p><strong>Description:</strong> " +
      esc(task.description || "—") +
      "</p>" +
      '<label>Owner<input type="text" class="ws-field-owner" value="' +
      esc(task.owner) +
      '" /></label>' +
      '<label>Department<input type="text" class="ws-field-dept" value="' +
      esc(task.department) +
      '" /></label>' +
      '<label>Due date<input type="date" class="ws-field-due" value="' +
      (task.dueDate ? task.dueDate.slice(0, 10) : "") +
      '" /></label>' +
      '<label>Status<select class="ws-field-status"><option value="todo"' +
      (task.status === "todo" ? " selected" : "") +
      '>To Do</option><option value="in_progress"' +
      (task.status === "in_progress" ? " selected" : "") +
      '>In Progress</option><option value="blocked"' +
      (task.status === "blocked" ? " selected" : "") +
      '>Blocked</option><option value="completed"' +
      (task.status === "completed" ? " selected" : "") +
      '>Completed</option></select></label>' +
      '<label>Evidence<textarea class="ws-field-evidence" rows="2">' +
      esc(task.evidence) +
      "</textarea></label>" +
      '<label>Completion notes<textarea class="ws-field-notes" rows="2">' +
      esc(task.completionNotes) +
      "</textarea></label>" +
      '<div class="ws-comments"><h3>Comments</h3><ul class="exec-list">' +
      (task.comments || [])
        .map(function (c) {
          return "<li><strong>" + esc(c.author) + ":</strong> " + esc(c.text) + "</li>";
        })
        .join("") +
      '</ul><label>Add comment<textarea class="ws-new-comment" rows="2" placeholder="Use @email for mentions"></textarea></label>' +
      '<button type="button" class="btn btn-secondary ws-post-comment">Post comment</button></div>' +
      '<div class="ws-attach"><h3>Attachments (reference notes)</h3><input type="text" class="ws-att-name" placeholder="Name" />' +
      '<textarea class="ws-att-note" rows="2" placeholder="Reference URL or note"></textarea>' +
      '<button type="button" class="btn btn-secondary ws-add-attach">Add reference</button></div>';

    function saveField(patch) {
      patchTask(taskId, patch).then(reloadWorkspace).catch(function (e) {
        setStatus(e.message, true);
      });
    }
    body.querySelector(".ws-field-owner").addEventListener("blur", function (e) {
      saveField({ owner: e.target.value });
    });
    body.querySelector(".ws-field-dept").addEventListener("blur", function (e) {
      saveField({ department: e.target.value });
    });
    body.querySelector(".ws-field-due").addEventListener("change", function (e) {
      saveField({ dueDate: e.target.value || null });
    });
    body.querySelector(".ws-field-status").addEventListener("change", function (e) {
      saveField({ status: e.target.value });
    });
    body.querySelector(".ws-field-evidence").addEventListener("blur", function (e) {
      saveField({ evidence: e.target.value });
    });
    body.querySelector(".ws-field-notes").addEventListener("blur", function (e) {
      saveField({ completionNotes: e.target.value });
    });
    body.querySelector(".ws-post-comment").addEventListener("click", function () {
      var text = body.querySelector(".ws-new-comment").value.trim();
      if (!text) return;
      fetch("/api/workspace", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", taskId: taskId, text: text }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(reloadWorkspace)
        .catch(function (e) {
          setStatus(e.message, true);
        });
    });
    body.querySelector(".ws-add-attach").addEventListener("click", function () {
      var name = body.querySelector(".ws-att-name").value.trim() || "Reference";
      var note = body.querySelector(".ws-att-note").value.trim();
      fetch("/api/workspace", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "attachment", taskId: taskId, name: name, note: note }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(reloadWorkspace)
        .catch(function (e) {
          setStatus(e.message, true);
        });
    });
  }

  function renderTimeline(data) {
    var el = $("ws-timeline");
    if (!el) return;
    el.innerHTML =
      "<h2>Timeline</h2><ul class=\"exec-list\">" +
      (data.timeline || [])
        .map(function (t) {
          return (
            "<li><strong>" +
            esc(t.title) +
            "</strong> — " +
            esc(t.status) +
            " · due " +
            esc((t.end || t.start || "").slice(0, 10)) +
            "</li>"
          );
        })
        .join("") +
      "</ul>";
  }

  function renderCalendar(data) {
    var el = $("ws-calendar");
    if (!el) return;
    var cal = data.calendar || {};
    var keys = Object.keys(cal).sort();
    el.innerHTML =
      "<h2>Calendar</h2>" +
      (keys.length
        ? keys
            .map(function (day) {
              return (
                "<p><strong>" +
                esc(day) +
                "</strong></p><ul class=\"exec-list\">" +
                cal[day]
                  .map(function (t) {
                    return "<li>" + esc(t.title) + " (" + esc(t.status) + ")</li>";
                  })
                  .join("") +
                "</ul>"
              );
            })
            .join("")
        : "<p class=\"microcopy\">Set due dates on tasks to populate the calendar.</p>");
  }

  function renderList(data) {
    var el = $("ws-list");
    if (!el) return;
    el.innerHTML =
      "<h2>All tasks</h2><div class=\"exec-table-wrap\"><table class=\"exec-table\"><thead><tr><th>Title</th><th>Priority</th><th>Owner</th><th>Status</th><th>Due</th></tr></thead><tbody>" +
      (data.tasks || [])
        .map(function (t) {
          return (
            "<tr data-task-id=\"" +
            esc(t.id) +
            "\"><td>" +
            esc(t.title) +
            "</td><td>" +
            esc(t.priority) +
            "</td><td>" +
            esc(t.owner) +
            "</td><td>" +
            esc(t.status) +
            "</td><td>" +
            esc(t.dueDate ? t.dueDate.slice(0, 10) : "—") +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table></div>";
    el.querySelectorAll("tr[data-task-id]").forEach(function (row) {
      row.addEventListener("click", function () {
        openTaskDetail(row.getAttribute("data-task-id"));
      });
    });
  }

  function renderHealth(data) {
    var h = data.health || {};
    $("health-kpis").innerHTML =
      kpiCard("Overall health", h.overallHealth, h.healthScore + "/100") +
      kpiCard("Completed", h.completedRecommendations, "recommendations") +
      kpiCard("Pending", h.pending, "open tasks") +
      kpiCard("Overdue", h.overdue, "need attention") +
      kpiCard("Governance improvement", (h.governanceImprovement > 0 ? "+" : "") + h.governanceImprovement, "pts vs prior") +
      kpiCard("Completion rate", h.completionRatePercent + "%", "");
  }

  function renderReassess(data) {
    var r = data.reAssessment || {};
    $("reassess-panel").innerHTML =
      "<h2>Re-assessment comparison</h2>" +
      (r.available
        ? "<p><strong>Previous:</strong> " +
          r.previous.governanceScore +
          "/100 (" +
          esc(r.previous.label) +
          ")</p><p><strong>Current:</strong> " +
          r.current.governanceScore +
          "/100 (" +
          esc(r.current.label) +
          ')</p><p class="exec-trend-badge exec-trend-' +
          r.improvement.direction +
          '">' +
          esc(r.improvement.label) +
          " · Δ " +
          r.improvement.delta +
          '</p><a class="btn btn-primary" href="' +
          esc(r.runAssessmentUrl) +
          '">Run new assessment</a>'
        : "<p>" +
          esc(r.message) +
          '</p><a class="btn btn-primary" href="' +
          esc(r.runAssessmentUrl) +
          '">Run new assessment</a>');
  }

  function renderHistory(data) {
    var sh = data.scoreHistory || {};
    $("score-history-panel").innerHTML =
      "<h2>Governance score timeline</h2><ul class=\"exec-list\">" +
      (sh.timeline || [])
        .map(function (p) {
          return (
            "<li>" +
            new Date(p.assessedAt).toLocaleDateString() +
            " — <strong>" +
            esc(p.label) +
            "</strong>: " +
            p.governanceScore +
            "/100</li>"
          );
        })
        .join("") +
      "</ul>";
    $("dept-progress-panel").innerHTML =
      "<h2>Department progress (latest)</h2><div class=\"exec-table-wrap\"><table class=\"exec-table\"><thead><tr><th>Department</th><th>Score</th></tr></thead><tbody>" +
      (sh.departmentProgress || [])
        .map(function (d) {
          return "<tr><td>" + esc(d.name) + "</td><td>" + d.score + "</td></tr>";
        })
        .join("") +
      "</tbody></table></div>";
  }

  function renderEffectiveness(data) {
    var items = data.effectiveness || [];
    $("effectiveness-panel").innerHTML = items.length
      ? "<h2>Action effectiveness</h2><div class=\"exec-table-wrap\"><table class=\"exec-table\"><thead><tr><th>Action</th><th>Expected</th><th>Actual</th><th>Variance</th></tr></thead><tbody>" +
        items
          .map(function (e) {
            return (
              "<tr><td>" +
              esc(e.title) +
              "</td><td>" +
              e.expectedImprovement +
              "</td><td>" +
              e.actualImprovement +
              "</td><td>" +
              e.variance +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>"
      : "<h2>Action effectiveness</h2><p class=\"microcopy\">Complete tasks and run a follow-up assessment to measure effectiveness.</p>";
  }

  function renderActivity(data) {
    $("ws-activity").innerHTML =
      "<h2>Activity log</h2><ul class=\"exec-list ws-audit\">" +
      (data.activity || [])
        .slice(0, 15)
        .map(function (a) {
          return "<li>" + new Date(a.timestamp).toLocaleString() + " — " + esc(a.message) + "</li>";
        })
        .join("") +
      "</ul>";
  }

  function renderAll(data) {
    wsData = data;
    renderKanban(data);
    renderTimeline(data);
    renderCalendar(data);
    renderList(data);
    renderHealth(data);
    renderReassess(data);
    renderHistory(data);
    renderEffectiveness(data);
    renderActivity(data);
    if (selectedTaskId) openTaskDetail(selectedTaskId);
  }

  function reloadWorkspace() {
    return fetch("/api/workspace", { credentials: "include" })
      .then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) throw new Error((d && d.error) || "Could not load workspace.");
          return d;
        });
      })
      .then(renderAll);
  }

  function loadReports() {
    return fetch("/api/dashboard", { credentials: "include" }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error((d && d.error) || "Could not load reports.");
        return d;
      });
    });
  }

  function renderLatestAssessment(report, score) {
    var section = $("dashboard-latest-assessment");
    var card = $("dashboard-latest-card");
    if (!section || !card) return;
    if (!report) { section.hidden = true; return; }
    section.hidden = false;
    var scoreHtml = score != null
      ? '<div class="exec-kpi-card" style="display:inline-block;margin-right:1rem"><span class="exec-kpi-label">Governance score</span><span class="exec-kpi-value">' + esc(String(score)) + '/100</span></div>'
      : "";
    card.innerHTML =
      '<div class="exec-latest-meta">' +
      "<h3>" + esc(report.projectLabel || report.planLabel || "Executive Assessment") + "</h3>" +
      '<p class="microcopy">Assessed ' + esc(report.uploadDate || report.purchasedAt || "—") +
      " · " + (report.workItemCount != null ? report.workItemCount : "—") + " work items" +
      " · Plan: " + esc(report.planLabel) + "</p>" +
      scoreHtml + "</div>";
    var actions = document.createElement("div");
    actions.className = "report-action-row";
    if (report.customerPaymentState === "generation_failed") {
      actions.innerHTML =
        '<p class="microcopy">Report generation failed. <a href="recover-report.html">Recover my report</a> or contact support@aigovernancehub.ai.</p>';
    } else if (!report.downloadReady) {
      actions.innerHTML =
        '<p class="microcopy">Your report is being prepared — downloads will appear automatically when ready. <a href="recover-report.html">Recover my report</a> if not received.</p>';
    } else if (!report.downloadDisabled && report.availableFormats) {
      report.availableFormats.forEach(function (fmt) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = fmt === "html" ? "btn btn-primary" : "btn btn-secondary";
        btn.textContent = "Download " + (FORMAT_LABELS[fmt] || fmt);
        btn.addEventListener("click", function () {
          fetch("/api/download-report", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recoveryToken: report.recoveryToken, format: fmt }),
          })
            .then(function (r) {
              if (!r.ok) throw new Error("Download failed.");
              return r.blob();
            })
            .then(function (blob) {
              var url = URL.createObjectURL(blob);
              var a = document.createElement("a");
              a.href = url;
              a.download = "ai-governance-executive-report." + fmt;
              a.click();
              URL.revokeObjectURL(url);
            })
            .catch(function (e) { setStatus(e.message, true); });
        });
        actions.appendChild(btn);
      });
    }
    card.appendChild(actions);
  }

  function renderReports(reports) {
    var list = $("dashboard-reports");
    if (!list) return;
    list.innerHTML = "";
    if (!reports.length) {
      list.innerHTML = "<p class='microcopy'>No verified assessments yet. <a href='pricing.html#assessment-wizard'>Run an assessment</a>.</p>";
      return;
    }
    reports.forEach(function (report) {
      var card = document.createElement("article");
      card.className = "recover-report-card";
      card.innerHTML =
        "<h3>" + esc(report.projectLabel || report.planLabel) + "</h3>" +
        "<p>Assessment ID: " + esc(report.assessmentId || report.orderRef) + "</p>" +
        "<p>Uploaded: " + esc(report.uploadDate || report.purchasedAt || "—") + "</p>" +
        "<p>Work items: " + (report.workItemCount != null ? report.workItemCount : "—") +
        " · Plan: " + esc(report.planLabel) + "</p>" +
        "<p>Status: " + esc(report.statusLabel || report.reportStatus || report.paymentStatus) + "</p>" +
        "<p>Reference: " + esc(report.paymentRef || "—") + "</p>" +
        '<div class="report-format-row"></div>' +
        '<p><a class="btn btn-secondary" href="pricing.html#assessment-wizard">Run another assessment</a></p>';
      var actions = card.querySelector(".report-format-row");
      if (report.customerPaymentState === "generation_failed") {
        var failNote = document.createElement("p");
        failNote.className = "microcopy";
        failNote.textContent =
          "Report generation failed. Use Recover My Report to retry or contact support@aigovernancehub.ai.";
        actions.appendChild(failNote);
      } else if (!report.downloadReady) {
        var waitNote = document.createElement("p");
        waitNote.className = "microcopy";
        waitNote.textContent =
          report.customerPaymentState === "processing"
            ? "Your report is being prepared — downloads unlock when generation completes."
            : "Downloads are not available for this assessment yet.";
        actions.appendChild(waitNote);
      } else if (!report.downloadDisabled && report.downloadReady && report.availableFormats) {
        report.availableFormats.forEach(function (fmt) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn btn-secondary";
          btn.textContent = "Download " + (FORMAT_LABELS[fmt] || fmt);
          btn.addEventListener("click", function () {
            fetch("/api/download-report", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ recoveryToken: report.recoveryToken, format: fmt }),
            })
              .then(function (r) {
                if (!r.ok) throw new Error("Download failed.");
                return r.blob();
              })
              .then(function (blob) {
                var url = URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = url;
                a.download = "report." + fmt;
                a.click();
                URL.revokeObjectURL(url);
              });
          });
          actions.appendChild(btn);
        });
      }
      list.appendChild(card);
    });
  }

  function init() {
    bindTabs();
    setStatus("Loading governance workspace…", false);
    Promise.all([reloadWorkspace(), loadReports()])
      .then(function (results) {
        $("dashboard-email").textContent = results[1].email;
        reportsData = results[1].reports || [];
        renderReports(reportsData);
        var latestReport = reportsData[0] || null;
        var latestScore = latestReport && latestReport.governanceScore != null
          ? latestReport.governanceScore
          : (wsData && wsData.health ? wsData.health.healthScore : null);
        renderLatestAssessment(latestReport, latestScore);
        setStatus("", false);
      })
      .catch(function (e) {
        if (e.message && e.message.indexOf("Sign in") !== -1) {
          window.location.href = "login.html?redirect=" + encodeURIComponent("/dashboard.html");
          return;
        }
        setStatus(e.message, true);
      });
    var logout = $("dashboard-logout");
    if (logout) {
      logout.addEventListener("click", function () {
        fetch("/api/auth-logout", { method: "POST", credentials: "include" }).finally(function () {
          window.location.href = "login.html";
        });
      });
    }
    document.querySelectorAll("#tab-export a, #tab-reports a[href^='/api/']").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        fetch(a.getAttribute("href"), { credentials: "include" })
          .then(function (r) {
            if (!r.ok) throw new Error("Export failed.");
            return r.blob().then(function (blob) {
              return { blob: blob, name: a.textContent.trim() };
            });
          })
          .then(function (p) {
            var url = URL.createObjectURL(p.blob);
            var link = document.createElement("a");
            link.href = url;
            link.download = p.name.replace(/\s+/g, "-").toLowerCase();
            link.click();
            URL.revokeObjectURL(url);
          })
          .catch(function (err) {
            setStatus(err.message, true);
          });
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
