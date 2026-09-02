import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/guest";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "AUMARA — Walk the place, choose your house, book direct",
  description:
    "Private geodesic houses in Benidoleig, Marina Alta. Walk the recorded site route, compare Chalet and Superior Chalet, and book direct through Beds24.",
  robots: "index,follow,max-image-preview:large",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    title: "AUMARA — Walk the place before you book",
    description:
      "Geodesic houses above the Marina Alta valley. Real stills, an on-site walkthrough, and direct Beds24 booking.",
    url: SITE_URL,
    images: [{ url: "/media/hero-houses.jpg", width: 1800, height: 1200 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f2eadc",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "AUMARA",
  legalName: "EL CID VENTURES BENIDOLEIG S.L.",
  taxID: "B53816989",
  url: SITE_URL,
  email: "elcidspain@gmail.com",
  telephone: "+34966579970",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Urb. Rincón del Silencio, 3",
    postalCode: "03759",
    addressLocality: "Benidoleig",
    addressRegion: "Alicante",
    addressCountry: "ES",
  },
  potentialAction: {
    "@type": "ReserveAction",
    target: "https://beds24.com/booking2.php?propid=324882",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
