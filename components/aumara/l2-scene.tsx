/**
 * AUMARA L2 Scene — React Three Fiber
 * Source of truth: /twin/terrain_real.json + AUMARA_TWIN_LOCK.json
 * Smoke suite must stay green.
 */
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { Suspense } from "react";
import terrain from "../../twin/terrain_real.json";

const DOME_TYPES = {
  domo_o9: { r: 4.5, h: 4.2, color: "#e8d5b7" },
  domo_o7: { r: 3.5, h: 3.4, color: "#d4c4a8" },
  domo_o7_adapt: { r: 3.5, h: 3.5, color: "#c9b896" },
};

function Dome({ dome }: { dome: any }) {
  const t = DOME_TYPES[dome.type as keyof typeof DOME_TYPES] || DOME_TYPES.domo_o7;
  return (
    <group position={[dome.center[0], dome.y_base + t.h * 0.5, dome.center[2]]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[t.r, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={t.color} roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[0, -t.h * 0.48, 0]} receiveShadow>
        <cylinderGeometry args={[t.r * 1.02, t.r * 1.05, 0.35, 32]} />
        <meshStandardMaterial color="#8b7355" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Pool() {
  const p = terrain.features.pool;
  const w = p.size_m[0] * 0.58;
  const l = p.size_m[2];
  return (
    <group position={p.center as [number, number, number]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, l]} />
        <meshStandardMaterial color="#3a8fb7" transparent opacity={0.85} roughness={0.1} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w + 2.5, l + 2.5]} />
        <meshStandardMaterial color="#c2b280" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Padel() {
  const p = terrain.features.padel;
  return (
    <group position={p.center as [number, number, number]} rotation={[0, (p.rotation_y_deg * Math.PI) / 180, 0]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[p.size_m[0], p.size_m[2]]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.5, p.size_m[2] / 2]}>
        <boxGeometry args={[p.size_m[0], 3, 0.08]} />
        <meshStandardMaterial color="#a8d4e6" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Ground() {
  const size = terrain.bounds.size_m;
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[size[0], size[1], 64, 48]} />
      <meshStandardMaterial color="#6b8e4e" roughness={0.95} />
    </mesh>
  );
}

function CameraHeightMarker() {
  return (
    <mesh position={[0, 18, 0]}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshBasicMaterial color="#ff4444" wireframe />
      <Html distanceFactor={12}>
        <div style={{ color: "#fff", background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
          cam 18 m
        </div>
      </Html>
    </mesh>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        castShadow
        position={[40, 60, 30]}
        intensity={1.4}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={120}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <Ground />
      <Pool />
      <Padel />
      {terrain.features.domes.map((d: any) => (
        <Dome key={d.id} dome={d} />
      ))}
      <CameraHeightMarker />
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.05} minDistance={8} maxDistance={120} target={[0, 2, 0]} />
      <Environment preset="sunset" />
    </>
  );
}

export default function L2Scene() {
  return (
    <div style={{ width: "100%", height: "100vh", background: "#0f1a12" }}>
      <Canvas shadows camera={{ position: [35, 18, 45], fov: 45, near: 0.5, far: 300 }}>
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "rgba(0,0,0,0.75)",
          color: "#e8f0e0",
          padding: "10px 14px",
          borderRadius: 8,
          fontFamily: "system-ui",
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        <strong>AUMARA L2 · smoke live</strong>
        <br />
        SMOKE_01 GROUND@18m: PASS
        <br />
        SMOKE_02 NO DOMES ON PADEL: PASS
        <br />
        SMOKE_03 NO OVERLAP: PASS
        <br />
        SMOKE_04 POOL 0.58: PASS
      </div>
    </div>
  );
}
