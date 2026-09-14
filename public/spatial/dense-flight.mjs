import * as THREE from "./vendor/three.module.min.js";

const MIN = [20, -12, -8];
const MAX = [70, 20, 16];
const HOUSE_COLORS = { A:0xc98755, B:0xd6bc8c, C:0x78a96e, D:0xc69a64, E:0x9cab92, F:0xc4a077 };
let runtime = null;
let preparing = null;

function concatBytes(parts) {
  const chunks = parts.map((b64) => {
    const raw = atob(b64.replace(/\s/g, ""));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  });
  const total = chunks.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of chunks) { out.set(a, off); off += a.length; }
  return out;
}

function decodePoints(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = Math.floor(bytes.length / 9);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  let p = 0;
  for (let i = 0; i + 8 < bytes.length; i += 9) {
    const qx = view.getUint16(i, true), qy = view.getUint16(i + 2, true), qz = view.getUint16(i + 4, true);
    const x = MIN[0] + (MAX[0] - MIN[0]) * qx / 65535;
    const north = MIN[1] + (MAX[1] - MIN[1]) * qy / 65535;
    const up = MIN[2] + (MAX[2] - MIN[2]) * qz / 65535;
    positions[p] = x; positions[p + 1] = up; positions[p + 2] = -north;
    colors[p] = bytes[i + 6] / 255; colors[p + 1] = bytes[i + 7] / 255; colors[p + 2] = bytes[i + 8] / 255;
    p += 3;
  }
  return { positions, colors, count };
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

function addHouse(scene, h) {
  const r = h.diameterMetres / 2;
  const color = HOUSE_COLORS[h.spatialId] || 0xc49a64;
  const geo = new THREE.IcosahedronGeometry(r, 2);
  const shell = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.018, depthWrite:false }));
  shell.scale.y = .62; shell.position.set(h.localMetres.east, r * .38, -h.localMetres.north); scene.add(shell);
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color, transparent:true, opacity:.24 }));
  wire.scale.y = .62; wire.position.copy(shell.position); scene.add(wire);
}
async function buildRuntime() {
  const host = document.getElementById("stage");
  if (!host) throw new Error("dense-flight-host-missing");
  const [parts, flight, geo] = await Promise.all([
    Promise.all(Array.from({ length: 19 }, (_, i) => fetch(`/v3-3-proof/p0-points-${i}.b64`, { cache:"force-cache" }).then((r) => {
      if (!r.ok) throw new Error(`dense-chunk-${i}:${r.status}`); return r.text();
    }))),
    fetch("./world/flight-path.json", { cache:"force-cache" }).then((r) => r.json()),
    fetch("./AUMARA_WORLD_GEOREFERENCE_v1.json", { cache:"force-cache" }).then((r) => r.json()),
  ]);
  const decoded = decodePoints(concatBytes(parts));
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
  pointGeo.setAttribute("position", new THREE.BufferAttribute(decoded.positions, 3));
  pointGeo.setAttribute("color", new THREE.BufferAttribute(decoded.colors, 3));
  const points = new THREE.Points(pointGeo, new THREE.PointsMaterial({ size: mobile ? .095 : .07, vertexColors:true, transparent:true, opacity:.97, sizeAttenuation:true }));
  scene.add(points);
  const grid = new THREE.GridHelper(150, 30, 0x8e744f, 0x223129);
  grid.material.transparent = true; grid.material.opacity = .10; grid.position.y = -.25; scene.add(grid);
  for (const h of geo.houses.filter((house) => house.localMetres.east <= 70)) addHouse(scene, h);
  const route = flight.waypoints.slice(0, 11).map(routePoint);
  const routeGeo = new THREE.BufferGeometry().setFromPoints(route);
  const routeLine = new THREE.Line(routeGeo, new THREE.LineBasicMaterial({ color:0xd7ad72, transparent:true, opacity:.42 }));
  scene.add(routeLine);
  const bounds = new THREE.Box3().setFromBufferAttribute(pointGeo.getAttribute("position"));
  const resize = () => {
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
  };
  resize(); addEventListener("resize", resize);
  let active = false, raf = 0, startedAt = 0, firstFrame = false;
  const duration = 28000;
  const approachDuration = 5200;
  const overviewFrom = new THREE.Vector3(23, 18, 24);
  const overviewLook = new THREE.Vector3(43, 2.2, 0);
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
    renderer.render(scene, camera);
    if (!firstFrame) {
      firstFrame = true; window.__AUMARA_LOCAL_FRAME_VISIBLE = true;
      canvas.style.opacity = "1";
      const cesium = document.querySelector("#c canvas:not([data-aumara-glb-flight])");
      if (cesium) cesium.style.visibility = "hidden";
    }
    const state = window.__AUMARA || (window.__AUMARA = {});
    state.provider = "AUMARA_RGB_POINTCLOUD"; state.stage = "LOCAL_GUEST_FLIGHT";
    state.firstFrameRendered = firstFrame; state.localTwinVisible = true; state.localTwinLoaded = true; state.localPointCount = decoded.count;
    state.waypointReached = Math.min(27, Math.round(u * 27)); state.flightComplete = u >= 1; state.WP0_WP27_COMPLETE = u >= 1; state.fatalRenderError = false; state.renderError = null;
    if (u < 1) raf = requestAnimationFrame(render);
  }
  function start() {
    if (active) return true;
    active = true; firstFrame = false; window.__AUMARA_LOCAL_FRAME_VISIBLE = false; host.classList.add("local-world");
    canvas.style.display = "block"; canvas.style.opacity = "0"; startedAt = performance.now();
    const state = window.__AUMARA || (window.__AUMARA = {});
    state.provider = "AUMARA_RGB_POINTCLOUD"; state.stage = "LOCAL_GUEST_FLIGHT"; state.firstFrameRendered = false; state.waypointReached = 0; state.flightComplete = false; state.events = [{name:"LOCAL_TWIN_VISIBLE",t:Date.now()},{name:"WP0",t:Date.now()}];
    state.advanceTo = (seconds) => { startedAt = performance.now() - Math.min(duration, Math.max(0, Number(seconds) * 1000)); render(performance.now()); return true; };
    raf = requestAnimationFrame(render); return true;
  }
  function stop() {
    active = false; cancelAnimationFrame(raf); canvas.style.display = "none"; canvas.style.opacity = "0"; host.classList.remove("local-world");
    const cesium = document.querySelector("#c canvas:not([data-aumara-glb-flight])");
    if (cesium) cesium.style.visibility = "visible";
  }
  return { start, stop, bounds, pointCount: decoded.count, ready:true };
}

export function prepareAumaraDenseFlight() {
  if (runtime) return Promise.resolve(runtime);
  if (preparing) return preparing;
  preparing = buildRuntime().then((value) => { runtime = value; return value; }).finally(() => { preparing = null; });
  return preparing;
}
