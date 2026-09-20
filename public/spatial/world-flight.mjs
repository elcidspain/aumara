// Globe and parcel approach. The existing ion configuration owns credentials.
let preparing;
let runtime;

export function prepareAumaraWorldFlight() {
  if (runtime) return Promise.resolve(runtime);
  if (preparing) return preparing;
  preparing = build().then(value => (runtime = value)).finally(() => { preparing = null; });
  return preparing;
}

async function build() {
  await window.AUMARA_ION.ready;
  if (!window.AUMARA_ION.resolve()) throw new Error('global-imagery-unavailable');
  const base = 'https://cesium.com/downloads/cesiumjs/releases/1.134/Build/Cesium/';
  if (!window.Cesium) {
    window.CESIUM_BASE_URL = base;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => reject(new Error('global-engine-timeout')), 20000);
      script.src = base + 'Cesium.js';
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('global-engine-unavailable')); };
      document.head.appendChild(script);
    });
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = base + 'Widgets/widgets.css'; document.head.appendChild(css);
  }
  const C = window.Cesium;
  window.AUMARA_ION.apply(C);
  const response = await fetch('./AUMARA_WORLD_GEOREFERENCE_v1.json');
  if (!response.ok) throw new Error('georeference-unavailable');
  const geo = await response.json();
  const origin = geo.localOrigin.wgs84;
  const elevation = geo.verticalPolicy.projectReferenceElevationMslMetres;
  const viewer = new C.Viewer('c', {
    animation:false, timeline:false, baseLayerPicker:false, geocoder:false,
    homeButton:false, sceneModePicker:false, navigationHelpButton:false,
    fullscreenButton:false, infoBox:false, selectionIndicator:false,
    requestRenderMode:true, maximumRenderTimeChange:Infinity,
    shadows:false, msaaSamples:1,
  });
  viewer.clock.shouldAnimate = false;
  viewer.scene.globe.enableLighting = false;
  viewer.scene.screenSpaceCameraController.enableInputs = false;
  viewer.resolutionScale = Math.min(1, 1.5 / (devicePixelRatio || 1));
  let active = false, raf = 0, startedAt = 0, onFinish, onStage, failure;
  const globalError = viewer.scene.renderError.addEventListener((scene, error) => {
    if (active) { stop(); failure?.(error); }
  });
  // This local pose matches the first Three.js frame (east, up, -north).
  const endLon = origin.longitude + 60 / (111320 * Math.cos(origin.latitude * Math.PI / 180));
  const endLat = origin.latitude - 100 / 110540;
  const keys = [
    [0, -12, 29, 18000000, -90, 'Tierra'],
    [6, -3, 40, 1100000, -90, 'España'],
    [11, -.25, 38.8, 65000, -80, 'Costa Blanca'],
    [16, origin.longitude, origin.latitude, 4500, -65, 'Benidoleig'],
    [22, endLon, endLat, elevation + 85, -38.66, 'AUMARA'],
  ];
  function stop() { active = false; cancelAnimationFrame(raf); }
  function frame(now) {
    if (!active) return;
    const elapsed = Math.min(22, (now - startedAt) / 1000);
    let i = keys.findIndex((key, index) => index < keys.length - 1 && elapsed < keys[index + 1][0]);
    if (i < 0) i = keys.length - 2;
    const a = keys[i], b = keys[i + 1];
    const u = Math.max(0, Math.min(1, (elapsed - a[0]) / (b[0] - a[0])));
    const e = u * u * (3 - 2 * u);
    const mix = (x, y) => x + (y - x) * e;
    const height = Math.exp(mix(Math.log(a[3]), Math.log(b[3])));
    viewer.camera.setView({
      destination:C.Cartesian3.fromDegrees(mix(a[1],b[1]), mix(a[2],b[2]), height),
      orientation:{ heading:0, pitch:C.Math.toRadians(mix(a[4],b[4])), roll:0 },
    });
    viewer.scene.requestRender();
    onStage?.(elapsed === 22 ? 'AUMARA' : a[5], elapsed / 22);
    if (elapsed < 22) raf = requestAnimationFrame(frame);
    else { active = false; onFinish?.(); }
  }
  function start({ complete, stage, error }) {
    stop(); onFinish = complete; onStage = stage; failure = error;
    const host = document.getElementById('c'); host.style.visibility = 'visible';
    active = true; startedAt = performance.now(); frame(startedAt);
  }
  // Wait for an actual imagery tile before revealing the globe.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { off(); reject(new Error('global-imagery-timeout')); }, 15000);
    viewer.camera.setView({ destination:C.Cartesian3.fromDegrees(-12,29,18000000) });
    const off = viewer.scene.postRender.addEventListener(() => {
      if (viewer.scene.globe.tilesLoaded && viewer.imageryLayers.length > 0) {
        clearTimeout(timer); off(); resolve();
      }
    });
    viewer.scene.requestRender();
  }).catch(error => { globalError(); viewer.destroy(); throw error; });
  return { start, stop };
}
