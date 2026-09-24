import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const base = process.env.AUMARA_SMOKE_BASE || "http://127.0.0.1:3000";
const forceRequireGoogle = process.env.AUMARA_REQUIRE_GOOGLE === "1";
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

async function readRuntimeExpectation() {
  let response;
  try {
    response = await fetch(base + "/api/spatial-config?probe=1", { cache: "no-store" });
  } catch (error) {
    throw new Error(`runtime credential probe unavailable: ${String(error)}`);
  }
  if (!response.ok) {
    throw new Error(`runtime credential probe failed: HTTP ${response.status}`);
  }
  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(`runtime credential probe invalid JSON: ${String(error)}`);
  }
  if (
    !data ||
    typeof data !== "object" ||
    !data.cesiumIon ||
    !data.googleMaps ||
    typeof data.cesiumIon.configured !== "boolean" ||
    typeof data.googleMaps.configured !== "boolean"
  ) {
    throw new Error("runtime credential probe missing or invalid provider state");
  }
  const publicCredentialConfigured = data.cesiumIon.configured || data.googleMaps.configured;
  return {
    // Photorealistic Google tiles are an optional refinement for the current guest route.
    // Require them only in an explicitly forced provider test; the source-map descent is
    // the supported fallback when Google tiles are unavailable.
    requireGoogle: forceRequireGoogle,
    probeAvailable: true,
    publicCredentialConfigured,
    cesiumIonConfigured: Boolean(data.cesiumIon.configured),
    googleMapsConfigured: Boolean(data.googleMaps.configured),
    privateIonConfigured: Boolean(data.cesiumIon.privateConfigured),
  };
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
  const runtimeExpectation = await readRuntimeExpectation();
  console.log("SPATIAL_RUNTIME_EXPECTATION", JSON.stringify(runtimeExpectation));

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
  await call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: 1440,
    screenHeight: 1000,
  });

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
    () => evaluate("['cesium-first-local-fallback','cinematic-to-dense-local','cesium-to-dense-west-east-qa','cesium-to-textured-site','cesium-parcel-mobile-dense-desktop'].includes(document.documentElement.dataset.aumaraFlightMode) ? document.documentElement.dataset.aumaraFlightMode : null"),
    10000,
    "supported flight mode",
  );
  await waitFor(() => evaluate("['local-ready','guest-ready'].includes(document.documentElement.dataset.aumaraFlightRuntime)"), 10000, "flight runtime");
  const denseQaMode = mode === "cesium-to-dense-west-east-qa";
  const guestMode = mode === "cinematic-to-dense-local";
  const texturedMode = mode === "cesium-to-textured-site";
  const adaptiveMode = mode === "cesium-parcel-mobile-dense-desktop";

  let aerial = null;
  if (denseQaMode || texturedMode || adaptiveMode) {
    aerial = await waitFor(
      () => evaluate("window.__AUMARA?.provider === 'CESIUM_SOURCE_MAP' && window.__AUMARA?.firstFrameRendered && !window.__AUMARA?.fatalRenderError ? ({provider:window.__AUMARA.provider,stage:window.__AUMARA.stage,mapViewKind:window.__AUMARA.mapViewKind,photorealisticMapStatus:window.__AUMARA.photorealisticMapStatus}) : null"),
      20000,
      "Cesium source-map first frame",
    );
    await waitFor(
      () => evaluate("['España','Costa Blanca','Benidoleig','AUMARA'].includes(window.__AUMARA?.stage) ? window.__AUMARA.stage : null"),
      18000,
      "autonomous global-stage progression",
    );
  }

  const frame = await waitFor(
    () => evaluate(texturedMode
      ? "window.__AUMARA?.provider === 'AUMARA_TEXTURED_MODEL' && window.__AUMARA?.firstFrameRendered && window.__AUMARA?.houseCount === 6 && !window.__AUMARA?.fatalRenderError ? ({provider:window.__AUMARA.provider,stage:window.__AUMARA.stage,waypointReached:window.__AUMARA.waypointReached,houseCount:window.__AUMARA.houseCount,localRenderer:window.__AUMARA.localRenderer}) : null"
      : ((guestMode || denseQaMode || adaptiveMode)
        ? "window.__AUMARA?.provider === 'AUMARA_RGB_POINTCLOUD' && window.__AUMARA?.firstFrameRendered && !window.__AUMARA?.fatalRenderError ? ({provider:window.__AUMARA.provider, stage:window.__AUMARA.stage, waypointReached:window.__AUMARA.waypointReached, localPointCount:window.__AUMARA.localPointCount,westPointCount:window.__AUMARA.westPointCount,eastPointCount:window.__AUMARA.eastPointCount,eastTrailingBytes:window.__AUMARA.eastTrailingBytes,fullSiteSourceSurface:window.__AUMARA.fullSiteSourceSurface}) : null"
        : "window.__AUMARA?.firstFrameRendered && !window.__AUMARA?.fatalRenderError ? ({provider:window.__AUMARA.provider, stage:window.__AUMARA.stage, globalTilesVisible:window.__AUMARA.globalTilesVisible, waypointReached:window.__AUMARA.waypointReached}) : null")),
    60000,
    texturedMode ? "textured six-house guest frame" : ((guestMode || denseQaMode || adaptiveMode) ? "dense local guest frame" : "first spatial WebGL frame"),
  );

  if (denseQaMode || adaptiveMode) {
    if (frame.westPointCount !== 37804 || frame.eastPointCount !== 8911 || frame.localPointCount !== 46715 || frame.eastTrailingBytes !== 3) {
      throw new Error(`dense source counts mismatch: ${JSON.stringify(frame)}`);
    }
    if (frame.fullSiteSourceSurface !== false) {
      throw new Error("dense QA route must not claim a completed full-site source surface");
    }
    console.log("SPATIAL_AERIAL_PASS", JSON.stringify(aerial));
    console.log("SPATIAL_DENSE_COUNTS_PASS", JSON.stringify(frame));
  }

  if (runtimeExpectation.requireGoogle && frame.provider !== "GOOGLE_PHOTOREALISTIC_3D_TILES") {
    throw new Error(`Public Cesium/Google credential is configured but active provider is ${frame.provider}`);
  }

  let autonomous;
  if (frame.provider === "AUMARA_TEXTURED_MODEL") {
    if (frame.houseCount !== 6 || frame.localRenderer !== "THREE_GLTF") {
      throw new Error(`textured AUMARA model incomplete: ${JSON.stringify(frame)}`);
    }
    autonomous = await waitFor(
      () => evaluate("window.__AUMARA?.waypointReached >= 1 ? ({provider:window.__AUMARA.provider, waypointReached:window.__AUMARA.waypointReached, houseCount:window.__AUMARA.houseCount,localRenderer:window.__AUMARA.localRenderer}) : null"),
      10000,
      "autonomous textured local waypoint progression",
    );
    console.log("SPATIAL_TEXTURED_GUEST_PASS", JSON.stringify(autonomous));
  } else if (frame.provider === "AUMARA_RGB_POINTCLOUD") {
    autonomous = await waitFor(
      () => evaluate("window.__AUMARA?.waypointReached >= 1 ? ({provider:window.__AUMARA.provider, waypointReached:window.__AUMARA.waypointReached, localPointCount:window.__AUMARA.localPointCount}) : null"),
      10000,
      "autonomous dense local waypoint progression",
    );
    console.log("SPATIAL_DENSE_GUEST_PASS", JSON.stringify(autonomous));
  } else if (frame.provider === "GOOGLE_PHOTOREALISTIC_3D_TILES") {
    const google = await waitFor(
      () => evaluate("window.__AUMARA_GOOGLE_TILE_VISIBLE === true && window.__AUMARA?.firstGoogleTileRendered && window.__AUMARA?.stage !== 'LOCAL_FALLBACK' && window.__AUMARA?.globalTilesVisible === true ? ({provider:window.__AUMARA.provider,stage:window.__AUMARA.stage,globalTilesStatus:window.__AUMARA.globalTilesStatus,globalTilesVisible:true,tileVisible:true}) : null"),
      8000,
      "visible active Google photorealistic tile",
    );
    autonomous = await waitFor(
      () => evaluate("window.__AUMARA?.stage !== 'LOCAL_FALLBACK' && window.__AUMARA?.events?.some((event) => event.name === 'IBERIA_STAGE') ? ({stage:window.__AUMARA.stage, events:window.__AUMARA.events.map((event)=>event.name)}) : null"),
      10000,
      "autonomous Earth to Iberia progression",
    );
    console.log("SPATIAL_GOOGLE_TILE_PASS", JSON.stringify(google));
  } else if (frame.provider === "LOCAL_THREE") {
    if (runtimeExpectation.requireGoogle) throw new Error("Local fallback is not acceptable while a public Cesium/Google credential is configured");
    autonomous = await waitFor(
      () => evaluate("window.__AUMARA?.waypointReached >= 1 ? ({provider:window.__AUMARA.provider, waypointReached:window.__AUMARA.waypointReached}) : null"),
      10000,
      "autonomous Local Three waypoint progression",
    );
    console.log("SPATIAL_LOCAL_FALLBACK_PASS", JSON.stringify(autonomous));
  } else {
    throw new Error(`unexpected spatial provider ${frame.provider}`);
  }

  await evaluate("typeof window.__AUMARA?.advanceTo === 'function' ? (window.__AUMARA.advanceTo(999), true) : false");
  const complete = await waitFor(
    () => evaluate("window.__AUMARA?.flightComplete && window.__AUMARA?.waypointReached === 27 ? ({provider:window.__AUMARA.provider, waypointReached:window.__AUMARA.waypointReached, flightComplete:window.__AUMARA.flightComplete}) : null"),
    5000,
    "WP27 completion",
  );
  console.log("SPATIAL_MODE_PASS", JSON.stringify(mode));
  console.log("SPATIAL_FIRST_FRAME_PASS", JSON.stringify(frame));
  console.log("SPATIAL_AUTONOMOUS_PROGRESS_PASS", JSON.stringify(autonomous));
  console.log("SPATIAL_WP27_PASS", JSON.stringify(complete));

  if (adaptiveMode) {
    await call("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    });
    await navigate(base + "/spatial/?smoke=mobile#flight");
    await waitFor(
      () => evaluate("document.documentElement.dataset.aumaraFlightMode === 'cesium-parcel-mobile-dense-desktop' ? true : null"),
      10000,
      "adaptive mobile flight mode",
    );
    await waitFor(
      () => evaluate("document.documentElement.dataset.aumaraFlightRuntime === 'guest-ready' ? true : null"),
      10000,
      "adaptive mobile runtime",
    );
    const mobileFirst = await waitFor(
      () => evaluate("window.__AUMARA?.mobileSafeMode === true && window.__AUMARA?.provider === 'CESIUM_SOURCE_MAP' && window.__AUMARA?.firstFrameRendered && !window.__AUMARA?.fatalRenderError ? ({provider:window.__AUMARA.provider,stage:window.__AUMARA.stage,mobileSafeMode:window.__AUMARA.mobileSafeMode}) : null"),
      25000,
      "mobile Cesium first frame",
    );
    const mobileFinal = await waitFor(
      () => evaluate("window.__AUMARA?.flightComplete && window.__AUMARA?.stage === 'PARCEL_READY' && window.__AUMARA?.localSkippedForMobile === true && window.__AUMARA?.mobileFinalVisual === 'VERIFIED_PROPERTY_PHOTO' && !window.__AUMARA?.fatalRenderError ? ({provider:window.__AUMARA.provider,stage:window.__AUMARA.stage,localSkippedForMobile:window.__AUMARA.localSkippedForMobile,mobileFinalVisual:window.__AUMARA.mobileFinalVisual}) : null"),
      50000,
      "mobile verified-property final",
    );
    console.log("SPATIAL_MOBILE_FIRST_FRAME_PASS", JSON.stringify(mobileFirst));
    console.log("SPATIAL_MOBILE_PARCEL_PASS", JSON.stringify(mobileFinal));
  }

  console.log("AUMARA_LIVE_RUNTIME_PASS");
} finally {
  try { ws?.close(); } catch {}
  chrome.kill("SIGTERM");
}
