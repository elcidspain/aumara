import type { Metadata } from "next";
import DirectStayFacts from "@/components/site/DirectStayFacts";
import FlightLaunch from "@/components/site/FlightLaunch";
import GuestHome from "@/components/site/GuestHome";
import SiteFooter from "@/components/site/SiteFooter";
import { SITE_URL } from "@/lib/guest";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default function HomePage() {
  return (
    <>
      <GuestHome />
      <DirectStayFacts />
      <FlightLaunch />
      <SiteFooter />
    </>
  );
}
