const BEDS24_AVAILABILITY_URL = "https://api.beds24.com/json/getAvailabilities";

const PROPERTY_ID = "324882";
const AGENT_REFERRER = "AUMARA_AI_AGENT";
const ROOM_TYPES = {
  "674465": { name: "Chalet", totalUnits: 3, maxGuests: 4 },
  "674466": { name: "Superior Chalet", totalUnits: 2, maxGuests: 6 },
} as const;

export type AvailabilityQuery = {
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
};

function requireIsoDate(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${field} must be YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error(`${field} is not a valid date`);
  return date;
}

function clampGuests(value: number | undefined, fallback: number, field: string) {
  const parsed = value ?? fallback;
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 20) throw new Error(`${field} must be an integer between 0 and 20`);
  return parsed;
}

function bookingUrl(roomId: string | null, checkIn: string, checkOut: string) {
  const params = new URLSearchParams({
    propid: PROPERTY_ID,
    checkin: checkIn,
    checkout: checkOut,
    referer: AGENT_REFERRER,
  });
  if (roomId) params.set("roomid", roomId);
  return `https://beds24.com/booking2.php?${params.toString()}`;
}

export async function getAumaraAvailability(query: AvailabilityQuery) {
  const checkInDate = requireIsoDate(query.checkIn, "checkIn");
  const checkOutDate = requireIsoDate(query.checkOut, "checkOut");
  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000);
  if (nights < 1 || nights > 31) throw new Error("stay must be between 1 and 31 nights");

  const adults = clampGuests(query.adults, 2, "adults");
  const children = clampGuests(query.children, 0, "children");
  if (adults < 1) throw new Error("at least one adult is required");

  const payload = {
    checkIn: query.checkIn.replaceAll("-", ""),
    checkOut: query.checkOut.replaceAll("-", ""),
    propId: PROPERTY_ID,
    numAdult: String(adults),
    numChild: String(children),
  };

  const response = await fetch(BEDS24_AVAILABILITY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Beds24 availability request failed with ${response.status}`);

  const raw = (await response.json()) as Record<string, any>;
  const inventory = Object.entries(ROOM_TYPES).map(([roomId, meta]) => {
    const item = raw[roomId] ?? {};
    const price = typeof item.price === "number" ? item.price : null;
    return {
      roomId,
      name: meta.name,
      totalUnits: meta.totalUnits,
      maxGuests: meta.maxGuests,
      availableUnits: Number(item.roomsavail ?? 0),
      price,
      pricePerNight: price === null ? null : Math.round((price / nights) * 100) / 100,
      currency: item.currency || raw.currency || "EUR",
      bookingUrl: bookingUrl(roomId, query.checkIn, query.checkOut),
    };
  });

  return {
    property: "AUMARA",
    location: "Rincón del Silencio, Benidoleig, Alicante, Spain",
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    nights,
    adults,
    children,
    inventory,
    allAvailability: bookingUrl(null, query.checkIn, query.checkOut),
    bookingAttribution: AGENT_REFERRER,
    source: "Beds24 live availability",
    pricingNote: "Prices and availability are live Beds24 results for the requested dates. Agent booking links carry a Beds24 referrer for conversion attribution. This endpoint does not alter rates or create a reservation.",
    generatedAt: new Date().toISOString(),
  };
}

export async function compareAumaraStayLengths(input: {
  checkIn: string;
  adults?: number;
  children?: number;
  minNights?: number;
  maxNights?: number;
}) {
  const start = requireIsoDate(input.checkIn, "checkIn");
  const minNights = Math.max(1, Math.min(14, Math.trunc(input.minNights ?? 2)));
  const maxNights = Math.max(minNights, Math.min(14, Math.trunc(input.maxNights ?? 6)));
  const options = await Promise.all(
    Array.from({ length: maxNights - minNights + 1 }, async (_, index) => {
      const nights = minNights + index;
      const checkOutDate = new Date(start.getTime() + nights * 86400000);
      const checkOut = checkOutDate.toISOString().slice(0, 10);
      return getAumaraAvailability({
        checkIn: input.checkIn,
        checkOut,
        adults: input.adults,
        children: input.children,
      });
    })
  );

  const roomTypes = Object.keys(ROOM_TYPES).map((roomId) => {
    const series = options.map((option) => option.inventory.find((item) => item.roomId === roomId)!).filter(Boolean);
    const available = series.filter((item) => item.availableUnits > 0 && item.price !== null);
    const bestNightly = available.length
      ? available.reduce((best, current) => (current.pricePerNight! < best.pricePerNight! ? current : best))
      : null;
    return {
      roomId,
      name: ROOM_TYPES[roomId as keyof typeof ROOM_TYPES].name,
      options: series.map((item, index) => ({
        nights: minNights + index,
        availableUnits: item.availableUnits,
        totalPrice: item.price,
        pricePerNight: item.pricePerNight,
        currency: item.currency,
        bookingUrl: item.bookingUrl,
      })),
      bestPublishedValue: bestNightly
        ? {
            nights: options.find((option) => option.inventory.some((item) => item === bestNightly))?.nights ?? null,
            pricePerNight: bestNightly.pricePerNight,
            totalPrice: bestNightly.price,
            currency: bestNightly.currency,
            bookingUrl: bestNightly.bookingUrl,
          }
        : null,
    };
  });

  return {
    property: "AUMARA",
    checkIn: input.checkIn,
    adults: input.adults ?? 2,
    children: input.children ?? 0,
    comparedNights: [minNights, maxNights],
    roomTypes,
    bookingAttribution: AGENT_REFERRER,
    source: "Beds24 live published pricing",
    guidance: "Use these published totals to suggest better-value stay lengths. Agent booking links are attributed in Beds24. Do not claim a discount unless the live price itself supports that claim, and never change a rate from this read-only endpoint.",
    generatedAt: new Date().toISOString(),
  };
}
