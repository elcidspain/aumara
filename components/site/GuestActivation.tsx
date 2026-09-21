"use client";

import { useEffect } from "react";
import { getGuestActivationEvent } from "@/lib/guest-activation.mjs";
import {
  GOOGLE_ADS_BOOKING_CLICK_SEND_TO,
  isGoogleAdsConversionSendTo,
  trackEvent,
  trackGoogleAdsConversion,
} from "@/lib/gtag";

export default function GuestActivation() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const trackedEvent = getGuestActivationEvent(anchor.href, location.origin, location.pathname);
      if (!trackedEvent) return;

      trackEvent(trackedEvent.name, trackedEvent.params);

      if (
        trackedEvent.name === "booking_click" &&
        isGoogleAdsConversionSendTo(GOOGLE_ADS_BOOKING_CLICK_SEND_TO)
      ) {
        trackGoogleAdsConversion(GOOGLE_ADS_BOOKING_CLICK_SEND_TO, {
          event_category: "booking",
          event_label: "beds24_outbound",
          page_path: location.pathname,
        });
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
