/**
 * Post-checkout pending page — server-backed status from persisted record (v25.24).
 */
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var state = (params.get("state") || "").toLowerCase();
  var paid = params.get("paid") === "1" || state === "processing" || state === "paid";
  var unpaid = document.getElementById("pending-unpaid");
  var paidPanel = document.getElementById("pending-paid");
  var failedPanel = document.getElementById("pending-failed");
  var cancelledPanel = document.getElementById("pending-cancelled");
  var generationFailedPanel = document.getElementById("pending-generation-failed");
  var emailEl = document.getElementById("pending-email");
  var paymentEl = document.getElementById("pending-payment-id");
  var orderEl = document.getElementById("pending-order-id");
  var extraMsg = document.getElementById("pending-extra-msg");
  var paidHeading = paidPanel && paidPanel.querySelector("h1");
  var paidLead = document.getElementById("pending-paid-lead");
  var pollAttempts = 0;
  var MAX_POLL = 24;

  function hideAll() {
    if (unpaid) unpaid.hidden = true;
    if (paidPanel) paidPanel.hidden = true;
    if (failedPanel) failedPanel.hidden = true;
    if (cancelledPanel) cancelledPanel.hidden = true;
    if (generationFailedPanel) generationFailedPanel.hidden = true;
  }

  function applyServerStatus(data) {
    if (!data) return;
    if (data.customerPaymentState === "success" && data.downloadReady) {
      hideAll();
      if (paidPanel) {
        paidPanel.hidden = false;
        document.title = "Assessment Ready | AI Governance Hub";
        if (paidHeading) paidHeading.textContent = "Your assessment is ready";
        if (paidLead) {
          paidLead.textContent =
            data.message ||
            "Payment verified. Sign in via Recover My Report to download your report.";
        }
      }
      return;
    }
    if (data.customerPaymentState === "generation_failed") {
      hideAll();
      if (generationFailedPanel) generationFailedPanel.hidden = false;
      document.title = "Generation Failed | AI Governance Hub";
      return;
    }
    if (data.customerPaymentState === "processing" || data.customerPaymentState === "success") {
      hideAll();
      if (paidPanel) paidPanel.hidden = false;
      document.title = "Payment Received — Processing | AI Governance Hub";
      if (paidHeading) {
        paidHeading.textContent = data.statusLabel === "Processing"
          ? "Payment received — assessment processing"
          : paidHeading.textContent;
      }
      if (paidLead && data.message) {
        paidLead.textContent = data.message;
      }
    }
  }

  function pollPaymentStatus() {
    var orderId = params.get("order") || "";
    var paymentId = params.get("payment") || "";
    if (!orderId || !paymentId) return;

    fetch("/api/payment-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: orderId, paymentId: paymentId }),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data) {
          applyServerStatus(result.data);
          if (
            result.data.customerPaymentState === "processing" &&
            pollAttempts < MAX_POLL
          ) {
            pollAttempts += 1;
            setTimeout(pollPaymentStatus, 5000);
          }
        }
      })
      .catch(function () {
        if (pollAttempts < MAX_POLL) {
          pollAttempts += 1;
          setTimeout(pollPaymentStatus, 5000);
        }
      });
  }

  if (state === "failed") {
    hideAll();
    if (failedPanel) failedPanel.hidden = false;
    document.title = "Payment Failed | AI Governance Hub";
    return;
  }

  if (state === "cancelled") {
    hideAll();
    if (cancelledPanel) cancelledPanel.hidden = false;
    document.title = "Checkout Cancelled | AI Governance Hub";
    return;
  }

  if (paid && paidPanel) {
    hideAll();
    paidPanel.hidden = false;
    document.title = "Payment Received — Processing | AI Governance Hub";

    var email = params.get("email") || "";
    var paymentId = params.get("payment") || "";
    var orderId = params.get("order") || "";
    var msg = params.get("msg") || "";

    if (emailEl) emailEl.textContent = email || "Use the email entered at checkout";
    if (paymentEl) paymentEl.textContent = paymentId || "Check your Razorpay receipt";
    if (orderEl) orderEl.textContent = orderId || "—";

    if (extraMsg && msg) {
      extraMsg.hidden = false;
      extraMsg.textContent = msg;
    }

    pollPaymentStatus();
    return;
  }

  if (unpaid) unpaid.hidden = false;
})();
