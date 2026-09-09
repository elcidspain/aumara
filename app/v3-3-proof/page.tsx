"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./proof.module.css";

type P = { x: number; y: number; z: number; r: number; g: number; b: number };
type V3 = { x: number; y: number; z: number };
type Proj = { sx: number; sy: number; depth: number };
type Seg = { a: V3; b: V3; stroke: string; width: number; depth: number };
type Poly = { pts: V3[]; fill: string; stroke: string; depth: number };

/** Quant envelope for densified chunks — DO NOT CHANGE (decode lock). */
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

/**
 * All six plan-true bookable houses A–F.
 * Locals = ΔUTM from origin 758784.34 / 4298083.43 EPSG:25830 (PR #13 / georef canon).
 * z ≈ 0.3 m ground (prior A/B/C ~0.5 / -0.05 / -0.24 — unified for AF6).
 */
const HOUSES = [
  { id: "A", x: 35.254, y: 0.845, z: 0.3, d: 7, superior: false, fill: "rgba(196,120,72,.18)", stroke: "rgba(214,156,108,.95)", strut: "rgba(232,180,130,.88)", label: "#e8b887", deck: "rgba(168,120,80,.28)" },
  { id: "B", x: 52.215, y: 4.961, z: 0.3, d: 9, superior: true, fill: "rgba(196,168,118,.16)", stroke: "rgba(214,188,140,.95)", strut: "rgba(236,210,160,.9)", label: "#e6d2a8", deck: "rgba(180,150,100,.32)" },
  { id: "C", x: 63.556, y: 13.969, z: 0.3, d: 7, superior: false, fill: "rgba(90,143,74,.16)", stroke: "rgba(122,176,108,.95)", strut: "rgba(150,200,130,.88)", label: "#a8d492", deck: "rgba(80,130,70,.28)" },
  { id: "D", x: 67.204, y: 0.633, z: 0.3, d: 9, superior: true, fill: "rgba(186,140,96,.16)", stroke: "rgba(210,170,120,.95)", strut: "rgba(230,190,140,.9)", label: "#efd0a0", deck: "rgba(170,130,90,.32)" },
  { id: "E", x: 76.68, y: 9.566, z: 0.3, d: 7, superior: false, fill: "rgba(120,150,110,.16)", stroke: "rgba(150,180,140,.95)", strut: "rgba(170,200,160,.88)", label: "#c0e0c0", deck: "rgba(100,140,100,.28)" },
  { id: "F", x: 84.133, y: 0.755, z: 0.3, d: 7, superior: false, fill: "rgba(160,120,90,.16)", stroke: "rgba(190,150,110,.95)", strut: "rgba(210,170,130,.88)", label: "#e0c0a0", deck: "rgba(140,110,80,.28)" },
] as const;

const HOUSE_COUNT = HOUSES.length; // === 6

const PATH_HALF_W = 0.75;
const PATH_WALL_H = 0.35;
const DOME_H_RATIO = 0.5;
/** Frequency-2 geodesic strut density (lat rings × lon segs) — wireframe, not smooth ball. */
const FREQ = 2;
const LAT_RINGS = 4 * FREQ; // 8
const LON_SEGS = 5 * FREQ; // 10 — pentagonal/hex feel

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
  const phi = lat * (Math.PI / 2);
  const rr = R * Math.cos(phi);
  const zz = hse.z + H * Math.sin(phi);
  return {
    x: hse.x + Math.cos(lon) * rr,
    y: hse.y + Math.sin(lon) * rr,
    z: zz,
  };
}

/** Frequency wireframe: meridional + parallel struts + diagonal braces (geodesic look). */
function buildHouseStruts(): Seg[] {
  const out: Seg[] = [];
  for (const hse of HOUSES) {
    // Parallel (latitude) rings
    for (let i = 0; i <= LAT_RINGS; i++) {
      const lat = i / LAT_RINGS;
      for (let j = 0; j < LON_SEGS; j++) {
        const lon0 = (j / LON_SEGS) * Math.PI * 2;
        const lon1 = ((j + 1) / LON_SEGS) * Math.PI * 2;
        out.push({
          a: domePoint(hse, lat, lon0),
          b: domePoint(hse, lat, lon1),
          stroke: hse.strut,
          width: i === 0 ? 2.4 : 1.15,
          depth: 0,
        });
      }
    }
    // Meridional struts (longitude)
    for (let j = 0; j < LON_SEGS; j++) {
      const lon = (j / LON_SEGS) * Math.PI * 2;
      for (let i = 0; i < LAT_RINGS; i++) {
        const lat0 = i / LAT_RINGS;
        const lat1 = (i + 1) / LAT_RINGS;
        out.push({
          a: domePoint(hse, lat0, lon),
          b: domePoint(hse, lat1, lon),
          stroke: hse.strut,
          width: 1.2,
          depth: 0,
        });
      }
    }
    // Diagonal braces (frequency feel) — every other panel
    for (let i = 0; i < LAT_RINGS; i++) {
      const lat0 = i / LAT_RINGS;
      const lat1 = (i + 1) / LAT_RINGS;
      for (let j = 0; j < LON_SEGS; j++) {
        if ((i + j) % 2 !== 0) continue;
        const lon0 = (j / LON_SEGS) * Math.PI * 2;
        const lon1 = ((j + 1) / LON_SEGS) * Math.PI * 2;
        out.push({
          a: domePoint(hse, lat0, lon0),
          b: domePoint(hse, lat1, lon1),
          stroke: hse.stroke,
          width: 0.85,
          depth: 0,
        });
      }
    }
  }
  return out;
}

/** Light translucent panels behind struts (structure readable, not fake smooth ball). */
function buildHousePanels(): Poly[] {
  const out: Poly[] = [];
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
          const apex = domePoint(hse, 1, 0);
          out.push({ pts: [p00, p01, apex], fill: hse.fill, stroke: "transparent", depth: 0 });
        } else {
          out.push({ pts: [p00, p01, p11, p10], fill: hse.fill, stroke: "transparent", depth: 0 });
        }
      }
    }
  }
  return out;
}

/** Platform / deck ring at ground — superior (B/D) get outer circular deck hint. */
function buildDeckRings(): Seg[] {
  const out: Seg[] = [];
  const N = 48;
  for (const hse of HOUSES) {
    const radii = hse.superior
      ? [hse.d / 2, hse.d / 2 + 0.55, hse.d / 2 + 1.15] // shell + deck lip + outer hint
      : [hse.d / 2, hse.d / 2 + 0.35];
    radii.forEach((R, ri) => {
      for (let j = 0; j < N; j++) {
        const a0 = (j / N) * Math.PI * 2;
        const a1 = ((j + 1) / N) * Math.PI * 2;
        out.push({
          a: { x: hse.x + Math.cos(a0) * R, y: hse.y + Math.sin(a0) * R, z: hse.z },
          b: { x: hse.x + Math.cos(a1) * R, y: hse.y + Math.sin(a1) * R, z: hse.z },
          stroke: ri === 0 ? hse.stroke : hse.deck.replace(/[\d.]+\)$/, "0.75)"),
          width: ri === 0 ? 2.6 : hse.superior && ri === 2 ? 2.0 : 1.4,
          depth: 0,
        });
      }
    });
  }
  return out;
}

/** Soft filled deck discs (outdoor flat — no photos). */
function buildDeckDiscs(): Poly[] {
  const out: Poly[] = [];
  const N = 36;
  for (const hse of HOUSES) {
    const R = hse.superior ? hse.d / 2 + 1.15 : hse.d / 2 + 0.35;
    const pts: V3[] = [];
    for (let j = 0; j < N; j++) {
      const a = (j / N) * Math.PI * 2;
      pts.push({ x: hse.x + Math.cos(a) * R, y: hse.y + Math.sin(a) * R, z: hse.z });
    }
    out.push({ pts, fill: hse.deck, stroke: hse.stroke, depth: 0 });
  }
  return out;
}

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
  const [yaw, setYaw] = useState(-0.55);
  const [pitch, setPitch] = useState(0.38);
  const [zoom, setZoom] = useState(1);
  const [auto, setAuto] = useState(true);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const houseStruts = useMemo(() => buildHouseStruts(), []);
  const housePanels = useMemo(() => buildHousePanels(), []);
  const deckRings = useMemo(() => buildDeckRings(), []);
  const deckDiscs = useMemo(() => buildDeckDiscs(), []);
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
      setYaw((v) => v + dt * 0.0001);
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

    // House-space centre so A–F (east 35→84) all fit; points may stay clipped to old envelope.
    const centre = { x: 58.5, y: 5.0, z: 3.2 };
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    // Zoomed out vs hybrid-volume (was w/52) so F@84 + deck clear of canvas edge.
    const scale = Math.min(w / 96, h / 52) * zoom;
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

    // Expanded ground grid covering A–F footprint
    ctx.strokeStyle = "rgba(196,154,100,.08)";
    ctx.lineWidth = 1;
    for (let gx = 20; gx <= 95; gx += 5) {
      const a = project({ x: gx, y: -15, z: 0 });
      const b = project({ x: gx, y: 22, z: 0 });
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    for (let gy = -15; gy <= 22; gy += 5) {
      const a = project({ x: 20, y: gy, z: 0 });
      const b = project({ x: 95, y: gy, z: 0 });
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }

    // Path volume WP0–WP10
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

    // Densified RGB points (unchanged load / quant)
    const drawn = points.map((p) => ({ p, s: project(p) })).sort((a, b) => a.s.depth - b.s.depth);
    for (const { p, s } of drawn) {
      if (s.sx < -8 || s.sx > w + 8 || s.sy < -8 || s.sy > h + 8) continue;
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.beginPath();
      ctx.arc(s.sx, s.sy, Math.max(0.75, 1.45 * zoom), 0, Math.PI * 2);
      ctx.fill();
    }

    // Deck discs (behind structure)
    const discs = deckDiscs.map((d) => {
      const s = d.pts.map(project);
      return { ...d, s, depth: s.reduce((n, p) => n + p.depth, 0) / s.length };
    });
    discs.sort((a, b) => a.depth - b.depth);
    for (const d of discs) {
      ctx.beginPath();
      d.s.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
      ctx.closePath();
      ctx.fillStyle = d.fill;
      ctx.fill();
    }

    // Light panels (structure readable, not smooth hemisphere fill)
    const panels = housePanels.map((f) => {
      const s = f.pts.map(project);
      return { ...f, s, depth: s.reduce((n, p) => n + p.depth, 0) / s.length };
    });
    panels.sort((a, b) => a.depth - b.depth);
    for (const f of panels) {
      ctx.beginPath();
      f.s.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
      ctx.closePath();
      ctx.fillStyle = f.fill;
      ctx.fill();
    }

    // Frequency wireframe struts
    const struts = houseStruts.map((sg) => {
      const pa = project(sg.a);
      const pb = project(sg.b);
      return { ...sg, pa, pb, depth: (pa.depth + pb.depth) / 2 };
    });
    struts.sort((a, b) => a.depth - b.depth);
    for (const sg of struts) {
      ctx.beginPath();
      ctx.moveTo(sg.pa.sx, sg.pa.sy);
      ctx.lineTo(sg.pb.sx, sg.pb.sy);
      ctx.strokeStyle = sg.stroke;
      ctx.lineWidth = sg.width;
      ctx.stroke();
    }

    // Platform / deck rings
    const rings = deckRings.map((sg) => {
      const pa = project(sg.a);
      const pb = project(sg.b);
      return { ...sg, pa, pb, depth: (pa.depth + pb.depth) / 2 };
    });
    rings.sort((a, b) => a.depth - b.depth);
    for (const sg of rings) {
      ctx.beginPath();
      ctx.moveTo(sg.pa.sx, sg.pa.sy);
      ctx.lineTo(sg.pb.sx, sg.pb.sy);
      ctx.strokeStyle = sg.stroke;
      ctx.lineWidth = sg.width;
      ctx.stroke();
    }

    // Labels A–F at apex
    for (const hse of HOUSES) {
      const apex = project(domePoint(hse, 1, 0));
      ctx.fillStyle = hse.label;
      ctx.font = "700 14px system-ui";
      ctx.fillText(hse.id, apex.sx + 6, apex.sy - 8);
      ctx.font = "600 10px ui-monospace,monospace";
      ctx.fillStyle = "rgba(232,220,190,.75)";
      ctx.fillText(`${hse.d}m`, apex.sx + 6, apex.sy + 6);
    }

    [0, 5, 10].forEach((i) => {
      const s = project(WPS[i]);
      ctx.fillStyle = "#f4dfbd";
      ctx.beginPath();
      ctx.arc(s.sx, s.sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "600 11px ui-monospace,monospace";
      ctx.fillText(`WP${i}`, s.sx + 7, s.sy - 7);
    });
  }, [points, yaw, pitch, zoom, houseStruts, housePanels, deckRings, deckDiscs, pathMesh]);

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
          <div className={styles.kicker}>AUMARA · V3.3 P0 HOUSES A–F · AF6</div>
          <h1>All six bookable geodesic houses bound to plan/UTM</h1>
          <p>
            Densified RGB source + frequency wireframe geodesic domes A–F (plan diameters 7/9/7/9/7/7 m) + platform/deck
            rings + WP0–WP10 path volume. houseCount={HOUSE_COUNT}. Sandbox only · NOT_PASS / owner QA.
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
            A–F geodesic houses ({HOUSE_COUNT})
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
          <button onClick={() => setZoom((v) => Math.max(0.45, v - 0.15))}>−</button>
          <button
            onClick={() => {
              setYaw(-0.55);
              setPitch(0.38);
              setZoom(1);
              setAuto(false);
            }}
          >
            RESET
          </button>
          <button onClick={() => setAuto((v) => !v)}>{auto ? "PAUSE" : "ORBIT"}</button>
          <button onClick={() => setZoom((v) => Math.min(2.4, v + 0.15))}>+</button>
        </div>
        <div className={styles.hint}>
          Drag to rotate · zoom − / + · houses A–F at true plan locals (F east≈84) · struts = geodesic structure
        </div>
      </section>
      <section className={styles.metrics}>
        <article>
          <span>SOURCE</span>
          <strong>MASTER_C · 8.00 s · 32 frames</strong>
          <p>
            P0 SPARSE_SFM_PASS (not 40). SHA fe9b2536…116452. 25,700 registered vertices. Densified chunks
            p0-points-0..18.b64 byte-identical / untouched.
          </p>
        </article>
        <article>
          <span>HOUSES A–F</span>
          <strong>houseCount={HOUSE_COUNT} · freq wireframe + deck</strong>
          <p>
            Plan/UTM locals from origin 758784.34 / 4298083.43 EPSG:25830. A–F all bookable. B &amp; D superior 9 m with
            circular deck hint. Outdoor flat colours only — no photo posters / interiors.
          </p>
        </article>
        <article>
          <span>REGISTRATION</span>
          <strong>WP0 → WP10 · RMS ≈ 0.88 m</strong>
          <p>XY 0.656 / Z 0.590 / 3D 0.882 m. Sandbox-not-survey. View expanded for E/F. Live freeze stands.</p>
        </article>
      </section>
      <section className={styles.note}>
        <strong>What you are looking at:</strong> all six bookable geodesic houses A–F bound to plan/UTM + densified
        source RGB (37,804) + WP0–WP10 path volume. Frequency wireframe struts + platform/deck rings (not smooth fake
        ball). houseCount={HOUSE_COUNT}. Sandbox AF6 proof; NOT_PASS until owner visual QA. No SfM / VGGT / GPU. Live
        untouched.
      </section>
    </main>
  );
}
