import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildGoogleTagScripts, GOOGLE_CONSENT_DEFAULT } from "../lib/google-tag-scripts.mjs";

const root = new URL("..", import.meta.url);
const gapDoc = JSON.parse(
  readFileSync(new URL("docs/ads-booking-conversion-gap.json", root), "utf8"),
);
const layoutSource = readFileSync(new URL("app/layout.tsx", root), "utf8");
const pmaxSource = readFileSync(new URL("docs/ADS_PMAX_INSTALL.md", root), "utf8");
const brandCanonSource = readFileSync(new URL("docs/BRAND_CANON.md", root), "utf8");

test("machine-readable blocker doc lists exact remaining external actions", () => {
  assert.equal(gapDoc.issue, 34);
  assert.equal(gapDoc.status, "blocked_on_external_configuration");
  assert.equal(gapDoc.site_side_verified.coverage, "next_guest_pages_only");
  assert.deepEqual(gapDoc.site_side_verified.events, ["booking_click", "spatial_flight_open"]);
  assert.match(gapDoc.cannot_measure_yet.join(" "), /standalone \/spatial\//);
  assert.equal(gapDoc.completion_receiver.status, "not_implemented");
  assert.match(gapDoc.completion_receiver.reason, /No authenticated Beds24-supported/);
  assert.equal(gapDoc.completion_receiver.implementation_gate.length, 3);
  assert.ok(Array.isArray(gapDoc.external_blockers));
  assert.equal(gapDoc.external_blockers.length, 4);
  assert.ok(gapDoc.external_blockers.some((blocker) => blocker.key === "spatial_click_coverage"));
});

test("canonical ads docs never treat an outbound Beds24 visit as Purchase/Book", () => {
  assert.doesNotMatch(pmaxSource, /Primary[^\n]*destination contains `beds24\.com\/booking2\.php`/i);
  assert.doesNotMatch(brandCanonSource, /Conversion 1[^\n]*destination contains `beds24\.com\/booking2\.php`/i);
  assert.match(pmaxSource, /Never use a destination rule that merely matches the Beds24 booking page or an outbound click/i);
  assert.match(brandCanonSource, /must never be used as the primary Purchase\/Book signal/i);
  assert.match(pmaxSource, /standalone `\/spatial\/` experience is not yet covered/i);
  assert.match(brandCanonSource, /standalone `\/spatial\/` static experience does not yet emit/i);
});

test("layout keeps Google tag loader and consent-safe defaults", () => {
  assert.equal(GOOGLE_CONSENT_DEFAULT.ad_storage, "denied");
  assert.equal(GOOGLE_CONSENT_DEFAULT.analytics_storage, "denied");
  assert.equal(GOOGLE_CONSENT_DEFAULT.ad_user_data, "denied");
  assert.equal(GOOGLE_CONSENT_DEFAULT.ad_personalization, "denied");

  const scripts = buildGoogleTagScripts({ gaId: "G-TEST123", adsId: "AW-11392880991" });
  assert.equal(scripts.googleTagLoaderId, "G-TEST123");
  assert.match(scripts.googleConsentDefaultScript, /window\.gtag\('consent','default'/);
  assert.match(scripts.googleConsentDefaultScript, /ad_storage:'denied'/);
  assert.match(scripts.googleTagInitScript, /window\.gtag\('config','G-TEST123',\{send_page_view:false\}\);/);
  assert.match(scripts.googleTagInitScript, /window\.gtag\('config','AW-11392880991'\);/);
  assert.equal(buildGoogleTagScripts({ adsId: "AW-11392880991" }).googleTagLoaderId, "AW-11392880991");
  assert.equal(
    buildGoogleTagScripts({ gaId: "AW-11392880991", adsId: "AW-11392880991" }).googleTagLoaderId,
    "AW-11392880991",
  );
  const rejected = buildGoogleTagScripts({ gaId: "G-TE'ST\\123", adsId: "AW-12'3" });
  assert.equal(rejected.googleTagLoaderId, "");
  assert.equal(
    rejected.googleTagInitScript,
    "window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};window.gtag('js',new Date());",
  );
});

test("layout wires helper-generated scripts into the DOM", () => {
  assert.match(layoutSource, /<Script id="google-consent-default" strategy="beforeInteractive">/);
  assert.match(layoutSource, /\{googleConsentDefaultScript\}/);
  assert.match(layoutSource, /<Script id="google-tags" strategy="afterInteractive">/);
  assert.match(layoutSource, /\{googleTagInitScript\}/);
});
