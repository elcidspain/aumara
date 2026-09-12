"use client";

export default function FlightLaunch() {
  function trackFlightOpen() {
    const w = window as typeof window & {
      gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
    };
    w.gtag?.("event", "flight_open", {
      event_category: "engagement",
      event_label: "home_fixed_launch",
    });
  }

  return (
    <a
      className="btn primary"
      href="/spatial/#flight"
      aria-label="Abrir el vuelo 3D de AUMARA"
      onClick={trackFlightOpen}
      style={{
        position: "fixed",
        right: "max(18px, env(safe-area-inset-right))",
        bottom: "max(18px, env(safe-area-inset-bottom))",
        zIndex: 68,
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.28)",
      }}
    >
      3D Flight
    </a>
  );
}
