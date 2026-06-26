/**
 * AI Governance Hub — Starter Launch Edition checkout (pricing.html only).
 * TODO: Replace placeholder with Razorpay Key ID only. Never add key_secret to frontend.
 */
(function () {
  "use strict";

  const RAZORPAY_KEY_ID = "RZP_KEY_ID_PLACEHOLDER";
  const STARTER_AMOUNT_PAISE = 49900;
  const CURRENCY = "INR";
  const PRODUCT_NAME = "AI Governance Hub";
  const PRODUCT_DESCRIPTION = "Starter Launch Edition — 30 days";
  const SUCCESS_URL = "starter-success.html";
  const PENDING_URL = "starter-pending.html";

  function getPrefill() {
    const nameInput = document.getElementById("starter-buyer-name");
    const emailInput = document.getElementById("starter-buyer-email");
    const prefill = {};

    if (nameInput && nameInput.value.trim()) {
      prefill.name = nameInput.value.trim();
    }
    if (emailInput && emailInput.value.trim()) {
      prefill.email = emailInput.value.trim();
    }

    return Object.keys(prefill).length ? prefill : undefined;
  }

  function redirectTo(url) {
    window.location.href = url;
  }

  function openCheckout(trigger) {
    if (typeof Razorpay === "undefined") {
      alert("Payment service is temporarily unavailable. Please try again or contact support@aigovernancehub.ai.");
      return;
    }

    if (RAZORPAY_KEY_ID === "RZP_KEY_ID_PLACEHOLDER") {
      alert("Checkout is not yet configured. Please contact support@aigovernancehub.ai to complete your Starter purchase.");
      return;
    }

    const buttons = document.querySelectorAll("[data-starter-checkout]");
    buttons.forEach(function (btn) {
      btn.disabled = true;
    });
    if (trigger) {
      trigger.setAttribute("aria-busy", "true");
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: STARTER_AMOUNT_PAISE,
      currency: CURRENCY,
      name: PRODUCT_NAME,
      description: PRODUCT_DESCRIPTION,
      handler: function () {
        redirectTo(SUCCESS_URL);
      },
      modal: {
        ondismiss: function () {
          redirectTo(PENDING_URL);
        },
      },
      theme: {
        color: "#2563eb",
      },
    };

    const prefill = getPrefill();
    if (prefill) {
      options.prefill = prefill;
    }

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", function () {
      redirectTo(PENDING_URL);
    });

    rzp.open();

    buttons.forEach(function (btn) {
      btn.disabled = false;
    });
    if (trigger) {
      trigger.removeAttribute("aria-busy");
    }
  }

  function bindCheckoutButtons() {
    document.querySelectorAll("[data-starter-checkout]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        openCheckout(button);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindCheckoutButtons);
  } else {
    bindCheckoutButtons();
  }
})();
