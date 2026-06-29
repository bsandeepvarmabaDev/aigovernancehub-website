/**
 * AI Governance Hub — login / magic link v23.0
 */
(function () {
  "use strict";

  function ux() {
    return window.AGHUX || null;
  }

  function setStatus(msg, isError) {
    var el = document.getElementById("login-status");
    if (!el) return;
    var api = ux();
    if (api) {
      api.setStatusEl(el, msg, isError ? "error" : msg ? "success" : "loading");
      return;
    }
    el.textContent = msg || "";
    el.classList.toggle("starter-upload-error", Boolean(isError));
  }

  function verifyTokenFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get("token");
    var redirect = params.get("redirect") || "/dashboard.html";
    if (!token) return;

    setStatus("Verifying your secure sign-in link…", false);
    fetch("/api/auth-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token: token }),
    })
      .then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok, data: d };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.authenticated) {
          setStatus("Sign-in successful. Opening My Reports…", false);
          window.location.href = redirect;
          return;
        }
        setStatus((result.data && result.data.error) || "This sign-in link is no longer valid.", true);
      })
      .catch(function () {
        setStatus("We could not complete sign-in. Request a new link below.", true);
      });
  }

  function bindForm() {
    var form = document.getElementById("login-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("login-email").value.trim();
      var btn = form.querySelector('button[type="submit"]');
      var api = ux();
      if (api) api.setBusy(btn, true, "Sending…");
      setStatus("Sending your secure sign-in link…", false);
      fetch("/api/auth-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, redirect: "/dashboard.html" }),
      })
        .then(function (r) {
          return r.json().then(function (d) {
            return { ok: r.ok, data: d };
          });
        })
        .then(function (result) {
          if (!result.ok) throw new Error((result.data && result.data.error) || "We could not send the sign-in link.");
          var deliveryFailed = result.data.emailDeliveryAvailable === false;
          var msg = deliveryFailed
            ? (result.data.message ||
                "Email sign-in is temporarily unavailable. Use Recover My Report after purchase, or contact support@aigovernancehub.ai.")
            : (result.data.message ||
                "Check your inbox for a secure sign-in link. It expires in 15 minutes.");
          setStatus(msg, deliveryFailed);
        })
        .catch(function (err) {
          setStatus(err.message, true);
        })
        .finally(function () {
          if (api) api.setBusy(btn, false);
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindForm();
      verifyTokenFromUrl();
    });
  } else {
    bindForm();
    verifyTokenFromUrl();
  }
})();
