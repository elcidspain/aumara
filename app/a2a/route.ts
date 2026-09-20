import { NextResponse } from "next/server";
import {
  appendDeliveryReceipt,
  callerHintFromRequest,
  createReceiptId,
  payloadHash,
} from "@/lib/a2aReceipts";
import {
  extractParty,
  extractStayDates,
  findIsoDates,
  wantsBooking,
  wantsCompare,
} from "@/lib/a2aDates";
import {
  buildAvailabilityStayPayload,
  buildCompareStayPayload,
  buildDirectBookingStayPayload,
  buildDiscoverStayPayload,
  type AumaraStayPayload,
} from "@/lib/a2aStayPayload";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

const SKILL_METHODS = new Set([
  "skills/discover-aumara-stay",
  "skills/check-live-availability",
  "skills/compare-stay-value",
  "skills/find-direct-booking",
]);

function serializedInput(input: unknown) {
  return JSON.stringify(input ?? "");
}

function successResult(payload: AumaraStayPayload, receiptId: string) {
  return {
    kind: "message",
    messageId: receiptId,
    role: "agent",
    receiptId,
    parts: [
      { kind: "data", data: payload },
      { kind: "text", text: payload.summary },
    ],
  };
}

function recordReceipt(
  request: Request,
  method: string,
  payload: AumaraStayPayload,
  dates: { checkIn?: string; checkOut?: string } | null
) {
  appendDeliveryReceipt({
    receiptId: payload.meta.receiptId,
    ts: new Date().toISOString(),
    method,
    callerHint: callerHintFromRequest(request),
    dates,
    unitCount: payload.units.length,
    payloadHash: payloadHash(payload),
    httpStatus: 200,
  });
}

function objectInt(input: unknown, key: string) {
  if (!input || typeof input !== "object") return undefined;
  const value = (input as Record<string, unknown>)[key];
  return Number.isInteger(value) ? (value as number) : undefined;
}

async function resolveSkill(
  method: string,
  input: unknown,
  receiptId: string
): Promise<AumaraStayPayload> {
  const dates = extractStayDates(input);
  const { adults, children } = extractParty(input);
  const serialized = serializedInput(input).toLowerCase();

  if (method === "skills/discover-aumara-stay") {
    return buildDiscoverStayPayload(receiptId);
  }
  if (method === "skills/find-direct-booking") {
    return buildDirectBookingStayPayload(receiptId);
  }
  if (method === "skills/compare-stay-value") {
    if (!dates[0]) throw new Error("compare-stay-value requires checkIn as YYYY-MM-DD or a dated phrase");
    return buildCompareStayPayload(
      {
        checkIn: dates[0],
        adults,
        children,
        minNights: objectInt(input, "minNights") ?? 2,
        maxNights: objectInt(input, "maxNights") ?? 6,
      },
      receiptId
    );
  }
  if (method === "skills/check-live-availability") {
    if (dates.length < 2) {
      throw new Error("check-live-availability requires checkIn and checkOut, ISO or natural dates");
    }
    return buildAvailabilityStayPayload(
      { checkIn: dates[0], checkOut: dates[1], adults, children },
      receiptId
    );
  }

  if (wantsCompare(serialized) && dates[0]) {
    return buildCompareStayPayload(
      {
        checkIn: dates[0],
        adults,
        children,
        minNights: objectInt(input, "minNights") ?? 2,
        maxNights: objectInt(input, "maxNights") ?? 6,
      },
      receiptId
    );
  }

  if (dates.length >= 2) {
    return buildAvailabilityStayPayload(
      { checkIn: dates[0], checkOut: dates[1], adults, children },
      receiptId
    );
  }

  if (wantsBooking(serialized)) {
    return buildDirectBookingStayPayload(receiptId);
  }

  return buildDiscoverStayPayload(receiptId);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400, headers }
    );
  }

  const id = body?.id ?? null;
  const method = typeof body?.method === "string" ? body.method : "";
  const supported =
    method === "SendMessage" || method === "message/send" || SKILL_METHODS.has(method);

  if (!supported) {
    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } },
      { status: 404, headers }
    );
  }

  const receiptId = createReceiptId();
  const params = body?.params;

  try {
    const payload = await resolveSkill(method, params, receiptId);
    const dates = payload.dates
      ? { checkIn: payload.dates.checkIn, checkOut: payload.dates.checkOut }
      : (() => {
          const found = findIsoDates(params);
          return found.length ? { checkIn: found[0], checkOut: found[1] } : null;
        })();

    recordReceipt(request, method, payload, dates);

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        result: successResult(payload, payload.meta.receiptId),
      },
      { headers }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Availability lookup failed";
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message },
      },
      { status: 400, headers }
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}
