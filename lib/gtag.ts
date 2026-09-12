import {
  isGaMeasurementId as validateGaMeasurementId,
  isGoogleAdsTagId as validateGoogleAdsTagId,
} from "./google-tag-ids.mjs";

/** GA4 measurement ID from Vercel env. Empty = no GA4 tag shipped. Do not invent an ID. */
export const GA_MEASUREMENT_ID = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "").trim();

/** Public Google Ads tag for the connected AUMARA advertiser. Safe to expose client-side. */
export const GOOGLE_ADS_TAG_ID = (process.env.NEXT_PUBLIC_GOOGLE_ADS_TAG_ID ?? "AW-11392880991").trim();

export function isGaMeasurementId(id: string): boolean {
  return validateGaMeasurementId(id);
}

export function isGoogleAdsTagId(id: string): boolean {
  return validateGoogleAdsTagId(id);
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const gtag = (window as typeof window & {
    gtag?: (command: "event", eventName: string, eventParams?: Record<string, unknown>) => void;
  }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, params);
}
