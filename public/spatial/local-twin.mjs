import * as THREE from "./vendor/three.module.min.js";

const COLORS = {
  A: 0xc56a32, B: 0xe8dcc4, C: 0x3f7a3a,
  D: 0xddd0b4, E: 0x9b2f22, F: 0xc8b896,
};
const WOOD = 0x4a2c18;

function domeGroup(r, color) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(r, 2),
    new THREE.MeshStandardMaterial({
      color, roughness: 0.7, metalness: 0,
      emissive: color, emissiveIntensity: 0.28,
      flatShading: true, side: THREE.DoubleSide,
    }),
  );
  shell.position.y = r * 0.02;
  g.add(shell);
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.98, r * 1.04, 0.48, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: WOOD, roughness: 0.88, metalness: 0, side: THREE.DoubleSide }),
  );
  ring.position.y = 0.24;
  g.add(ring);
  return g;
}

window.runAumaraLocalTwin = async function runAumaraLocalTwin(opts) {
  const { geo, flight, hm, overlay } = opts;
  const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  const host = document.getElementById("c");
  host.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x8eacc0, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8eacc0);
  scene.fog = new THREE.Fog(0x8eacc0, 40, 220);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.15, 600);

  function resize() {
    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  scene.add(new THREE.HemisphereLight(0xfff1d6, 0x3d4a30, 1.35));
  const sun = new THREE.DirectionalLight(0xfff4dc, 2.4);
  sun.position.set(40, 70, 20);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffe6c8, 0.55));

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(240, 72),
    new THREE.MeshStandardMaterial({ color: 0x4d6a3e, roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  function sampleHM(east, north) {
    if (!hm) return 0.5;
    const u = (east - hm.east0) / hm.cell;
    const v = (north - hm.north0) / hm.cell;
    const c0 = Math.floor(u), r0 = Math.floor(v), tx = u - c0, ty = v - r0;
    function at(c, r) {
      const cc = Math.max(0, Math.min(hm.cols - 1, c));
      const rr = Math.max(0, Math.min(hm.rows - 1, r));
      return hm.heights_m[rr * hm.cols + cc];
    }
    return at(c0, r0) * (1 - tx) * (1 - ty) + at(c0 + 1, r0) * tx * (1 - ty) + at(c0, r0 + 1) * (1 - tx) * ty + at(c0 + 1, r0 + 1) * tx * ty;
  }

  const houses = geo.houses.map((h) => {
    const r = h.diameterMetres / 2;
    const mesh = domeGroup(r, COLORS[h.spatialId] || 0xc8b896);
    const z = sampleHM(h.localMetres.east, h.localMetres.north);
    mesh.position.set(h.localMetres.east, z, h.localMetres.north);
    scene.add(mesh);
    const el = document.createElement("button");
    el.className = "ar";
    el.type = "button";
    el.textContent = h.spatialId;
    el.style.display = "none";
    el.onclick = () => opts.openSheet?.(h);
    overlay.appendChild(el);
    return { h, el, mesh };
  });

  const wps = flight.waypoints;
  const dur = flight.duration_s_default || 48;
  function posAt(u) {
    const n = wps.length;
    u = Math.max(0, Math.min(1, u));
    const i = Math.min(n - 2, Math.floor(u * (n - 1)));
    const f = u * (n - 1) - i;
    const a = wps[i]?.local, b = wps[i + 1]?.local;
    const east = a.east + (b.east - a.east) * f;
    const north = a.north + (b.north - a.north) * f;
    return { east, north, y: sampleHM(east, north) + 3.72 };
  }

  let elapsed = 0, complete = false, maxWp = -1;
  const events = [];
  const emit = (name) => {
    if (!events.length || events[events.length - 1].name !== name) events.push({ name, t: Date.now() });
  };
  emit("LOCAL_TWIN_VISIBLE");

  window.__AUMARA = {
    provider: "LOCAL_THREE",
    stage: "LOCAL_GUEST_FLIGHT",
    firstFrameRendered: false,
    waypointReached: 0,
    flightComplete: false,
    WP0_WP27_COMPLETE: false,
    localTwinVisible: true,
    fatalRenderError: false,
    renderError: null,
    events,
    advanceTo(t) { elapsed = t; tick(0, true); },
  };

  function placeLabels() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    houses.forEach((node) => {
      const p = node.mesh.position.clone();
      p.y += node.h.diameterMetres * 0.55;
      p.project(camera);
      const on = p.z < 1 && p.x > -1.2 && p.x < 1.2 && p.y > -1.2 && p.y < 1.2;
      if (!on) { node.el.style.display = "none"; return; }
      node.el.style.display = "block";
      node.el.style.left = `${(p.x * 0.5 + 0.5) * width}px`;
      node.el.style.top = `${(-p.y * 0.5 + 0.5) * height}px`;
    });
  }

  function tick(dt, measure) {
    if (!complete) elapsed += dt;
    elapsed = Math.min(elapsed, dur);
    const u = Math.min(1, elapsed / dur);
    const intro = 2.4;
    if (elapsed < intro) {
      const t = elapsed / intro;
      const e = t * t * (3 - 2 * t);
      camera.position.set(14 - 2 * e, 24 - 12 * e, -28 + 18 * e);
      const here = posAt(0);
      camera.lookAt(52, 1.2 + (here.y - 1.2) * e, 4);
    } else {
      const pu = (elapsed - intro) / Math.max(0.01, dur - intro);
      const here = posAt(pu);
      const look = posAt(Math.min(1, pu + 0.04));
      camera.position.set(here.east, here.y, here.north);
      camera.lookAt(look.east, look.y - 0.35, look.north);
    }
    const wp = Math.min(27, Math.round(u * 27));
    if (wp > maxWp) {
      maxWp = wp;
      window.__AUMARA.waypointReached = wp;
      if (wp === 0) emit("WP0");
      if (wp === 27) emit("WP27");
    }
    if (elapsed >= dur - 0.02 && !complete) {
      complete = true;
      window.__AUMARA.flightComplete = true;
      window.__AUMARA.WP0_WP27_COMPLETE = true;
      window.__AUMARA.waypointReached = 27;
      emit("WP27");
    }
    if (!measure) {
      renderer.render(scene, camera);
      if (!window.__AUMARA.firstFrameRendered) window.__AUMARA.firstFrameRendered = true;
      placeLabels();
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(dt, false);
    if (!complete) requestAnimationFrame(loop);
    else { renderer.render(scene, camera); placeLabels(); }
  }
  emit("WP0");
  tick(0, false);
  requestAnimationFrame(loop);
};
