import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const require = createRequire(import.meta.url);
const handlers = require(join(root, "lib/ion-server.js"));

const FAKE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.seal";
process.env.CESIUM_ION_TOKEN = FAKE_JWT;
process.env.AUMARA_RUNTIME_PUBLIC_V1 = FAKE_JWT;
process.env.VITE_GOOGLE_MAPS_API_KEY = "maps-test-key";

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(k, v) { this.headers[k] = v; },
    end(data) { this.body = data == null ? "" : String(data); },
  };
  return res;
}

function jsonOf(res) {
  return JSON.parse(res.body);
}

{
  const res = mockRes();
  handlers.handleIon({ method: "GET", headers: {} }, res);
  const body = jsonOf(res);
  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.configured, true);
  assert.equal(body.googleMaps, true);
  const raw = res.body;
  assert.equal(raw.includes(FAKE_JWT), false);
  assert.equal(/eyJ[A-Za-z0-9_-]+\./.test(raw), false);
  assert.equal("token" in body, false);
  assert.equal("jwt" in body, false);
  assert.equal("key" in body, false);
}

{
  const res = mockRes();
  handlers.handleIonGate({
    method: "GET",
    headers: { host: "preview.example", origin: "https://other.example" },
  }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(jsonOf(res).boot, null);
}

{
  const res = mockRes();
  handlers.handleIonGate({
    method: "GET",
    headers: { host: "preview.example", origin: "https://preview.example", "x-forwarded-proto": "https" },
  }, res);
  const body = jsonOf(res);
  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.boot, "/api/ion-boot");
  assert.equal(res.body.includes(FAKE_JWT), false);
  assert.match(String(res.headers["Set-Cookie"] || ""), /AUMARA_ION_GATE=1/);
}

{
  const denied = mockRes();
  handlers.handleIonBoot({ method: "GET", headers: { host: "preview.example", cookie: "" } }, denied);
  assert.match(denied.body, /gated/);
  assert.equal(denied.body.includes(FAKE_JWT), false);

  const allowed = mockRes();
  handlers.handleIonBoot({
    method: "GET",
    headers: { host: "preview.example", cookie: "AUMARA_ION_GATE=1" },
  }, allowed);
  assert.match(allowed.body, /__AUMARA_ION_APPLY/);
  assert.match(allowed.headers["Content-Type"], /javascript/);
}

{
  const html = readFileSync(join(root, "index.html"), "utf8");
  const ion = readFileSync(join(root, "ion.js"), "utf8");
  assert.match(html, /local=1/);
  assert.match(ion, /\/api\/ion-gate/);
  assert.match(ion, /gate\.boot/);
  assert.equal(/globe\.show\s*=\s*true/.test(html), false);
  assert.match(html, /hideGlobe/);
  assert.match(html, /TILE_PROOF_MS/);
  assert.match(html, /CLEAN_LOCAL_HANDOFF/);
  assert.match(html, /utmGridModelMatrix/);
  assert.match(html, /utm\.js/);
  const utm = readFileSync(join(root, "utm.js"), "utf8");
  assert.match(utm, /wgs84ToUtm30n/);
}

{
  const vm = await import("node:vm");
  const ctx = { globalThis: {} };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(join(root, "utm.js"), "utf8"), ctx);
  const geo = JSON.parse(readFileSync(join(root, "AUMARA_WORLD_GEOREFERENCE_v1.json"), "utf8"));
  const originE = geo.localOrigin.utm30n.easting;
  const originN = geo.localOrigin.utm30n.northing;
  geo.houses.forEach((h) => {
    const rt = ctx.AUMARA_UTM.localFromWgs84(h.wgs84.longitude, h.wgs84.latitude, originE, originN);
    const err = Math.hypot(rt.east - h.localMetres.east, rt.north - h.localMetres.north);
    assert.ok(err < 0.05, "house " + h.spatialId + " UTM err " + err);
  });
}

{
  const server = createServer((req, res) => {
    if (req.url === "/api/ion") return handlers.handleIon(req, res);
    if (req.url === "/api/ion-gate") return handlers.handleIonGate(req, res);
    if (req.url === "/api/ion-boot") return handlers.handleIonBoot(req, res);
    if (req.url === "/" || req.url === "/index.html") {
      res.setHeader("Content-Type", "text/html");
      res.end(readFileSync(join(root, "index.html")));
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const ion = await fetch(`http://127.0.0.1:${port}/api/ion`).then((r) => r.json());
  assert.equal(ion.configured, true);
  assert.equal(JSON.stringify(ion).includes(FAKE_JWT), false);
  const home = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(home.status, 200);
  const page = await home.text();
  assert.match(page, /CLEAN_LOCAL_HANDOFF/);
  server.close();
}

console.log("handoff-preview ion-seal: ok");
