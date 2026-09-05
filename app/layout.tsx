import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Cinzel } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "@/lib/guest";
import { GA_MEASUREMENT_ID, isGaMeasurementId } from "@/lib/gtag";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const display = Playfair_Display({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const brand = Cinzel({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "AUMARA — Hay lugares que te dan más",
  description:
    "Casas geodésicas independientes en Benidoleig, Marina Alta. Un vuelo real entre las casas, un recorrido por el lugar y reserva directa.",
  robots: "index,follow,max-image-preview:large",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    title: "AUMARA — Hay lugares que te dan más",
    description:
      "Casas geodésicas independientes en Benidoleig, Marina Alta. Un vuelo real entre las casas y reserva directa.",
    url: SITE_URL,
    images: [{ url: "/media/flight/poster.jpg", width: 1920, height: 1080 }],
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

const gaId = isGaMeasurementId(GA_MEASUREMENT_ID) ? GA_MEASUREMENT_ID : "";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${display.variable} ${brand.variable} ${inter.className}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
