"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./proof.module.css";

type P = { x: number; y: number; z: number; r: number; g: number; b: number };
type V3 = { x: number; y: number; z: number };

const WEST_MIN = [20, -12, -8] as const;
const WEST_MAX = [70, 20, 16] as const;
const EAST_MIN = [70, -12, -8] as const;
const EAST_MAX = [95, 20, 16] as const;

const WPS: V3[] = [
  { x: 23.254, y: -1.155, z: 4.467 }, { x: 26.698, y: -2.496, z: 4.524 }, { x: 30.143, y: -3.838, z: 4.536 },
  { x: 33.647, y: -4.810, z: 4.500 }, { x: 37.325, y: -4.526, z: 4.423 }, { x: 40.931, y: -3.715, z: 4.304 },
  { x: 44.538, y: -2.904, z: 4.144 }, { x: 48.144, y: -2.092, z: 3.961 }, { x: 51.799, y: -1.635, z: 3.775 },
  { x: 54.780, y: -0.116, z: 3.618 }, { x: 56.995, y: 2.843, z: 3.475 },
];

const HOUSES = [
  { id: "A", x: 35.254, y: 0.845, z: 0.505, d: 7 },
  { id: "B", x: 52.215, y: 4.961, z: -0.046, d: 9 },
  { id: "C", x: 63.556, y: 13.969, z: -0.241, d: 7 },
  { id: "D", x: 67.204, y: 0.633, z: -0.063, d: 9 },
  { id: "E", x: 76.680, y: 9.566, z: -0.066, d: 7 },
  { id: "F", x: 84.133, y: 0.755, z: 0.267, d: 7 },
];

function decodePoints(b64: string, min: readonly number[], max: readonly number[]): P[] {
  const raw = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const pts: P[] = [];
  for (let i = 0; i + 8 < bytes.length; i += 9) {
    const qx = view.getUint16(i, true);
    const qy = view.getUint16(i + 2, true);
    const qz = view.getUint16(i + 4, true);
    pts.push({
      x: min[0] + ((max[0] - min[0]) * qx) / 65535,
      y: min[1] + ((max[1] - min[1]) * qy) / 65535,
      z: min[2] + ((max[2] - min[2]) * qz) / 65535,
      r: bytes[i + 6],
      g: bytes[i + 7],
      b: bytes[i + 8],
    });
  }
  return pts;
}

async function fetchChunk(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.text();
}

export default function V33Proof() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<P[]>([]);
  const [yaw, setYaw] = useState(-0.72);
  const [pitch, setPitch] = useState(0.34);
  const [zoom, setZoom] = useState(1);
  const [auto, setAuto] = useState(true);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  useEffect(() => {
    Promise.all([
      Promise.all(Array.from({ length: 19 }, (_, i) => fetchChunk(`/v3-3-proof/p0-points-${i}.b64`))),
      Promise.all(Array.from({ length: 5 }, (_, i) => fetchChunk(`/v3-3-proof/p0-east-${i}.b64`))),
    ])
      .then(([westChunks, eastChunks]) => {
        const west = decodePoints(westChunks.join(""), WEST_MIN, WEST_MAX);
        const east = decodePoints(eastChunks.join(""), EAST_MIN, EAST_MAX);
        setPoints([...west, ...east]);
      })
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

    const centre = { x: 58.2, y: 1.2, z: 3.6 };
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const scale = Math.min(w / 78, h / 34) * zoom;
    const project = (p: V3) => {
      const x = p.x - centre.x;
      const y = p.y - centre.y;
      const z = p.z - centre.z;
      const rx = cy * x - sy * y;
      const ry = sy * x + cy * y;
      const yy = cp * ry - sp * z;
      const zz = sp * ry + cp * z;
      return { sx: w / 2 + rx * scale, sy: h / 2 - yy * scale, depth: zz };
    };

    ctx.strokeStyle = "rgba(196,154,100,.08)";
    ctx.lineWidth = 1;
    for (let gx = 20; gx <= 95; gx += 5) {
      const a = project({ x: gx, y: -15, z: 0 });
      const b = project({ x: gx, y: 20, z: 0 });
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }
    for (let gy = -15; gy <= 20; gy += 5) {
      const a = project({ x: 20, y: gy, z: 0 });
      const b = project({ x: 95, y: gy, z: 0 });
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }

    const seamA = project({ x: 70, y: -15, z: 0 });
    const seamB = project({ x: 70, y: 20, z: 0 });
    ctx.strokeStyle = "rgba(210,150,90,.45)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(seamA.sx, seamA.sy); ctx.lineTo(seamB.sx, seamB.sy); ctx.stroke();

    const drawn = points.map((p) => ({ p, s: project(p) })).sort((a, b) => a.s.depth - b.s.depth);
    for (const { p, s } of drawn) {
      if (s.sx < -8 || s.sx > w + 8 || s.sy < -8 || s.sy > h + 8) continue;
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.beginPath();
      ctx.arc(s.sx, s.sy, Math.max(0.75, 1.35 * zoom), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#d8ae76";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(216,174,118,.45)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    WPS.forEach((p, i) => {
      const s = project(p);
      i ? ctx.lineTo(s.sx, s.sy) : ctx.moveTo(s.sx, s.sy);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(104,215,156,.9)";
    ctx.fillStyle = "rgba(104,215,156,.08)";
    ctx.lineWidth = 2;
    for (const hse of HOUSES) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const s = project({ x: hse.x + Math.cos(a) * hse.d / 2, y: hse.y + Math.sin(a) * hse.d / 2, z: hse.z });
        i ? ctx.lineTo(s.sx, s.sy) : ctx.moveTo(s.sx, s.sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const s = project({ x: hse.x, y: hse.y, z: hse.z + 1 });
      ctx.fillStyle = "#8fe4b2";
      ctx.font = "700 12px system-ui";
      ctx.fillText(hse.id, s.sx + 5, s.sy - 5);
      ctx.fillStyle = "rgba(104,215,156,.08)";
    }
  }, [points, yaw, pitch, zoom]);

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
  const up = () => { drag.current = null; };

  return <main className={styles.page}><header className={styles.header}><div><div className={styles.kicker}>AUMARA · V3.3 DENSE SOURCE RECONSTRUCTION</div><h1>Actual geometry from MASTER_C (+ east recovery)</h1><p>Live spatial proof reconstructed from authoritative AUMARA media/source data for owner QA.</p></div><span className={styles.badge}>SANDBOX · OWNER QA</span></header><section className={styles.stageCard}><div className={styles.stageTop}><div><strong>{points.length || "…"}</strong><span>visible RGB source points</span></div><div className={styles.legend}><span className={styles.dotSource} />source geometry <span className={styles.dotRoute} />WP0–WP10 <span className={styles.dotHouse} />A–F footprints</div></div><canvas ref={canvasRef} className={styles.canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} /><div className={styles.controls}><button onClick={() => setZoom((v) => Math.max(0.55, v - 0.15))}>−</button><button onClick={() => { setYaw(-0.72); setPitch(0.34); setZoom(1); setAuto(false); }}>RESET</button><button onClick={() => setAuto((v) => !v)}>{auto ? "PAUSE" : "ORBIT"}</button><button onClick={() => setZoom((v) => Math.min(2.1, v + 0.15))}>+</button></div><div className={styles.hint}>Drag to rotate · seam guide at x≈70 · zoom with − / +</div></section><section className={styles.metrics}><article><span>SOURCE</span><strong>MASTER_C + canonical local georef</strong><p>West preserved exactly; east extension staged for owner QA with explicit seam diagnostics.</p></article><article><span>DENSE RECON</span><strong>37,804 west + 9,080 east = 46,884 target</strong><p>Recovered chunks p0-east-1..3 plus surviving chunks 0 and 4; seam join still pending alignment (see QA JSON).</p></article><article><span>REGISTRATION</span><strong>Seam diagnostic (gap quantified) at x≈70</strong><p>Machine-readable seam and E/F support diagnostics shipped in /public/v3-3-proof.</p></article></section><section className={styles.note}><strong>What you are looking at:</strong> colored points are reconstructed from AUMARA sources; gold is the canonical route; green rings are A–F footprint envelopes. This remains a sandbox owner-QA proof path.</section></main>;
}
