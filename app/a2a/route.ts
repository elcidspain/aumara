import { NextResponse } from "next/server";
import { agentAuthorized } from "@/lib/agentAccess";
import { getAumaraAgentOffer } from "@/lib/agentOffer";
import { compareAumaraStayLengths, getAumaraAvailability } from "@/lib/liveAvailability";

const PROPERTY = {
  name: "AUMARA",
  location: "Rincón del Silencio, Benidoleig, Alicante, Spain",
  website: "https://www.aumara.me/",
  booking: "https://beds24.com/booking2.php?propid=324882",
  chalet: "https://beds24.com/booking2.php?propid=324882&roomid=674465",
  superior: "https://beds24.com/booking2.php?propid=324882&roomid=674466",
};

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

function serializedInput(input: unknown) {
  return JSON.stringify(input ?? "");
}

function findIsoDates(input: unknown) {
  return Array.from(new Set(serializedInput(input).match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? []));
}

function findInteger(input: unknown, keys: string[]) {
  const value = input && typeof input === "object" ? input as Record<string, any> : {};
  for (const key of keys) {
    const candidate = value[key];
    if (Number.isInteger(candidate)) return candidate as number;
  }
  return undefined;
}

function baseMessage(input: unknown) {
  const serialized = serializedInput(input).toLowerCase();
  if (serialized.includes("book") || serialized.includes("reserv") || serialized.includes("availability") || serialized.includes("date") || serialized.includes("price")) {
    return `AUMARA direct booking: all availability ${PROPERTY.booking}; Chalet Ø7 ${PROPERTY.chalet}; Superior Chalet Ø9 ${PROPERTY.superior}. For exact live prices, send check-in and check-out dates as YYYY-MM-DD. This agent does not create, hold or modify reservations.`;
  }
  return `AUMARA is a stay of independent geodesic houses among pine trees in Benidoleig, Marina Alta, Alicante. Chalet Ø7 is for up to 4 guests; Superior Chalet Ø9 is for up to 6. Website: ${PROPERTY.website}. Direct availability: ${PROPERTY.booking}.`;
}

async function messagePayload(input: unknown, privateAgentAccess: boolean) {
  const serialized = serializedInput(input).toLowerCase();
  const dates = findIsoDates(input);
  const adults = findInteger(input, ["adults", "numAdults", "guests"]);
  const children = findInteger(input, ["children", "numChildren"]);

  if (serialized.includes("compare") || serialized.includes("value") || serialized.includes("longer") || serialized.includes("nightly")) {
    if (dates[0]) {
      const result = await compareAumaraStayLengths({ checkIn: dates[0], adults, children, minNights: 2, maxNights: 6 });
      return { text: JSON.stringify(result), data: result };
    }
  }

  if (dates.length >= 2) {
    if (privateAgentAccess) {
      const result = await getAumaraAgentOffer({ checkIn: dates[0], checkOut: dates[1], adults, children });
      const lead = result.agentRateFound
        ? "I found a live AUMARA private agent price below the current published Beds24 price."
        : "I checked the AUMARA private agent channel; no lower live agent price is currently available.";
      return { text: `${lead} ${JSON.stringify(result)}`, data: result };
    }
    const result = await getAumaraAvailability({ checkIn: dates[0], checkOut: dates[1], adults, children });
    return { text: JSON.stringify(result), data: result };
  }

  return { text: baseMessage(input), data: null };
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers });
  }

  const id = body?.id ?? null;
  const method = body?.method;
  if (method === "SendMessage" || method === "message/send") {
    try {
      const answer = await messagePayload(body?.params, agentAuthorized(request));
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          kind: "message",
          messageId: `aumara-${Date.now()}`,
          role: "agent",
          parts: [
            { kind: "text", text: answer.text },
            ...(answer.data ? [{ kind: "data", data: answer.data }] : []),
          ],
        },
      }, { headers });
    } catch (error) {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          kind: "message",
          messageId: `aumara-${Date.now()}`,
          role: "agent",
          parts: [{ kind: "text", text: error instanceof Error ? error.message : "Availability lookup failed" }],
        },
      }, { headers });
    }
  }

  return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } }, { status: 404, headers });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}
