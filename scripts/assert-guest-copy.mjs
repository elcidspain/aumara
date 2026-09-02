#!/usr/bin/env node
/**
 * Guest pages must not advertise physical-vs-bookable inventory counts.
 */
import fs from "node:fs";
import path from "node:path";

const roots = ["app", "components/site", "lib"];
const forbidden = [
  /5 bookable/i,
  /6 physical/i,
  /six houses/i,
  /five open/i,
  /five currently/i,
  /currently bookable/i,
  /3 Chalet \+ 2/i,
  /sixth physical/i,
  /Current inventory/i,
  /physical houses on site/i,
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|js|jsx|md|html|css)$/.test(name)) acc.push(p);
  }
  return acc;
}

const files = roots.flatMap((r) => walk(path.join(process.cwd(), r)));
let failed = false;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const re of forbidden) {
    if (re.test(text)) {
      console.error(`Forbidden inventory copy in ${file}: ${re}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`Guest copy gate passed (${files.length} files).`);
