import {
  BOOK_CHALET,
  BOOK_DIRECT,
  BOOK_SUPERIOR,
  PLACE,
  SITE_URL,
} from "@/lib/guest";

/** Public GBP-matching phone is Elena. Legal registered contact stays Ilya. */
export const CONTACTS = {
  email: "elcidspain@gmail.com",
  publicPhone: "+34649242159",
  ilyaPhone: "+34622914323",
  leraPhone: "+34622537748",
} as const;

/** Google lodging additionalType for AUMARA units. Never Bungalow. */
export const UNIT_ADDITIONAL_TYPE = "Chalet" as const;
export const PROPERTY_ADDITIONAL_TYPE = "House" as const;

export const HERO_IMAGES = [
  `${SITE_URL}/media/hero/three-houses-01.webp`,
  `${SITE_URL}/media/hero/three-houses-02.webp`,
  `${SITE_URL}/media/hero/three-houses-03.webp`,
  `${SITE_URL}/media/stills/inside-valley.jpg`,
  `${SITE_URL}/media/stills/chalet-mezzanine.jpg`,
  `${SITE_URL}/media/stills/superior-living.jpg`,
  `${SITE_URL}/media/stills/dining-windows.jpg`,
  `${SITE_URL}/media/stills/pines-domes.jpg`,
] as const;

export const PROPERTY_DESCRIPTION =
  "Independent geodesic houses among pine trees in Benidoleig, Marina Alta, Alicante. Chalet and Superior Chalet — complete houses with their own entrance. Direct booking on aumara.me. Not a bungalow.";

type Amenity = { "@type": "LocationFeatureSpecification"; name: string; value: boolean };

type UnitSchemaInput = {
  name: string;
  identifier: string;
  url: string;
  description: string;
  image: string;
  extraImages?: readonly string[];
  maxGuests: number;
  bookingUrl: string;
  bookingName: string;
  numberOfBedrooms?: number;
  amenities: Amenity[];
};

export function postalAddress(): {
  "@type": "PostalAddress";
  streetAddress: string;
  postalCode: string;
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
} {
  return {
    "@type": "PostalAddress",
    streetAddress: PLACE.streetAddress,
    postalCode: PLACE.postalCode,
    addressLocality: PLACE.addressLocality,
    addressRegion: PLACE.addressRegion,
    addressCountry: PLACE.addressCountry,
  };
}

export function geoCoordinates(): {
  "@type": "GeoCoordinates";
  latitude: number;
  longitude: number;
} {
  return {
    "@type": "GeoCoordinates",
    latitude: PLACE.latitude,
    longitude: PLACE.longitude,
  };
}

export function reserveAction(
  url: string,
  name: string,
): {
  "@type": "ReserveAction";
  name: string;
  target: {
    "@type": "EntryPoint";
    urlTemplate: string;
    actionPlatform: string[];
  };
} {
  return {
    "@type": "ReserveAction",
    name,
    target: {
      "@type": "EntryPoint",
      urlTemplate: url,
      actionPlatform: [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform",
      ],
    },
  };
}

export function lodgingBusinessJsonLd(): Record<string, unknown> {
  const address = postalAddress();
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    additionalType: PROPERTY_ADDITIONAL_TYPE,
    name: "AUMARA",
    legalName: "EL CID VENTURES BENIDOLEIG S.L.",
    taxID: "B53816989",
    url: SITE_URL,
    description: PROPERTY_DESCRIPTION,
    disambiguatingDescription:
      "Geodesic houses in Benidoleig: Chalet and Superior Chalet. Not a bungalow.",
    image: [...HERO_IMAGES],
    email: CONTACTS.email,
    telephone: CONTACTS.publicPhone,
    address,
    geo: geoCoordinates(),
    hasMap: PLACE.maps,
    sameAs: [PLACE.maps],
    currenciesAccepted: "EUR",
    areaServed: [
      { "@type": "Place", name: "Benidoleig" },
      { "@type": "Place", name: "Marina Alta" },
      { "@type": "Place", name: "Dénia" },
      { "@type": "Place", name: "Costa Blanca" },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: CONTACTS.publicPhone,
        contactType: "reservations",
        availableLanguage: ["es", "en", "ru"],
      },
    ],
    containsPlace: [
      {
        "@type": "Accommodation",
        additionalType: UNIT_ADDITIONAL_TYPE,
        name: "Chalet",
        occupancy: { "@type": "QuantitativeValue", maxValue: 4, unitText: "occupants" },
        url: `${SITE_URL}/chalet`,
        image: `${SITE_URL}/media/stills/chalet-mezzanine.jpg`,
        amenityFeature: [{ "@type": "LocationFeatureSpecification", name: "Entire house", value: true }],
      },
      {
        "@type": "Accommodation",
        additionalType: UNIT_ADDITIONAL_TYPE,
        name: "Superior Chalet",
        description:
          "Complete house in Benidoleig for up to 6 guests. Separate bedroom, own entrance. Direct booking on aumara.me.",
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
    potentialAction: reserveAction(BOOK_DIRECT, "Book AUMARA directly"),
  };
}

export function vacationRentalJsonLd(input: UnitSchemaInput): Record<string, unknown> {
  const images = [input.image, ...(input.extraImages ?? [])];
  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    additionalType: UNIT_ADDITIONAL_TYPE,
    name: input.name,
    identifier: input.identifier,
    url: input.url,
    image: images,
    description: input.description,
    occupancy: { "@type": "QuantitativeValue", maxValue: input.maxGuests, unitText: "occupants" },
    ...(input.numberOfBedrooms !== undefined ? { numberOfBedrooms: input.numberOfBedrooms } : {}),
    address: postalAddress(),
    geo: geoCoordinates(),
    telephone: CONTACTS.publicPhone,
    containedInPlace: {
      "@type": "LodgingBusiness",
      additionalType: PROPERTY_ADDITIONAL_TYPE,
      name: "AUMARA",
      url: SITE_URL,
      legalName: "EL CID VENTURES BENIDOLEIG S.L.",
    },
    containsPlace: {
      "@type": "Accommodation",
      additionalType: UNIT_ADDITIONAL_TYPE,
      name: input.name,
      occupancy: { "@type": "QuantitativeValue", maxValue: input.maxGuests, unitText: "occupants" },
      ...(input.numberOfBedrooms !== undefined ? { numberOfBedrooms: input.numberOfBedrooms } : {}),
      amenityFeature: input.amenities,
    },
    amenityFeature: input.amenities,
    potentialAction: reserveAction(input.bookingUrl, input.bookingName),
  };
}

export function chaletVacationRentalJsonLd(): Record<string, unknown> {
  return vacationRentalJsonLd({
    name: "Chalet",
    identifier: "674465",
    url: `${SITE_URL}/chalet`,
    description:
      "Complete independent geodesic house at AUMARA in Benidoleig, Marina Alta, for up to 4 guests. Own entrance, sleeping zone and mezzanine. Direct booking on aumara.me. Not a bungalow.",
    image: `${SITE_URL}/media/stills/chalet-mezzanine.jpg`,
    extraImages: [
      `${SITE_URL}/media/hero/three-houses-01.webp`,
      `${SITE_URL}/media/stills/inside-valley.jpg`,
      `${SITE_URL}/media/stills/pines-domes.jpg`,
    ],
    maxGuests: 4,
    bookingUrl: BOOK_CHALET,
    bookingName: "Book Chalet directly",
    amenities: [
      { "@type": "LocationFeatureSpecification", name: "Entire house", value: true },
      { "@type": "LocationFeatureSpecification", name: "Private entrance", value: true },
    ],
  });
}

export function superiorVacationRentalJsonLd(): Record<string, unknown> {
  return vacationRentalJsonLd({
    name: "Superior Chalet",
    identifier: "674466",
    url: `${SITE_URL}/superior`,
    description:
      "Complete independent geodesic house at AUMARA in Benidoleig, Marina Alta, for up to 6 guests. Separate bedroom, own entrance. Direct booking on aumara.me. Not a bungalow.",
    image: `${SITE_URL}/media/stills/superior-living.jpg`,
    extraImages: [
      `${SITE_URL}/media/stills/dining-windows.jpg`,
      `${SITE_URL}/media/hero/three-houses-02.webp`,
      `${SITE_URL}/media/stills/inside-trees.jpg`,
    ],
    maxGuests: 6,
    bookingUrl: BOOK_SUPERIOR,
    bookingName: "Book Superior Chalet directly",
    numberOfBedrooms: 1,
    amenities: [
      { "@type": "LocationFeatureSpecification", name: "Entire house", value: true },
      { "@type": "LocationFeatureSpecification", name: "Private entrance", value: true },
      { "@type": "LocationFeatureSpecification", name: "Separate bedroom", value: true },
    ],
  });
}
