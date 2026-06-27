/**
 * AI Governance Hub — Recover purchased reports v25.7
 */
(function () {
  "use strict";

  var RECOVER_URL = "/api/recover-reports";

  function ux() {
    return window.AGHUX || null;
  }

  function setStatus(message, isError) {
    var status = document.getElementById("recover-status");
    if (!status) return;
    var api = ux();
    if (api) {
      api.setStatusEl(status, message, isError ? "error" : message ? "info" : null);
      return;
    }
    status.textContent = message || "";
    status.classList.toggle("starter-upload-error", Boolean(isError));
  }

  function bindForm() {
    var form = document.getElementById("recover-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var emailInput = document.getElementById("recover-email");
      var email = emailInput ? emailInput.value.trim() : "";
      if (!email) {
        setStatus("Enter the email address you used at checkout.", true);
        return;
      }

      var submitBtn = document.getElementById("recover-submit");
      var api = ux();
      if (api) api.setBusy(submitBtn, true, "Sending link…");

      setStatus("Sending a secure sign-in link to your email…", false);
      var resultsPanel = document.getElementById("recover-results");
      if (resultsPanel) resultsPanel.hidden = true;

      fetch(RECOVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            throw new Error((result.data && result.data.error) || "We could not process that request.");
          }
          var message =
            result.data.message ||
            "If purchased reports exist for this email, a secure sign-in link has been sent. Check your inbox and spam folder.";
          if (result.data.paymentReceived && result.data.generationFailed) {
            message =
              result.data.message ||
              "Payment verified. Report generation failed — sign in from the email link to retry from My Reports.";
          } else if (result.data.paymentReceived && result.data.assessmentProcessing && !result.data.readyReportCount) {
            message =
              result.data.message ||
              "Payment received. Your executive assessment is processing — downloads will appear when generation completes.";
          } else if (result.data.reportsFound && result.data.emailDeliveryAvailable === false) {
            message =
              result.data.message ||
              "Payment received. We found your purchase, but email delivery is unavailable. Use your payment success page or contact support@aigovernancehub.ai.";
          }
          setStatus(message, false);
          if (resultsPanel) {
            resultsPanel.hidden = false;
            var heading = resultsPanel.querySelector("h2");
            if (heading) {
              if (result.data.generationFailed) {
                heading.textContent = "Payment verified — generation failed";
              } else if (result.data.paymentReceived && result.data.assessmentProcessing) {
                heading.textContent = "Payment received — assessment processing";
              }
              heading.setAttribute("tabindex", "-1");
              heading.focus();
            }
            var list = document.getElementById("recover-list");
            if (list) {
              list.innerHTML = "";
              var note = document.createElement("p");
              note.className = "recover-email-note";
              note.textContent = result.data.generationFailed
                ? "Your payment is verified. Report generation failed — sign in from the email link and retry from My Reports, or contact support@aigovernancehub.ai."
                : result.data.assessmentProcessing
                ? "Your payment is verified on our side. Report downloads unlock automatically when generation completes. Sign in from the email link to track status in My Reports."
                : "For your security, downloads are available only after you sign in from the email link. Open My Reports to download HTML, PDF, Word, and PowerPoint formats.";
              list.appendChild(note);
            }
          }
        })
        .catch(function (error) {
          setStatus(error.message, true);
        })
        .finally(function () {
          if (api) api.setBusy(submitBtn, false);
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindForm);
  } else {
    bindForm();
  }
})();
