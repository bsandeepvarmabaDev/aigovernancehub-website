/**
 * AI Governance Hub — analytics client v18.0
 */
(function () {
  "use strict";
  window.AGHAnalytics = {
    track: function (event, metadata) {
      fetch("/api/analytics-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: event, metadata: metadata || {} }),
        keepalive: true,
      }).catch(function () {});
    },
  };
})();
