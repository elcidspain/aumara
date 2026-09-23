import { prepareAumaraWorldFlight } from "./world-flight.mjs";

const BOOK = "https://beds24.com/booking2.php?propid=324882";
let installed = false;
let running = false;
let generation = 0;
let worldRuntime = null;
let denseRuntime = null;
let denseModulePromise = null;

function prepareDenseRuntime() {
  if (!denseModulePromise) denseModulePromise = import("./dense-flight.mjs").then((m) => m.prepareAumaraDenseFlight());
  return denseModulePromise;
}

function isMobileSafeMode() {
  const ua = navigator.userAgent || "";
  const coarse = globalThis.matchMedia?.("(pointer: coarse)")?.matches;
  const narrow = Math.min(innerWidth || 9999, innerHeight || 9999) < 900;
  return !!(coarse || narrow || /iPhone|iPad|iPod|Android/i.test(ua));
}

function ensureStyles() {
  if (document.getElementById("aumara-guest-flight-css")) return;
  // Preserve credits; let Cesium open and close its attribution dialog normally.
  for (const sheet of document.styleSheets) {
    if (sheet.ownerNode?.tagName !== 'STYLE') continue;
    for (const rule of sheet.cssRules) {
      const selectors = rule.selectorText?.split(',').map(value => value.trim());
      if (selectors?.length === 2 && selectors.includes('.cesium-widget-credits') && selectors.includes('.cesium-credit-lightbox-overlay')) {
        rule.selectorText = '.cesium-widget-credits';
      }
    }
  }
  const style = document.createElement("style");
  style.id = "aumara-guest-flight-css";
  style.textContent = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&family=Playfair+Display:wght@500;600&display=swap");
#stage #close{z-index:7!important;display:inline-flex!important}
#aumara-guest-flight{position:absolute;inset:0;z-index:4;overflow:hidden;background:transparent;pointer-events:none;color:#f3ecde;opacity:1;transition:opacity .8s ease}
#aumara-guest-flight::before{content:"";position:absolute;inset:-2%;background:#07110c url("./world/blue-marble-2048.jpg") center/cover no-repeat;filter:saturate(.88) contrast(1.02) brightness(.72);transform:scale(1.03);opacity:1;transition:opacity .75s ease}
#aumara-guest-flight.world-live::before{opacity:0}
#aumara-guest-flight.off{opacity:0;pointer-events:none}
.agf-frame{position:absolute;inset:-3%;opacity:0;background-position:center;background-size:cover;filter:saturate(.92) contrast(1.04);will-change:transform,opacity}
.agf-frame.on{opacity:1;animation:agfZoom 3.6s cubic-bezier(.2,.55,.25,1) both}
.agf-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,10,7,.18),rgba(3,10,7,.05) 48%,rgba(3,10,7,.72));pointer-events:none}
.agf-copy{position:absolute;left:max(28px,5vw);bottom:max(32px,7vh);z-index:2;text-shadow:0 8px 34px rgba(0,0,0,.58)}
.agf-copy small{display:block;margin-bottom:9px;font:700 11px/1.2 Inter,system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#d5b276}
.agf-copy strong{display:block;font:500 clamp(36px,6.2vw,86px)/.98 'Playfair Display',Georgia,'Times New Roman',serif;color:#f0ddb0}
.agf-copy span{display:block;margin-top:10px;font:500 clamp(14px,1.5vw,19px)/1.35 Inter,system-ui,sans-serif;color:#f5eee3}
.agf-progress{position:absolute;left:5vw;right:5vw;bottom:18px;height:2px;background:rgba(255,255,255,.18);z-index:2;overflow:hidden}
.agf-progress i{display:block;height:100%;width:0;background:#c49a64;transition:width .8s ease}
@keyframes agfZoom{from{transform:scale(1.02)}to{transform:scale(1.14)}}
`;
  document.head.appendChild(style);
}
function ensureUi(stage) {
  let root = document.getElementById("aumara-guest-flight");
  if (root) return root;
  root = document.createElement("div");
  root.id = "aumara-guest-flight";
  root.innerHTML = `
    <div class="agf-frame agf-a"></div>
    <div class="agf-frame agf-b"></div>
    <div class="agf-shade"></div>
    <div class="agf-copy">
      <small>AUMARA &middot; Costa Blanca</small>
      <strong id="agf-label">Tierra</strong>
      <span id="agf-sub">Hacia la pen&iacute;nsula ib&eacute;rica</span>
    </div>
    <div class="agf-progress"><i id="agf-progress-bar"></i></div>`;
  stage.insertBefore(root, stage.firstChild);
  return root;
}

function showEndPanel(stage) {
  if (document.getElementById("agf-end")) return;
  const panel = document.createElement("div");
  panel.id = "agf-end";
  panel.style.cssText = "position:absolute;left:max(22px,5vw);right:max(22px,5vw);bottom:max(28px,5vh);z-index:6;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:18px 20px;border:1px solid rgba(255,255,255,.16);border-radius:22px;background:rgba(6,16,9,.82);backdrop-filter:blur(14px);color:#f3ecde";
  panel.innerHTML = `
    <div style="flex:1;min-width:220px"><div style="font:700 10px/1.2 system-ui;letter-spacing:.17em;text-transform:uppercase;color:#c49a64;margin-bottom:5px">AUMARA &middot; BENIDOLEIG</div><div style="font:500 clamp(20px,3vw,34px)/1.05 Georgia,serif;color:#f0ddb0">Elige tu casa.</div><div id="agf-source" style="margin-top:7px;font:12px/1.4 system-ui;opacity:.8"></div></div>
    <a class="btn ghost" href="/#houses">Ver las casas</a>
    <button class="btn ghost" id="agf-replay" type="button">Repetir el vuelo</button>
    <a class="btn gold" href="${BOOK}" target="_blank" rel="noreferrer">Consultar disponibilidad</a>`;
  stage.appendChild(panel);
  panel.querySelector('#agf-replay').onclick = () => { stopGuestFlight(); startGuestFlight(); };
}

async function startGuestFlight() {
  if (running) return true;
  running = true;
  const token = ++generation;
  const mobileSafeMode = isMobileSafeMode();
  const stage = document.getElementById("stage");
  if (!stage) { running = false; return false; }
  ensureStyles();
  const root = ensureUi(stage);
  root.style.display = "block";
  root.style.removeProperty("opacity");
  root.classList.remove("off", "world-live");
  window.__AUMARA = { provider:"CESIUM_SOURCE_MAP", stage:"LOADING", firstFrameRendered:false, fatalRenderError:false, renderError:null, waypointReached:null, flightComplete:false, fullSiteSourceSurface:false, mobileSafeMode, events:[] };
  window.__AUMARA_LOCAL_FRAME_VISIBLE = false;
  document.getElementById('flight-cover')?.classList.remove('off');
  const loadingText = document.querySelector('#flight-cover span');
  if (loadingText) loadingText.textContent = 'Preparando el vuelo 3D…';
  stage.classList.add("on");
  document.body.style.overflow = "hidden";
  stage.classList.remove("local-world");
  const cesiumHost = document.getElementById("c");
  if (cesiumHost) cesiumHost.style.visibility = "visible";
  const legacyOverlay = document.getElementById("overlay");
  if (legacyOverlay) legacyOverlay.style.display = "none";
  const oldEnd = document.getElementById("agf-end");
  if (oldEnd) oldEnd.remove();

  let densePromise = null;

  function fail(error) {
    if (token !== generation) return;
    worldRuntime?.stop(); denseRuntime?.stop(); running = false;
    window.__AUMARA.fatalRenderError = true;
    window.__AUMARA.renderError = String(error?.message || error).replace(/https?:\/\/[^\s]+/g, '[resource]').slice(0, 160);
    window.__AUMARA.stage = 'ERROR';
    const cover = document.getElementById('flight-cover');
    cover?.classList.remove('off');
    if (loadingText) loadingText.textContent = 'Puedes volver a intentar el recorrido.';
    showEndPanel(stage);
  }
  function finishAtParcel() {
    if (token !== generation) return;
    running = false;
    root.classList.add("off");
    document.getElementById("flight-cover")?.classList.add("off");
    const state = window.__AUMARA || (window.__AUMARA = {});
    state.provider = "CESIUM_SOURCE_MAP";
    state.stage = "PARCEL_READY";
    state.flightComplete = true;
    state.localSkippedForMobile = true;
    state.localTwinVisible = false;
    state.localTwinLoaded = false;
    state.fatalRenderError = false;
    state.renderError = null;
    showEndPanel(stage);
    const source = document.getElementById("agf-source");
    if (source) source.textContent = "Vista aérea AUMARA · Costa Blanca";
    setTimeout(() => {
      if (token === generation && root.classList.contains("off")) root.style.display = "none";
    }, 900);
  }

  async function enterDense() {
    if (token !== generation) return;
    try {
      const dense = await densePromise;
      if (token !== generation) return;
      if (!dense) throw new Error("dense-runtime-unavailable");
      denseRuntime = dense;
      dense.start({
        complete: () => {
          if (token !== generation) return;
          running = false;
          showEndPanel(stage);
          const source = document.getElementById("agf-source");
          if (source) source.textContent = "Recorrido espacial AUMARA";
        },
        error: fail,
      });
      const deadline = performance.now() + 5000;
      while (token === generation && !window.__AUMARA_LOCAL_FRAME_VISIBLE && performance.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (token !== generation) return;
      if (!window.__AUMARA_LOCAL_FRAME_VISIBLE) throw new Error("dense-first-frame-timeout");
      root.classList.add("off");
      document.getElementById("flight-cover")?.classList.add("off");
      setTimeout(() => { if (token === generation && root.classList.contains("off")) root.style.display = "none"; }, 900);
    } catch (error) { fail(error); }
  }
  try {
    densePromise = mobileSafeMode ? null : prepareDenseRuntime();
    const global = await prepareAumaraWorldFlight();
    if (token !== generation) return false;
    worldRuntime = global;
    global.start({ complete: () => { if (mobileSafeMode) finishAtParcel(); else void enterDense(); }, error: fail, stage: (label, progress) => {
      if (token !== generation) return;
      window.__AUMARA.stage = label;
      root.classList.add("world-live");
      root.querySelector('#agf-label').textContent = label;
      root.querySelector('#agf-sub').textContent = label === 'AUMARA' ? 'Casas entre pinos y vistas al valle' : 'Destino AUMARA · Costa Blanca';
      root.querySelector('#agf-progress-bar').style.width = `${progress * 100}%`;
      document.getElementById('flight-cover')?.classList.add('off');
    } });
    return true;
  } catch (error) { fail(error); return false; }
}
function stopGuestFlight(keepVisible = false) {
  generation += 1;
  running = false;
  const stage = document.getElementById("stage");
  if (stage && !keepVisible) stage.classList.remove("on", "local-world");
  worldRuntime?.stop();
  denseRuntime?.stop();
  document.body.style.overflow = "";
  const cesiumHost = document.getElementById("c");
  if (cesiumHost) cesiumHost.style.visibility = "visible";
}

export function installAumaraGuestFlight() {
  if (installed) return;
  installed = true;
  const button = document.getElementById("flight");
  if (button) button.onclick = (event) => { event.preventDefault(); startGuestFlight(); };
  const close = document.getElementById("close");
  if (close) close.onclick = (event) => {
    event.preventDefault();
    // Keep the last frame on screen until navigation replaces the document.
    stopGuestFlight(true);
    window.location.replace("/");
  };
  document.documentElement.dataset.aumaraFlightRuntime = "guest-ready";
  document.documentElement.dataset.aumaraFlightMode = "cesium-parcel-mobile-dense-desktop";
  const hashFlight = location.hash === "#flight";
  if (hashFlight) { try { history.replaceState(null, "", location.pathname + location.search); } catch {} }
  if (document.getElementById('stage')) {
    window.__AUMARA_PENDING_FLIGHT = false;
    startGuestFlight();
  }
}

installAumaraGuestFlight();
window.AUMARA_START_FLIGHT = startGuestFlight;
