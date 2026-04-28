/**
 * Citizen homepage preview — same implementation as `widget-card.js`.
 *
 * Partners who want a filename that reads like “homepage widget” can load:
 *   /widget-homepage.js
 */
(function () {
  "use strict";

  function getDefaultBaseUrl() {
    var cur = document.currentScript;
    if (cur && cur.src) {
      try {
        return new URL(cur.src).origin;
      } catch (e) {
        /* ignore */
      }
    }
    return "https://www.thecitizen.io";
  }

  function isLoopbackCitizenOrigin(origin) {
    try {
      var u = new URL(origin);
      var h = (u.hostname || "").toLowerCase();
      return h === "localhost" || h === "127.0.0.1";
    } catch (e) {
      return false;
    }
  }

  function pickApiBaseUrl(citizenOrigin, explicit) {
    if (explicit) return explicit;
    if (isLoopbackCitizenOrigin(citizenOrigin)) return "https://www.thecitizen.io";
    return "";
  }

  /**
   * @param {HTMLElement} el
   */
  function readOptions(el) {
    return {
      marketId: el.getAttribute("data-market-id"),
      baseUrl: el.getAttribute("data-base-url"),
      apiBaseUrl: el.getAttribute("data-api-base-url"),
      theme: el.getAttribute("data-theme"),
      minHeight: el.getAttribute("data-min-height"),
      height: el.getAttribute("data-height"),
      title: el.getAttribute("data-title"),
      clickUrl: el.getAttribute("data-click-url"),
    };
  }

  /**
   * @param {HTMLElement} el
   * @param {{ marketId?: string|null, baseUrl?: string|null, apiBaseUrl?: string|null, theme?: string|null, minHeight?: string|null, height?: string|null, title?: string|null, clickUrl?: string|null }} opts
   */
  function mount(el, opts) {
    var marketId = opts.marketId;
    if (!marketId) {
      console.warn(
        '[Citizen market card] Missing data-market-id (e.g. data-market-id="covid19").'
      );
      return;
    }
    if (!opts.clickUrl) {
      console.warn(
        "[Citizen market card] Missing data-click-url (partner full-page URL for this market)."
      );
      return;
    }

    var base = (opts.baseUrl || getDefaultBaseUrl()).replace(/\/$/, "");
    var apiBase = (opts.apiBaseUrl || "").trim().replace(/\/$/, "");
    apiBase = pickApiBaseUrl(base, apiBase);

    var url = base + "/embed/market-card/" + encodeURIComponent(marketId) + "?embed=1";
    if (opts.theme === "dark" || opts.theme === "light") {
      url += "&theme=" + encodeURIComponent(opts.theme);
    }
    if (apiBase) {
      url += "&apiBase=" + encodeURIComponent(apiBase);
    }

    var computed = window.getComputedStyle(el);
    if (computed.position === "static") {
      el.style.position = "relative";
    }
    if (!el.style.display) el.style.display = "block";

    var iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.title = opts.title || "Citizen — " + marketId;
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.minHeight = opts.minHeight || "240px";
    if (opts.height) {
      iframe.style.height = opts.height;
    }
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    var a = document.createElement("a");
    a.href = opts.clickUrl;
    a.target = "_top";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", "Open full market");
    a.style.position = "absolute";
    a.style.inset = "0";
    a.style.zIndex = "2";
    a.style.cursor = "pointer";
    a.style.background = "transparent";
    a.style.outline = "none";

    el.appendChild(iframe);
    el.appendChild(a);
  }

  function init() {
    var nodes = document.querySelectorAll(
      "#citizen-market-card, [data-citizen-market-card]"
    );
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute("data-citizen-mounted") === "1") continue;
      el.setAttribute("data-citizen-mounted", "1");
      mount(el, readOptions(el));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
