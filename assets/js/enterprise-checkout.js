/**
 * AI Governance Hub — Enterprise custom checkout (P0)
 */
(function () {
  "use strict";

  var CHECKOUT_URL = "/api/enterprise-checkout";
  var VERIFY_URL = "/api/verify-payment";
  var SUCCESS_URL = "starter-success.html";
  var payToken = new URLSearchParams(window.location.search).get("token");
  var checkoutData = null;

  function $(id) {
    return document.getElementById(id);
  }

  function show(id) {
    ["checkout-loading", "checkout-invalid", "checkout-paid", "checkout-ready"].forEach(function (panel) {
      var el = $(panel);
      if (el) el.hidden = panel !== id;
    });
  }

  function fail(message) {
    show("checkout-invalid");
    var msg = $("checkout-invalid-message");
    if (msg) msg.textContent = message;
  }

  async function loadCheckout() {
    if (!payToken) {
      fail("No payment token provided.");
      return;
    }
    try {
      var response = await fetch(CHECKOUT_URL + "?token=" + encodeURIComponent(payToken));
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        fail(data.error || "Unable to load checkout.");
        return;
      }
      if (data.paid) {
        show("checkout-paid");
        return;
      }
      checkoutData = data;
      show("checkout-ready");
      if ($("checkout-reference")) {
        $("checkout-reference").textContent = "Reference: " + (data.secureReference || "—");
      }
      if ($("checkout-work-items") && data.workItems != null) {
        $("checkout-work-items").textContent = data.workItems.toLocaleString();
      }
      if ($("checkout-amount")) {
        $("checkout-amount").innerHTML = "<strong>" + (data.amountDisplay || "") + " " + (data.currency || "") + "</strong>";
      }
    } catch (error) {
      fail(error.message || "Unable to load checkout.");
    }
  }

  async function verifyPayment(paymentResponse) {
    var payload = {
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      name: checkoutData.buyerName || "Enterprise Customer",
      email: checkoutData.buyerEmail,
      sessionId: checkoutData.sessionId,
      enterprisePayToken: payToken,
    };
    var response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok || data.success !== true || !data.confirmationToken) {
      throw new Error(data.error || "Payment verification failed.");
    }
    window.location.href = SUCCESS_URL + "?confirmation=" + encodeURIComponent(data.confirmationToken);
  }

  function openRazorpay() {
    if (typeof Razorpay === "undefined") {
      var status = $("checkout-status");
      if (status) status.textContent = "Payment service is temporarily unavailable.";
      return;
    }
    if (!checkoutData || !checkoutData.orderId) return;
    var statusEl = $("checkout-status");
    if (statusEl) statusEl.textContent = "Opening secure checkout…";
    var rzp = new Razorpay({
      key: checkoutData.keyId,
      amount: checkoutData.amount,
      currency: checkoutData.currency,
      name: "AI Governance Hub",
      description: "Enterprise Assessment",
      order_id: checkoutData.orderId,
      prefill: {
        name: checkoutData.buyerName || "",
        email: checkoutData.buyerEmail || "",
      },
      handler: function (paymentResponse) {
        verifyPayment(paymentResponse).catch(function (error) {
          if (statusEl) statusEl.textContent = error.message;
        });
      },
      modal: {
        ondismiss: function () {
          if (statusEl) statusEl.textContent = "Checkout closed. You can retry when ready.";
        },
      },
    });
    rzp.open();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var payBtn = $("enterprise-pay-btn");
    if (payBtn) payBtn.addEventListener("click", openRazorpay);
    loadCheckout();
  });
})();
