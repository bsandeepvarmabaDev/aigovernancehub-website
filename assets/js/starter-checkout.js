/**
 * AI Governance Hub — Starter Launch Edition checkout (pricing.html only).
 * v16.4: order creation and payment verification via Vercel serverless APIs.
 * Never add Razorpay key_secret or Key ID constants to this file.
 */
(function () {
  "use strict";

  const CREATE_ORDER_URL = "/api/create-order";
  const VERIFY_PAYMENT_URL = "/api/verify-payment";
  const PRODUCT_NAME = "AI Governance Hub";
  const PRODUCT_DESCRIPTION = "Starter Launch Edition";
  const SUCCESS_URL = "starter-success.html";
  const PENDING_URL = "starter-pending.html";

  function getField(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
  }

  function getCheckoutDetails() {
    return {
      name: getField("starter-buyer-name"),
      email: getField("starter-buyer-email"),
      company: getField("starter-company"),
    };
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateCheckoutDetails(details) {
    if (!details.name) return "Please enter your name.";
    if (!details.email || !isValidEmail(details.email)) return "Please enter a valid email address.";
    
    return "";
  }

  function redirectTo(url) {
    window.location.href = url;
  }

  function setButtonsLoading(isLoading) {
    document.querySelectorAll("[data-starter-checkout]").forEach(function (btn) {
      btn.disabled = isLoading;
      if (isLoading) btn.setAttribute("aria-busy", "true");
      else btn.removeAttribute("aria-busy");
    });
  }

  function showSafeError(message) {
    window.alert(message || "Payment could not be completed. Please try again or contact support@aigovernancehub.ai.");
  }

  function handleFailure(message) {
    setButtonsLoading(false);
    showSafeError(message);
    redirectTo(PENDING_URL);
  }

  async function createOrder() {
    const response = await fetch(CREATE_ORDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json().catch(function () { return {}; });

    if (!response.ok) {
      throw new Error(data.error || "Unable to start checkout.");
    }

    if (!data || !data.keyId || !data.orderId || !data.amount || !data.currency) {
      throw new Error("Invalid checkout response from server.");
    }

    return data;
  }

  async function verifyPayment(paymentResponse, details) {
    const response = await fetch(VERIFY_PAYMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        name: details.name,
        email: details.email,
        company: details.company
      })
    });

    const data = await response.json().catch(function () { return {}; });

    if (!response.ok || data.success !== true) {
      throw new Error(data.error || "Payment verification failed.");
    }

    return data;
  }

  async function openCheckout() {
    if (typeof Razorpay === "undefined") {
      showSafeError("Payment service is temporarily unavailable. Please try again or contact support@aigovernancehub.ai.");
      return;
    }

    const details = getCheckoutDetails();
    const validationError = validateCheckoutDetails(details);

    if (validationError) {
      showSafeError(validationError);
      const form = document.getElementById("starter-checkout-form");
      if (form) form.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setButtonsLoading(true);

    let order;
    try {
      order = await createOrder();
    } catch (error) {
      handleFailure(error.message);
      return;
    }

    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: PRODUCT_NAME,
      description: PRODUCT_DESCRIPTION,
      order_id: order.orderId,
      prefill: {
        name: details.name,
        email: details.email
      },
      handler: function (paymentResponse) {
        verifyPayment(paymentResponse, details)
          .then(function () {
            redirectTo(SUCCESS_URL);
          })
          .catch(function (error) {
            handleFailure(error.message);
          });
      },
      modal: {
        ondismiss: function () {
          handleFailure("Payment was not completed.");
        }
      },
      theme: { color: "#2563eb" }
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function () {
      handleFailure("Payment could not be completed.");
    });

    rzp.open();
  }

  function bindCheckoutButtons() {
    document.querySelectorAll("[data-starter-checkout]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        openCheckout();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindCheckoutButtons);
  } else {
    bindCheckoutButtons();
  }
})();
