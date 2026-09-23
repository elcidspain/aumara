// Globe and parcel approach. The existing ion configuration owns credentials.
let preparing;
let runtime;
const FLIGHT_SECONDS = 34;

export function prepareAumaraWorldFlight() {
  if (runtime) return Promise.resolve(runtime);
  if (preparing) return preparing;
  preparing = build().then(value => (runtime = value)).finally(() => { preparing = null; });
  return preparing;
}

async function build() {
  // The bundled globe starts independently of optional provider credentials.
  let base = 'https://cesium.com/downloads/cesiumjs/releases/1.134/Build/Cesium/';
  if (!window.Cesium) {
    const engineBases = [
      'https://unpkg.com/cesium@1.134.0/Build/Cesium/',
      'https://cesium.com/downloads/cesiumjs/releases/1.134/Build/Cesium/',
      'https://cdn.jsdelivr.net/npm/cesium@1.134.0/Build/Cesium/',
    ];
    let lastEngineError = null;
    for (const candidateBase of engineBases) {
      if (window.Cesium) break;
      window.CESIUM_BASE_URL = candidateBase;
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          const timer = setTimeout(() => {
            script.onerror = script.onload = null;
            script.remove();
            reject(new Error('global-engine-timeout'));
          }, 7000);
          script.src = candidateBase + 'Cesium.js';
          script.dataset.aumaraCesiumEngine = candidateBase;
          script.onload = () => { clearTimeout(timer); resolve(); };
          script.onerror = () => {
            clearTimeout(timer);
            script.remove();
            reject(new Error('global-engine-unavailable'));
          };
          document.head.appendChild(script);
        });
        if (window.Cesium) base = candidateBase;
      } catch (error) {
        lastEngineError = error;
      }
    }
    if (!window.Cesium) throw lastEngineError || new Error('global-engine-unavailable');
    window.CESIUM_BASE_URL = base;
    if (!document.querySelector('link[data-aumara-cesium-css]')) {
      const css = document.createElement('link');
      css.dataset.aumaraCesiumCss = '1';
      css.rel = 'stylesheet'; css.href = base + 'Widgets/widgets.css'; document.head.appendChild(css);
    }
  }
  const C = window.Cesium;
  window.AUMARA_ION?.apply(C);
  const response = await fetch('./AUMARA_WORLD_GEOREFERENCE_v1.json');
  if (!response.ok) throw new Error('georeference-unavailable');
  const geo = await response.json();
  const origin = geo.localOrigin.wgs84;
  const elevation = geo.verticalPolicy.projectReferenceElevationMslMetres;
  const imagery = await C.SingleTileImageryProvider.fromUrl('./world/blue-marble-2048.jpg', { credit: 'Blue Marble' });
  let imagerySource = 'LOCAL_BLUE_MARBLE';
  const detail = C.ArcGisMapServerImageryProvider.fromUrl(
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
  ).catch(() => null);
  const viewer = new C.Viewer('c', {
    baseLayer: new C.ImageryLayer(imagery),
    terrainProvider: new C.EllipsoidTerrainProvider(),
    animation:false, timeline:false, baseLayerPicker:false, geocoder:false,
    homeButton:false, sceneModePicker:false, navigationHelpButton:false,
    fullscreenButton:false, infoBox:false, selectionIndicator:false,
    requestRenderMode:true, maximumRenderTimeChange:Infinity,
    shadows:false, msaaSamples:1,
  });
  viewer.clock.shouldAnimate = false;
  viewer.scene.globe.enableLighting = false;
  viewer.scene.globe.maximumScreenSpaceError = 4;
  viewer.scene.screenSpaceCameraController.enableInputs = false;
  viewer.resolutionScale = Math.min(1, 1.5 / (devicePixelRatio || 1));
  let active = false, raf = 0, startedAt = 0, onFinish, onStage, failure;
  let photoTiles = null, photoStatus = 'PENDING', siteTilesVisible = false;
  let photoRequested = false, photoGeneration = 0;
  async function loadPhotorealisticMap() {
    if (photoRequested) return;
    photoRequested = true;
    const request = ++photoGeneration;
    let timer;
    try {
      await window.AUMARA_ION?.ready;
      if (!window.AUMARA_ION?.apply(C)) { photoStatus = 'UNCONFIGURED'; return; }
      const candidate = C.createGooglePhotorealistic3DTileset().then(tiles => {
        if (request !== photoGeneration || viewer.isDestroyed()) {
          tiles.destroy();
          throw new Error('map-tiles-expired');
        }
        return tiles;
      });
      const tiles = await Promise.race([
        candidate,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('map-tiles-timeout')), 12000); }),
      ]);
      if (request !== photoGeneration || viewer.isDestroyed()) { tiles.destroy(); return; }
      photoTiles = tiles;
      photoTiles.maximumScreenSpaceError = 12;
      photoTiles.cacheBytes = 96 * 1024 * 1024;
      photoTiles.maximumCacheOverflowBytes = 48 * 1024 * 1024;
      photoTiles.showCreditsOnScreen = true;
      photoTiles.show = false;
      photoTiles.tileVisible.addEventListener(() => {
        if (active && viewer.camera.positionCartographic.height < elevation + 1500) siteTilesVisible = true;
      });
      photoTiles.tileFailed.addEventListener(() => { photoStatus = 'PARTIAL'; });
      viewer.scene.primitives.add(photoTiles);
      photoStatus = 'READY';
      viewer.scene.requestRender();
    } catch (_) {
      photoGeneration += 1;
      photoStatus = 'UNAVAILABLE';
    } finally { clearTimeout(timer); }
  }
  const globalError = viewer.scene.renderError.addEventListener((scene, error) => {
    if (active) { stop(); failure?.(error); }
  });
  // Keep AUMARA as the visual anchor for the entire descent.
  // The camera descends over the verified site coordinates instead of panning
  // across Spain and only reacquiring the parcel at the end.
  const endLon = origin.longitude + 45 / (111320 * Math.cos(origin.latitude * Math.PI / 180));
  const endLat = origin.latitude - 70 / 110540;
  const keys = [
    [0, origin.longitude, origin.latitude, 18000000, 'Tierra'],
    [6, origin.longitude, origin.latitude, 1100000, 'España'],
    [11, origin.longitude, origin.latitude, 65000, 'Costa Blanca'],
    [16, origin.longitude, origin.latitude, 4500, 'Benidoleig'],
    [22, endLon, endLat, elevation + 280, 'AUMARA'],
  ];
  const targetCartesian = C.Cartesian3.fromDegrees(origin.longitude, origin.latitude, elevation + 8);
  function targetLockedOrientation(destination) {
    const direction = C.Cartesian3.subtract(targetCartesian, destination, new C.Cartesian3());
    C.Cartesian3.normalize(direction, direction);
    let seed = C.Ellipsoid.WGS84.geodeticSurfaceNormal(destination, new C.Cartesian3());
    let right = C.Cartesian3.cross(direction, seed, new C.Cartesian3());
    if (C.Cartesian3.magnitudeSquared(right) < 1e-10) {
      right = C.Cartesian3.cross(direction, C.Cartesian3.UNIT_Z, right);
    }
    C.Cartesian3.normalize(right, right);
    const up = C.Cartesian3.cross(right, direction, new C.Cartesian3());
    C.Cartesian3.normalize(up, up);
    return { direction, up };
  }
  function stop() { active = false; cancelAnimationFrame(raf); }
  function frame(now) {
    if (!active) return;
    const elapsed = Math.min(22, (now - startedAt) / 1000 * (22 / FLIGHT_SECONDS));
    let i = keys.findIndex((key, index) => index < keys.length - 1 && elapsed < keys[index + 1][0]);
    if (i < 0) i = keys.length - 2;
    const a = keys[i], b = keys[i + 1];
    const u = Math.max(0, Math.min(1, (elapsed - a[0]) / (b[0] - a[0])));
    const e = u * u * (3 - 2 * u);
    const mix = (x, y) => x + (y - x) * e;
    const rawHeight = Math.exp(mix(Math.log(a[3]), Math.log(b[3])));
    // A raster map is an aerial reference, not a ground-level 3D reconstruction.
    const height = Math.max(rawHeight, elevation + 280);
    if (photoTiles) photoTiles.show = height < 65000;
    if (!photoRequested) loadPhotorealisticMap();
    const destination = C.Cartesian3.fromDegrees(mix(a[1],b[1]), mix(a[2],b[2]), height);
    viewer.camera.setView({
      destination,
      orientation: targetLockedOrientation(destination),
    });
    viewer.scene.requestRender();
    if (window.__AUMARA) {
      window.__AUMARA.earthBasemapVisible = true;
      window.__AUMARA.globalImagerySource = imagerySource;
      window.__AUMARA.firstFrameRendered = true;
      window.__AUMARA.provider = 'CESIUM_SOURCE_MAP';
      window.__AUMARA.mapViewKind = siteTilesVisible ? 'PHOTOREALISTIC_3D_MAP' : 'SATELLITE_MAP';
      window.__AUMARA.photorealisticMapStatus = photoStatus;
      window.__AUMARA.aerialDurationSeconds = FLIGHT_SECONDS;
      window.__AUMARA.aerialFlightComplete = elapsed === 22;
      window.__AUMARA.flightComplete = elapsed === 22;
      window.__AUMARA.fullSiteSourceSurface = false;
      window.__AUMARA.waypointReached = null;
    }
    onStage?.(elapsed === 22 ? 'AUMARA' : a[4], elapsed / 22);
    if (elapsed < 22) raf = requestAnimationFrame(frame);
    else { active = false; onFinish?.(); }
  }
  function start({ complete, stage, error }) {
    stop(); onFinish = complete; onStage = stage; failure = error;
    const host = document.getElementById('c'); host.style.visibility = 'visible';
    siteTilesVisible = false;
    active = true; startedAt = performance.now(); frame(startedAt);
  }
  // Warm up on rendered frames, not globe.tilesLoaded. Single-tile imagery can remain
  // "loading" in headless/mobile even after a valid visible frame exists.
  await new Promise((resolve, reject) => {
    let renderedFrames = 0;
    const timer = setTimeout(() => { off(); reject(new Error('global-imagery-timeout')); }, 15000);
    const warmDestination = C.Cartesian3.fromDegrees(origin.longitude, origin.latitude, 18000000);
    viewer.camera.setView({ destination:warmDestination, orientation:targetLockedOrientation(warmDestination) });
    const off = viewer.scene.postRender.addEventListener(() => {
      const canvasReady = viewer.scene.canvas.width > 0 && viewer.scene.canvas.height > 0;
      const imageryReady = viewer.imageryLayers.length > 0;
      if (canvasReady && imageryReady) renderedFrames += 1;
      if (window.__AUMARA) window.__AUMARA.globalWarmup = {
        rendered:true, renderedFrames, tilesLoaded:viewer.scene.globe.tilesLoaded,
        width:viewer.scene.canvas.width, height:viewer.scene.canvas.height,
      };
      if (renderedFrames >= 2) {
        clearTimeout(timer); off(); resolve();
      }
      viewer.scene.requestRender();
    });
    viewer.scene.requestRender();
  }).catch(error => { globalError(); viewer.destroy(); throw error; });
  // Detailed imagery may refine during the flight; it never blocks the base globe.
  detail.then(provider => {
    if (!provider || viewer.isDestroyed()) return;
    viewer.imageryLayers.addImageryProvider(provider);
    imagerySource = 'BLUE_MARBLE_WITH_ESRI_DETAIL';
    viewer.scene.requestRender();
  });
  return { start, stop };
}
