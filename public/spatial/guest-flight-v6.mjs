import { prepareAumaraDenseFlight } from "./dense-flight.mjs";

const BOOK = "https://beds24.com/booking2.php?propid=324882";
const FRAMES = [
  { src: "./world/blue-marble-2048.jpg", label: "Tierra", sub: "Hacia la pen\u00ednsula ib\u00e9rica", pos: "50% 48%" },
  { src: "./world/flight-iberia.jpg", label: "Iberia", sub: "Mediterr\u00e1neo \u00b7 Espa\u00f1a", pos: "51% 51%" },
  { src: "./world/flight-costa-blanca.jpg", label: "Costa Blanca", sub: "Alicante \u00b7 Comunitat Valenciana", pos: "53% 52%" },
  { src: "./world/flight-marina-alta.jpg", label: "Marina Alta", sub: "Valle de la Rector\u00eda", pos: "49% 50%" },
  { src: "./world/flight-benidoleig.jpg", label: "Benidoleig", sub: "Rinc\u00f3n del Silencio", pos: "46% 58%" },
  { src: "./world/flight-aumara.jpg", label: "AUMARA", sub: "Has llegado", pos: "47% 63%" },
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let installed = false;
let running = false;
let generation = 0;

function preload(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
}

function ensureStyles() {
  if (document.getElementById("aumara-guest-flight-css")) return;
  const style = document.createElement("style");
  style.id = "aumara-guest-flight-css";
  style.textContent = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&family=Playfair+Display:wght@500;600&display=swap");
#stage #close{z-index:7!important;display:inline-flex!important}
#aumara-guest-flight{position:absolute;inset:0;z-index:4;overflow:hidden;background:#061009 url("/media/hero/three-houses-01.webp") center/cover no-repeat;color:#f3ecde;opacity:1;transition:opacity .8s ease}
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
      <small>AUMARA &middot; Vuelo 3D</small>
      <strong id="agf-label">Tierra</strong>
      <span id="agf-sub">Hacia la pen&iacute;nsula ib&eacute;rica</span>
    </div>
    <div class="agf-progress"><i id="agf-progress-bar"></i></div>`;
  stage.insertBefore(root, stage.firstChild);
  return root;
}

function showFrame(root, index, slotIndex) {
  const slots = [root.querySelector(".agf-a"), root.querySelector(".agf-b")];
  const current = slots[slotIndex % 2];
  const previous = slots[(slotIndex + 1) % 2];
  const frame = FRAMES[index];
  current.style.backgroundImage = `url("${frame.src}")`;
  current.style.backgroundPosition = frame.pos;
  current.classList.remove("on");
  void current.offsetWidth;
  current.classList.add("on");
  previous.classList.remove("on");
  const state = window.__AUMARA || (window.__AUMARA = {});
  state.provider = "AUMARA_CINEMATIC"; state.stage = frame.label.toUpperCase().replace(/\s+/g, "_"); state.firstFrameRendered = true; state.fatalRenderError = false;
  root.querySelector("#agf-label").textContent = frame.label;
  root.querySelector("#agf-sub").textContent = frame.sub;
  root.querySelector("#agf-progress-bar").style.width = `${((index + 1) / FRAMES.length) * 100}%`;
}
function showEndPanel(stage) {
  if (document.getElementById("agf-end")) return;
  const panel = document.createElement("div");
  panel.id = "agf-end";
  panel.style.cssText = "position:absolute;left:max(22px,5vw);right:max(22px,5vw);bottom:max(28px,5vh);z-index:6;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:18px 20px;border:1px solid rgba(255,255,255,.16);border-radius:22px;background:rgba(6,16,9,.82);backdrop-filter:blur(14px);color:#f3ecde";
  panel.innerHTML = `
    <div style="flex:1;min-width:220px"><div style="font:700 10px/1.2 system-ui;letter-spacing:.17em;text-transform:uppercase;color:#c49a64;margin-bottom:5px">AUMARA &middot; BENIDOLEIG</div><div style="font:500 clamp(20px,3vw,34px)/1.05 Georgia,serif;color:#f0ddb0">Elige tu casa.</div></div>
    <a class="btn ghost" href="/#houses">Ver las casas</a>
    <a class="btn gold" href="${BOOK}" target="_blank" rel="noreferrer">Consultar disponibilidad</a>`;
  stage.appendChild(panel);
}

async function runCinematic(root, token) {
  const restReady = Promise.all(FRAMES.slice(1).map((frame) => preload(frame.src)));
  await preload(FRAMES[0].src);
  if (token !== generation) return false;
  showFrame(root, 0, 0);
  root.style.opacity = "1";
  const cover = document.getElementById("flight-cover");
  if (cover) cover.classList.add("off");
  await sleep(2200);
  await restReady;
  for (let i = 1; i < FRAMES.length; i += 1) {
    if (token !== generation) return false;
    showFrame(root, i, i);
    await sleep(i === FRAMES.length - 1 ? 2200 : 2450);
  }
  return token === generation;
}
async function startGuestFlight() {
  if (running) return true;
  running = true;
  const token = ++generation;
  const stage = document.getElementById("stage");
  if (!stage) return false;
  ensureStyles();
  const root = ensureUi(stage);
  root.style.display = "block";
  root.style.opacity = "0";
  root.classList.remove("off");
  window.__AUMARA = { provider:"AUMARA_CINEMATIC", stage:"LOADING", firstFrameRendered:false, fatalRenderError:false, renderError:null, waypointReached:0, flightComplete:false, events:[] };
  stage.classList.add("on");
  document.body.style.overflow = "hidden";
  stage.classList.remove("local-world");
  const cesiumHost = document.getElementById("c");
  if (cesiumHost) cesiumHost.style.visibility = "hidden";
  const legacyOverlay = document.getElementById("overlay");
  if (legacyOverlay) legacyOverlay.style.display = "none";
  const oldEnd = document.getElementById("agf-end");
  if (oldEnd) oldEnd.remove();

  const densePromise = prepareAumaraDenseFlight().catch(() => null);
  const cinematicOk = await runCinematic(root, token);
  if (!cinematicOk) return false;
  const dense = await densePromise;
  if (token !== generation || !dense) return false;
  dense.start();
  const deadline = performance.now() + 4500;
  while (!window.__AUMARA_LOCAL_FRAME_VISIBLE && performance.now() < deadline) await sleep(50);
  if (token !== generation) return false;
  root.classList.add("off");
  setTimeout(() => { if (root.classList.contains("off")) root.style.display = "none"; }, 900);
  setTimeout(() => { if (token === generation) showEndPanel(stage); }, 23500);
  return true;
}
function stopGuestFlight() {
  generation += 1;
  running = false;
  const stage = document.getElementById("stage");
  if (stage) stage.classList.remove("on", "local-world");
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
    stopGuestFlight();
    window.location.replace("/");
  };
  document.documentElement.dataset.aumaraFlightRuntime = "guest-ready";
  document.documentElement.dataset.aumaraFlightMode = "cinematic-to-dense-local";
  const hashFlight = location.hash === "#flight";
  if (hashFlight) { try { history.replaceState(null, "", location.pathname + location.search); } catch {} }
  if (hashFlight || window.__AUMARA_AUTO_FLIGHT || window.__AUMARA_PENDING_FLIGHT) {
    window.__AUMARA_PENDING_FLIGHT = false;
    startGuestFlight();
  }
}

installAumaraGuestFlight();
window.AUMARA_START_FLIGHT = startGuestFlight;
