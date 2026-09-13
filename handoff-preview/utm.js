/* AUMARA UTM EPSG:25830 — zone 30N. Used for GLB grid + A–F labels. */
(function (global) {
  const a = 6378137.0, f = 1 / 298.257223563, k0 = 0.9996, E0 = 500000.0, N0 = 0.0;
  const lon0 = -3 * Math.PI / 180;
  const e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  function wgs84ToUtm30n(lonDeg, latDeg) {
    const φ = latDeg * Math.PI / 180, λ = lonDeg * Math.PI / 180;
    const sinφ = Math.sin(φ), cosφ = Math.cos(φ), tanφ = Math.tan(φ);
    const ν = a / Math.sqrt(1 - e2 * sinφ * sinφ);
    const t = tanφ * tanφ, C = ep2 * cosφ * cosφ, Aλ = (λ - lon0) * cosφ;
    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * φ
      - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * φ)
      + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * φ)
      - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * φ));
    return {
      easting: E0 + k0 * ν * (Aλ + (1 - t + C) * Aλ * Aλ * Aλ / 6
        + (5 - 18 * t + t * t + 72 * C - 58 * ep2) * Aλ * Aλ * Aλ * Aλ * Aλ / 120),
      northing: N0 + k0 * (M + ν * tanφ * (Aλ * Aλ / 2 + (5 - t + 9 * C + 4 * C * C) * Aλ * Aλ * Aλ * Aλ / 24
        + (61 - 58 * t + t * t + 600 * C - 330 * ep2) * Aλ * Aλ * Aλ * Aλ * Aλ * Aλ / 720)),
    };
  }
  function utm30nToWgs84(easting, northing) {
    const x = easting - E0, y = northing - N0;
    const M = y / k0;
    const μ = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    const φ1 = μ + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * μ)
      + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * μ)
      + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * μ)
      + (1097 * e1 * e1 * e1 * e1 / 512) * Math.sin(8 * μ);
    const sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1), tanφ1 = Math.tan(φ1);
    const ν1 = a / Math.sqrt(1 - e2 * sinφ1 * sinφ1);
    const ρ1 = a * (1 - e2) / Math.pow(1 - e2 * sinφ1 * sinφ1, 1.5);
    const C1 = ep2 * cosφ1 * cosφ1, T1 = tanφ1 * tanφ1, D = x / (ν1 * k0);
    const φ = φ1 - (ν1 * tanφ1 / ρ1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D * D * D * D / 24
      + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D * D * D * D * D * D / 720);
    const λ = lon0 + (D - (1 + 2 * T1 + C1) * D * D * D / 6
      + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D * D * D * D * D / 120) / cosφ1;
    return { lon: λ * 180 / Math.PI, lat: φ * 180 / Math.PI };
  }
  function localFromWgs84(lonDeg, latDeg, originE, originN) {
    const u = wgs84ToUtm30n(lonDeg, latDeg);
    return { east: u.easting - originE, north: u.northing - originN };
  }
  function wgs84FromLocal(east, north, originE, originN) {
    return utm30nToWgs84(originE + east, originN + north);
  }
  global.AUMARA_UTM = { wgs84ToUtm30n, utm30nToWgs84, localFromWgs84, wgs84FromLocal };
})(typeof window !== "undefined" ? window : globalThis);
