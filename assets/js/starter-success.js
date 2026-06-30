/**
 * Post-checkout success page — payment verify, poll generation, downloads (v25.19).
 */
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var token = params.get("confirmation");
  var verifying = document.getElementById("success-verifying");
  var unverified = document.getElementById("success-unverified");
  var verified = document.getElementById("success-verified");
  var downloadActions = document.getElementById("download-actions");
  var downloadStatus = document.getElementById("download-status");
  var emailStatusLine = document.getElementById("email-status-line");
  var pollAttempts = 0;
  var MAX_POLL = 24;
  var FLOW_STEP_IDS = ["received", "verifying", "generating", "downloads", "email", "complete"];

  function setFlowStep(doneThrough, activeIdx) {
    var stepsEl = document.getElementById("sx-flow-steps");
    if (stepsEl) stepsEl.hidden = false;
    FLOW_STEP_IDS.forEach(function (name, idx) {
      var el = document.getElementById("fstep-" + name);
      if (!el) return;
      var icon = el.querySelector(".sx-flow-icon");
      el.classList.remove("sx-step-done", "sx-step-active");
      if (idx <= doneThrough) {
        el.classList.add("sx-step-done");
        if (icon) icon.textContent = "✓";
      } else if (idx === activeIdx) {
        el.classList.add("sx-step-active");
        if (icon) icon.textContent = "●";
      } else {
        if (icon) icon.textContent = "○";
      }
    });
  }

  var FORMATS = [
    { id: "html", label: "Download HTML", primary: true },
    { id: "pdf", label: "Download PDF", primary: false },
    { id: "docx", label: "Download Word", primary: false },
    { id: "pptx", label: "Download PowerPoint", primary: false },
    { id: "text", label: "Download Plain Text", primary: false },
  ];

  function setDownloadStatus(msg, isError) {
    var api = window.AGHUX;
    if (api) {
      api.setStatusEl(downloadStatus, msg, isError ? "error" : msg ? "success" : "loading");
      return;
    }
    downloadStatus.textContent = msg || "";
  }

  function focusVerifiedHeading() {
    var heading = verified && verified.querySelector("h1");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }

  function setEmailLine(data) {
    if (!emailStatusLine || !data) return;
    if (data.emailStatus === "sent") {
      emailStatusLine.textContent =
        "We also emailed you a backup copy. Your downloads above are ready now — no need to wait for it.";
    } else if (data.emailStatus === "failed") {
      emailStatusLine.textContent =
        "Email delivery is temporarily unavailable, but your downloads are ready above.";
    } else if (data.reportStatus === "generating") {
      emailStatusLine.textContent =
        "Payment verified. Your report is being prepared — downloads will appear automatically.";
    } else if (data.customerPaymentState === "generation_failed") {
      emailStatusLine.textContent =
        "Payment verified. Report generation failed — use Recover My Report to retry.";
    } else {
      emailStatusLine.textContent =
        "No account needed — use Recover My Report anytime with your checkout email.";
    }
  }

  function renderDownloads(data) {
    if (!downloadActions) return;
    downloadActions.innerHTML = "";
    var available = data.availableFormats || ["html", "text"];

    FORMATS.forEach(function (fmt) {
      if (available.indexOf(fmt.id) === -1) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = fmt.primary ? "btn btn-primary" : "btn btn-secondary";
      btn.textContent = fmt.label;
      btn.addEventListener("click", function () {
        attemptDownload(fmt, token, 0);
      });
      downloadActions.appendChild(btn);
    });
  }

  function attemptDownload(fmt, confirmToken, retryCount) {
    setDownloadStatus("Preparing your " + fmt.label.replace("Download ", "") + "…", false);
    fetch("/api/download-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationToken: confirmToken, format: fmt.id }),
    })
      .then(function (response) {
        if (response.status === 409 && retryCount < 8) {
          setDownloadStatus("Report still generating — retrying in a few seconds…", false);
          return new Promise(function (resolve) {
            setTimeout(function () {
              resolve(attemptDownload(fmt, confirmToken, retryCount + 1));
            }, 3000);
          });
        }
        if (!response.ok) {
          return response.json().then(function (data) {
            var api = window.AGHUX;
            var msg = (data && data.error) || "Download could not be completed.";
            if (api) {
              var norm = api.normalizeError(msg);
              throw new Error(norm.title + " — " + norm.fix);
            }
            throw new Error(msg);
          });
        }
        var disposition = response.headers.get("Content-Disposition") || "";
        var filenameMatch = disposition.match(/filename=\"([^\"]+)\"/);
        var filename = filenameMatch ? filenameMatch[1] : "ai-governance-executive-report." + fmt.id;
        return response.blob().then(function (blob) {
          return { blob: blob, filename: filename };
        });
      })
      .then(function (payload) {
        if (!payload || !payload.blob) return;
        var url = URL.createObjectURL(payload.blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = payload.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDownloadStatus("Download started. Check your downloads folder.", false);
      })
      .catch(function (error) {
        setDownloadStatus(error.message, true);
      });
  }

  function showVerified(data) {
    if (verifying) verifying.hidden = true;
    if (unverified) unverified.hidden = true;
    if (verified) verified.hidden = false;
    var isGenerationFailed = data.customerPaymentState === "generation_failed";
    var isProcessing =
      !isGenerationFailed &&
      (data.customerPaymentState === "processing" || data.downloadReady !== true);
    document.title = isGenerationFailed
      ? "Generation Failed | AI Governance Hub"
      : isProcessing
        ? "Payment Verified — Preparing Assessment | AI Governance Hub"
        : "Assessment Ready | AI Governance Hub";
    var heading = document.getElementById("success-verified-heading");
    var lead = document.getElementById("success-verified-lead");
    if (heading) {
      heading.textContent = isGenerationFailed
        ? "Report generation failed"
        : isProcessing
          ? "Payment verified — preparing your assessment"
          : "Your executive assessment is ready";
    }
    if (lead) {
      lead.textContent = isGenerationFailed
        ? (data.message ||
            "Payment verified. Report generation failed — use Recover My Report to retry or contact support@aigovernancehub.ai.")
        : isProcessing
          ? "Your payment was verified server-side. Your executive report is being generated — downloads will appear automatically when ready."
          : "Payment verified. Your full AI governance report has been generated — board-ready formats, delivered securely.";
    }
    focusVerifiedHeading();
    if (isGenerationFailed) {
      setFlowStep(1, 2);
    } else if (isProcessing) {
      setFlowStep(1, 2);
    } else if (data.emailStatus === "sent") {
      setFlowStep(4, 5);
    } else if (data.emailStatus === "failed") {
      setFlowStep(3, 5);
    } else {
      setFlowStep(3, 4);
    }
    if (!isProcessing && !isGenerationFailed && window.AGHStarterExperience && typeof window.AGHStarterExperience.initSuccessCelebration === "function") {
      window.AGHStarterExperience.initSuccessCelebration();
    }
    setEmailLine(data);
    if (data.downloadReady === true) {
      setDownloadStatus("", false);
      renderDownloads(data);
    } else if (isGenerationFailed) {
      setDownloadStatus(
        data.message ||
          "Report generation failed. Use Recover My Report or My Reports to retry.",
        true
      );
    } else {
      setDownloadStatus(
        data.message || "Payment verified. Preparing your executive assessment…",
        false
      );
    }
  }

  function verifyToken() {
    return fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationToken: token }),
    }).then(function (response) {
      return response.json().then(function (data) {
        return { ok: response.ok, data: data };
      });
    });
  }

  function pollUntilReady() {
    pollAttempts += 1;
    verifyToken()
      .then(function (result) {
        if (!(result.ok && result.data && result.data.valid === true)) {
          if (pollAttempts >= MAX_POLL) {
            if (verifying) verifying.hidden = true;
            if (unverified) unverified.hidden = false;
            var stepsEl = document.getElementById("sx-flow-steps");
            if (stepsEl) stepsEl.hidden = true;
            setDownloadStatus(
              "Payment verified but your report is still preparing. Use Recover My Report or My Reports, or contact support@aigovernancehub.ai.",
              true
            );
          } else {
            setTimeout(pollUntilReady, 5000);
          }
          return;
        }
        showVerified(result.data);
        if (
          result.data.downloadReady !== true &&
          result.data.customerPaymentState !== "generation_failed" &&
          pollAttempts < MAX_POLL
        ) {
          setTimeout(pollUntilReady, 5000);
        }
      })
      .catch(function () {
        if (pollAttempts < MAX_POLL) {
          setTimeout(pollUntilReady, 5000);
        } else {
          if (verifying) verifying.hidden = true;
          if (unverified) unverified.hidden = false;
          setDownloadStatus(
            "Connection interrupted. Your payment may be verified — try Recover My Report or contact support@aigovernancehub.ai.",
            true
          );
        }
      });
  }

  if (!token) {
    if (unverified) unverified.hidden = false;
    return;
  }

  setFlowStep(0, 1);
  if (verifying) verifying.hidden = false;
  pollUntilReady();
})();
