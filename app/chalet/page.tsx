import type { Metadata } from "next";
import InfoShell from "../_components/InfoShell";
import { BOOK_CHALET, PLACE, SITE_URL } from "@/lib/guest";

const pageUrl = `${SITE_URL}/chalet`;
const image = `${SITE_URL}/media/stills/chalet-mezzanine.jpg`;

export const metadata: Metadata = {
  title: "Chalet en Benidoleig para 4",
  description:
    "Casa completa en Benidoleig para hasta 4 personas. Entrada propia, zona de dormir y altillo. Reserva directa en aumara.me, no en Booking.com.",
  alternates: { canonical: pageUrl },
  openGraph: {
    type: "website",
    title: "Chalet en Benidoleig para 4 | AUMARA",
    description: "Whole house for up to 4 guests. Direct booking on aumara.me, not Booking.com.",
    url: pageUrl,
    images: [{ url: image, alt: "AUMARA Chalet interior in Benidoleig" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chalet en Benidoleig para 4 | AUMARA",
    description: "Casa completa para 4. Reserva directa en aumara.me.",
    images: [image],
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AUMARA", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Chalet", item: pageUrl },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: "Chalet",
    identifier: "674465",
    url: pageUrl,
    image,
    description:
      "Complete independent house at AUMARA in Benidoleig, Marina Alta, for up to 4 guests. Own entrance, sleeping zone and mezzanine. Direct booking on aumara.me — not Booking.com.",
    occupancy: { "@type": "QuantitativeValue", maxValue: 4, unitText: "occupants" },
    address: {
      "@type": "PostalAddress",
      streetAddress: PLACE.streetAddress,
      postalCode: PLACE.postalCode,
      addressLocality: PLACE.addressLocality,
      addressRegion: PLACE.addressRegion,
      addressCountry: PLACE.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: PLACE.latitude,
      longitude: PLACE.longitude,
    },
    containedInPlace: {
      "@type": "LodgingBusiness",
      name: "AUMARA",
      url: SITE_URL,
      legalName: "EL CID VENTURES BENIDOLEIG S.L.",
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Entire house", value: true },
      { "@type": "LocationFeatureSpecification", name: "Private entrance", value: true },
    ],
    potentialAction: {
      "@type": "ReserveAction",
      target: BOOK_CHALET,
      name: "Book Chalet directly",
    },
  },
];

export default function ChaletPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <InfoShell eyebrow="Chalet" title="Casa completa para 4 en Benidoleig.">
        <p>
          AUMARA, Benidoleig, Marina Alta, Costa Blanca, cerca de Dénia. El Chalet es una casa independiente para hasta
          cuatro personas: entrada propia, zona de dormir, altillo abierto y ventanales al valle.
        </p>
        <p>
          La reserva es directa en <a href={SITE_URL}>aumara.me</a>. El checkout es el motor de AUMARA, no un anuncio
          de Booking.com ni de otro OTA.
        </p>
        <p>
          <a href={BOOK_CHALET} target="_blank" rel="noreferrer">
            Comprobar fechas del Chalet
          </a>
        </p>
        <h2>English</h2>
        <p>
          AUMARA is in Benidoleig, Marina Alta, Costa Blanca, near Denia. Chalet is a complete house for up to 4 guests:
          own entrance, sleeping zone, open mezzanine and windows to the valley. Direct booking on aumara.me — not
          Booking.com.
        </p>
        <h2>Русский</h2>
        <p>
          AUMARA — место для отдыха в Бенидолеиге, Марина Альта, Коста-Бланка, рядом с Денией. Chalet: целый дом до 4
          человек, свой вход, спальная зона и антресоль. Прямое бронирование на aumara.me, не через Booking.com.
        </p>
      </InfoShell>
    </>
  );
}
