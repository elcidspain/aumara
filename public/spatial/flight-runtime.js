(function () {
  "use strict";

  const root = document.documentElement;
  const cesiumStart = typeof window.startFlight === "function" ? window.startFlight.bind(window) : null;
  let hybridPromise = null;
  let localPromise = null;

  function failClosed(error) {
    const message = String(error && error.message ? error.message : error).slice(0, 180);
    root.dataset.aumaraFlight = "local-error";
    window.__AUMARA = {
      provider: "LOCAL_THREE",
      stage: "LOCAL_BOOTSTRAP_ERROR",
      firstFrameRendered: false,
      flightComplete: false,
      waypointReached: null,
      fatalRenderError: true,
      renderError: message,
    };
    const hud = document.getElementById("hud");
    if (hud) {
      hud.classList.add("on");
      hud.textContent = "3D runtime: " + message;
    }
    console.error("AUMARA_FLIGHT", message);
    return false;
  }

  async function waitForIonRuntimeConfig() {
    const ion = window.AUMARA_ION;
    if (!ion || !ion.ready || typeof ion.ready.then !== "function") return;
    try { await ion.ready; } catch (error) {}
  }

  function runtimeCredentialPresent() {
    const ion = window.AUMARA_ION;
    const ionToken = !!(ion && typeof ion.resolve === "function" && ion.resolve());
    const status = window.__AUMARA_ION_STATUS || {};
    return ionToken || !!status.googleMapsConfigured;
  }

  function withTimeout(promise, timeoutMs, label) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(label || "timeout")), timeoutMs);
      Promise.resolve(promise).then(
        (value) => { clearTimeout(timer); resolve(value); },
        (error) => { clearTimeout(timer); reject(error); },
      );
    });
  }

  async function waitForCesiumState(timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const state = window.__AUMARA;
      if (state && state.fatalRenderError) return null;
      if (state && state.firstFrameRendered && window.__AUMARA_GOOGLE_TILE_VISIBLE === true) return state;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  async function startLocalFlight() {
    const stage = document.getElementById("stage");
    if (stage) stage.classList.add("on");
    if (localPromise) return localPromise;
    root.dataset.aumaraFlight = "local-starting";

    localPromise = (async () => {
      await import("./local-twin.mjs");
      if (typeof window.runAumaraLocalTwin !== "function") throw new Error("local-twin-unavailable");
      const [geo, flight, hm] = await Promise.all([
        fetch("./AUMARA_WORLD_GEOREFERENCE_v1.json").then((r) => {
          if (!r.ok) throw new Error("georef:" + r.status);
          return r.json();
        }),
        fetch("./world/flight-path.json").then((r) => {
          if (!r.ok) throw new Error("flight-path:" + r.status);
          return r.json();
        }),
        fetch("./world/heightmap.json").then((r) => {
          if (!r.ok) throw new Error("heightmap:" + r.status);
          return r.json();
        }),
      ]);
      await window.runAumaraLocalTwin({
        geo,
        flight,
        hm,
        overlay: document.getElementById("overlay"),
        openSheet: typeof window.openSheet === "function" ? window.openSheet : null,
      });
      root.dataset.aumaraFlight = "local-initialized";
      return true;
    })().catch((error) => {
      localPromise = null;
      return failClosed(error);
    });
    return localPromise;
  }

  async function startCesiumFlight() {
    if (!cesiumStart) return false;
    await waitForIonRuntimeConfig();
    if (!runtimeCredentialPresent()) return false;
    root.dataset.aumaraFlight = "cesium-starting";
    window.__AUMARA_GOOGLE_TILE_VISIBLE = false;
    try {
      await withTimeout(cesiumStart(), 18000, "cesium-start-timeout");
      const state = await waitForCesiumState(5000);
      if (!state) return false;
      root.dataset.aumaraFlight = "cesium-rendered";
      return true;
    } catch (error) {
      return false;
    }
  }

  async function startHybridFlight() {
    const stage = document.getElementById("stage");
    if (stage) stage.classList.add("on");
    if (hybridPromise) return hybridPromise;

    hybridPromise = (async () => {
      if (await startCesiumFlight()) return true;
      root.dataset.aumaraFlight = "local-fallback";
      return startLocalFlight();
    })().catch((error) => {
      hybridPromise = null;
      return failClosed(error);
    });
    return hybridPromise;
  }

  window.AUMARA_START_LOCAL_FLIGHT = startLocalFlight;
  window.AUMARA_START_FLIGHT = startHybridFlight;
  const button = document.getElementById("flight");
  if (button) button.onclick = startHybridFlight;
  const ionButton = document.getElementById("ionbtn");
  if (ionButton && new URL(location.href).searchParams.get("debug") !== "1") ionButton.style.display = "none";
  root.dataset.aumaraFlightRuntime = "local-ready";
  root.dataset.aumaraFlightMode = "cesium-first-local-fallback";

  const pendingFlight = !!window.__AUMARA_PENDING_FLIGHT;
  window.__AUMARA_PENDING_FLIGHT = false;
  if (window.__AUMARA_AUTO_FLIGHT || pendingFlight) startHybridFlight();
})();
