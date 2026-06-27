/**
 * AI Governance Hub — Starter Report checkout (pricing.html only).
 * v18.0: Upload → Preview → Pay → Download Report (commercial launch).
 * Never add Razorpay key_secret or Key ID constants to this file.
 */
(function () {
  "use strict";

  function track(event, metadata) {
    if (window.AGHAnalytics && typeof window.AGHAnalytics.track === "function") {
      window.AGHAnalytics.track(event, metadata);
    }
  }

  const UPLOAD_URL = "/api/upload-report";
  const PREVIEW_URL = "/api/generate-preview";
  const CREATE_ORDER_URL = "/api/create-order";
  const VERIFY_PAYMENT_URL = "/api/verify-payment";
  const DOWNLOAD_URL = "/api/download-report";
  const PRODUCT_NAME = "AI Governance Hub";
  const PRODUCT_DESCRIPTION = "Executive AI Governance Assessment — Introductory Offer";
  const SUCCESS_URL = "starter-success.html";
  const PENDING_URL = "starter-pending.html";
  const ALLOWED_EXTENSIONS = [".csv", ".txt", ".tsv", ".xlsx", ".xls"];

  let uploadSession = null;

  function getField(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
  }

  function getCheckoutDetails() {
    const details = {
      name: getField("starter-buyer-name"),
      email: getField("starter-buyer-email"),
    };

    const company = getField("starter-buyer-company");
    if (company) {
      details.company = company;
    }

    return details;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateCheckoutDetails(details) {
    if (!details.name) {
      return "Please enter your name.";
    }
    if (!details.email || !isValidEmail(details.email)) {
      return "Please enter a valid email address.";
    }
    return "";
  }

  function isValidOrder(order) {
    return (
      order &&
      typeof order.keyId === "string" &&
      order.keyId.length > 0 &&
      typeof order.orderId === "string" &&
      order.orderId.length > 0 &&
      typeof order.amount === "number" &&
      order.amount > 0 &&
      typeof order.currency === "string" &&
      order.currency.length > 0
    );
  }

  function hasValidUploadSession() {
    return (
      uploadSession &&
      typeof uploadSession.sessionId === "string" &&
      typeof uploadSession.sessionToken === "string" &&
      uploadSession.preview
    );
  }

  function scrollToCheckoutForm() {
    const form = document.getElementById("starter-checkout-form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function redirectTo(url) {
    window.location.href = url;
  }

  function redirectToSuccess(confirmationToken) {
    const params = new URLSearchParams({ confirmation: confirmationToken });
    redirectTo(`${SUCCESS_URL}?${params.toString()}`);
  }

  function setButtonsLoading(isLoading) {
    document.querySelectorAll("[data-starter-checkout]").forEach(function (btn) {
      btn.disabled = isLoading;
      if (isLoading) {
        btn.setAttribute("aria-busy", "true");
      } else {
        btn.removeAttribute("aria-busy");
      }
    });
  }

  function setUploadLoading(isLoading) {
    const uploadBtn = document.getElementById("starter-upload-btn");
    if (uploadBtn) {
      uploadBtn.disabled = isLoading;
      uploadBtn.setAttribute("aria-busy", String(isLoading));
    }
  }

  function showSafeError(message) {
    window.alert(
      message || "Something went wrong. Please try again or contact support@aigovernancehub.ai."
    );
  }

  function setUploadStatus(message, isError) {
    const status = document.getElementById("starter-upload-status");
    if (!status) {
      return;
    }
    status.textContent = message || "";
    status.classList.toggle("starter-upload-error", Boolean(isError));
  }

  function renderPreview(preview) {
    const panel = document.getElementById("starter-preview-panel");
    if (!panel || !preview) {
      return;
    }

    document.getElementById("preview-total-records").textContent = String(preview.totalRecords);
    document.getElementById("preview-ai-related-count").textContent = String(preview.aiCandidates);
    document.getElementById("preview-risk-high").textContent = String(preview.riskSummary.high);
    document.getElementById("preview-risk-medium").textContent = String(preview.riskSummary.medium);
    document.getElementById("preview-risk-low").textContent = String(preview.riskSummary.low);
    document.getElementById("preview-governance-score").textContent = `${preview.governanceScore}%`;
    document.getElementById("preview-governance-rating").textContent = preview.governanceRating;

    panel.hidden = false;

    const unlockBtn = document.querySelector("[data-starter-checkout]");
    if (unlockBtn) {
      const checkoutPrice = document.querySelector("[data-checkout-price]");
      const priceLabel = checkoutPrice ? checkoutPrice.textContent : "₹199";
      unlockBtn.textContent = "Unlock Full Report — " + priceLabel;
      unlockBtn.disabled = false;
    }
    track("preview_viewed");
  }

  function hidePreview() {
    const panel = document.getElementById("starter-preview-panel");
    if (panel) {
      panel.hidden = true;
    }
  }

  function handleFailure(message) {
    setButtonsLoading(false);
    showSafeError(message);
    redirectTo(PENDING_URL);
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Unable to read file."));
          return;
        }
        const base64 = result.split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = function () {
        reject(new Error("Unable to read file."));
      };
      reader.readAsDataURL(file);
    });
  }

  function validateSelectedFile(file) {
    if (!file) {
      return "Choose a CSV, TSV, TXT, or Excel export file.";
    }

    const lower = file.name.toLowerCase();
    const allowed = ALLOWED_EXTENSIONS.some(function (ext) {
      return lower.endsWith(ext);
    });

    if (!allowed) {
      return "Upload a CSV, TSV, TXT, or Excel export file.";
    }

    if (file.size <= 0) {
      return "The selected file is empty.";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "File exceeds the 5 MB limit.";
    }

    return "";
  }

  async function uploadReportFile(file) {
    const validationError = validateSelectedFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const contentBase64 = await readFileAsBase64(file);

    const response = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        contentBase64,
      }),
    });

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(data.error || "Upload failed.");
    }

    if (!data.sessionId || !data.sessionToken || !data.preview) {
      throw new Error("Invalid upload response from server.");
    }

    return data;
  }

  async function refreshPreview() {
    if (!hasValidUploadSession()) {
      return;
    }

    const response = await fetch(PREVIEW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionToken: uploadSession.sessionToken,
      }),
    });

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok || !data.preview) {
      uploadSession = null;
      hidePreview();
      throw new Error(data.error || "Preview expired. Upload your file again.");
    }

    uploadSession.preview = data.preview;
    renderPreview(data.preview);
  }

  async function handleFileSelected(event) {
    const input = event.target;
    const file = input.files && input.files[0];

    if (!file) {
      return;
    }

    setUploadLoading(true);
    setUploadStatus("Uploading and validating file…", false);
    uploadSession = null;
    hidePreview();

    try {
      const result = await uploadReportFile(file);
      uploadSession = {
        sessionId: result.sessionId,
        sessionToken: result.sessionToken,
        preview: result.preview,
        filename: file.name,
      };
      renderPreview(result.preview);
      setUploadStatus(`Uploaded ${file.name}. Preview ready — full report locked until payment.`, false);
      track("upload_completed", { filename: file.name });
      scrollToCheckoutForm();
    } catch (error) {
      setUploadStatus(error.message || "Upload failed.", true);
      showSafeError(error.message);
    } finally {
      setUploadLoading(false);
      input.value = "";
    }
  }

  async function createOrder() {
    const response = await fetch(CREATE_ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: uploadSession.sessionId,
        sessionToken: uploadSession.sessionToken,
      }),
    });

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(data.error || "Unable to start checkout.");
    }

    if (!isValidOrder(data)) {
      throw new Error("Invalid checkout response from server.");
    }

    return data;
  }

  async function verifyPayment(paymentResponse, details) {
    const payload = {
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      name: details.name,
      email: details.email,
      sessionId: uploadSession.sessionId,
      sessionToken: uploadSession.sessionToken,
    };

    if (details.company) {
      payload.company = details.company;
    }

    const response = await fetch(VERIFY_PAYMENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok || data.success !== true || !data.confirmationToken) {
      throw new Error(data.error || "Payment verification failed.");
    }

    return data;
  }

  async function openCheckout() {
    if (typeof Razorpay === "undefined") {
      showSafeError(
        "Payment service is temporarily unavailable. Please try again or contact support@aigovernancehub.ai."
      );
      return;
    }

    if (!hasValidUploadSession()) {
      showSafeError("Upload your CSV/Excel/Jira export and review the preview before payment.");
      scrollToCheckoutForm();
      return;
    }

    const details = getCheckoutDetails();
    const validationError = validateCheckoutDetails(details);

    if (validationError) {
      showSafeError(validationError);
      scrollToCheckoutForm();
      return;
    }

    setButtonsLoading(true);

    let order;

    try {
      await refreshPreview();
      order = await createOrder();
      track("checkout_started");
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
        email: details.email,
      },
      handler: function (paymentResponse) {
        track("payment_submitted");
        verifyPayment(paymentResponse, details)
          .then(function (result) {
            redirectToSuccess(result.confirmationToken);
          })
          .catch(function (error) {
            handleFailure(error.message);
          });
      },
      modal: {
        ondismiss: function () {
          handleFailure("Payment was not completed.");
        },
      },
      theme: {
        color: "#2563eb",
      },
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function () {
      handleFailure("Payment could not be completed.");
    });

    rzp.open();
    setButtonsLoading(false);
  }

  function bindCheckoutButtons() {
    document.querySelectorAll("[data-starter-scroll-checkout]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        scrollToCheckoutForm();
      });
    });

    document.querySelectorAll("[data-starter-checkout]").forEach(function (button) {
      button.disabled = true;
      const checkoutPrice = document.querySelector("[data-checkout-price]");
      const priceLabel = checkoutPrice ? checkoutPrice.textContent : "₹199";
      button.textContent = "Unlock Full Report — " + priceLabel;
      button.addEventListener("click", function (event) {
        event.preventDefault();
        openCheckout();
      });
    });

    const fileInput = document.getElementById("starter-report-file");
    if (fileInput) {
      fileInput.addEventListener("change", handleFileSelected);
    }

    const uploadBtn = document.getElementById("starter-upload-btn");
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", function () {
        fileInput.click();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindCheckoutButtons);
  } else {
    bindCheckoutButtons();
  }
})();
