import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildGoogleTagScripts, GOOGLE_CONSENT_DEFAULT } from "../lib/google-tag-scripts.mjs";

const root = new URL("..", import.meta.url);
const gapDoc = JSON.parse(
  readFileSync(new URL("docs/ads-booking-conversion-gap.json", root), "utf8"),
);
const layoutSource = readFileSync(new URL("app/layout.tsx", root), "utf8");

test("machine-readable blocker doc lists exact remaining external actions", () => {
  assert.equal(gapDoc.issue, 34);
  assert.equal(gapDoc.status, "blocked_on_external_configuration");
  assert.deepEqual(gapDoc.site_side_verified.events, ["booking_click", "spatial_flight_open"]);
  assert.equal(gapDoc.completion_receiver.status, "not_implemented");
  assert.match(gapDoc.completion_receiver.reason, /No authenticated Beds24-supported/);
  assert.equal(gapDoc.completion_receiver.implementation_gate.length, 3);
  assert.ok(Array.isArray(gapDoc.external_blockers));
  assert.equal(gapDoc.external_blockers.length, 3);
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
