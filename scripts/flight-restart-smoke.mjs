/* Drives public/spatial/flight-runtime.js against a stubbed Cesium page so the
 * close/reopen path is covered without a live Google Photorealistic session.
 */
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const runtimeSource = readFileSync(path.join(here, "..", "public", "spatial", "flight-runtime.js"), "utf8");

const page = `<!doctype html>
<html><head><meta charset="utf-8"><title>flight restart harness</title></head>
<body>
<div id="stage"><div id="c"></div><div id="overlay"></div><div id="hud"></div></div>
<button id="flight">flight</button>
<button id="close">close</button>
<script>
(function () {
  var params = new URL(location.href).searchParams;
  var startDelayMs = Number(params.get("start") || 300);
  var tilesWork = params.get("tiles") !== "0";
  window.__HARNESS = { startCalls: 0, twinRuns: 0, localTwinRuns: 0 };
  window.AUMARA_ION = { ready: Promise.resolve(true), resolve: function () { return "harness-token"; } };
  window.__AUMARA_ION_STATUS = { ionConfigured: true, googleMapsConfigured: true };

  new MutationObserver(function () {
    var value = document.documentElement.dataset.aumaraFlight;
    if (value === "local-reload") sessionStorage.setItem("HARNESS_LOCAL_RELOAD", "1");
    if (value === "local-fallback") sessionStorage.setItem("HARNESS_LOCAL_FALLBACK", "1");
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-aumara-flight"] });

  function runTwin() {
    window.__HARNESS.twinRuns += 1;
    return new Promise(function (resolve) {
      setTimeout(function () {
        window.__AUMARA = {
          provider: "GOOGLE_PHOTOREALISTIC_3D_TILES",
          stage: tilesWork ? "EARTH" : "LOCAL_FALLBACK",
          firstFrameRendered: true,
          firstGoogleTileRendered: tilesWork,
          globalTilesVisible: tilesWork,
          fatalRenderError: false,
          flightComplete: false,
          waypointReached: 0,
        };
        if (tilesWork) window.__AUMARA_GOOGLE_TILE_VISIBLE = true;
        resolve();
      }, startDelayMs);
    });
  }

  // Mirrors the one-shot latch in public/spatial/index.html.
  var started = false;
  window.startFlight = function () {
    window.__HARNESS.startCalls += 1;
    document.getElementById("stage").classList.add("on");
    if (started) return;
    started = true;
    return runTwin();
  };
})();
</script>
<script src="./flight-runtime.js" defer></script>
</body></html>
`;

const localTwinStub = `window.runAumaraLocalTwin = async function () {
  window.__HARNESS.localTwinRuns += 1;
  window.__AUMARA = {
    provider: "LOCAL_THREE",
    stage: "LOCAL_GUEST_FLIGHT",
    firstFrameRendered: true,
    waypointReached: 0,
    flightComplete: false,
    fatalRenderError: false,
    renderError: null,
    events: [],
  };
  return true;
};
`;

const server = createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/flight-runtime.js") {
    response.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" });
    response.end(runtimeSource);
    return;
  }
  if (url.pathname === "/local-twin.mjs") {
    response.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" });
    response.end(localTwinStub);
    return;
  }
  if (url.pathname.endsWith(".json")) {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end("{}");
    return;
  }
  if (url.pathname === "/harness.html") {
    response.writeHead(200, { "content-type": "text/html", "cache-control": "no-store" });
    response.end(page);
    return;
  }
  response.writeHead(404, { "content-type": "text/plain" });
  response.end("not found");
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const cdpPort = 9333;
const browser = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
  .map((name) => ({ name, result: spawnSync("which", [name], { encoding: "utf8" }) }))
  .find(({ result }) => result.status === 0)?.result.stdout.trim();
if (!browser) throw new Error("Chrome/Chromium not present");

const profile = mkdtempSync(path.join(os.tmpdir(), "aumara-restart-"));
const chrome = spawn(browser, [
  "--headless=new",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(fn, timeout, label) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    try { last = await fn(); if (last) return last; } catch (error) { last = String(error); }
    await sleep(100);
  }
  throw new Error(`timeout waiting for ${label}: ${JSON.stringify(last)}`);
}

let ws;
let nextId = 1;
const pending = new Map();
function call(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const out = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (out.exceptionDetails) throw new Error(out.exceptionDetails.text || "Runtime.evaluate exception");
  return out.result?.value;
}
async function navigate(url, clearSession = true) {
  await call("Page.navigate", { url });
  await waitFor(() => evaluate("document.readyState === 'complete'"), 15000, `document ${url}`);
  await waitFor(() => evaluate("document.documentElement.dataset.aumaraFlightRuntime === 'local-ready'"), 10000, "flight runtime");
  if (clearSession) await evaluate("sessionStorage.clear(); true");
}
const flightState = () => evaluate(`({
  flight: document.documentElement.dataset.aumaraFlight || null,
  reloaded: sessionStorage.getItem("HARNESS_LOCAL_RELOAD") === "1",
  localFallback: sessionStorage.getItem("HARNESS_LOCAL_FALLBACK") === "1",
  startCalls: window.__HARNESS ? window.__HARNESS.startCalls : null,
  twinRuns: window.__HARNESS ? window.__HARNESS.twinRuns : null,
  localTwinRuns: window.__HARNESS ? window.__HARNESS.localTwinRuns : null
})`);
const click = (id) => evaluate(`document.getElementById(${JSON.stringify(id)}).click(); true`);

const failures = [];
function check(name, condition, detail) {
  if (condition) {
    console.log(`PASS ${name}`, JSON.stringify(detail));
    return;
  }
  failures.push(name);
  console.log(`FAIL ${name}`, JSON.stringify(detail));
}

try {
  await waitFor(async () => (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).ok, 15000, "Chrome CDP");
  const tab = await (await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" })).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  });
  await call("Runtime.enable");
  await call("Page.enable");

  // Reopening after the Google handoff already hid the tiles must keep the live session.
  await navigate(`${base}/harness.html?start=300&tiles=1`);
  await click("flight");
  await waitFor(() => evaluate("document.documentElement.dataset.aumaraFlight === 'cesium-rendered'"), 10000, "first Cesium render");
  await evaluate("window.__AUMARA.globalTilesVisible = false; window.__AUMARA.stage = 'WP0_27'; true");
  await click("close");
  await click("flight");
  await sleep(7000);
  let state = await flightState();
  check(
    "reopen-after-handoff-keeps-cesium",
    state.flight === "cesium-rendered" && !state.reloaded && !state.localFallback && state.twinRuns === 1,
    state,
  );

  // Reopening while the first Cesium startup is still loading must wait for it.
  await navigate(`${base}/harness.html?start=9000&tiles=1`);
  await click("flight");
  await waitFor(() => evaluate("document.documentElement.dataset.aumaraFlight === 'cesium-starting'"), 5000, "Cesium startup");
  await sleep(1000);
  await click("close");
  await click("flight");
  await sleep(14000);
  state = await flightState();
  check(
    "reopen-during-startup-waits",
    state.flight === "cesium-rendered" && !state.reloaded && !state.localFallback && state.twinRuns === 1,
    state,
  );

  // A Cesium session that never shows tiles must still reload into the clean local fallback.
  await navigate(`${base}/harness.html?start=300&tiles=0`);
  await click("flight");
  let broken = await waitFor(
    async () => ((await flightState()).reloaded ? await flightState() : null),
    12000,
    "clean local fallback reload",
  ).catch((error) => ({ error: String(error) }));
  check("broken-cesium-still-falls-back", broken.reloaded === true, broken);

  // A session that dies after rendering must not be resumed on reopen.
  await navigate(`${base}/harness.html?start=300&tiles=1`);
  await click("flight");
  await waitFor(() => evaluate("document.documentElement.dataset.aumaraFlight === 'cesium-rendered'"), 10000, "first Cesium render");
  await evaluate("window.__AUMARA.fatalRenderError = true; true");
  await click("close");
  await click("flight");
  broken = await waitFor(
    async () => ((await flightState()).reloaded ? await flightState() : null),
    12000,
    "clean local fallback reload after fatal render error",
  ).catch((error) => ({ error: String(error) }));
  check("dead-session-not-resumed", broken.reloaded === true, broken);

  // Reopening a clean local fallback must stay local instead of reloading again.
  await navigate(`${base}/harness.html?start=300&tiles=1`);
  await evaluate('sessionStorage.setItem("AUMARA_FORCE_LOCAL_ONCE", "1"); true');
  await navigate(`${base}/harness.html?start=300&tiles=1`, false);
  await waitFor(() => evaluate("document.documentElement.dataset.aumaraFlight === 'local-initialized'"), 10000, "clean local fallback");
  await click("close");
  await click("flight");
  await sleep(7000);
  state = await flightState();
  check(
    "reopen-local-fallback-stays-local",
    state.flight === "local-initialized" && !state.reloaded && state.startCalls === 0 && state.localTwinRuns === 1,
    state,
  );

  if (failures.length) throw new Error(`flight restart smoke failures: ${failures.join(", ")}`);
  console.log("AUMARA_FLIGHT_RESTART_PASS");
} finally {
  try { ws?.close(); } catch {}
  chrome.kill("SIGTERM");
  server.close();
}
