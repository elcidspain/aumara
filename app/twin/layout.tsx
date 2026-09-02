import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AUMARA twin (unlisted)",
  robots: "noindex,nofollow",
};

export default function TwinLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ margin: 0, padding: 0, overflow: "hidden", height: "100svh" }}>{children}</div>;
}
