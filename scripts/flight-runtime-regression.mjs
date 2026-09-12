import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const source = await fs.readFile(new URL("../public/spatial/flight-runtime.js", import.meta.url), "utf8");

let resolveCesium;
let cesiumStarts = 0;
let replacements = 0;
const stored = new Map();
const stage = {
  classList: {
    add() {},
    remove() {},
  },
};
const flight = {};
const close = {
  onclick() {
    stage.classList.remove("on");
  },
};
const elements = { flight, close, stage };
const document = {
  documentElement: { dataset: {} },
  getElementById(id) {
    return elements[id] || null;
  },
};
const location = {
  href: "https://example.test/spatial/",
  pathname: "/spatial/",
  search: "",
  replace() {
    replacements += 1;
  },
};
const sessionStorage = {
  getItem(key) {
    return stored.get(key) || null;
  },
  setItem(key, value) {
    stored.set(key, value);
  },
  removeItem(key) {
    stored.delete(key);
  },
};
const window = {
  AUMARA_ION: {
    resolve() {
      return "configured";
    },
  },
  startFlight() {
    cesiumStarts += 1;
    return new Promise((resolve) => {
      resolveCesium = resolve;
    });
  },
};
window.window = window;

vm.runInNewContext(source, {
  console,
  document,
  location,
  sessionStorage,
  setTimeout,
  clearTimeout,
  URL,
  window,
});

const firstAttempt = flight.onclick();
await Promise.resolve();
assert.equal(cesiumStarts, 1, "Cesium startup should be in flight before close");
close.onclick({});
const resumedAttempt = flight.onclick();

window.__AUMARA_GOOGLE_TILE_VISIBLE = false;
window.__AUMARA = {
  provider: "GOOGLE_PHOTOREALISTIC_3D_TILES",
  stage: "WP0_27",
  firstFrameRendered: true,
  firstGoogleTileRendered: true,
  googleTileVisibleObserved: true,
  globalTilesVisible: false,
  fatalRenderError: false,
};
resolveCesium();

assert.equal(await firstAttempt, false, "the closed generation should remain cancelled");
assert.equal(await resumedAttempt, true, "the reopened generation should reuse established Cesium state");
assert.equal(cesiumStarts, 1, "the latched Cesium startup must only be invoked once");
assert.equal(replacements, 0, "an established Cesium handoff must not trigger local reload");
assert.equal(stored.has("AUMARA_FORCE_LOCAL_ONCE"), false);

window.__AUMARA_GOOGLE_TILE_VISIBLE = false;
window.__AUMARA.globalTilesVisible = false;
close.onclick({});
assert.equal(await flight.onclick(), true, "hidden Google tiles after a proven session must not discard Cesium");
assert.equal(cesiumStarts, 1);
assert.equal(replacements, 0);

close.onclick({});
assert.equal(await flight.onclick(), true, "later reopenings should reuse validated Cesium");
assert.equal(cesiumStarts, 1);
assert.equal(replacements, 0);

console.log("flight runtime close/reopen regression passed");
