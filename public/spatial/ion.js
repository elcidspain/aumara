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

  document.addEventListener("click", function (event) {
    var target = event.target && event.target.closest ? event.target.closest("#flight") : null;
    if (!target) return;
    var runtimeState = document.documentElement.dataset.aumaraFlightRuntime || "";
    if (runtimeState === "local-ready" || runtimeState === "load-error") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.__AUMARA_PENDING_FLIGHT = true;
  }, true);

  try {
    var u = new URL(location.href);
    if (u.searchParams.has("ion")) {
      u.searchParams.delete("ion");
      history.replaceState(null, "", u.pathname + (u.search || ""));
    }
  } catch (e) {}

  window.addEventListener("DOMContentLoaded", function () {
    var flightButton = document.getElementById("flight");
    if (flightButton) flightButton.onclick = function () { window.__AUMARA_PENDING_FLIGHT = true; };
    if (document.querySelector('script[data-aumara-local-flight="1"]')) return;
    var script = document.createElement("script");
    script.src = "./flight-runtime.js";
    script.defer = true;
    script.dataset.aumaraLocalFlight = "1";
    script.onerror = function () { document.documentElement.dataset.aumaraFlightRuntime = "load-error"; };
    document.body.appendChild(script);
  }, { once: true });
})();

var aumaraRuntimeIonToken = "";
var aumaraGoogleMapsKey = "";

async function loadAumaraIonRuntimeConfig() {
  var controller = typeof AbortController === "function" ? new AbortController() : null;
  var timer = controller ? setTimeout(function () { controller.abort(); }, 4000) : null;
  try {
    var response = await fetch("/api/spatial-config", { cache: "no-store", signal: controller ? controller.signal : undefined });
    if (!response.ok) return false;
    var data = await response.json();
    var ion = data && data.cesiumIon ? data.cesiumIon : null;
    var googleMaps = data && data.googleMaps ? data.googleMaps : null;
    if (ion && ion.configured && typeof ion.token === "string" && ion.token.trim()) aumaraRuntimeIonToken = ion.token.trim();
    if (googleMaps && googleMaps.configured && typeof googleMaps.key === "string" && googleMaps.key.trim()) aumaraGoogleMapsKey = googleMaps.key.trim();
    window.__AUMARA_ION_STATUS = { ionConfigured: Boolean(aumaraRuntimeIonToken), googleMapsConfigured: Boolean(aumaraGoogleMapsKey) };
    return Boolean(aumaraRuntimeIonToken || aumaraGoogleMapsKey);
  } catch (e) {
    window.__AUMARA_ION_STATUS = { ionConfigured: false, googleMapsConfigured: false };
    return false;
  } finally { if (timer) clearTimeout(timer); }
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

function boundRuntimeHeightProbe(C) {
  try {
    var proto = C && C.Scene && C.Scene.prototype;
    if (!proto || proto.__AUMARA_HEIGHT_PROBE_BOUNDED) return;
    var sampleHeightMostDetailed = proto.sampleHeightMostDetailed;
    if (typeof sampleHeightMostDetailed !== "function") return;
    proto.sampleHeightMostDetailed = function (cartographics) {
      var scene = this;
      return Promise.race([
        Promise.resolve(sampleHeightMostDetailed.call(scene, cartographics)),
new Promise(function (_, reject) {
          setTimeout(function () { reject(new Error("height-probe-timeout")); }, 2500);
        }),
      ]);
    };
    proto.__AUMARA_HEIGHT_PROBE_BOUNDED = true;
  } catch (e) {}
}

function sampleCanonicalHeight(hm, east, north) {
  var u = (east - hm.east0) / hm.cell;
  var v = (north - hm.north0) / hm.cell;
  var c0 = Math.floor(u), r0 = Math.floor(v), tx = u - c0, ty = v - r0;
  function at(c, r) {
    var cc = Math.max(0, Math.min(hm.cols - 1, c));
    var rr = Math.max(0, Math.min(hm.rows - 1, r));
    return hm.heights_m[rr * hm.cols + cc];
  }
  return at(c0, r0) * (1 - tx) * (1 - ty) + at(c0 + 1, r0) * tx * (1 - ty) + at(c0, r0 + 1) * (1 - tx) * ty + at(c0 + 1, r0 + 1) * tx * ty;
}

async function buildCanonicalCesiumLocalModel(C, modelOptions) {
  var parts = await Promise.all([
    fetch("./AUMARA_WORLD_GEOREFERENCE_v1.json", { cache: "force-cache" }).then(function (r) { return r.json(); }),
    fetch("./world/heightmap.json", { cache: "force-cache" }).then(function (r) { return r.json(); }),
  ]);
  var geo = parts[0], hm = parts[1];
  var collection = new C.PrimitiveCollection();
  var parent = modelOptions && modelOptions.modelMatrix ? modelOptions.modelMatrix : C.Matrix4.IDENTITY;
  var shellInstances = [], ringInstances = [];
  var colors = { A: "#c56a32", B: "#e8dcc4", C: "#3f7a3a", D: "#ddd0b4", E: "#9b2f22", F: "#c8b896" };
  geo.houses.forEach(function (h) {
    var r = h.diameterMetres / 2;
    var z = sampleCanonicalHeight(hm, h.localMetres.east, h.localMetres.north);
    var shellLocal = C.Matrix4.fromTranslation(new C.Cartesian3(h.localMetres.east, h.localMetres.north, z + r * 0.02));
    var ringLocal = C.Matrix4.fromTranslation(new C.Cartesian3(h.localMetres.east, h.localMetres.north, z + 0.24));
    shellInstances.push(new C.GeometryInstance({
      geometry: new C.EllipsoidGeometry({ radii: new C.Cartesian3(r, r, r), vertexFormat: C.PerInstanceColorAppearance.VERTEX_FORMAT }),
      modelMatrix: C.Matrix4.multiply(parent, shellLocal, new C.Matrix4()),
      attributes: { color: C.ColorGeometryInstanceAttribute.fromColor(C.Color.fromCssColorString(colors[h.spatialId] || "#c8b896")) },
    }));
    ringInstances.push(new C.GeometryInstance({
      geometry: new C.CylinderGeometry({ length: 0.48, topRadius: r * 0.98, bottomRadius: r * 1.04, slices: 28, vertexFormat: C.PerInstanceColorAppearance.VERTEX_FORMAT }),
      modelMatrix: C.Matrix4.multiply(parent, ringLocal, new C.Matrix4()),
      attributes: { color: C.ColorGeometryInstanceAttribute.fromColor(C.Color.fromCssColorString("#4a2c18")) },
    }));
  });
  collection.add(new C.Primitive({ geometryInstances: shellInstances, appearance: new C.PerInstanceColorAppearance({ translucent: false, closed: true }), asynchronous: false }));
  collection.add(new C.Primitive({ geometryInstances: ringInstances, appearance: new C.PerInstanceColorAppearance({ translucent: false, closed: true }), asynchronous: false }));
  collection.show = true;
  collection.__AUMARA_CANONICAL_FALLBACK = true;
  return collection;
}

function installCanonicalModelFallback(C) {
  try {
    if (!C || !C.Model || C.Model.__AUMARA_CANONICAL_FALLBACK_WRAPPED) return;
    var original = C.Model.fromGltfAsync.bind(C.Model);
    C.Model.fromGltfAsync = async function (options) {
      var url = String(options && options.url || "");
      if (!/aumara-site-v2_1\.glb(?:$|\?)/.test(url)) return original(options);
      try {
        return await Promise.race([
          original(options),
          new Promise(function (_, reject) { setTimeout(function () { reject(new Error("aumara-local-model-timeout")); }, 2500); }),
        ]);
      } catch (error) {
        return buildCanonicalCesiumLocalModel(C, options);
      }
    };
    C.Model.__AUMARA_CANONICAL_FALLBACK_WRAPPED = true;
  } catch (e) {}
}

function installAumaraGlbBridge(C) {
  if (!C || !C.Model || C.Model.__AUMARA_GLB_BRIDGED || typeof C.Model.fromGltfAsync !== "function") return;
  var original = C.Model.fromGltfAsync.bind(C.Model);
  C.Model.fromGltfAsync = async function (options) {
    var url = String(options && options.url || "");
    if (!/aumara-site-v2_1\.glb(?:$|\?)/.test(url)) return original(options);
    var localRuntime = import("./glb-flight.mjs").then(function (m) { return m.prepareAumaraGlbFlight(); });
    await localRuntime;
    var visible = false, destroyed = false;
    return {
      update: function () {},
      prePassesUpdate: function () {},
      updateForPass: function () {},
      postPassesUpdate: function () {},
      isDestroyed: function () { return destroyed; },
      destroy: function () { destroyed = true; localRuntime.then(function (r) { r.stop(); }).catch(function () {}); },
      get show() { return visible; },
      set show(value) {
        visible = !!value;
        localRuntime.then(function (r) { if (visible) r.start(); else r.stop(); }).catch(function (error) {
          if (window.__AUMARA) { window.__AUMARA.renderError = String(error && error.message || error); window.__AUMARA.fatalRenderError = true; }
        });
      },
    };
  };
  C.Model.__AUMARA_GLB_BRIDGED = true;
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
    boundRuntimeHeightProbe(C);
    installAumaraGlbBridge(C);
    installCanonicalModelFallback(C);

    if (C && !C.__AUMARA_GOOGLE_FACTORY_WRAPPED) {
      var directGoogleFactory = typeof C.createGooglePhotorealistic3DTileset === "function" ? C.createGooglePhotorealistic3DTileset.bind(C) : null;
      var ionFactory = C.Cesium3DTileset && typeof C.Cesium3DTileset.fromIonAssetId === "function" ? C.Cesium3DTileset.fromIonAssetId.bind(C.Cesium3DTileset) : null;
      if (hasGoogleKey && directGoogleFactory) {
        C.createGooglePhotorealistic3DTileset = async function () {
          try { return instrumentVisibleTileset(await directGoogleFactory.apply(null, arguments)); }
          catch (error) { if (hasIon && ionFactory) return instrumentVisibleTileset(await ionFactory(assetId)); throw error; }
        };
        C.__AUMARA_GOOGLE_FACTORY_WRAPPED = true;
      } else if (hasIon && ionFactory) {
        C.createGooglePhotorealistic3DTileset = async function () { return instrumentVisibleTileset(await ionFactory(assetId)); };
        C.__AUMARA_GOOGLE_FACTORY_WRAPPED = true;
      }
    }
    return hasGoogleKey || hasIon;
  },
};
