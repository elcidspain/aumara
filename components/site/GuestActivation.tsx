"use client";

import { useEffect } from "react";
import { getGuestActivationEvent } from "@/lib/guest-activation";
import { trackEvent } from "@/lib/gtag";

export default function GuestActivation() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const trackedEvent = getGuestActivationEvent(anchor.href, location.origin, location.pathname);
      if (trackedEvent) trackEvent(trackedEvent.name, trackedEvent.params);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
