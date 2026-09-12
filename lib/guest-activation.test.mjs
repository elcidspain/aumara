import test from "node:test";
import assert from "node:assert/strict";

import { getGuestActivationEvent } from "./guest-activation.mjs";

test("tracks Beds24 booking links by host", () => {
  assert.deepEqual(
    getGuestActivationEvent("https://www.beds24.com/booking2.php?propid=324882", "https://aumara.me", "/"),
    {
      name: "booking_click",
      params: { destination: "beds24", page_path: "/" },
    },
  );

  assert.deepEqual(
    getGuestActivationEvent("https://book.aumara.beds24.com/booking2.php?propid=324882", "https://aumara.me", "/es"),
    {
      name: "booking_click",
      params: { destination: "beds24", page_path: "/es" },
    },
  );
});

test("does not treat non-Beds24 links as booking conversion", () => {
  assert.equal(
    getGuestActivationEvent("https://www.aumara.me/booking-confirmed", "https://aumara.me", "/"),
    null,
  );
});

test("tracks same-origin spatial links only", () => {
  assert.deepEqual(
    getGuestActivationEvent("/spatial/#flight", "https://aumara.me", "/"),
    {
      name: "spatial_flight_open",
      params: { page_path: "/" },
    },
  );

  assert.equal(
    getGuestActivationEvent("https://example.com/spatial/#flight", "https://aumara.me", "/"),
    null,
  );

  assert.equal(
    getGuestActivationEvent("https://aumara.me/spatiality", "https://aumara.me", "/"),
    null,
  );
});
