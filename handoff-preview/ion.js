/* AUMARA CLEAN_LOCAL_HANDOFF ion bootstrap.
 * Gate then boot. Never print credentials. Never write localStorage.
 */
(function () {
  try {
    var u = new URL(location.href);
    if (u.searchParams.has("ion")) {
      u.searchParams.delete("ion");
      history.replaceState(null, "", u.pathname + (u.search || "") + (u.hash || ""));
    }
  } catch (e) {}

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(true); };
      s.onerror = function () { reject(new Error("ion-boot-load")); };
      document.head.appendChild(s);
    });
  }

  async function bootIon() {
    var forceLocal = /(?:\?|&)local=1(?:&|$)/.test(location.search);
    window.__AUMARA_FORCE_LOCAL = forceLocal;
    window.__AUMARA_ION_STATUS = { ionConfigured: false, googleMapsConfigured: false, gated: false, booted: false };
    if (forceLocal) return false;
    try {
      var status = await fetch("/api/ion", { cache: "no-store", credentials: "same-origin" }).then(function (r) {
        if (!r.ok) throw new Error("ion-status");
        return r.json();
      });
      window.__AUMARA_ION_STATUS.ionConfigured = !!status.configured;
      window.__AUMARA_ION_STATUS.googleMapsConfigured = !!status.googleMaps;
      if (!status.configured) return false;
      var gate = await fetch("/api/ion-gate", { cache: "no-store", credentials: "same-origin" }).then(function (r) {
        return r.json();
      });
      window.__AUMARA_ION_STATUS.gated = !!(gate && gate.ok && gate.boot);
      if (!gate || !gate.ok || !gate.boot) return false;
      await loadScript(gate.boot);
      window.__AUMARA_ION_STATUS.booted = !!(window.__AUMARA_ION_BOOT && window.__AUMARA_ION_BOOT.ok);
      return window.__AUMARA_ION_STATUS.booted;
    } catch (e) {
      window.__AUMARA_ION_STATUS.booted = false;
      return false;
    }
  }

  window.AUMARA_ION = {
    asset: 2275207,
    ready: bootIon(),
    resolve: function () {
      return !!(window.__AUMARA_ION_BOOT && window.__AUMARA_ION_BOOT.ok);
    },
    apply: function (C) {
      var assetId = this.asset;
      if (typeof window.__AUMARA_ION_APPLY === "function") window.__AUMARA_ION_APPLY(C);
      var hasGoogleKey = !!(C && C.GoogleMaps && C.GoogleMaps.defaultApiKey);
      var hasIon = !!(C && C.Ion && C.Ion.defaultAccessToken);
      if (C && !C.__AUMARA_GOOGLE_FACTORY_WRAPPED) {
        var direct = typeof C.createGooglePhotorealistic3DTileset === "function" ? C.createGooglePhotorealistic3DTileset.bind(C) : null;
        var ionFactory = C.Cesium3DTileset && typeof C.Cesium3DTileset.fromIonAssetId === "function"
          ? C.Cesium3DTileset.fromIonAssetId.bind(C.Cesium3DTileset)
          : null;
        if (hasGoogleKey && direct) {
          C.createGooglePhotorealistic3DTileset = async function () {
            try { return await direct.apply(null, arguments); }
            catch (error) { if (hasIon && ionFactory) return ionFactory(assetId); throw error; }
          };
          C.__AUMARA_GOOGLE_FACTORY_WRAPPED = true;
        } else if (hasIon && ionFactory) {
          C.createGooglePhotorealistic3DTileset = async function () { return ionFactory(assetId); };
          C.__AUMARA_GOOGLE_FACTORY_WRAPPED = true;
        }
      }
      return hasGoogleKey || hasIon;
    },
  };
})();
