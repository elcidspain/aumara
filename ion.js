/* Cesium ion — AUMARA. No JSON token API. */
(function () {
  try {
    var u = new URL(location.href);
    if (u.searchParams.has("ion")) {
      u.searchParams.delete("ion");
      history.replaceState(null, "", u.pathname + (u.search || "") + (u.hash || ""));
    }
  } catch (e) {}
})();

window.AUMARA_ION = {
  googleAsset: 2275207,
  asset: 2275207,
  worldTerrainAsset: 1,
  worldImageryAsset: 2,
  aumaraAsset: null,
  pages: [
    "https://elcidspain.github.io/aumara/",
    "https://aumara.me/",
    "https://www.aumara.me/",
    "https://aumara-path-cut.vercel.app/",
  ],
  resolve: function () {
    try { return localStorage.getItem("CESIUM_ION_TOKEN") || ""; } catch (e) { return ""; }
  },
  sessionPresent: function () { return !!this.resolve(); },
  apply: function (C, explicit) {
    var token = explicit || this.resolve();
    if (token) { try { localStorage.setItem("CESIUM_ION_TOKEN", token); } catch (e) {} }
    if (token && C && C.Ion) C.Ion.defaultAccessToken = token;
    return !!(token || (C && C.Ion && C.Ion.defaultAccessToken));
  },
};

(function bootstrapIon() {
  try { if (new URL(location.href).searchParams.get("local") === "1") return; } catch (e) {}
  try { if (localStorage.getItem("CESIUM_ION_TOKEN")) return; } catch (e) {}
  fetch("/api/ion-gate?ts=" + Date.now(), { credentials: "same-origin", cache: "no-store" })
    .catch(function () {})
    .then(function () {
      var s = document.createElement("script");
      s.src = "/api/ion-boot?ts=" + Date.now();
      s.async = true;
      document.head.appendChild(s);
    });
})();
