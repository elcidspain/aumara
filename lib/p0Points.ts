export type P0Point = { x: number; y: number; z: number; r: number; g: number; b: number };
export type V3 = { x: number; y: number; z: number };

export const P0_QUANT_MIN = [20, -12, -8] as const;
export const P0_QUANT_MAX = [70, 20, 16] as const;

/** WP0–WP10 camera positions in local metres: x=east, y=north, z=up. */
export const P0_WPS: V3[] = [
  { x: 23.254, y: -1.155, z: 4.467 },
  { x: 26.698, y: -2.496, z: 4.524 },
  { x: 30.143, y: -3.838, z: 4.536 },
  { x: 33.647, y: -4.81, z: 4.5 },
  { x: 37.325, y: -4.526, z: 4.423 },
  { x: 40.931, y: -3.715, z: 4.304 },
  { x: 44.538, y: -2.904, z: 4.144 },
  { x: 48.144, y: -2.092, z: 3.961 },
  { x: 51.799, y: -1.635, z: 3.775 },
  { x: 54.78, y: -0.116, z: 3.618 },
  { x: 56.995, y: 2.843, z: 3.475 },
];

export const P0_HOUSES = [
  { id: "A", x: 35.254, y: 0.845, z: 0.505, d: 7, color: "#c47848" },
  { id: "B", x: 52.215, y: 4.961, z: -0.046, d: 9, color: "#d4c4a0" },
  { id: "C", x: 63.556, y: 13.969, z: -0.241, d: 7, color: "#5a8f4a" },
] as const;

export function concatDecodedChunks(parts: string[]): Uint8Array {
  const chunks = parts.map((b64) => {
    const raw = atob(b64.replace(/\s/g, ""));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  });
  const total = chunks.reduce((n, a) => n + a.length, 0);
  const bytes = new Uint8Array(total);
  let off = 0;
  for (const a of chunks) {
    bytes.set(a, off);
    off += a.length;
  }
  return bytes;
}

export function decodePoints(bytes: Uint8Array): P0Point[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const pts: P0Point[] = [];
  for (let i = 0; i + 8 < bytes.length; i += 9) {
    const qx = view.getUint16(i, true);
    const qy = view.getUint16(i + 2, true);
    const qz = view.getUint16(i + 4, true);
    pts.push({
      x: P0_QUANT_MIN[0] + ((P0_QUANT_MAX[0] - P0_QUANT_MIN[0]) * qx) / 65535,
      y: P0_QUANT_MIN[1] + ((P0_QUANT_MAX[1] - P0_QUANT_MIN[1]) * qy) / 65535,
      z: P0_QUANT_MIN[2] + ((P0_QUANT_MAX[2] - P0_QUANT_MIN[2]) * qz) / 65535,
      r: bytes[i + 6],
      g: bytes[i + 7],
      b: bytes[i + 8],
    });
  }
  return pts;
}

export function loadP0Points(): Promise<P0Point[]> {
  return Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      fetch(`/v3-3-proof/p0-points-${i}.b64`).then((r) => {
        if (!r.ok) throw new Error(`p0 chunk ${i}: ${r.status}`);
        return r.text();
      }),
    ),
  ).then((parts) => decodePoints(concatDecodedChunks(parts)));
}

/** Three.js Y-up: [east, up, north] */
export function toThree(p: V3): [number, number, number] {
  return [p.x, p.z, p.y];
}
