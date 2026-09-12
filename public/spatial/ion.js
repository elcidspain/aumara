/* AUMARA spatial bootstrap.
 * Loads the hybrid flight runtime after the page Cesium path is defined.
 * Never print or commit Ion tokens.
 */
(function () {
  var autoFlight = location.hash === "#flight";
  if (autoFlight) {
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  }
  window.__AUMARA_AUTO_FLIGHT = autoFlight;

  try {
    var u = new URL(location.href);
    if (u.searchParams.has("ion")) {
      u.searchParams.delete("ion");
      history.replaceState(null, "", u.pathname + (u.search || ""));
    }
  } catch (e) {}

  window.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector('script[data-aumara-local-flight="1"]')) return;
    var script = document.createElement("script");
    script.src = "./flight-runtime.js";
    script.defer = true;
    script.dataset.aumaraLocalFlight = "1";
    script.onerror = function () {
      document.documentElement.dataset.aumaraFlightRuntime = "load-error";
    };
    document.body.appendChild(script);
  }, { once: true });
})();

window.AUMARA_ION = {
  asset: 2275207,
  resolve: function () {
    try { return localStorage.getItem("CESIUM_ION_TOKEN") || ""; } catch (e) { return ""; }
  },
  apply: function (C) {
    var token = this.resolve();
    if (token && C && C.Ion) C.Ion.defaultAccessToken = token;
    return !!(token && C && C.Ion);
  },
};
