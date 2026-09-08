"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { loadP0Points, P0_HOUSES, type P0Point } from "@/lib/p0Points";
import { pathPolyline, sampleFlight, type HouseId } from "@/lib/l4Program";
import styles from "@/app/l4-flight/l4.module.css";

const Y_UP = new THREE.Vector3(0, 1, 0);

function Cloud({ points, size }: { points: P0Point[]; size: number }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(points.length * 3);
    const col = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.z;
      pos[i * 3 + 2] = p.y;
      col[i * 3] = p.r / 255;
      col[i * 3 + 1] = p.g / 255;
      col[i * 3 + 2] = p.b / 255;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [points]);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <points geometry={geom}>
      <pointsMaterial
        size={size}
        vertexColors
        sizeAttenuation
        depthWrite={false}
        toneMapped={false}
        fog={false}
      />
    </points>
  );
}

function House({
  id,
  x,
  y,
  z,
  d,
  color,
  active,
}: {
  id: string;
  x: number;
  y: number;
  z: number;
  d: number;
  color: string;
  active: boolean;
}) {
  const r = d / 2;
  return (
    <group position={[x, z + r * 0.42, y]}>
      <mesh>
        <sphereGeometry args={[r, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={active ? 0.5 : 0.28}
          roughness={0.72}
          metalness={0.04}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -r * 0.42, 0]}>
        <ringGeometry args={[r - 0.12, r, 48]} />
        <meshBasicMaterial
          color={active ? "#f0d090" : "#68d79c"}
          transparent
          opacity={active ? 1 : 0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Html distanceFactor={18} position={[0, r * 0.55, 0]}>
        <div
          style={{
            color: active ? "#ffe7b0" : "#8fe4b2",
            font: "700 13px system-ui",
            textShadow: "0 1px 4px #000",
            pointerEvents: "none",
          }}
        >
          {id}
        </div>
      </Html>
    </group>
  );
}

function FlightCam({
  playing,
  elapsed,
  look,
}: {
  playing: boolean;
  elapsed: React.MutableRefObject<number>;
  look: React.MutableRefObject<{ yaw: number; pitch: number }>;
}) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const qYaw = useMemo(() => new THREE.Quaternion(), []);
  const qPitch = useMemo(() => new THREE.Quaternion(), []);
  useFrame((state, delta) => {
    if (playing) elapsed.current += delta;
    const s = sampleFlight(elapsed.current);
    state.camera.position.set(...s.position);
    fwd.set(s.lookAt[0] - s.position[0], s.lookAt[1] - s.position[1], s.lookAt[2] - s.position[2]);
    if (fwd.lengthSq() < 1e-6) fwd.set(1, 0, 0);
    else fwd.normalize();
    right.crossVectors(fwd, Y_UP);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    else right.normalize();
    qYaw.setFromAxisAngle(Y_UP, look.current.yaw);
    qPitch.setFromAxisAngle(right, look.current.pitch);
    fwd.applyQuaternion(qYaw).applyQuaternion(qPitch);
    target.copy(state.camera.position).addScaledVector(fwd, 4);
    state.camera.lookAt(target);
  });
  return null;
}

function Scene({
  points,
  playing,
  elapsed,
  look,
  pointSize,
  activeHouse,
}: {
  points: P0Point[];
  playing: boolean;
  elapsed: React.MutableRefObject<number>;
  look: React.MutableRefObject<{ yaw: number; pitch: number }>;
  pointSize: number;
  activeHouse: HouseId | null;
}) {
  const pathPts = useMemo(() => pathPolyline(100), []);
  return (
    <>
      <color attach="background" args={["#06110c"]} />
      <fog attach="fog" args={["#06110c", 22, 90]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[30, 40, 12]} intensity={0.85} />
      <hemisphereLight args={["#c9ddd0", "#3a2a18", 0.2]} />
      <Cloud points={points} size={pointSize} />
      <Line points={pathPts} color="#d8ae76" lineWidth={1.5} transparent opacity={0.7} />
      {P0_HOUSES.map((h) => (
        <House key={h.id} {...h} active={activeHouse === h.id} />
      ))}
      <FlightCam playing={playing} elapsed={elapsed} look={look} />
    </>
  );
}

export default function L4Flight() {
  const [points, setPoints] = useState<P0Point[]>([]);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const [label, setLabel] = useState("TAKEOFF");
  const [activeHouse, setActiveHouse] = useState<HouseId | null>(null);
  const [hudDim, setHudDim] = useState(false);
  const [hint, setHint] = useState(true);
  const [gyro, setGyro] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const elapsed = useRef(0);
  const look = useRef({ yaw: 0, pitch: 0 });
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const gyroBase = useRef<{ yaw: number; pitch: number } | null>(null);

  useEffect(() => {
    loadP0Points().then(setPoints).catch(console.error);
  }, []);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 720);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("touchmove", block, { passive: false });
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = "";
      document.removeEventListener("touchmove", block);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = sampleFlight(elapsed.current);
      setTick(s.t);
      setLabel(s.label);
      setActiveHouse(s.phase === "PAD" || s.phase === "LANDING" ? s.house : null);
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const hide = window.setTimeout(() => {
      setHudDim(true);
      setHint(false);
    }, 2800);
    return () => window.clearTimeout(hide);
  }, []);

  useEffect(() => {
    if (!gyro) {
      gyroBase.current = null;
      return;
    }
    const onOrient = (e: DeviceOrientationEvent) => {
      const g = (e.gamma ?? 0) * (Math.PI / 180);
      const b = (e.beta ?? 0) * (Math.PI / 180);
      if (!gyroBase.current) gyroBase.current = { yaw: g, pitch: b };
      look.current.yaw = THREE.MathUtils.clamp((g - gyroBase.current.yaw) * 1.1, -1.2, 1.2);
      look.current.pitch = THREE.MathUtils.clamp((b - gyroBase.current.pitch) * 0.7, -0.55, 0.55);
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [gyro]);

  function wakeHud() {
    setHudDim(false);
    window.setTimeout(() => setHudDim(true), 2600);
  }

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { x: e.clientX, y: e.clientY, yaw: look.current.yaw, pitch: look.current.pitch };
    e.currentTarget.setPointerCapture(e.pointerId);
    setHint(false);
    wakeHud();
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    look.current.yaw = THREE.MathUtils.clamp(drag.current.yaw - dx * 0.0045, -1.35, 1.35);
    look.current.pitch = THREE.MathUtils.clamp(drag.current.pitch - dy * 0.0032, -0.6, 0.55);
  }

  function onUp() {
    drag.current = null;
  }

  async function enableGyro() {
    wakeHud();
    const orient = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    try {
      if (typeof orient.requestPermission === "function") {
        const perm = await orient.requestPermission();
        if (perm !== "granted") return;
      }
      setGyro(true);
    } catch {
      setGyro(false);
    }
  }

  return (
    <div
      className={styles.shell}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div className={`${styles.hud} ${hudDim ? styles.hudDim : ""}`}>
        <div>
          <div className={styles.kicker}>AUMARA · L4 · A → B → C</div>
          <h1 className={styles.title}>{label}</h1>
          <p className={styles.meta}>Fly between the houses. Land on A, B, then C. Slide to look. Not a video.</p>
        </div>
        <span className={styles.badge}>{activeHouse ? `PAD ${activeHouse}` : "IN FLIGHT"}</span>
      </div>
      <Canvas
        camera={{ fov: narrow ? 64 : 58, near: 0.12, far: 180, position: sampleFlight(0).position }}
        dpr={narrow ? [1, 1.35] : [1, 1.75]}
        gl={{ antialias: !narrow, powerPreference: "high-performance" }}
        style={{ touchAction: "none" }}
      >
        <Suspense fallback={null}>
          {points.length ? (
            <Scene
              points={points}
              playing={playing}
              elapsed={elapsed}
              look={look}
              pointSize={narrow ? 0.42 : 0.32}
              activeHouse={activeHouse}
            />
          ) : null}
        </Suspense>
      </Canvas>
      {hint ? <div className={styles.hint}>You are flying — landings at A, B, C</div> : null}
      <p className={styles.note}>
        {points.length ? `${points.length} clipped RGB source points` : "loading cloud…"} · {label}
      </p>
      <div className={styles.bar}>
        <button
          type="button"
          onClick={() => {
            setPlaying((v) => !v);
            wakeHud();
          }}
        >
          {playing ? "PAUSE" : "MOVE"}
        </button>
        <button
          type="button"
          onClick={() => {
            elapsed.current = 0;
            look.current = { yaw: 0, pitch: 0 };
            gyroBase.current = null;
            setPlaying(true);
            wakeHud();
          }}
        >
          REPLAY
        </button>
        <button type="button" onClick={() => (gyro ? setGyro(false) : enableGyro())} aria-pressed={gyro}>
          {gyro ? "GYRO ON" : "GYRO"}
        </button>
        <div className={styles.progress} aria-hidden="true">
          <span style={{ width: `${Math.round(tick * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
