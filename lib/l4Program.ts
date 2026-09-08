import { P0_HOUSES, P0_WPS, toThree, type V3 } from "./p0Points";

export type HouseId = "A" | "B" | "C";
export type Phase = "TAKEOFF" | "CRUISE" | "LANDING" | "PAD" | "LIFTOFF";

export type FlightSample = {
  position: [number, number, number];
  lookAt: [number, number, number];
  phase: Phase;
  house: HouseId | null;
  label: string;
  t: number;
};

type Key = {
  p: V3;
  look: V3;
  dur: number;
  phase: Phase;
  house: HouseId | null;
  label: string;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpV(a: V3, b: V3, t: number): V3 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
}

function ease(t: number) {
  return t * t * (3 - 2 * t);
}

function lookFwd(from: V3, to: V3): V3 {
  return {
    x: from.x + (to.x - from.x) * 0.55,
    y: from.y + (to.y - from.y) * 0.55,
    z: from.z - 0.35,
  };
}

function houseLook(h: (typeof P0_HOUSES)[number]): V3 {
  return { x: h.x, y: h.y, z: h.z + h.d * 0.32 };
}

/** Camera on the pad, looking at the dome. */
export function padOf(h: (typeof P0_HOUSES)[number]): V3 {
  const r = h.d * 0.72;
  return {
    x: h.x - r * 1.05,
    y: h.y - r * 0.62,
    z: Math.max(2.05, h.z + 2.15),
  };
}

export function approachOf(h: (typeof P0_HOUSES)[number]): V3 {
  const r = h.d * 0.9;
  return {
    x: h.x - r * 1.2,
    y: h.y - r * 0.7,
    z: 4.35,
  };
}

function key(p: V3, look: V3, dur: number, phase: Phase, house: HouseId | null, label: string): Key {
  return { p, look, dur, phase, house, label };
}

export function buildKeys(): Key[] {
  const A = P0_HOUSES[0];
  const B = P0_HOUSES[1];
  const C = P0_HOUSES[2];
  const w = P0_WPS;
  const keys: Key[] = [];

  keys.push(key(w[0], lookFwd(w[0], w[1]), 0, "TAKEOFF", null, "TAKEOFF"));
  keys.push(key(w[1], lookFwd(w[1], w[2]), 2.1, "CRUISE", null, "BETWEEN HOUSES"));
  keys.push(key(w[2], lookFwd(w[2], w[3]), 2.0, "CRUISE", null, "BETWEEN HOUSES"));
  keys.push(key(w[3], lookFwd(w[3], approachOf(A)), 1.8, "CRUISE", "A", "TO A"));

  keys.push(key(approachOf(A), houseLook(A), 2.2, "LANDING", "A", "LANDING A"));
  keys.push(key(padOf(A), houseLook(A), 2.6, "LANDING", "A", "LANDING A"));
  keys.push(key(padOf(A), houseLook(A), 2.8, "PAD", "A", "ON PAD A"));
  keys.push(key(approachOf(A), houseLook(A), 1.7, "LIFTOFF", "A", "LIFTOFF A"));

  keys.push(key(w[4], lookFwd(w[4], w[5]), 2.0, "CRUISE", null, "A → B"));
  keys.push(key(w[5], lookFwd(w[5], w[6]), 1.8, "CRUISE", null, "A → B"));
  keys.push(key(w[6], lookFwd(w[6], w[7]), 1.8, "CRUISE", null, "A → B"));
  keys.push(key(w[7], lookFwd(w[7], approachOf(B)), 1.7, "CRUISE", "B", "TO B"));

  keys.push(key(approachOf(B), houseLook(B), 2.2, "LANDING", "B", "LANDING B"));
  keys.push(key(padOf(B), houseLook(B), 2.6, "LANDING", "B", "LANDING B"));
  keys.push(key(padOf(B), houseLook(B), 2.8, "PAD", "B", "ON PAD B"));
  keys.push(key(approachOf(B), houseLook(B), 1.7, "LIFTOFF", "B", "LIFTOFF B"));

  keys.push(key(w[8], lookFwd(w[8], w[9]), 1.8, "CRUISE", null, "B → C"));
  keys.push(key(w[9], lookFwd(w[9], w[10]), 1.7, "CRUISE", null, "B → C"));
  keys.push(key(w[10], lookFwd(w[10], approachOf(C)), 2.0, "CRUISE", "C", "TO C"));

  keys.push(key(approachOf(C), houseLook(C), 2.4, "LANDING", "C", "LANDING C"));
  keys.push(key(padOf(C), houseLook(C), 2.8, "LANDING", "C", "LANDING C"));
  keys.push(key(padOf(C), houseLook(C), 3.2, "PAD", "C", "ON PAD C"));

  const climb = { x: 48, y: 6, z: 7.2 };
  keys.push(key(climb, lookFwd(climb, w[0]), 3.4, "CRUISE", null, "RETURN"));
  keys.push(key(w[0], lookFwd(w[0], w[1]), 3.0, "TAKEOFF", null, "TAKEOFF"));

  return keys;
}

const KEYS = buildKeys();

export function totalDuration(keys = KEYS): number {
  return keys.reduce((n, k) => n + k.dur, 0);
}

export const L4_DURATION_S = totalDuration();

export function sampleFlight(timeS: number, keys = KEYS): FlightSample {
  const total = totalDuration(keys);
  let t = ((timeS % total) + total) % total;
  let acc = 0;
  for (let i = 1; i < keys.length; i += 1) {
    const next = keys[i];
    const dur = Math.max(0.001, next.dur);
    if (t <= acc + dur) {
      const u = ease((t - acc) / dur);
      const prev = keys[i - 1];
      const p = lerpV(prev.p, next.p, u);
      const look = lerpV(prev.look, next.look, u);
      const live = next;
      return {
        position: toThree(p),
        lookAt: toThree(look),
        phase: live.phase,
        house: live.house,
        label: live.label,
        t: t / total,
      };
    }
    acc += dur;
  }
  const last = keys[keys.length - 1];
  return {
    position: toThree(last.p),
    lookAt: toThree(last.look),
    phase: last.phase,
    house: last.house,
    label: last.label,
    t: 1,
  };
}

export function pathPolyline(steps = 120, keys = KEYS): [number, number, number][] {
  const total = totalDuration(keys);
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    pts.push(sampleFlight((i / steps) * total, keys).position);
  }
  return pts;
}

export function padDistance(sample: FlightSample, houseId: HouseId): number {
  const h = P0_HOUSES.find((x) => x.id === houseId);
  if (!h) return Infinity;
  const pad = toThree(padOf(h));
  const dx = sample.position[0] - pad[0];
  const dy = sample.position[1] - pad[1];
  const dz = sample.position[2] - pad[2];
  return Math.hypot(dx, dy, dz);
}
