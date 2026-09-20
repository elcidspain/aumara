import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import GuestActivation from "@/components/site/GuestActivation";
import AgentWebTools from "@/components/site/AgentWebTools";
import { PLACE, SITE_URL } from "@/lib/guest";
import {
  GA_MEASUREMENT_ID,
  GOOGLE_ADS_TAG_ID,
  isGaMeasurementId,
  isGoogleAdsTagId,
} from "@/lib/gtag";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-sans", display: "swap" });
const display = Playfair_Display({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const heroImage = `${SITE_URL}/media/hero/three-houses-01.webp`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AUMARA | Casas en Benidoleig, cerca de Dénia",
    template: "%s | AUMARA",
  },
  description:
    "Casas independientes en Benidoleig, Marina Alta, Costa Blanca. Chalet para 4 y Superior Chalet para 6. Reserva directa en aumara.me, no en Booking.com.",
  keywords: [
    "AUMARA",
    "Benidoleig",
    "Marina Alta",
    "Costa Blanca",
    "Dénia",
    "Chalet",
    "Superior Chalet",
    "casa 6 personas",
    "reserva directa",
  ],
  robots: "index,follow,max-image-preview:large",
  openGraph: {
    type: "website",
    title: "AUMARA | Casas en Benidoleig, cerca de Dénia",
    description:
      "Casas independientes entre pinos en Benidoleig, Marina Alta. Chalet y Superior Chalet. Reserva directa en aumara.me.",
    url: SITE_URL,
    siteName: "AUMARA",
    locale: "es_ES",
    images: [{ url: heroImage, width: 1920, height: 1080, alt: "Casas de AUMARA entre pinos en Benidoleig, Marina Alta" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AUMARA | Casas en Benidoleig, cerca de Dénia",
    description: "Chalet para 4 y Superior Chalet para 6. Reserva directa en aumara.me.",
    images: [heroImage],
  },
};

export const viewport: Viewport = { themeColor: "#f2eadc" };

const address = {
  "@type": "PostalAddress",
  streetAddress: PLACE.streetAddress,
  postalCode: PLACE.postalCode,
  addressLocality: PLACE.addressLocality,
  addressRegion: PLACE.addressRegion,
  addressCountry: PLACE.addressCountry,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "AUMARA",
  legalName: "EL CID VENTURES BENIDOLEIG S.L.",
  taxID: "B53816989",
  url: SITE_URL,
  description: "Independent houses among pine trees in Benidoleig, Marina Alta, Alicante. Direct booking on aumara.me — not Booking.com.",
  image: [
    heroImage,
    `${SITE_URL}/media/hero/three-houses-02.webp`,
    `${SITE_URL}/media/hero/three-houses-03.webp`,
    `${SITE_URL}/media/stills/inside-valley.jpg`,
    `${SITE_URL}/media/stills/chalet-mezzanine.jpg`,
    `${SITE_URL}/media/stills/superior-living.jpg`,
  ],
  email: "elcidspain@gmail.com",
  telephone: "+34966579970",
  address,
  geo: {
    "@type": "GeoCoordinates",
    latitude: PLACE.latitude,
    longitude: PLACE.longitude,
  },
  hasMap: PLACE.maps,
  currenciesAccepted: "EUR",
  areaServed: [
    { "@type": "Place", name: "Benidoleig" },
    { "@type": "Place", name: "Marina Alta" },
    { "@type": "Place", name: "Dénia" },
    { "@type": "Place", name: "Costa Blanca" },
  ],
  containsPlace: [
    {
      "@type": "Accommodation",
      name: "Chalet",
      occupancy: { "@type": "QuantitativeValue", maxValue: 4 },
      url: `${SITE_URL}/chalet`,
      image: `${SITE_URL}/media/stills/chalet-mezzanine.jpg`,
      amenityFeature: [{ "@type": "LocationFeatureSpecification", name: "Entire house", value: true }],
    },
    {
      "@type": "Accommodation",
      name: "Superior Chalet",
      description: "Complete house in Benidoleig for up to 6 guests. Separate bedroom, own entrance. Direct booking on aumara.me.",
      occupancy: { "@type": "QuantitativeValue", maxValue: 6, unitText: "occupants" },
      numberOfBedrooms: 1,
      url: `${SITE_URL}/superior`,
      image: `${SITE_URL}/media/stills/superior-living.jpg`,
      address,
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Entire house", value: true },
        { "@type": "LocationFeatureSpecification", name: "Private entrance", value: true },
        { "@type": "LocationFeatureSpecification", name: "Separate bedroom", value: true },
      ],
    },
  ],
  potentialAction: { "@type": "ReserveAction", target: "https://beds24.com/booking2.php?propid=324882", name: "Book AUMARA directly" },
};

const gaId = isGaMeasurementId(GA_MEASUREMENT_ID) ? GA_MEASUREMENT_ID : "";
const adsId = isGoogleAdsTagId(GOOGLE_ADS_TAG_ID) ? GOOGLE_ADS_TAG_ID : "";
const googleTagIds = Array.from(new Set([gaId, adsId].filter(Boolean)));
const googleTagLoaderId = googleTagIds[0] ?? "";
const googleTagConfigs = [
  gaId ? `window.gtag('config','${gaId}',{send_page_view:false});` : "",
  adsId ? `window.gtag('config','${adsId}');` : "",
].join("");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${display.variable} ${inter.className}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {googleTagLoaderId ? (
          <>
            <Script id="google-consent-default" strategy="beforeInteractive">
              {`window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};window.gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});`}
            </Script>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleTagLoaderId}`} strategy="afterInteractive" />
            <Script id="google-tags" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};window.gtag('js',new Date());${googleTagConfigs}`}
            </Script>
          </>
        ) : null}
        <GuestActivation />
        <AgentWebTools />
        {children}
      </body>
    </html>
  );
}
