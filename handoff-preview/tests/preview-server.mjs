import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const require = createRequire(import.meta.url);
const handlers = require(join(root, "lib/ion-server.js"));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".css": "text/css; charset=utf-8",
};

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname === "/api/ion") return handlers.handleIon(req, res);
  if (url.pathname === "/api/ion-gate") return handlers.handleIonGate(req, res);
  if (url.pathname === "/api/ion-boot") return handlers.handleIonBoot(req, res);
  let path = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = normalize(join(root, path.replace(/^\/+/, "")));
  if (!file.startsWith(root)) { res.statusCode = 403; res.end(); return; }
  try {
    const st = statSync(file);
    if (!st.isFile()) throw new Error("not-file");
    res.setHeader("Content-Type", TYPES[extname(file)] || "application/octet-stream");
    res.end(readFileSync(file));
  } catch (error) {
    res.statusCode = 404;
    res.end("not found");
  }
});

const port = Number(process.env.PORT || 4173);
server.listen(port, "0.0.0.0", () => {
  console.log("handoff-preview local http://127.0.0.1:" + port + "/?local=1");
});
