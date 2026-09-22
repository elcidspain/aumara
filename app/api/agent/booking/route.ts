import { NextResponse } from "next/server";
import {
  agentBookingAuthorized,
  agentBookingConfigured,
  createAuthenticatedBooking,
  type AgentBookingInput,
} from "@/lib/agentBooking";

export const dynamic = "force-dynamic";

const commonHeaders = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function POST(request: Request) {
  if (!agentBookingConfigured()) {
    return NextResponse.json(
      { ok: false, error: "booking_runtime_not_configured" },
      { status: 503, headers: commonHeaders }
    );
  }
  if (!agentBookingAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "invalid_agent_booking_token" },
      {
        status: 401,
        headers: {
          ...commonHeaders,
          "WWW-Authenticate": 'Bearer realm="AUMARA authenticated booking"',
        },
      }
    );
  }

  let body: AgentBookingInput;
  try {
    body = (await request.json()) as AgentBookingInput;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400, headers: commonHeaders }
    );
  }

  try {
    const result = await createAuthenticatedBooking(body);
    return NextResponse.json(result, { status: 201, headers: commonHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "booking_failed",
      },
      { status: 400, headers: commonHeaders }
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: commonHeaders });
}
