"use client";

import { useEffect } from "react";

export default function SpatialEntryPage() {
  useEffect(() => {
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    window.location.replace(`/spatial/index.html${search}${hash}`);
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#0a1a14",
        color: "#f3ecde",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p>AUMARA · loading spatial experience…</p>
    </main>
  );
}
