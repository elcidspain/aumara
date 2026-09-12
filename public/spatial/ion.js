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

var aumaraRuntimeIonToken = "";

async function loadAumaraIonRuntimeConfig() {
  try {
    var response = await fetch("/api/spatial-config", { cache: "no-store" });
    if (!response.ok) return false;
    var data = await response.json();
    var ion = data && data.cesiumIon ? data.cesiumIon : null;
    if (ion && ion.configured && typeof ion.token === "string" && ion.token.trim()) {
      aumaraRuntimeIonToken = ion.token.trim();
    }
    window.__AUMARA_ION_STATUS = {
      publicConfigured: Boolean(ion && ion.configured),
      privateConfigured: Boolean(ion && ion.privateConfigured),
    };
    return Boolean(aumaraRuntimeIonToken);
  } catch (e) {
    window.__AUMARA_ION_STATUS = { publicConfigured: false, privateConfigured: false };
    return false;
  }
}

window.AUMARA_ION = {
  asset: 2275207,
  ready: loadAumaraIonRuntimeConfig(),
  resolve: function () {
    if (aumaraRuntimeIonToken) return aumaraRuntimeIonToken;
    try { return localStorage.getItem("CESIUM_ION_TOKEN") || ""; } catch (e) { return ""; }
  },
  apply: function (C) {
    var token = this.resolve();
    if (token && C && C.Ion) C.Ion.defaultAccessToken = token;
    if (C && C.Cesium3DTileset && C.Cesium3DTileset.fromIonAssetId) {
      var assetId = this.asset;
      C.createGooglePhotorealistic3DTileset = function () {
        return C.Cesium3DTileset.fromIonAssetId(assetId);
      };
    }
    return !!(token && C && C.Ion);
  },
};
