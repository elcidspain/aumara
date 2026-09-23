import * as THREE from "./vendor/three.module.min.js";

const WEST_MIN = [20, -12, -8];
const WEST_MAX = [70, 20, 16];
const EAST_MIN = [70, -12, -8];
const EAST_MAX = [95, 20, 16];
const HOUSE_COLORS = { A:0xc98755, B:0xd6bc8c, C:0x78a96e, D:0xc69a64, E:0x9cab92, F:0xc4a077 };
let runtime = null;
let preparing = null;

function decodeParts(parts, min, max) {
  const chunks = parts.map((b64) => {
    const raw = atob(b64.replace(/\s/g, ""));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  });
  const count = chunks.reduce((n, bytes) => n + Math.floor(bytes.length / 9), 0);
  const remainderBytes = chunks.reduce((n, bytes) => n + (bytes.length % 9), 0);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  let p = 0;
  for (const bytes of chunks) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const usable = bytes.length - (bytes.length % 9);
    for (let i = 0; i < usable; i += 9) {
      const qx = view.getUint16(i, true), qy = view.getUint16(i + 2, true), qz = view.getUint16(i + 4, true);
      const x = min[0] + (max[0] - min[0]) * qx / 65535;
      const north = min[1] + (max[1] - min[1]) * qy / 65535;
      const up = min[2] + (max[2] - min[2]) * qz / 65535;
      positions[p] = x; positions[p + 1] = up; positions[p + 2] = -north;
      colors[p] = bytes[i + 6] / 255; colors[p + 1] = bytes[i + 7] / 255; colors[p + 2] = bytes[i + 8] / 255;
      p += 3;
    }
  }
  return { positions, colors, count, remainderBytes };
}

function routePoint(wp) {
  return new THREE.Vector3(wp.local.east, wp.local.ground_z + (wp.target_agl_m ?? 3.75), -wp.local.north);
}

function interpolateRoute(path, u) {
  const n = path.length;
  const scaled = Math.max(0, Math.min(0.999999, u)) * (n - 1);
  const i = Math.min(n - 2, Math.floor(scaled));
  const f = scaled - i;
  return path[i].clone().lerp(path[i + 1], f);
}

function addHouseFootprint(scene, h) {
  const r = h.diameterMetres / 2;
  const color = HOUSE_COLORS[h.spatialId] || 0xc49a64;
  const points = [];
  for (let i = 0; i <= 64; i += 1) {
    const angle = i / 64 * Math.PI * 2;
    points.push(new THREE.Vector3(
      h.localMetres.east + Math.cos(angle) * r,
      0.04,
      -(h.localMetres.north + Math.sin(angle) * r),
    ));
  }
  const ring = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent:true, opacity:.18 }),
  );
  scene.add(ring);
}
async function buildRuntime() {
  const host = document.getElementById("stage");
  if (!host) throw new Error("dense-flight-host-missing");
  const [westParts, eastParts, flight, geo, eastMeta] = await Promise.all([
    Promise.all(Array.from({ length: 19 }, (_, i) => fetch(`/v3-3-proof/p0-points-${i}.b64`, { cache:"force-cache" }).then((r) => {
      if (!r.ok) throw new Error(`dense-west-chunk-${i}:${r.status}`); return r.text();
    }))),
    Promise.all(Array.from({ length: 5 }, (_, i) => fetch(`/v3-3-proof/p0-east-${i}.b64`, { cache:"force-cache" }).then((r) => {
      if (!r.ok) throw new Error(`dense-east-chunk-${i}:${r.status}`); return r.text();
    }))),
    fetch("./world/flight-path.json", { cache:"force-cache" }).then((r) => r.json()),
    fetch("./AUMARA_WORLD_GEOREFERENCE_v1.json", { cache:"force-cache" }).then((r) => r.json()),
    fetch("/v3-3-proof/p0_east_extension.json", { cache:"force-cache" }).then((r) => r.ok ? r.json() : null),
  ]);
  const west = decodeParts(westParts, WEST_MIN, WEST_MAX);
  const east = decodeParts(eastParts, EAST_MIN, EAST_MAX);
  if (west.count !== 37804) throw new Error(`dense-west-count:${west.count}`);
  if (east.count !== 8911) throw new Error(`dense-east-usable-count:${east.count}`);
  const totalCount = west.count + east.count;
  const positions = new Float32Array(totalCount * 3);
  const colors = new Float32Array(totalCount * 3);
  positions.set(west.positions, 0); positions.set(east.positions, west.positions.length);
  colors.set(west.colors, 0); colors.set(east.colors, west.colors.length);
  const canvas = document.createElement("canvas");
  canvas.dataset.aumaraGlbFlight = "dense";
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:none;opacity:0;transition:opacity .55s ease;z-index:1;pointer-events:none";
  host.insertBefore(canvas, document.getElementById("overlay"));
  const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha:false, powerPreference:"high-performance" });
  renderer.setPixelRatio(Math.min(mobile ? 1.35 : 1.8, devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x07110c, 1);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07110c); scene.fog = new THREE.Fog(0x07110c, 58, 145);
  const camera = new THREE.PerspectiveCamera(58, 1, .08, 450);
  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const pointMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPointScale: { value: mobile ? 2.25 : 1.95 },
      uFogColor: { value: new THREE.Color(0x07110c) },
    },
    vertexColors: true,
    transparent: true,
    depthTest: true,
    depthWrite: true,
    vertexShader: `
      varying vec3 vColor;
      varying float vDepth;
      uniform float uPointScale;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDepth = max(0.0, -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        float perspectiveScale = clamp(7.5 / max(1.0, vDepth), 0.72, 3.0);
        gl_PointSize = clamp(uPointScale * perspectiveScale, 1.35, 6.25);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vDepth;
      uniform vec3 uFogColor;
      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float radius = length(p);
        if (radius > 0.5) discard;
        float edge = 1.0 - smoothstep(0.32, 0.50, radius);
        float fog = smoothstep(58.0, 145.0, vDepth);
        vec3 color = mix(vColor, uFogColor, fog);
        float alpha = 0.97 * edge * mix(1.0, 0.42, fog);
        if (alpha < 0.025) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
  const points = new THREE.Points(pointGeo, pointMaterial);
  scene.add(points);
  for (const h of geo.houses) addHouseFootprint(scene, h);
  const route = flight.waypoints.map(routePoint);
  const bounds = new THREE.Box3().setFromBufferAttribute(pointGeo.getAttribute("position"));
  const resize = () => {
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
  };
  resize(); addEventListener("resize", resize);
  let active = false, raf = 0, startedAt = 0, firstFrame = false, onFinish = null, failure = null, cesiumHideTimer = 0;
  const duration = 36000;
  const approachDuration = 5200;
  const overviewFrom = new THREE.Vector3(24, 22, 28);
  const overviewLook = new THREE.Vector3(58, 2.0, -2);
  function render(now) {
    if (!active) return;
    const elapsed = now - startedAt;
    const u = Math.min(1, elapsed / duration);
    if (elapsed < approachDuration) {
      const t = elapsed / approachDuration, e = t * t * (3 - 2 * t);
      const first = route[0]; camera.position.copy(overviewFrom).lerp(first.clone().add(new THREE.Vector3(-2, 7, 8)), e);
      camera.lookAt(overviewLook.clone().lerp(route[Math.min(4, route.length - 1)], e));
    } else {
      const pu = (elapsed - approachDuration) / Math.max(1, duration - approachDuration);
      const here = interpolateRoute(route, pu), ahead = interpolateRoute(route, Math.min(1, pu + .035));
      camera.position.copy(here); camera.lookAt(ahead.x, ahead.y - .35, ahead.z);
    }
    try { renderer.render(scene, camera); } catch (error) { active = false; failure?.(error); return; }
    if (!firstFrame) {
      firstFrame = true; window.__AUMARA_LOCAL_FRAME_VISIBLE = true;
      // Crossfade over the still-valid map frame. Never expose a blank/grey handoff.
      canvas.style.opacity = "1";
      const cesium = document.querySelector("#c canvas:not([data-aumara-glb-flight])");
      clearTimeout(cesiumHideTimer);
      if (cesium) cesiumHideTimer = setTimeout(() => {
        if (active && firstFrame) cesium.style.visibility = "hidden";
      }, 650);
    }
    const state = window.__AUMARA || (window.__AUMARA = {});
    state.provider = "AUMARA_RGB_POINTCLOUD"; state.stage = "LOCAL_GUEST_FLIGHT";
    state.firstFrameRendered = firstFrame; state.localTwinVisible = true; state.localTwinLoaded = true; state.localPointCount = totalCount;
    state.westPointCount = west.count; state.eastPointCount = east.count; state.eastTrailingBytes = east.remainderBytes;
    state.eastDeclaredWorkingPoints = eastMeta?.east_working_points ?? null; state.eastExtensionPass = eastMeta?.pass === true;
    state.eastSeamMeanRatio = eastMeta?.seam_ratio_vs_baseline?.mean_ratio ?? null; state.fullSiteSourceSurface = false;
    state.waypointReached = Math.min(27, Math.round(u * 27)); state.flightComplete = u >= 1; state.WP0_WP27_COMPLETE = u >= 1; state.fatalRenderError = false; state.renderError = null;
    if (u < 1) raf = requestAnimationFrame(render); else { active = false; onFinish?.(); }
  }
  function start({ complete, error } = {}) {
    if (active) return true;
    active = true; firstFrame = false; onFinish = complete || null; failure = error || null; window.__AUMARA_LOCAL_FRAME_VISIBLE = false; host.classList.add("local-world");
    canvas.style.display = "block"; canvas.style.opacity = "0"; startedAt = performance.now();
    const state = window.__AUMARA || (window.__AUMARA = {});
    state.provider = "AUMARA_RGB_POINTCLOUD"; state.stage = "LOCAL_GUEST_FLIGHT"; state.firstFrameRendered = false; state.waypointReached = 0; state.flightComplete = false;
    state.localPointCount = totalCount; state.westPointCount = west.count; state.eastPointCount = east.count; state.eastTrailingBytes = east.remainderBytes;
    state.eastDeclaredWorkingPoints = eastMeta?.east_working_points ?? null; state.eastExtensionPass = eastMeta?.pass === true; state.fullSiteSourceSurface = false;
    state.events = [{name:"LOCAL_TWIN_VISIBLE",t:Date.now()},{name:"WP0",t:Date.now()}];
    state.advanceTo = (seconds) => { startedAt = performance.now() - Math.min(duration, Math.max(0, Number(seconds) * 1000)); render(performance.now()); return true; };
    raf = requestAnimationFrame(render); return true;
  }
  function stop() {
    active = false; cancelAnimationFrame(raf); clearTimeout(cesiumHideTimer); onFinish = null; failure = null; canvas.style.display = "none"; canvas.style.opacity = "0"; host.classList.remove("local-world");
    const cesium = document.querySelector("#c canvas:not([data-aumara-glb-flight])");
    if (cesium) cesium.style.visibility = "visible";
  }
  return { start, stop, bounds, pointCount: totalCount, westPointCount: west.count, eastPointCount: east.count, ready:true };
}

export function prepareAumaraDenseFlight() {
  if (runtime) return Promise.resolve(runtime);
  if (preparing) return preparing;
  preparing = buildRuntime().then((value) => { runtime = value; return value; }).finally(() => { preparing = null; });
  return preparing;
}
