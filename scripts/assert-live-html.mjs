#!/usr/bin/env node
/**
 * Fetch public HTML to a complete local file, then parse it.
 * Never pipe curl into a closed consumer (curl 23 / broken pipe).
 */
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = (process.env.AUMARA_IDENTITY_BASE || "https://www.aumara.me").replace(/\/$/, "");
const dir = mkdtempSync(join(tmpdir(), "aumara-html-"));

async function save(path, destName) {
  const url = `${base}${path}`;
  const response = await fetch(url, {
    headers: { Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8" },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`${url} HTTP ${response.status}`);
  }
  const html = await response.text();
  if (!html) {
    throw new Error(`${url} empty body`);
  }
  const file = join(dir, destName);
  writeFileSync(file, html);
  const roundTrip = readFileSync(file, "utf8");
  if (roundTrip.length !== html.length) {
    throw new Error(`${file} incomplete write`);
  }
  return { url, file, html: roundTrip };
}

function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed)) blocks.push(...parsed);
    else blocks.push(parsed);
  }
  return blocks;
}

function typeOf(node) {
  const value = node && node["@type"];
  return Array.isArray(value) ? value : [value];
}

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  for (const value of Object.values(node)) walk(value, visit);
}

const home = await save("/", "home.html");
const faq = await save("/faq", "faq.html");
const chalet = await save("/chalet", "chalet.html");
const superior = await save("/superior", "superior.html");

const homeLd = jsonLdBlocks(home.html);
const lodging = homeLd.find((node) => typeOf(node).includes("LodgingBusiness"));
if (!lodging) throw new Error("home JSON-LD missing LodgingBusiness");
if (lodging.additionalType !== "House") {
  throw new Error(`home additionalType ${lodging.additionalType}, expected House`);
}
if (lodging.telephone !== "+34649242159") {
  throw new Error(`home telephone ${lodging.telephone}`);
}
if (!lodging.address || lodging.address.postalCode !== "03759") {
  throw new Error("home postalCode must be 03759");
}
if (lodging.address.addressLocality !== "Benidoleig") {
  throw new Error("home locality must be Benidoleig");
}
const action = lodging.potentialAction;
if (!action || action["@type"] !== "ReserveAction") {
  throw new Error("home missing ReserveAction");
}
const target = typeof action.target === "string" ? action.target : action.target?.urlTemplate;
if (!target || !target.includes("beds24.com/booking2.php?propid=324882")) {
  throw new Error(`home ReserveAction target ${target}`);
}

function assertUnitPage(page, expectedName) {
  const ld = jsonLdBlocks(page.html);
  const rental = ld.find((node) => typeOf(node).includes("VacationRental"));
  if (!rental) throw new Error(`${page.url} missing VacationRental`);
  if (rental.additionalType !== "Chalet") {
    throw new Error(`${page.url} additionalType ${rental.additionalType}, expected Chalet`);
  }
  if (rental.name !== expectedName) {
    throw new Error(`${page.url} name ${rental.name}`);
  }
}

assertUnitPage(chalet, "Chalet");
assertUnitPage(superior, "Superior Chalet");

if (!faq.html.includes("AUMARA es un bungalow?")) {
  throw new Error("faq missing bungalow denial question");
}
if (!faq.html.toLowerCase().includes("no es un bungalow")) {
  throw new Error("faq missing bungalow denial");
}

for (const page of [home, faq, chalet, superior]) {
  walk(jsonLdBlocks(page.html), (node) => {
    if (node.additionalType === "Bungalow" || typeOf(node).includes("Bungalow")) {
      throw new Error(`${page.url} published Bungalow as a lodging type`);
    }
  });
  if (page.html.includes("03750")) {
    throw new Error(`${page.url} still contains postcode 03750`);
  }
}

console.log(
  `AUMARA live HTML identity passed (${dir}). ` +
    "House/Chalet JSON-LD, 03759 Benidoleig, Elena phone, Beds24 ReserveAction.",
);
