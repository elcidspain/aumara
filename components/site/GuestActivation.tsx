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

  return (
    <a
      href="/spatial/#flight"
      aria-label="Enter AUMARA 3D flight"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "18px",
        zIndex: 80,
        transform: "translateX(-50%)",
        padding: "12px 18px",
        borderRadius: "999px",
        border: "1px solid rgba(196,154,100,.72)",
        background: "rgba(10,26,20,.92)",
        color: "#f3ecde",
        boxShadow: "0 10px 36px rgba(0,0,0,.24)",
        font: "600 11px/1 system-ui,sans-serif",
        letterSpacing: ".14em",
        textDecoration: "none",
        textTransform: "uppercase",
        backdropFilter: "blur(12px)",
      }}
    >
      Enter AUMARA · 3D Flight
    </a>
  );
}
