export function isGaMeasurementId(id) {
  return /^G-[A-Z0-9]{6,12}$/.test(String(id));
}

export function isGoogleAdsTagId(id) {
  return /^AW-\d{6,15}$/.test(String(id));
}
