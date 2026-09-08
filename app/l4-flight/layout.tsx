import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "AUMARA L4 movement (sandbox)",
  robots: "noindex,nofollow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#06110c",
};

export default function L4Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ margin: 0, padding: 0, overflow: "hidden", height: "100dvh" }}>{children}</div>;
}
