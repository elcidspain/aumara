#!/usr/bin/env node
/**
 * Guest pages must preserve AUMARA truth and brand separation.
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


const guestHomePath = path.join(process.cwd(), "components/site/GuestHome.tsx");
const i18nPath = path.join(process.cwd(), "lib/i18n.ts");
const guestHome = fs.readFileSync(guestHomePath, "utf8");
const i18n = fs.readFileSync(i18nPath, "utf8");

const brandLeaks = [
  [guestHomePath, /EL_CID_URL/, "EL CID sister-brand link in AUMARA guest layer"],
  [guestHomePath, /className="elcid"/, "EL CID navigation item in AUMARA guest layer"],
  [guestHomePath, /href="#operator"/, "legal operator navigation promoted into AUMARA guest layer"],
  [guestHomePath, /id="operator"/, "legal operator body section promoted into AUMARA guest layer"],
  [i18nPath, /tagWest:\s*"[^"]*EL CID/i, "EL CID map label in AUMARA creative layer"],
  [i18nPath, /es:\s*\{\s*\.\.\.EN,/s, "Spanish guest copy falling back to English"],
];

const machineTruthFiles = [
  path.join(process.cwd(), "public/llms.txt"),
  path.join(process.cwd(), "public/.well-known/agent-skills/plan-aumara-stay/SKILL.md"),
  path.join(process.cwd(), "public/.well-known/agent-skills/find-aumara-availability/SKILL.md"),
  path.join(process.cwd(), "app/mcp/route.ts"),
];
for (const file of machineTruthFiles) {
  const source = fs.readFileSync(file, "utf8");
  if (/4\s*(?:×|x)?\s*Chalet/i.test(source) || /4 Chalet units/i.test(source)) {
    console.error(`Machine truth gate failed in ${file}: stale 4 Chalet + 2 Superior inventory`);
    failed = true;
  }
}

for (const [file, re, label] of brandLeaks) {
  const source = file === guestHomePath ? guestHome : i18n;
  if (re.test(source)) {
    console.error(`Brand/copy gate failed in ${file}: ${label}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`AUMARA guest truth/brand gate passed (${files.length} files).`);
