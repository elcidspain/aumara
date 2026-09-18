import { NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * Thin UCP discovery stub — honest human-mediated checkout only.
 * Agents never create/hold/charge; payment completes in Beds24/Booking UI.
 * No agent payment execution, or invented charge rails.
 */
const HUMAN_CHECKOUT = "https://beds24.com/booking2.php?propid=324882";
const WWW = "https://www.aumara.me";

const profile = {
  // Shape expected by isitagentready UCP skill (flat discovery fields)
  protocol_version: "2026-04-08",
  services: [],
  capabilities: [],
  endpoints: {
    human_checkout: HUMAN_CHECKOUT,
    guest_openapi: `${WWW}/openapi.json`,
    agent_card: `${WWW}/.well-known/agent-card.json`,
    continue_url: HUMAN_CHECKOUT,
  },
  // Spec-aligned nested envelope (ucp.dev) — empty agent commerce surface
  ucp: {
    version: "2026-04-08",
    services: {},
    capabilities: {},
    payment_handlers: {},
  },
  checkout_mode: "human-mediated-only",
  continue_url: HUMAN_CHECKOUT,
  payment_policy: {
    agent_auto_charge: false,
    agent_hold: false,
    agent_reservation: false,
    reservation_completes_in: "Beds24/Booking human UI",
    checkout_urls: {
      all: HUMAN_CHECKOUT,
      chalet: `${HUMAN_CHECKOUT}&roomid=674465`,
      superiorChalet: `${HUMAN_CHECKOUT}&roomid=674466`,
    },
    note:
      "Payment and reservation complete only when a human finishes checkout in Beds24/Booking. Agents may discover availability and return booking URLs; they never create, hold, or charge.",
  },
};

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=300",
  "Access-Control-Allow-Origin": "*",
};

export function GET() {
  return NextResponse.json(profile, { status: 200, headers });
}

export function HEAD() {
  return new NextResponse(null, { status: 200, headers });
}
