/**
 * Citizen embed loader — include after a mount point:
 *
 * <div id="citizen-widget" data-market-id="covid19"></div>
 * <script src="https://www.thecitizen.io/widget.js" async></script>
 *
 * Optional: data-base-url, data-ref, data-theme (light|dark), data-min-height, data-height, data-title
 * Multiple widgets: add data-citizen-widget to any element with data-market-id
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

  /**
   * @param {HTMLElement} el
   * @param {{ marketId?: string | null, baseUrl?: string | null, ref?: string | null, theme?: string | null, minHeight?: string | null, height?: string | null, title?: string | null }} opts
   */
  function mount(el, opts) {
    var marketId = opts.marketId;
    if (!marketId) {
      console.warn(
        "[Citizen widget] Missing data-market-id on container (e.g. <div id=\"citizen-widget\" data-market-id=\"covid19\">)."
      );
      return;
    }

    var base = (opts.baseUrl || getDefaultBaseUrl()).replace(/\/$/, "");
    var url =
      base +
      "/markets/" +
      encodeURIComponent(marketId) +
      "?embed=1";
    if (opts.ref) {
      url += "&ref=" + encodeURIComponent(opts.ref);
    }
    if (opts.theme === "dark" || opts.theme === "light") {
      url += "&theme=" + encodeURIComponent(opts.theme);
    }

    var iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.title = opts.title || "Citizen — " + marketId;
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.minHeight = opts.minHeight || "720px";
    if (opts.height) {
      iframe.style.height = opts.height;
    }
    // WebAuthn / passkeys (e.g. Thirdweb sign-in) require delegation in cross-origin iframes.
    // Parent page should also send Permissions-Policy allowing Citizen’s origin — see partner docs.
    iframe.setAttribute(
      "allow",
      "clipboard-write; publickey-credentials-get *; publickey-credentials-create *"
    );
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    el.appendChild(iframe);
  }

  /**
   * @param {HTMLElement} el
   */
  function readOptions(el) {
    return {
      marketId: el.getAttribute("data-market-id"),
      baseUrl: el.getAttribute("data-base-url"),
      ref: el.getAttribute("data-ref"),
      theme: el.getAttribute("data-theme"),
      minHeight: el.getAttribute("data-min-height"),
      height: el.getAttribute("data-height"),
      title: el.getAttribute("data-title"),
    };
  }

  function init() {
    var nodes = document.querySelectorAll("#citizen-widget, [data-citizen-widget]");
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
