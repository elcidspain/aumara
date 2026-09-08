import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { padDistance, sampleFlight, totalDuration } from "./l4Program";

describe("L4 house landings", () => {
  it("runs long enough to land, not a jump-cut", () => {
    const d = totalDuration();
    assert.ok(d > 35 && d < 70, `duration ${d}`);
  });

  it("puts the camera on pads A, B and C", () => {
    const d = totalDuration();
    const hits = { A: false, B: false, C: false };
    for (let i = 0; i <= 400; i += 1) {
      const s = sampleFlight((i / 400) * d);
      if (s.phase === "PAD" && s.house) {
        assert.ok(padDistance(s, s.house) < 0.35, `${s.house} pad distance ${padDistance(s, s.house)}`);
        hits[s.house] = true;
      }
    }
    assert.deepEqual(hits, { A: true, B: true, C: true });
  });
});
