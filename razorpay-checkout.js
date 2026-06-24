/* AI Governance Hub Website v16.0.1 - Razorpay Checkout Helper
   Public frontend only. Do not place Razorpay key_secret in this file.
   For production fulfilment, configure backend endpoints to create orders and verify signatures. */
(function () {
  "use strict";

  const CONFIG = {
    keyId: "rzp_test_REPLACE_WITH_YOUR_KEY_ID",
    brandName: "AI Governance Hub",
    brandLogo: "https://aigovernancehub.ai/app-logo-512.png",
    supportEmail: "support@aigovernancehub.ai",

    // Recommended production flow:
    // 1. POST createOrderEndpoint with { planId, amount, currency, customer }
    // 2. Open Razorpay Checkout with returned order_id
    // 3. POST verifyEndpoint with razorpay_order_id/payment_id/signature
    createOrderEndpoint: "",
    verifyEndpoint: "",

    // Static-site fallback while backend verification is not deployed.
    paymentLinks: {
      assessment: "https://razorpay.me/@balthisandeep?amount=CVDUr6Uxp2FOGZGwAHntNg%3D%3D",
      professional: "",
      enterprise: ""
    }
  };

  const PLANS = {
    assessment: {
      name: "AI Governance Assessment Report",
      amount: 9900,
      displayAmount: "₹99",
      description: "Instant browser-generated AI Governance PDF report"
    },
    professional: {
      name: "Professional Governance Review",
      amount: 29900,
      displayAmount: "₹299",
      description: "Detailed governance review and 30-day action plan"
    },
    enterprise: {
      name: "Enterprise Governance Review",
      amount: 99900,
      displayAmount: "₹999",
      description: "Executive governance review and audit-readiness recommendations"
    }
  };

  function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
  }

  function getCustomer() {
    return {
      name: getValue("assessmentName") || localStorage.getItem("aghCustomerName") || "",
      email: getValue("assessmentEmail") || localStorage.getItem("aghCustomerEmail") || "",
      company: getValue("assessmentCompany") || localStorage.getItem("aghCustomerCompany") || "",
      contact: ""
    };
  }

  function rememberPendingPayment(planId) {
    const payload = {
      planId,
      planName: PLANS[planId]?.name || planId,
      amount: PLANS[planId]?.displayAmount || "",
      startedAt: new Date().toISOString(),
      customer: getCustomer()
    };
    localStorage.setItem("aghPendingPayment", JSON.stringify(payload));
    localStorage.setItem("aghPaymentStarted", payload.startedAt);
  }

  function markPaid(planId, payment) {
    localStorage.setItem("aghPaymentStatus", "paid");
    localStorage.setItem("aghPaidPlan", planId);
    localStorage.setItem("aghLastPayment", JSON.stringify({
      planId,
      planName: PLANS[planId]?.name || planId,
      amount: PLANS[planId]?.displayAmount || "",
      payment,
      completedAt: new Date().toISOString()
    }));
  }

  function setButtonBusy(button, busy) {
    if (!button) return;
    button.disabled = !!busy;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = "Opening secure payment...";
    } else if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }

  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
      document.head.appendChild(script);
    });
  }

  async function createOrder(planId, customer) {
    const plan = PLANS[planId];
    const response = await fetch(CONFIG.createOrderEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, amount: plan.amount, currency: "INR", customer })
    });
    if (!response.ok) throw new Error("Unable to create Razorpay order.");
    return response.json();
  }

  async function verifyPayment(planId, response) {
    if (!CONFIG.verifyEndpoint) {
      markPaid(planId, response);
      window.location.href = `thank-you.html?plan=${encodeURIComponent(planId)}&payment_id=${encodeURIComponent(response.razorpay_payment_id || "")}`;
      return;
    }

    const verifyResponse = await fetch(CONFIG.verifyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, ...response })
    });

    if (!verifyResponse.ok) throw new Error("Payment verification failed.");
    const result = await verifyResponse.json();
    if (!result.verified) throw new Error("Payment signature could not be verified.");

    markPaid(planId, response);
    window.location.href = `thank-you.html?plan=${encodeURIComponent(planId)}&payment_id=${encodeURIComponent(response.razorpay_payment_id || "")}`;
  }

  function fallbackToPaymentLink(planId) {
    const link = CONFIG.paymentLinks[planId];
    rememberPendingPayment(planId);

    if (link) {
      window.location.href = link;
      return;
    }

    const subject = encodeURIComponent(`${PLANS[planId]?.name || "AI Governance Hub"} payment request`);
    const body = encodeURIComponent(`Hi AI Governance Hub team,\n\nI want to purchase ${PLANS[planId]?.name || planId} (${PLANS[planId]?.displayAmount || ""}).\n\nPlease share the Razorpay payment link.\n`);
    window.location.href = `mailto:sales@aigovernancehub.ai?subject=${subject}&body=${body}`;
  }

  async function startPayment(planId, button) {
    const plan = PLANS[planId] || PLANS.assessment;
    rememberPendingPayment(planId);
    setButtonBusy(button, true);

    try {
      const hasBackend = CONFIG.createOrderEndpoint && CONFIG.keyId && !CONFIG.keyId.includes("REPLACE_WITH");
      if (!hasBackend) {
        fallbackToPaymentLink(planId);
        return;
      }

      const customer = getCustomer();
      const order = await createOrder(planId, customer);
      await loadRazorpayScript();

      const options = {
        key: order.keyId || CONFIG.keyId,
        amount: order.amount || plan.amount,
        currency: order.currency || "INR",
        name: CONFIG.brandName,
        description: plan.description,
        image: CONFIG.brandLogo,
        order_id: order.orderId,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.contact
        },
        notes: {
          planId,
          company: customer.company,
          source: "aigovernancehub.ai"
        },
        theme: { color: "#2563eb" },
        handler: async function (response) {
          try {
            await verifyPayment(planId, response);
          } catch (error) {
            alert(error.message || "Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: function () {
            window.location.href = `payment-pending.html?plan=${encodeURIComponent(planId)}`;
          }
        }
      };

      const checkout = new window.Razorpay(options);
      checkout.open();
    } catch (error) {
      console.error("AI Governance Hub Razorpay error:", error);
      alert(error.message || "Unable to start payment. Please try again or contact support.");
    } finally {
      setButtonBusy(button, false);
    }
  }

  window.startAghRazorpayPayment = function (planId, event) {
    if (event && event.preventDefault) event.preventDefault();
    startPayment(planId || "assessment", event ? event.currentTarget : null);
    return false;
  };

  window.markPaymentStarted = function () {
    rememberPendingPayment("assessment");
  };
})();
