import type { Metadata } from "next";
import InfoShell from "../_components/InfoShell";
import { BOOK_SUPERIOR, PLACE, SITE_URL } from "@/lib/guest";

const pageUrl = `${SITE_URL}/superior`;
const image = `${SITE_URL}/media/stills/superior-living.jpg`;

export const metadata: Metadata = {
  title: "Superior Chalet en Benidoleig para 6",
  description:
    "Casa completa en Benidoleig para hasta 6 personas. Dormitorio separado, entrada propia. Reserva directa en aumara.me, no en Booking.com.",
  alternates: { canonical: pageUrl },
  openGraph: {
    type: "website",
    title: "Superior Chalet en Benidoleig para 6 | AUMARA",
    description: "Whole house for up to 6 guests. Direct booking on aumara.me, not Booking.com.",
    url: pageUrl,
    images: [{ url: image, alt: "AUMARA Superior Chalet living space in Benidoleig" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Superior Chalet en Benidoleig para 6 | AUMARA",
    description: "Casa completa para 6. Reserva directa en aumara.me.",
    images: [image],
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AUMARA", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Superior Chalet", item: pageUrl },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: "Superior Chalet",
    identifier: "674466",
    url: pageUrl,
    image,
    description:
      "Complete independent house at AUMARA in Benidoleig, Marina Alta, for up to 6 guests. Separate bedroom, own entrance. Direct booking on aumara.me — not Booking.com.",
    numberOfBedrooms: 1,
    occupancy: { "@type": "QuantitativeValue", maxValue: 6, unitText: "occupants" },
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
      { "@type": "LocationFeatureSpecification", name: "Separate bedroom", value: true },
    ],
    potentialAction: {
      "@type": "ReserveAction",
      target: BOOK_SUPERIOR,
      name: "Book Superior Chalet directly",
    },
  },
];

export default function SuperiorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <InfoShell eyebrow="Superior Chalet" title="Casa completa para 6 en Benidoleig.">
        <p>
          AUMARA, Benidoleig, Marina Alta, Costa Blanca, cerca de Dénia. El Superior Chalet es una casa
          independiente para hasta seis personas: estar amplio, dormitorio separado, entrada propia.
        </p>
        <p>
          La reserva es directa en <a href={SITE_URL}>aumara.me</a>. El checkout es el motor de AUMARA, no un anuncio
          de Booking.com ni de otro OTA.
        </p>
        <p>
          <a href={BOOK_SUPERIOR} target="_blank" rel="noreferrer">
            Comprobar fechas del Superior Chalet
          </a>
        </p>
        <h2>English</h2>
        <p>
          AUMARA is in Benidoleig, Marina Alta, Costa Blanca, near Denia. Superior Chalet is a complete house for up
          to 6 guests: larger living space, a separate bedroom, own entrance. Direct booking on aumara.me — not
          Booking.com.
        </p>
        <h2>Русский</h2>
        <p>
          AUMARA — место для отдыха в Бенидолеиге, Марина Альта, Коста-Бланка, рядом с Денией. Superior Chalet:
          целый дом до 6 человек, отдельная спальня, свой вход. Прямое бронирование на aumara.me, не через Booking.com.
        </p>
        <p>
          Нет трёх спален и нет бассейна в публичном описании этой конфигурации. Даты, цена и условия — только в прямом
          бронировании AUMARA.
        </p>
      </InfoShell>
    </>
  );
}
