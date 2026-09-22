import { createHash, timingSafeEqual } from "node:crypto";
import { getAumaraAvailability } from "@/lib/liveAvailability";

const BEDS24_API = "https://api.beds24.com/v2";
const PROPERTY_ID = 324882;
const AGENT_REFERRER = "AUMARA_AI_AGENT";

const ROOMS = {
  "674465": { name: "Chalet", maxGuests: 4, baselineNightly: 259 },
  "674466": { name: "Superior Chalet", maxGuests: 6, baselineNightly: 329 },
} as const;

type RoomId = keyof typeof ROOMS;

export type AgentBookingInput = {
  roomId: string | number;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  confirmBooking: boolean;
};

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

function privilegedBearer() {
  return (
    process.env.AUMARA_AGENT_BOOK_TOKEN?.trim() ||
    process.env.AUMARA_AGENT_ACCESS_TOKEN?.trim() ||
    ""
  );
}

export function agentBookingConfigured() {
  return Boolean(
    privilegedBearer() &&
      (process.env.BEDS24_REFRESH_CREDENTIAL?.trim() ||
        process.env.BEDS24_REFRESH_TOKEN?.trim())
  );
}

export function agentBookingAuthorized(request: Request) {
  const expected = privilegedBearer();
  if (!expected) return false;
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return Boolean(match?.[1] && constantTimeEqual(match[1].trim(), expected));
}

function requireText(value: unknown, field: string, max = 160) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim().slice(0, max);
}

function requireEmail(value: unknown) {
  const email = requireText(value, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("email is invalid");
  }
  return email;
}

function intField(value: unknown, fallback: number, field: string) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 20) {
    throw new Error(`${field} must be an integer between 0 and 20`);
  }
  return parsed;
}

function isoDate(value: unknown, field: string) {
  const text = requireText(value, field, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${field} must be YYYY-MM-DD`);
  }
  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw new Error(`${field} is invalid`);
  }
  return { text, date };
}

function normalizeInput(input: AgentBookingInput) {
  const roomId = String(input.roomId) as RoomId;
  if (!(roomId in ROOMS)) throw new Error("roomId must be 674465 or 674466");
  const checkIn = isoDate(input.checkIn, "checkIn");
  const checkOut = isoDate(input.checkOut, "checkOut");
  if (checkOut.date <= checkIn.date) throw new Error("checkOut must be after checkIn");
  const adults = intField(input.adults, 2, "adults");
  const children = intField(input.children, 0, "children");
  if (adults < 1) throw new Error("at least one adult is required");
  if (adults + children > ROOMS[roomId].maxGuests) {
    throw new Error(`${ROOMS[roomId].name} capacity is ${ROOMS[roomId].maxGuests} guests`);
  }
  if (input.confirmBooking !== true) {
    throw new Error("confirmBooking=true is required for a live reservation");
  }
  return {
    roomId,
    checkIn: checkIn.text,
    checkOut: checkOut.text,
    adults,
    children,
    firstName: requireText(input.firstName, "firstName", 100),
    lastName: requireText(input.lastName, "lastName", 100),
    email: requireEmail(input.email),
    phone: typeof input.phone === "string" ? input.phone.trim().slice(0, 60) : "",
  };
}

function refreshCredential() {
  const value =
    process.env.BEDS24_REFRESH_CREDENTIAL?.trim() ||
    process.env.BEDS24_REFRESH_TOKEN?.trim() ||
    "";
  if (!value) throw new Error("Beds24 booking credential is not configured");
  return value;
}

async function accessToken() {
  const response = await fetch(`${BEDS24_API}/authentication/token`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      refreshToken: refreshCredential(),
      "User-Agent": "AUMARA-Agent-Booking/1.0",
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.token) {
    throw new Error(`Beds24 token exchange failed with ${response.status}`);
  }
  return String(body.token);
}

async function beds24(
  token: string,
  path: string,
  method: "GET" | "POST",
  body?: unknown
) {
  const response = await fetch(`${BEDS24_API}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      token,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      "User-Agent": "AUMARA-Agent-Booking/1.0",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function rows(payload: any): any[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function exactReference(payload: any, apiReference: string) {
  return rows(payload).find(
    (item) =>
      item &&
      typeof item === "object" &&
      String(item.apiReference ?? "") === apiReference
  );
}

async function findExisting(token: string, apiReference: string) {
  const params = new URLSearchParams({
    propertyId: String(PROPERTY_ID),
    searchString: apiReference,
  });
  const { response, payload } = await beds24(
    token,
    `/bookings?${params.toString()}`,
    "GET"
  );
  if (!response.ok) {
    throw new Error(`Beds24 duplicate check failed with ${response.status}`);
  }
  return exactReference(payload, apiReference) ?? null;
}

function apiReference(input: ReturnType<typeof normalizeInput>) {
  const canonical = [
    PROPERTY_ID,
    input.roomId,
    input.checkIn,
    input.checkOut,
    input.adults,
    input.children,
    input.email.toLowerCase(),
    input.lastName.toLowerCase(),
  ].join("|");
  const digest = createHash("sha256").update(canonical).digest("hex").slice(0, 20);
  return `AUMARA-AI-${digest.toUpperCase()}`;
}

function pricingSnapshot(availability: Awaited<ReturnType<typeof getAumaraAvailability>>) {
  const chalet = availability.inventory.find((item) => item.roomId === "674465");
  const superior = availability.inventory.find((item) => item.roomId === "674466");
  const inversion =
    chalet?.pricePerNight !== null &&
    chalet?.pricePerNight !== undefined &&
    superior?.pricePerNight !== null &&
    superior?.pricePerNight !== undefined &&
    superior.pricePerNight < chalet.pricePerNight;

  const dynamic = availability.inventory.map((item) => {
    const baseline = ROOMS[item.roomId as RoomId]?.baselineNightly;
    const deltaPct =
      baseline && item.pricePerNight !== null
        ? Math.round(((item.pricePerNight - baseline) / baseline) * 10000) / 100
        : null;
    return {
      roomId: item.roomId,
      name: item.name,
      liveNightly: item.pricePerNight,
      baselineNightly: baseline ?? null,
      deltaPct,
    };
  });

  return { inversion, dynamic };
}

function responseBooking(row: any, fallback: {
  apiReference: string;
  price: number;
  roomId: RoomId;
  checkIn: string;
  checkOut: string;
}) {
  return {
    bookingId: row?.id ?? null,
    apiReference: String(row?.apiReference ?? fallback.apiReference),
    status: String(row?.status ?? "confirmed"),
    roomId: String(row?.roomId ?? fallback.roomId),
    roomName: ROOMS[fallback.roomId].name,
    checkIn: String(row?.arrival ?? fallback.checkIn),
    checkOut: String(row?.departure ?? fallback.checkOut),
    price: typeof row?.price === "number" ? row.price : fallback.price,
    currency: "EUR",
  };
}

export async function createAuthenticatedBooking(input: AgentBookingInput) {
  const normalized = normalizeInput(input);
  const availability = await getAumaraAvailability({
    checkIn: normalized.checkIn,
    checkOut: normalized.checkOut,
    adults: normalized.adults,
    children: normalized.children,
  });
  const selected = availability.inventory.find(
    (item) => item.roomId === normalized.roomId
  );
  if (!selected || selected.availableUnits < 1 || selected.price === null) {
    throw new Error(`${ROOMS[normalized.roomId].name} is not currently bookable for these dates`);
  }

  const pricing = pricingSnapshot(availability);
  if (pricing.inversion) {
    throw new Error(
      "Pricing integrity check failed: Superior Chalet is currently priced below Chalet for the same stay"
    );
  }

  const ref = apiReference(normalized);
  const token = await accessToken();
  const existing = await findExisting(token, ref);
  if (existing) {
    return {
      ok: true,
      created: false,
      idempotentReplay: true,
      source: "Beds24",
      booking: responseBooking(existing, {
        apiReference: ref,
        price: selected.price,
        roomId: normalized.roomId,
        checkIn: normalized.checkIn,
        checkOut: normalized.checkOut,
      }),
      pricing,
    };
  }

  const booking: Record<string, unknown> = {
    propertyId: PROPERTY_ID,
    roomId: Number(normalized.roomId),
    roomQty: 1,
    status: "confirmed",
    arrival: normalized.checkIn,
    departure: normalized.checkOut,
    numAdult: normalized.adults,
    numChild: normalized.children,
    firstName: normalized.firstName,
    lastName: normalized.lastName,
    email: normalized.email,
    price: selected.price,
    apiReference: ref,
    referer: AGENT_REFERRER,
    comments: "Created by authenticated AUMARA agent runtime at live Beds24 price.",
    allowAutoAction: "enable",
    allowWebhooks: true,
  };
  if (normalized.phone) {
    booking.phone = normalized.phone;
    booking.mobile = normalized.phone;
  }

  const created = await beds24(token, "/bookings", "POST", [booking]);
  if (created.response.status !== 201 || !Array.isArray(created.payload)) {
    throw new Error(`Beds24 booking creation failed with ${created.response.status}`);
  }
  const first = created.payload[0];
  if (!first || first.success !== true) {
    const message =
      first?.errors?.[0]?.message ||
      first?.message ||
      "Beds24 rejected the booking";
    throw new Error(String(message));
  }

  let readBack = await findExisting(token, ref);
  if (!readBack) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    readBack = await findExisting(token, ref);
  }
  if (!readBack) {
    throw new Error("Beds24 accepted the write but the booking could not be verified by read-back");
  }

  return {
    ok: true,
    created: true,
    idempotentReplay: false,
    source: "Beds24",
    booking: responseBooking(readBack, {
      apiReference: ref,
      price: selected.price,
      roomId: normalized.roomId,
      checkIn: normalized.checkIn,
      checkOut: normalized.checkOut,
    }),
    pricing,
    payment: {
      collected: false,
      note: "Reservation creation is complete. Payment collection is a separate capability.",
    },
  };
}
