const BEDS24_AVAILABILITY_URL = "https://api.beds24.com/json/getAvailabilities";

const PROPERTY_ID = "324882";
const ROOM_TYPES = {
  "674465": { name: "Chalet Ø7", totalUnits: 3, maxGuests: 4 },
  "674466": { name: "Superior Chalet Ø9", totalUnits: 2, maxGuests: 6 },
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
    return {
      roomId,
      name: meta.name,
      totalUnits: meta.totalUnits,
      maxGuests: meta.maxGuests,
      availableUnits: Number(item.roomsavail ?? 0),
      price: typeof item.price === "number" ? item.price : null,
      currency: item.currency || raw.currency || "EUR",
      bookingUrl: `https://beds24.com/booking2.php?propid=${PROPERTY_ID}&roomid=${roomId}`,
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
    allAvailability: `https://beds24.com/booking2.php?propid=${PROPERTY_ID}`,
    source: "Beds24 live availability",
    generatedAt: new Date().toISOString(),
  };
}
