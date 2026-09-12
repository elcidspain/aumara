/** GA4 measurement ID from Vercel env. Empty = no tag shipped. Do not invent an ID. */
export const GA_MEASUREMENT_ID = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "").trim();

export function isGaMeasurementId(id: string): boolean {
  return /^G-[A-Z0-9]{6,12}$/.test(id);
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const gtag = (window as typeof window & {
    gtag?: (command: "event", eventName: string, eventParams?: Record<string, unknown>) => void;
  }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, params);
}
