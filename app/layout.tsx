import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AUMARA Digital Twin · L2 Smoke",
  description: "Complejo El Cid / Rincón del Silencio — locked terrain + domes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>{children}</body>
    </html>
  );
}
