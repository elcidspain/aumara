/* AUMARA spatial bootstrap.
 * Loads the hybrid flight runtime after the page Cesium path is defined.
 * Never print or commit runtime credentials.
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
    var flightButton = document.getElementById("flight");
    if (flightButton) {
      flightButton.onclick = function () {
        window.__AUMARA_PENDING_FLIGHT = true;
      };
    }
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
var aumaraGoogleMapsKey = "";

async function loadAumaraIonRuntimeConfig() {
  var controller = typeof AbortController === "function" ? new AbortController() : null;
  var timer = controller ? setTimeout(function () { controller.abort(); }, 4000) : null;
  try {
    var response = await fetch("/api/spatial-config", {
      cache: "no-store",
      signal: controller ? controller.signal : undefined,
    });
    if (!response.ok) return false;
    var data = await response.json();
    var ion = data && data.cesiumIon ? data.cesiumIon : null;
    var googleMaps = data && data.googleMaps ? data.googleMaps : null;
    if (ion && ion.configured && typeof ion.token === "string" && ion.token.trim()) {
      aumaraRuntimeIonToken = ion.token.trim();
    }
    if (googleMaps && googleMaps.configured && typeof googleMaps.key === "string" && googleMaps.key.trim()) {
      aumaraGoogleMapsKey = googleMaps.key.trim();
    }
    window.__AUMARA_ION_STATUS = {
      ionConfigured: Boolean(aumaraRuntimeIonToken),
      googleMapsConfigured: Boolean(aumaraGoogleMapsKey),
    };
    return Boolean(aumaraRuntimeIonToken || aumaraGoogleMapsKey);
  } catch (e) {
    window.__AUMARA_ION_STATUS = { ionConfigured: false, googleMapsConfigured: false };
    return false;
  } finally {
    if (timer) clearTimeout(timer);
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
    if (aumaraGoogleMapsKey && C && C.GoogleMaps) {
      C.GoogleMaps.defaultApiKey = aumaraGoogleMapsKey;
      return true;
    }
    if (C && C.Cesium3DTileset && C.Cesium3DTileset.fromIonAssetId) {
      var assetId = this.asset;
      C.createGooglePhotorealistic3DTileset = function () {
        return C.Cesium3DTileset.fromIonAssetId(assetId);
      };
    }
    return !!(token && C && C.Ion);
  },
};
