import { createHash } from "crypto";
import {
  compareAumaraStayLengths,
  getAumaraAvailability,
  type AvailabilityQuery,
} from "@/lib/liveAvailability";
import { createReceiptId } from "@/lib/a2aReceipts";

export const AUMARA_STAY_SCHEMA_VERSION = "aumara.stay.v1" as const;
export const AUMARA_AGENT_CARD_VERSION = "1.2.0-sandbox" as const;

export const AUMARA_PLACE = {
  name: "AUMARA",
  address: "Rincón del Silencio, Benidoleig, Alicante, Spain",
  mapsShare: "https://maps.app.goo.gl/Ppyb5PX7nbvazpUR6",
  website: "https://www.aumara.me/",
} as const;

/** Beds24 property + room constants (mirrors app/a2a/route.ts PROPERTY). */
export const AUMARA_PROPERTY = {
  propid: "324882",
  booking: "https://beds24.com/booking2.php?propid=324882",
  rooms: {
    "674465": {
      id: "674465",
      label: "Chalet",
      guestsMax: 4,
      bookingUrl: "https://beds24.com/booking2.php?propid=324882&roomid=674465",
    },
    "674466": {
      id: "674466",
      label: "Superior Chalet",
      guestsMax: 6,
      bookingUrl: "https://beds24.com/booking2.php?propid=324882&roomid=674466",
    },
  },
} as const;

export type AumaraStayUnit = {
  id: string;
  label: string;
  guestsMax: number;
  available: number | null;
  totalPrice: number | null;
  currency: string | null;
  nightly: number | null;
  bookingUrl: string;
};

export type AumaraStayPromo = {
  headline: string;
  body: string;
  validUntil?: string | null;
  upliftHint?: string | null;
  code?: string | null;
};

export type AumaraStayPayload = {
  place: {
    name: string;
    address: string;
    mapsShare: string;
    website: string;
  };
  dates: { checkIn: string; checkOut: string; nights: number } | null;
  units: AumaraStayUnit[];
  summary: string;
  humanCheckout: {
    channel: "Beds24";
    url: string;
    note: "Payment/reservation completes only in human Beds24/Booking UI; this agent never creates/holds/charges.";
  };
  promo: AumaraStayPromo | null;
  meta: {
    schemaVersion: typeof AUMARA_STAY_SCHEMA_VERSION;
    generatedAt: string;
    source: "Beds24";
    agentCardVersion: typeof AUMARA_AGENT_CARD_VERSION;
    receiptId: string;
  };
};

const HUMAN_CHECKOUT_NOTE =
  "Payment/reservation completes only in human Beds24/Booking UI; this agent never creates/holds/charges." as const;

function readPromoFromEnv(): AumaraStayPromo | null {
  const raw = process.env.AUMARA_AGENT_PROMO_JSON;
  if (!raw || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const promo =
      parsed && typeof parsed === "object" && "promo" in (parsed as object)
        ? (parsed as { promo: unknown }).promo
        : parsed;
    if (!promo || typeof promo !== "object") return null;
    const p = promo as Record<string, unknown>;
    if (typeof p.headline !== "string" || typeof p.body !== "string") return null;
    return {
      headline: p.headline,
      body: p.body,
      ...(p.validUntil !== undefined ? { validUntil: (p.validUntil as string | null) ?? null } : {}),
      ...(p.upliftHint !== undefined ? { upliftHint: (p.upliftHint as string | null) ?? null } : {}),
      ...(p.code !== undefined ? { code: (p.code as string | null) ?? null } : {}),
    };
  } catch {
    return null;
  }
}

function humanCheckout(url: string): AumaraStayPayload["humanCheckout"] {
  return { channel: "Beds24", url, note: HUMAN_CHECKOUT_NOTE };
}

function withMeta(partial: Omit<AumaraStayPayload, "meta"> & { receiptId?: string }): AumaraStayPayload {
  const receiptId = partial.receiptId ?? createReceiptId();
  const { receiptId: _drop, ...rest } = partial as typeof partial & { receiptId?: string };
  return {
    ...rest,
    meta: {
      schemaVersion: AUMARA_STAY_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      source: "Beds24",
      agentCardVersion: AUMARA_AGENT_CARD_VERSION,
      receiptId,
    },
  };
}

function defaultUnits(): AumaraStayUnit[] {
  return Object.values(AUMARA_PROPERTY.rooms).map((room) => ({
    id: room.id,
    label: room.label,
    guestsMax: room.guestsMax,
    available: null,
    totalPrice: null,
    currency: null,
    nightly: null,
    bookingUrl: room.bookingUrl,
  }));
}

/** Discover defaults — no live dates; factual place + booking routes. */
export function buildDiscoverStayPayload(receiptId?: string): AumaraStayPayload {
  const units = defaultUnits();
  const summary =
    `AUMARA is a stay of independent geodesic houses among pine trees in Benidoleig, Marina Alta, Alicante. ` +
    `Chalet is for up to 4 guests; Superior Chalet is for up to 6. ` +
    `Website: ${AUMARA_PLACE.website}. Direct availability: ${AUMARA_PROPERTY.booking}. ` +
    `This agent never creates, holds or charges a reservation — checkout completes only in Beds24.`;

  return withMeta({
    place: { ...AUMARA_PLACE },
    dates: null,
    units,
    summary,
    humanCheckout: humanCheckout(AUMARA_PROPERTY.booking),
    promo: readPromoFromEnv(),
    receiptId,
  });
}

/** Live availability → structured aumara.stay.v1. */
export async function buildAvailabilityStayPayload(
  query: AvailabilityQuery,
  receiptId?: string
): Promise<AumaraStayPayload> {
  const result = await getAumaraAvailability(query);
  const units: AumaraStayUnit[] = result.inventory.map((item) => ({
    id: item.roomId,
    label: item.name,
    guestsMax: item.maxGuests,
    available: item.availableUnits,
    totalPrice: item.price,
    currency: item.currency ?? "EUR",
    nightly: item.pricePerNight,
    bookingUrl: item.bookingUrl,
  }));

  const priced = units.filter((u) => u.available && u.available > 0 && u.totalPrice != null);
  const summary =
    priced.length > 0
      ? `AUMARA live Beds24 ${result.checkIn}→${result.checkOut} (${result.nights} nights): ` +
        priced
          .map(
            (u) =>
              `${u.label} available=${u.available} total=${u.totalPrice} ${u.currency} (~${u.nightly}/night)`
          )
          .join("; ") +
        `. Checkout: ${result.allAvailability}`
      : `AUMARA live Beds24 ${result.checkIn}→${result.checkOut} (${result.nights} nights): no published units currently available for those dates. Check ${result.allAvailability}`;

  return withMeta({
    place: { ...AUMARA_PLACE },
    dates: { checkIn: result.checkIn, checkOut: result.checkOut, nights: result.nights },
    units,
    summary,
    humanCheckout: humanCheckout(result.allAvailability),
    promo: readPromoFromEnv(),
    receiptId,
  });
}

/** Compare stay lengths → structured payload highlighting best published nightly. */
export async function buildCompareStayPayload(
  input: {
    checkIn: string;
    adults?: number;
    children?: number;
    minNights?: number;
    maxNights?: number;
  },
  receiptId?: string
): Promise<AumaraStayPayload> {
  const result = await compareAumaraStayLengths(input);
  const units: AumaraStayUnit[] = [];

  for (const room of result.roomTypes) {
    const best = room.bestPublishedValue;
    if (best && best.nights != null) {
      const checkOutDate = new Date(`${result.checkIn}T00:00:00Z`);
      checkOutDate.setUTCDate(checkOutDate.getUTCDate() + best.nights);
      const checkOut = checkOutDate.toISOString().slice(0, 10);
      units.push({
        id: room.roomId,
        label: `${room.name} (best published ${best.nights}n)`,
        guestsMax: room.roomId === "674465" ? 4 : 6,
        available: 1,
        totalPrice: best.totalPrice,
        currency: best.currency ?? "EUR",
        nightly: best.pricePerNight,
        bookingUrl: best.bookingUrl,
      });
      void checkOut;
    } else {
      units.push({
        id: room.roomId,
        label: room.name,
        guestsMax: room.roomId === "674465" ? 4 : 6,
        available: 0,
        totalPrice: null,
        currency: null,
        nightly: null,
        bookingUrl: AUMARA_PROPERTY.rooms[room.roomId as keyof typeof AUMARA_PROPERTY.rooms]?.bookingUrl ?? AUMARA_PROPERTY.booking,
      });
    }
  }

  const tips = result.roomTypes
    .filter((r) => r.bestPublishedValue)
    .map(
      (r) =>
        `${r.name}: best published nightly ${r.bestPublishedValue!.pricePerNight} ${r.bestPublishedValue!.currency} at ${r.bestPublishedValue!.nights} nights (total ${r.bestPublishedValue!.totalPrice})`
    );

  const summary =
    tips.length > 0
      ? `AUMARA stay-length value from check-in ${result.checkIn} (nights ${result.comparedNights[0]}–${result.comparedNights[1]}): ${tips.join("; ")}. Values are live published Beds24 totals only.`
      : `AUMARA stay-length compare from ${result.checkIn}: no published available windows in the requested night range.`;

  const firstBooking =
    units.find((u) => u.bookingUrl)?.bookingUrl ?? AUMARA_PROPERTY.booking;

  return withMeta({
    place: { ...AUMARA_PLACE },
    dates: null,
    units,
    summary,
    humanCheckout: humanCheckout(firstBooking),
    promo: readPromoFromEnv(),
    receiptId,
  });
}

/** Direct booking routes without live quote. */
export function buildDirectBookingStayPayload(receiptId?: string): AumaraStayPayload {
  const units = defaultUnits();
  const summary =
    `AUMARA direct booking routes (Beds24 propid ${AUMARA_PROPERTY.propid}): ` +
    `all availability ${AUMARA_PROPERTY.booking}; ` +
    units.map((u) => `${u.label} ${u.bookingUrl}`).join("; ") +
    `. This agent does not create, hold or charge — continue in Beds24.`;

  return withMeta({
    place: { ...AUMARA_PLACE },
    dates: null,
    units,
    summary,
    humanCheckout: humanCheckout(AUMARA_PROPERTY.booking),
    promo: readPromoFromEnv(),
    receiptId,
  });
}

/** Canonical JSON hash helper re-export site for callers that need payload digests. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
