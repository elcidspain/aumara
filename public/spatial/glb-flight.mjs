import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/addons/GLTFLoader.js';

let runtime = null;
let preparing = null;

function point(w) {
  return new THREE.Vector3(w.local.east, w.local.ground_z + w.target_agl_m, -w.local.north);
}

function clearHouses(v, houses) {
  let east = v.x, north = -v.z;
  for (const h of houses || []) {
    const he = h.local.east, hn = h.local.north;
    const need = h.diameterMetres / 2 + 2.0;
    let dx = east - he, dy = north - hn;
    if (Math.hypot(dx, dy) < .001) { dx = 0; dy = -1; }
    const d = Math.hypot(dx, dy);
    if (d < need) { const k = need / d; east = he + dx * k; north = hn + dy * k; }
  }
  v.x = east; v.z = -north; return v;
}

function at(path, houses, u) {
  u = Math.max(0, Math.min(0.999999, u));
  const q = u * (path.length - 1), i = Math.floor(q), f = q - i;
  return clearHouses(path[i].clone().lerp(path[Math.min(i + 1, path.length - 1)], f), houses);
}

async function buildRuntime() {
  const stage = document.getElementById('stage');
  if (!stage) throw new Error('stage-missing');
  const [flight, gltf] = await Promise.all([
    fetch('./world/flight-path.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('flight-path:' + r.status); return r.json(); }),
    new GLTFLoader().loadAsync('./world/aumara-site-v2_1.glb'),
  ]);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'none', opacity:'0', transition:'opacity 900ms ease', zIndex: '1' });
  renderer.domElement.dataset.aumaraGlbFlight = '1';
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x91a59d);
  scene.fog = new THREE.Fog(0x91a59d, 140, 380);
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.08, 500);
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x384330, 2.2));
  const sun = new THREE.DirectionalLight(0xfff2d4, 3.2); sun.position.set(35, 70, 20); scene.add(sun);
  const world = gltf.scene;
  world.traverse(o => {
    if (o.name === 'veg_lod') o.visible = false;
    if (o.isMesh && o.material) { o.material.side = THREE.DoubleSide; o.material.needsUpdate = true; }
  });
  scene.add(world);
  const bounds = new THREE.Box3().setFromObject(world);
  if (bounds.isEmpty()) throw new Error('glb-bounds-empty');
  const path = flight.waypoints.map(point);
  const houses = flight.houses || [];
  const houseNodes = houses.map(h => world.getObjectByName('house_' + h.spatialId));
  if (houseNodes.length !== 6 || houseNodes.some(node => !node)) throw new Error('six-house-model-incomplete');
  world.updateMatrixWorld(true);
  const terrain = world.getObjectByName('terrain');
  if (!terrain) throw new Error('terrain-missing');
  const ray = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  function groundAt(p) {
    ray.set(new THREE.Vector3(p.x, bounds.max.y + 20, p.z), down);
    const hit = ray.intersectObject(terrain, true)[0];
    if (!hit) throw new Error('route-outside-terrain');
    return hit.point.y;
  }
  const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
  function routeAt(u) {
    const p = clearHouses(curve.getPoint(Math.max(0, Math.min(1, u))), houses);
    p.y = groundAt(p) + 3.75;
    return p;
  }
  // Validate the complete path before it can become the visible scene.
  for (let i = 0; i <= 280; i++) routeAt(i / 280);

  let active = false, startedAt = 0, raf = 0, firstLocalFrame = false, onComplete, onError;
  const duration = (flight.duration_s_default || 48) * 1000;
  const approach = 7000;
  const overview = new THREE.Vector3(60, 85, 100);
  const overviewTarget = new THREE.Vector3(60, 1, -5);
  function render(now) {
    if (!active) return;
    try {
    const elapsed = now - startedAt;
    const u = Math.max(0, Math.min(1, (elapsed - approach) / duration));
    const p = routeAt(u);
    const t = routeAt(Math.min(1, u + .025));
    if (u > .975) t.copy(p).add(p.clone().sub(routeAt(Math.max(0, u - .025))));
    t.y -= .4;
    if (elapsed < approach) {
      const q = Math.min(1, elapsed / approach), e = q * q * (3 - 2 * q);
      camera.position.copy(overview).lerp(p, e);
      camera.lookAt(overviewTarget.clone().lerp(t, e));
    } else { camera.position.copy(p); camera.lookAt(t); }
    renderer.render(scene, camera);
    if (!firstLocalFrame) {
      firstLocalFrame = true;
      window.__AUMARA_LOCAL_FRAME_VISIBLE = true;
      renderer.domElement.style.opacity = '1';
    }
    if (window.__AUMARA) {
      window.__AUMARA.localTwinVisible = true;
      window.__AUMARA.localTwinLoaded = true;
      window.__AUMARA.localRenderer = 'THREE_GLTF';
      window.__AUMARA.provider = 'AUMARA_TEXTURED_MODEL';
      window.__AUMARA.stage = elapsed < approach ? 'LOCAL_APPROACH' : 'LOCAL_ROUTE';
      window.__AUMARA.houseCount = houseNodes.length;
      window.__AUMARA.waypointReached = Math.min(path.length - 1, Math.floor(u * (path.length - 1)));
      window.__AUMARA.flightComplete = u === 1;
      window.__AUMARA.firstFrameRendered = true;
      window.__AUMARA.cameraAgl = elapsed >= approach ? camera.position.y - groundAt(camera.position) : null;
      window.__AUMARA.localGlbBounds = { min: bounds.min.toArray(), max: bounds.max.toArray() };
    }
    if (u < 1) raf = requestAnimationFrame(render);
    else { active = false; onComplete?.(); }
    } catch (error) { stop(); onError?.(error); }
  }
  function start(options = {}) {
    stop(); onComplete = options.complete; onError = options.error;
    active = true; firstLocalFrame = false; window.__AUMARA_LOCAL_FRAME_VISIBLE = false; startedAt = performance.now(); renderer.domElement.style.display = 'block';
    raf = requestAnimationFrame(render); return true;
  }
  function stop() {
    active = false; cancelAnimationFrame(raf); renderer.domElement.style.display = 'none'; renderer.domElement.style.opacity = '0';
    window.__AUMARA_LOCAL_FRAME_VISIBLE = false;
    const cesium = document.querySelector('#c canvas'); if (cesium) cesium.style.visibility = 'visible';
  }
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  runtime = { start, stop, bounds };
  return runtime;
}

export function prepareAumaraGlbFlight() {
  if (runtime) return Promise.resolve(runtime);
  if (!preparing) preparing = buildRuntime().finally(() => { preparing = null; });
  return preparing;
}

window.AUMARA_PREPARE_GLTF_FLIGHT = prepareAumaraGlbFlight;
