/**
 * AI Governance Hub — Product walkthrough video (feature-flagged).
 *
 * LIVE as of the 90-second walkthrough recorded for v25.13.
 * The pricing page CSP frame-src already trusts youtube.com / youtube-nocookie.com.
 *
 * If this ever needs to be pulled: set VIDEO_WALKTHROUGH_ENABLED = false or clear
 * VIDEO_URL — the entire section hides again with no "coming soon", no placeholder,
 * no empty frame ever shown.
 */
(function () {
  "use strict";

  var VIDEO_WALKTHROUGH_ENABLED = true;
  var VIDEO_URL = "https://www.youtube-nocookie.com/embed/DV52OlF6w1s";
  var VIDEO_TITLE = "AI Governance Hub — 90-second product walkthrough";

  var section = document.querySelector("[data-video-walkthrough]");
  if (!section) return;

  // Hide the whole section unless explicitly enabled AND a real URL is set.
  if (!VIDEO_WALKTHROUGH_ENABLED || !VIDEO_URL) {
    section.hidden = true;
    return;
  }

  var frame = section.querySelector("[data-video-frame]");
  if (!frame) {
    section.hidden = true;
    return;
  }

  var iframe = document.createElement("iframe");
  iframe.src = VIDEO_URL;
  iframe.title = VIDEO_TITLE;
  iframe.loading = "lazy";
  iframe.width = "560";
  iframe.height = "315";
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute(
    "allow",
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
  );
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  frame.appendChild(iframe);

  section.hidden = false;
})();
