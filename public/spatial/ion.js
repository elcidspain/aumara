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

function instrumentVisibleTileset(tileset) {
  try {
    if (tileset && tileset.tileVisible && typeof tileset.tileVisible.addEventListener === "function") {
      tileset.tileVisible.addEventListener(function () {
        window.__AUMARA_GOOGLE_TILE_VISIBLE = true;
        if (window.__AUMARA) {
          window.__AUMARA.firstGoogleTileRendered = true;
          window.__AUMARA.googleTileVisibleObserved = true;
          window.__AUMARA.globalTilesStatus = "READY";
        }
      });
    }
  } catch (e) {}
  return tileset;
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
    var assetId = this.asset;
    var hasGoogleKey = !!(aumaraGoogleMapsKey && C && C.GoogleMaps);
    var hasIon = !!(token && C && C.Ion);
    if (hasIon) C.Ion.defaultAccessToken = token;
    if (hasGoogleKey) C.GoogleMaps.defaultApiKey = aumaraGoogleMapsKey;

    if (C && !C.__AUMARA_GOOGLE_FACTORY_WRAPPED) {
      var directGoogleFactory = typeof C.createGooglePhotorealistic3DTileset === "function"
        ? C.createGooglePhotorealistic3DTileset.bind(C)
        : null;
      var ionFactory = C.Cesium3DTileset && typeof C.Cesium3DTileset.fromIonAssetId === "function"
        ? C.Cesium3DTileset.fromIonAssetId.bind(C.Cesium3DTileset)
        : null;

      if (hasGoogleKey && directGoogleFactory) {
        C.createGooglePhotorealistic3DTileset = async function () {
          try {
            return instrumentVisibleTileset(await directGoogleFactory.apply(null, arguments));
          } catch (error) {
            if (hasIon && ionFactory) return instrumentVisibleTileset(await ionFactory(assetId));
            throw error;
          }
        };
        C.__AUMARA_GOOGLE_FACTORY_WRAPPED = true;
      } else if (hasIon && ionFactory) {
        C.createGooglePhotorealistic3DTileset = async function () {
          return instrumentVisibleTileset(await ionFactory(assetId));
        };
        C.__AUMARA_GOOGLE_FACTORY_WRAPPED = true;
      }
    }
    return hasGoogleKey || hasIon;
  },
};
