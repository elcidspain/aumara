import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const gapDoc = JSON.parse(
  readFileSync(new URL("docs/ads-booking-conversion-gap.json", root), "utf8"),
);
const layoutSource = readFileSync(new URL("app/layout.tsx", root), "utf8");

test("machine-readable blocker doc lists exact remaining external actions", () => {
  assert.equal(gapDoc.issue, 34);
  assert.equal(gapDoc.status, "blocked_on_external_configuration");
  assert.deepEqual(gapDoc.site_side_verified.events, ["booking_click", "spatial_flight_open"]);
  assert.ok(Array.isArray(gapDoc.external_blockers));
  assert.equal(gapDoc.external_blockers.length, 3);
});

test("layout keeps Google tag loader and consent-safe defaults", () => {
  assert.match(layoutSource, /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=\$\{googleTagLoaderId\}/);
  assert.match(layoutSource, /window\.gtag\('consent','default',\{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'\}\)/);
  assert.match(layoutSource, /gaId \? `window\.gtag\('config','\$\{gaId\}',\{send_page_view:false\}\);` : ""/);
  assert.match(layoutSource, /adsId \? `window\.gtag\('config','\$\{adsId\}'\);` : ""/);
});
