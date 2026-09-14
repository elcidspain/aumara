import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/addons/GLTFLoader.js';

let runtime = null;

function point(w) {
  return new THREE.Vector3(w.local.east, w.local.ground_z + w.target_agl_m, -w.local.north);
}

function clearHouses(v, houses) {
  let east = v.x, north = -v.z;
  for (const h of houses || []) {
    const he = h.local.east, hn = h.local.north;
    const need = h.diameterMetres / 2 + 2.0;
    const dx = east - he, dy = north - hn, d = Math.hypot(dx, dy) || 0.001;
    if (d < need) { const k = need / d; east = he + dx * k; north = hn + dy * k; }
  }
  v.x = east; v.z = -north; return v;
}

function at(path, houses, u) {
  u = Math.max(0, Math.min(0.999999, u));
  const q = u * (path.length - 1), i = Math.floor(q), f = q - i;
  return clearHouses(path[i].clone().lerp(path[Math.min(i + 1, path.length - 1)], f), houses);
}

export async function prepareAumaraGlbFlight() {
  if (runtime) return runtime;
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
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'none', zIndex: '1' });
  renderer.domElement.dataset.aumaraGlbFlight = '1';
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x91a59d);
  scene.fog = new THREE.FogExp2(0x91a59d, 0.0065);
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

  let active = false, startedAt = 0, raf = 0, firstLocalFrame = false;
  const duration = (flight.duration_s_default || 48) * 1000;
  function render(now) {
    if (!active) return;
    const u = Math.min(1, (now - startedAt) / duration);
    const p = at(path, houses, u >= 1 ? 0.999999 : u);
    const t = at(path, houses, Math.min(0.999999, u + 0.035));
    t.y -= 1.55;
    camera.position.copy(p); camera.lookAt(t); renderer.render(scene, camera);
    if (!firstLocalFrame) {
      firstLocalFrame = true;
      window.__AUMARA_LOCAL_FRAME_VISIBLE = true;
      const cesium = document.querySelector('#c canvas');
      if (cesium) cesium.style.visibility = 'hidden';
    }
    if (window.__AUMARA) {
      window.__AUMARA.localTwinVisible = true;
      window.__AUMARA.localTwinLoaded = true;
      window.__AUMARA.localRenderer = 'THREE_GLTF';
      window.__AUMARA.localGlbBounds = { min: bounds.min.toArray(), max: bounds.max.toArray() };
    }
    if (u < 1) raf = requestAnimationFrame(render);
  }
  function start() {
    if (active) return true;
    active = true; firstLocalFrame = false; window.__AUMARA_LOCAL_FRAME_VISIBLE = false; startedAt = performance.now(); renderer.domElement.style.display = 'block';
    raf = requestAnimationFrame(render); return true;
  }
  function stop() {
    active = false; cancelAnimationFrame(raf); renderer.domElement.style.display = 'none';
    const cesium = document.querySelector('#c canvas'); if (cesium) cesium.style.visibility = 'visible';
  }
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  runtime = { start, stop, bounds };
  return runtime;
}

window.AUMARA_PREPARE_GLTF_FLIGHT = prepareAumaraGlbFlight;
