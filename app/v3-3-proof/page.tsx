"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./proof.module.css";

type P = { x: number; y: number; z: number; r: number; g: number; b: number };
type V3 = { x: number; y: number; z: number };
type Proj = { sx: number; sy: number; depth: number };
type Facet = { a: V3; b: V3; c: V3; fill: string; stroke: string; depth: number };

const MIN = [20, -12, -8];
const MAX = [70, 20, 16];
const WPS: V3[] = [
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

/** Plan-lock A/B/C only (WP0–WP10 envelope). Outdoor flat materials — never photos. */
const HOUSES = [
  { id: "A", x: 35.254, y: 0.845, z: 0.505, d: 7, fill: "rgba(196,120,72,.34)", stroke: "rgba(214,156,108,.92)", label: "#e8b887" },
  { id: "B", x: 52.215, y: 4.961, z: -0.046, d: 9, fill: "rgba(196,168,118,.32)", stroke: "rgba(214,188,140,.92)", label: "#e6d2a8" },
  { id: "C", x: 63.556, y: 13.969, z: -0.241, d: 7, fill: "rgba(90,143,74,.32)", stroke: "rgba(122,176,108,.92)", label: "#a8d492" },
] as const;

const PATH_HALF_W = 0.75; // ~1.5 m ribbon
const PATH_WALL_H = 0.35;
const DOME_H_RATIO = 0.5; // hemisphere-ish height = 0.5 × diameter
const LAT_RINGS = 6;
const LON_SEGS = 16;

function concatDecodedChunks(parts: string[]): Uint8Array {
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

function decodePoints(bytes: Uint8Array): P[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const pts: P[] = [];
  for (let i = 0; i + 8 < bytes.length; i += 9) {
    const qx = view.getUint16(i, true);
    const qy = view.getUint16(i + 2, true);
    const qz = view.getUint16(i + 4, true);
    pts.push({
      x: MIN[0] + ((MAX[0] - MIN[0]) * qx) / 65535,
      y: MIN[1] + ((MAX[1] - MIN[1]) * qy) / 65535,
      z: MIN[2] + ((MAX[2] - MIN[2]) * qz) / 65535,
      r: bytes[i + 6],
      g: bytes[i + 7],
      b: bytes[i + 8],
    });
  }
  return pts;
}

function domePoint(hse: (typeof HOUSES)[number], lat: number, lon: number): V3 {
  const R = hse.d / 2;
  const H = hse.d * DOME_H_RATIO;
  // lat 0 = base ring, lat 1 = apex; radius shrinks with cos(lat * π/2)
  const phi = lat * (Math.PI / 2);
  const rr = R * Math.cos(phi);
  const zz = hse.z + H * Math.sin(phi);
  return {
    x: hse.x + Math.cos(lon) * rr,
    y: hse.y + Math.sin(lon) * rr,
    z: zz,
  };
}

function buildHouseFacets(): Facet[] {
  const out: Facet[] = [];
  for (const hse of HOUSES) {
    for (let i = 0; i < LAT_RINGS; i++) {
      const lat0 = i / LAT_RINGS;
      const lat1 = (i + 1) / LAT_RINGS;
      for (let j = 0; j < LON_SEGS; j++) {
        const lon0 = (j / LON_SEGS) * Math.PI * 2;
        const lon1 = ((j + 1) / LON_SEGS) * Math.PI * 2;
        const p00 = domePoint(hse, lat0, lon0);
        const p01 = domePoint(hse, lat0, lon1);
        const p10 = domePoint(hse, lat1, lon0);
        const p11 = domePoint(hse, lat1, lon1);
        if (i + 1 === LAT_RINGS) {
          // apex triangles
          const apex = domePoint(hse, 1, 0);
          out.push({
            a: p00,
            b: p01,
            c: apex,
            fill: hse.fill,
            stroke: hse.stroke,
            depth: 0,
          });
        } else {
          out.push({ a: p00, b: p01, c: p11, fill: hse.fill, stroke: hse.stroke, depth: 0 });
          out.push({ a: p00, b: p11, c: p10, fill: hse.fill, stroke: hse.stroke, depth: 0 });
        }
      }
    }
  }
  return out;
}

/** Lateral offsets for volumetric ribbon along WP polyline. */
function pathOffsets(pts: V3[], halfW: number): { left: V3[]; right: V3[]; topL: V3[]; topR: V3[] } {
  const left: V3[] = [];
  const right: V3[] = [];
  const topL: V3[] = [];
  const topR: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    let dx = next.x - prev.x;
    let dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const nx = -dy;
    const ny = dx;
    const p = pts[i];
    // Ground ribbon slightly below camera z (path sits on terrain-ish)
    const gz = Math.min(p.z - 2.8, p.z * 0.15 + 0.2);
    left.push({ x: p.x + nx * halfW, y: p.y + ny * halfW, z: gz });
    right.push({ x: p.x - nx * halfW, y: p.y - ny * halfW, z: gz });
    topL.push({ x: p.x + nx * halfW, y: p.y + ny * halfW, z: gz + PATH_WALL_H });
    topR.push({ x: p.x - nx * halfW, y: p.y - ny * halfW, z: gz + PATH_WALL_H });
  }
  return { left, right, topL, topR };
}

export default function V33Proof() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<P[]>([]);
  const [yaw, setYaw] = useState(-0.72);
  const [pitch, setPitch] = useState(0.34);
  const [zoom, setZoom] = useState(1);
  const [auto, setAuto] = useState(true);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const houseFacets = useMemo(() => buildHouseFacets(), []);
  const pathMesh = useMemo(() => pathOffsets(WPS, PATH_HALF_W), []);

  useEffect(() => {
    Promise.all(
      Array.from({ length: 19 }, (_, i) =>
        fetch(`/v3-3-proof/p0-points-${i}.b64`).then((r) => {
          if (!r.ok) throw new Error(`p0 chunk ${i}: ${r.status}`);
          return r.text();
        }),
      ),
    )
      .then((parts) => setPoints(decodePoints(concatDecodedChunks(parts))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!auto) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      setYaw((v) => v + dt * 0.00011);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.floor(w * dpr) || c.height !== Math.floor(h * dpr)) {
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const centre = { x: 46.2, y: 0.7, z: 3.8 };
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const scale = Math.min(w / 52, h / 34) * zoom;
    const project = (p: V3): Proj => {
      const x = p.x - centre.x;
      const y = p.y - centre.y;
      const z = p.z - centre.z;
      const rx = cy * x - sy * y;
      const ry = sy * x + cy * y;
      const yy = cp * ry - sp * z;
      const zz = sp * ry + cp * z;
      return { sx: w / 2 + rx * scale, sy: h / 2 - yy * scale, depth: zz };
    };

    // Ground grid
    ctx.strokeStyle = "rgba(196,154,100,.08)";
    ctx.lineWidth = 1;
    for (let gx = 20; gx <= 70; gx += 5) {
      const a = project({ x: gx, y: -15, z: 0 });
      const b = project({ x: gx, y: 20, z: 0 });
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    for (let gy = -15; gy <= 20; gy += 5) {
      const a = project({ x: 20, y: gy, z: 0 });
      const b = project({ x: 70, y: gy, z: 0 });
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }

    // --- Path volume (stone-border ribbon): deck + side walls + edge lines ---
    const { left, right, topL, topR } = pathMesh;
    type Quad = { pts: V3[]; fill: string; stroke: string; depth: number };
    const quads: Quad[] = [];
    for (let i = 0; i < left.length - 1; i++) {
      const deck: V3[] = [left[i], left[i + 1], right[i + 1], right[i]];
      const wallL: V3[] = [left[i], left[i + 1], topL[i + 1], topL[i]];
      const wallR: V3[] = [right[i], right[i + 1], topR[i + 1], topR[i]];
      const mid = (arr: V3[]) => {
        const s = arr.map(project);
        return s.reduce((n, p) => n + p.depth, 0) / s.length;
      };
      quads.push({ pts: deck, fill: "rgba(168,148,118,.38)", stroke: "rgba(210,190,150,.55)", depth: mid(deck) });
      quads.push({ pts: wallL, fill: "rgba(120,108,88,.42)", stroke: "rgba(190,170,130,.7)", depth: mid(wallL) });
      quads.push({ pts: wallR, fill: "rgba(120,108,88,.42)", stroke: "rgba(190,170,130,.7)", depth: mid(wallR) });
    }
    quads.sort((a, b) => a.depth - b.depth);
    for (const q of quads) {
      const s = q.pts.map(project);
      ctx.beginPath();
      s.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
      ctx.closePath();
      ctx.fillStyle = q.fill;
      ctx.fill();
      ctx.strokeStyle = q.stroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    // Top edge lines (stone border feel)
    ctx.strokeStyle = "rgba(232,210,170,.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    topL.forEach((p, i) => {
      const s = project(p);
      i ? ctx.lineTo(s.sx, s.sy) : ctx.moveTo(s.sx, s.sy);
    });
    ctx.stroke();
    ctx.beginPath();
    topR.forEach((p, i) => {
      const s = project(p);
      i ? ctx.lineTo(s.sx, s.sy) : ctx.moveTo(s.sx, s.sy);
    });
    ctx.stroke();

    // --- Densified RGB points (unchanged load) ---
    const drawn = points.map((p) => ({ p, s: project(p) })).sort((a, b) => a.s.depth - b.s.depth);
    for (const { p, s } of drawn) {
      if (s.sx < -8 || s.sx > w + 8 || s.sy < -8 || s.sy > h + 8) continue;
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.beginPath();
      ctx.arc(s.sx, s.sy, Math.max(0.85, 1.65 * zoom), 0, Math.PI * 2);
      ctx.fill();
    }

    // --- House geodesic shells (translucent volume + wire silhouette) ---
    const facets = houseFacets.map((f) => {
      const pa = project(f.a);
      const pb = project(f.b);
      const pc = project(f.c);
      return { ...f, pa, pb, pc, depth: (pa.depth + pb.depth + pc.depth) / 3 };
    });
    facets.sort((a, b) => a.depth - b.depth);
    ctx.lineWidth = 0.9;
    for (const f of facets) {
      ctx.beginPath();
      ctx.moveTo(f.pa.sx, f.pa.sy);
      ctx.lineTo(f.pb.sx, f.pb.sy);
      ctx.lineTo(f.pc.sx, f.pc.sy);
      ctx.closePath();
      ctx.fillStyle = f.fill;
      ctx.fill();
      ctx.strokeStyle = f.stroke;
      ctx.stroke();
    }
    // Base ring + label
    for (const hse of HOUSES) {
      ctx.beginPath();
      for (let i = 0; i <= LON_SEGS; i++) {
        const lon = (i / LON_SEGS) * Math.PI * 2;
        const s = project(domePoint(hse, 0, lon));
        i ? ctx.lineTo(s.sx, s.sy) : ctx.moveTo(s.sx, s.sy);
      }
      ctx.strokeStyle = hse.stroke;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      const apex = project(domePoint(hse, 1, 0));
      ctx.fillStyle = hse.label;
      ctx.font = "700 13px system-ui";
      ctx.fillText(hse.id, apex.sx + 6, apex.sy - 6);
    }

    // WP markers on path centreline (camera heights)
    [0, 5, 10].forEach((i) => {
      const s = project(WPS[i]);
      ctx.fillStyle = "#f4dfbd";
      ctx.beginPath();
      ctx.arc(s.sx, s.sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "600 11px ui-monospace,monospace";
      ctx.fillText(`WP${i}`, s.sx + 7, s.sy - 7);
    });
  }, [points, yaw, pitch, zoom, houseFacets, pathMesh]);

  const down = (e: React.PointerEvent) => {
    setAuto(false);
    drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setYaw(drag.current.yaw + (e.clientX - drag.current.x) * 0.008);
    setPitch(Math.max(-0.8, Math.min(1.05, drag.current.pitch + (e.clientY - drag.current.y) * 0.006)));
  };
  const up = () => {
    drag.current = null;
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.kicker}>AUMARA · V3.3 P0 HYBRID VOLUME</div>
          <h1>Densified source + plan-true house &amp; path volumes</h1>
          <p>
            Hybrid = densified RGB source points + geodesic A/B/C house shells (plan diameters 7/9/7 m) + volumetric
            WP0–WP10 path ribbon. Sandbox only · NOT_PASS / owner QA.
          </p>
        </div>
        <span className={styles.badge}>SANDBOX · OWNER QA · NOT_PASS</span>
      </header>
      <section className={styles.stageCard}>
        <div className={styles.stageTop}>
          <div>
            <strong>{points.length || "…"}</strong>
            <span>densified RGB source points</span>
          </div>
          <div className={styles.legend}>
            <span className={styles.dotSource} />
            densified source
            <span className={styles.dotRoute} />
            path volume WP0–WP10
            <span className={styles.dotHouse} />
            A/B/C house volumes
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
        <div className={styles.controls}>
          <button onClick={() => setZoom((v) => Math.max(0.55, v - 0.15))}>−</button>
          <button
            onClick={() => {
              setYaw(-0.72);
              setPitch(0.34);
              setZoom(1);
              setAuto(false);
            }}
          >
            RESET
          </button>
          <button onClick={() => setAuto((v) => !v)}>{auto ? "PAUSE" : "ORBIT"}</button>
          <button onClick={() => setZoom((v) => Math.min(2.1, v + 0.15))}>+</button>
        </div>
        <div className={styles.hint}>Drag to rotate · zoom with − / + · shells read as volume when orbiting</div>
      </section>
      <section className={styles.metrics}>
        <article>
          <span>SOURCE</span>
          <strong>MASTER_C · 8.00 s · 32 frames</strong>
          <p>P0 SPARSE_SFM_PASS (not 40). SHA fe9b2536…116452. 25,700 registered vertices. Densified chunks untouched.</p>
        </article>
        <article>
          <span>HOUSES + PATH</span>
          <strong>A/B/C geodesic shells · ribbon ~1.5 m</strong>
          <p>
            Plan-lock centres; height ≈ 0.5×diameter hemisphere. Path = extruded stone-border ribbon with side walls.
            Outdoor flat colours only — no photo posters.
          </p>
        </article>
        <article>
          <span>REGISTRATION</span>
          <strong>WP0 → WP10 · RMS ≈ 0.88 m</strong>
          <p>XY 0.656 / Z 0.590 / 3D 0.882 m. Sandbox-not-survey. Independent check-transform not applied.</p>
        </article>
      </section>
      <section className={styles.note}>
        <strong>What you are looking at:</strong> hybrid volume layer — densified source RGB points (37,804) +
        plan-true geodesic house volumes A/B/C + volumetric WP0–WP10 path ribbon. Not footprints-only. Sandbox densify
        + volume proof; NOT_PASS until owner visual QA. No SfM rerun / VGGT / GPU. Live freeze stands.
      </section>
    </main>
  );
}
