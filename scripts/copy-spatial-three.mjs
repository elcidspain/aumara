import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const vendorDir = path.resolve("public/spatial/vendor");
const threeSource = path.resolve("node_modules/three/build/three.module.min.js");
const threeTarget = path.join(vendorDir, "three.module.min.js");
const loaderSource = path.resolve("node_modules/three/examples/jsm/loaders/GLTFLoader.js");
const loaderDir = path.join(vendorDir, "addons");
const loaderTarget = path.join(loaderDir, "GLTFLoader.js");
const utilsSource = path.resolve("node_modules/three/examples/jsm/utils/BufferGeometryUtils.js");
const utilsDir = path.join(vendorDir, "utils");
const utilsTarget = path.join(utilsDir, "BufferGeometryUtils.js");
const meta = path.join(vendorDir, "three.vendor.json");

await Promise.all([
  mkdir(vendorDir, { recursive: true }),
  mkdir(loaderDir, { recursive: true }),
  mkdir(utilsDir, { recursive: true }),
]);
await copyFile(threeSource, threeTarget);
const loader = (await readFile(loaderSource, "utf8")).replace("} from 'three';", "} from '../three.module.min.js';");
const utils = (await readFile(utilsSource, "utf8")).replace("} from 'three';", "} from '../three.module.min.js';");
await Promise.all([
  writeFile(loaderTarget, loader, "utf8"),
  writeFile(utilsTarget, utils, "utf8"),
]);
const files = await Promise.all([
  ["three.module.min.js", threeTarget],
  ["addons/GLTFLoader.js", loaderTarget],
  ["utils/BufferGeometryUtils.js", utilsTarget],
].map(async ([name, file]) => {
  const bytes = await readFile(file);
  return { name, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}));
await writeFile(meta, `${JSON.stringify({ package: "three", files }, null, 2)}\n`, "utf8");
console.log(`AUMARA_THREE_VENDOR files=${files.length} bytes=${files.reduce((n, f) => n + f.bytes, 0)}`);
