export const GOOGLE_CONSENT_DEFAULT = Object.freeze({
  ad_storage: "denied",
  analytics_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
});

const GTAG_STUB =
  "window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};";

function isGaMeasurementId(id) {
  return /^G-[A-Z0-9]{6,12}$/.test(id);
}

function isGoogleAdsTagId(id) {
  return /^AW-\d{6,15}$/.test(id);
}

function escapeForSingleQuotedJs(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function buildGoogleTagScripts({ gaId = "", adsId = "" } = {}) {
  const safeGaId = isGaMeasurementId(gaId) ? gaId : "";
  const safeAdsId = isGoogleAdsTagId(adsId) ? adsId : "";
  const googleTagIds = [safeGaId, safeAdsId].filter(Boolean);
  const googleTagLoaderId = Array.from(new Set(googleTagIds))[0] ?? "";
  const escapedGaId = escapeForSingleQuotedJs(safeGaId);
  const escapedAdsId = escapeForSingleQuotedJs(safeAdsId);
  const googleTagConfigs = [
    safeGaId ? `window.gtag('config','${escapedGaId}',{send_page_view:false});` : "",
    safeAdsId ? `window.gtag('config','${escapedAdsId}');` : "",
  ].join("");

  const googleConsentDefaultScript =
    `${GTAG_STUB}window.gtag('consent','default',{` +
    `ad_storage:'${GOOGLE_CONSENT_DEFAULT.ad_storage}',` +
    `analytics_storage:'${GOOGLE_CONSENT_DEFAULT.analytics_storage}',` +
    `ad_user_data:'${GOOGLE_CONSENT_DEFAULT.ad_user_data}',` +
    `ad_personalization:'${GOOGLE_CONSENT_DEFAULT.ad_personalization}'` +
    "});";

  const googleTagInitScript = `${GTAG_STUB}window.gtag('js',new Date());${googleTagConfigs}`;

  return {
    googleTagLoaderId,
    googleConsentDefaultScript,
    googleTagInitScript,
  };
}
