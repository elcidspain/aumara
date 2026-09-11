(function () {
  "use strict";

  const root = document.documentElement;
  let startPromise = null;

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
    console.error("AUMARA_LOCAL_FLIGHT", message);
    return false;
  }

  async function startLocalFlight() {
    const stage = document.getElementById("stage");
    if (stage) stage.classList.add("on");
    if (startPromise) return startPromise;
    root.dataset.aumaraFlight = "local-starting";

    startPromise = (async () => {
      try {
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
      } catch (error) {
        startPromise = null;
        return failClosed(error);
      }
    })();
    return startPromise;
  }

  window.AUMARA_START_LOCAL_FLIGHT = startLocalFlight;
  const button = document.getElementById("flight");
  if (button) button.onclick = startLocalFlight;
  const ionButton = document.getElementById("ionbtn");
  if (ionButton && new URL(location.href).searchParams.get("debug") !== "1") ionButton.style.display = "none";
  root.dataset.aumaraFlightRuntime = "local-ready";

  if (window.__AUMARA_AUTO_FLIGHT) startLocalFlight();
})();
