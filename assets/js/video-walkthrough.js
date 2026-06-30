/**
 * AI Governance Hub — Product walkthrough video (feature-flagged).
 *
 * To go live with the real 60–90s walkthrough:
 *   1. Set VIDEO_WALKTHROUGH_ENABLED = true
 *   2. Set VIDEO_URL to the embed URL, e.g.
 *        "https://www.youtube-nocookie.com/embed/VIDEO_ID"
 *   The pricing page CSP frame-src already trusts youtube.com / youtube-nocookie.com.
 *
 * While disabled (or with an empty URL) the entire section is hidden — no
 * "coming soon", no placeholder, no empty frame is ever shown.
 */
(function () {
  "use strict";

  var VIDEO_WALKTHROUGH_ENABLED = false;
  var VIDEO_URL = ""; // e.g. "https://www.youtube-nocookie.com/embed/VIDEO_ID"
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
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  );
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  frame.appendChild(iframe);

  section.hidden = false;
})();
