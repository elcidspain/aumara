(function () {
  "use strict";

  const root = document.documentElement;
  const cesiumStart = typeof window.startFlight === "function" ? window.startFlight.bind(window) : null;
  let hybridPromise = null;
  let localPromise = null;
  let cesiumPromise = null;
  let cesiumValidated = false;
  let attemptGeneration = 0;
  let flightCancelled = false;

  function isAttemptActive(generation) {
    return generation === attemptGeneration && !flightCancelled;
  }

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

  function consumeCleanLocalFallback() {
    try {
      if (sessionStorage.getItem("AUMARA_FORCE_LOCAL_ONCE") !== "1") return false;
      sessionStorage.removeItem("AUMARA_FORCE_LOCAL_ONCE");
      return true;
    } catch (error) {
      return false;
    }
  }

  function reloadIntoCleanLocalFallback(reason, generation) {
    if (!isAttemptActive(generation)) return false;
    root.dataset.aumaraFlight = "local-reload";
    root.dataset.aumaraCesiumFailure = String(reason || "cesium-failed").slice(0, 80);
    try {
      sessionStorage.setItem("AUMARA_FORCE_LOCAL_ONCE", "1");
      location.replace(location.pathname + location.search);
      return new Promise(() => {});
    } catch (error) {
      return Promise.reject(error);
    }
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

  async function waitForCesiumState(timeoutMs, generation) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (!isAttemptActive(generation)) return null;
      const state = window.__AUMARA;
      if (state && state.fatalRenderError) return null;
      const googlePathStillActive = !!(
        state &&
        state.stage !== "LOCAL_FALLBACK" &&
        state.globalTilesVisible === true
      );
      if (
        googlePathStillActive &&
        state.firstFrameRendered &&
        window.__AUMARA_GOOGLE_TILE_VISIBLE === true
      ) return state;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  function establishedCesiumState() {
    const state = window.__AUMARA;
    if (!state || state.fatalRenderError || state.stage === "LOCAL_FALLBACK") return false;
    const googleTilesProven = !!(
      window.__AUMARA_GOOGLE_TILE_VISIBLE === true ||
      state.firstGoogleTileRendered ||
      state.googleTileVisibleObserved
    );
    return !!(state.firstFrameRendered && googleTilesProven);
  }

  function ensureCesiumStarted() {
    if (!cesiumPromise) {
      window.__AUMARA_GOOGLE_TILE_VISIBLE = false;
      cesiumPromise = withTimeout(cesiumStart(), 40000, "cesium-start-timeout");
    }
    return cesiumPromise;
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

  async function startCesiumFlight(generation) {
    if (!cesiumStart) return false;
    await waitForIonRuntimeConfig();
    if (!isAttemptActive(generation)) return false;
    if (!runtimeCredentialPresent()) return false;
    root.dataset.aumaraFlight = "cesium-starting";
    if (cesiumValidated && establishedCesiumState()) {
      root.dataset.aumaraFlight = "cesium-rendered";
      return true;
    }
    try {
      await ensureCesiumStarted();
      if (!isAttemptActive(generation)) return false;
      if (establishedCesiumState()) {
        cesiumValidated = true;
        root.dataset.aumaraFlight = "cesium-rendered";
        return true;
      }
      const state = await waitForCesiumState(5000, generation);
      if (!isAttemptActive(generation)) return false;
      if (state || establishedCesiumState()) {
        cesiumValidated = true;
        root.dataset.aumaraFlight = "cesium-rendered";
        return true;
      }
      return reloadIntoCleanLocalFallback("cesium-no-visible-active-tile", generation);
    } catch (error) {
      return reloadIntoCleanLocalFallback(error && error.message ? error.message : "cesium-start-failed", generation);
    }
  }

  async function startHybridFlight() {
    const stage = document.getElementById("stage");
    if (stage) stage.classList.add("on");
    if (hybridPromise) return hybridPromise;

    flightCancelled = false;
    const generation = ++attemptGeneration;
    hybridPromise = (async () => {
      // A local twin already running owns the stage, so reopening must not start Cesium behind it.
      if (localPromise) return startLocalFlight();
      if (await startCesiumFlight(generation)) return true;
      if (!isAttemptActive(generation)) return false;
      root.dataset.aumaraFlight = "local-fallback";
      return startLocalFlight();
    })().catch((error) => {
      if (!isAttemptActive(generation)) return false;
      hybridPromise = null;
      return failClosed(error);
    });
    return hybridPromise;
  }

  window.AUMARA_START_LOCAL_FLIGHT = startLocalFlight;
  window.AUMARA_START_FLIGHT = startHybridFlight;
  const button = document.getElementById("flight");
  if (button) button.onclick = startHybridFlight;

  const closeButton = document.getElementById("close");
  const legacyClose = closeButton && typeof closeButton.onclick === "function" ? closeButton.onclick : null;
  if (closeButton) {
    closeButton.onclick = function (event) {
      flightCancelled = true;
      attemptGeneration += 1;
      hybridPromise = null;
      window.__AUMARA_PENDING_FLIGHT = false;
      try { sessionStorage.removeItem("AUMARA_FORCE_LOCAL_ONCE"); } catch (error) {}
      if (legacyClose) return legacyClose.call(this, event);
      const stage = document.getElementById("stage");
      if (stage) stage.classList.remove("on");
    };
  }

  const ionButton = document.getElementById("ionbtn");
  if (ionButton && new URL(location.href).searchParams.get("debug") !== "1") ionButton.style.display = "none";
  root.dataset.aumaraFlightRuntime = "local-ready";
  root.dataset.aumaraFlightMode = "cesium-first-local-fallback";

  const forceCleanLocal = consumeCleanLocalFallback();
  const pendingFlight = !!window.__AUMARA_PENDING_FLIGHT;
  window.__AUMARA_PENDING_FLIGHT = false;
  if (forceCleanLocal) {
    root.dataset.aumaraFlight = "local-clean-fallback";
    startLocalFlight();
  } else if (window.__AUMARA_AUTO_FLIGHT || pendingFlight) {
    startHybridFlight();
  }
})();
