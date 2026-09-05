import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AUMARA — Cinematic landing preview",
  description: "Private geodesic houses in Benidoleig, Marina Alta.",
  robots: "noindex,nofollow",
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
