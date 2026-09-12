"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/gtag";

export default function GuestActivation() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.href;
      if (href.includes("beds24.com/")) {
        trackEvent("booking_click", { destination: "beds24", page_path: location.pathname });
      } else if (href.includes("/spatial")) {
        trackEvent("spatial_flight_open", { page_path: location.pathname });
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
