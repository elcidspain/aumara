import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const base = process.env.AUMARA_SMOKE_BASE || "http://127.0.0.1:3000";
const cdpPort = 9222;
const browser = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
  .map((name) => ({ name, result: spawnSync("which", [name], { encoding: "utf8" }) }))
  .find(({ result }) => result.status === 0)?.result.stdout.trim();
if (!browser) throw new Error("Chrome/Chromium not present");

const profile = mkdtempSync(path.join(os.tmpdir(), "aumara-chrome-"));
const chrome = spawn(browser, [
  "--headless=new",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--enable-webgl",
  "--ignore-gpu-blocklist",
  "--autoplay-policy=no-user-gesture-required",
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(fn, timeout = 20000, label = "condition") {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    try { last = await fn(); if (last) return last; } catch (error) { last = String(error); }
    await sleep(150);
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
async function evaluate(expression, userGesture = false) {
  const out = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture });
  if (out.exceptionDetails) throw new Error(out.exceptionDetails.text || "Runtime.evaluate exception");
  return out.result?.value;
}
async function navigate(url) {
  await call("Page.navigate", { url });
  await waitFor(() => evaluate("document.readyState === 'complete'"), 20000, `document ${url}`);
}

try {
  await waitFor(async () => (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).ok, 15000, "Chrome CDP");
  const tab = await (await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(base + "/")}`, { method: "PUT" })).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
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

  await navigate(base + "/");
  await waitFor(() => evaluate("!!document.querySelector('.sound-btn')"), 10000, "sound button");
  await evaluate("document.querySelector('.sound-btn').click(); true", true);
  const sound = await waitFor(
    () => evaluate("window.__AUMARA_SOUND?.state === 'running' && window.__AUMARA_SOUND?.contextState === 'running' ? window.__AUMARA_SOUND : null"),
    6000,
    "running WebAudio",
  );
  await evaluate("document.querySelector('.sound-btn').click(); true", true);
  await waitFor(() => evaluate("['stopping','stopped'].includes(window.__AUMARA_SOUND?.state)"), 3000, "sound stop");
  console.log("ROOT_SOUND_PASS", JSON.stringify(sound));

  await navigate(base + "/spatial/#flight");
  const mode = await waitFor(
    () => evaluate("document.documentElement.dataset.aumaraFlightMode === 'ion-primary-local-fallback' ? document.documentElement.dataset.aumaraFlightMode : null"),
    10000,
    "hybrid flight mode",
  );
  await waitFor(() => evaluate("document.documentElement.dataset.aumaraFlightRuntime === 'local-ready'"), 10000, "flight runtime");
  const frame = await waitFor(
    () => evaluate("window.__AUMARA?.firstFrameRendered && !window.__AUMARA?.fatalRenderError ? ({provider:window.__AUMARA.provider, waypointReached:window.__AUMARA.waypointReached}) : null"),
    20000,
    "first spatial WebGL frame",
  );
  await evaluate("window.__AUMARA.advanceTo(999); true");
  const complete = await waitFor(
    () => evaluate("window.__AUMARA?.flightComplete && window.__AUMARA?.waypointReached === 27 ? ({provider:window.__AUMARA.provider, waypointReached:window.__AUMARA.waypointReached, flightComplete:window.__AUMARA.flightComplete}) : null"),
    5000,
    "WP27 completion",
  );
  console.log("SPATIAL_MODE_PASS", JSON.stringify(mode));
  console.log("SPATIAL_FIRST_FRAME_PASS", JSON.stringify(frame));
  console.log("SPATIAL_WP27_PASS", JSON.stringify(complete));
  console.log("AUMARA_LIVE_RUNTIME_PASS");
} finally {
  try { ws?.close(); } catch {}
  chrome.kill("SIGTERM");
}
