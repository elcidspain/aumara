import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const source = path.resolve("node_modules/three/build/three.min.js");
const targetDir = path.resolve("public/spatial/vendor");
const target = path.join(targetDir, "three.min.js");
const meta = path.join(targetDir, "three.vendor.json");

await mkdir(targetDir, { recursive: true });
await copyFile(source, target);
const bytes = await readFile(target);
const sha256 = createHash("sha256").update(bytes).digest("hex");
await writeFile(
  meta,
  `${JSON.stringify({ package: "three", source: "node_modules/three/build/three.min.js", sha256, bytes: bytes.length }, null, 2)}\n`,
  "utf8",
);
console.log(`AUMARA_THREE_VENDOR bytes=${bytes.length} sha256=${sha256}`);
