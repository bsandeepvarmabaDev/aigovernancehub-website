/**
 * AI Governance Hub — dynamic pricing v18.0
 */
(function () {
  "use strict";

  function updatePriceElements(pricing) {
    document.querySelectorAll("[data-pricing-display]").forEach(function (el) {
      el.textContent = pricing.amountDisplay;
    });
    document.querySelectorAll("[data-pricing-note]").forEach(function (el) {
      el.textContent = pricing.note;
    });
    document.querySelectorAll("[data-checkout-price]").forEach(function (el) {
      el.textContent = pricing.checkoutAmountDisplay;
    });
    document.querySelectorAll("[data-starter-checkout]").forEach(function (btn) {
      if (btn.disabled) {
        btn.textContent = "Unlock Full Report — " + pricing.checkoutAmountDisplay;
      }
    });
  }

  fetch("/api/pricing")
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (data && data.selected) {
        updatePriceElements(data.selected);
      }
    })
    .catch(function () {});
})();
