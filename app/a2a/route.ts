import { NextResponse } from "next/server";

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
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

function messageText(input: unknown) {
  const serialized = JSON.stringify(input ?? "").toLowerCase();
  if (serialized.includes("book") || serialized.includes("reserv") || serialized.includes("availability") || serialized.includes("date")) {
    return `AUMARA direct booking: all availability ${PROPERTY.booking}; Chalet Ø7 ${PROPERTY.chalet}; Superior Chalet Ø9 ${PROPERTY.superior}. These links show live price, availability and booking conditions. This agent does not create or modify reservations.`;
  }
  return `AUMARA is a stay of independent geodesic houses among pine trees in Benidoleig, Marina Alta, Alicante. Chalet Ø7 is for up to 4 guests; Superior Chalet Ø9 is for up to 6. Website: ${PROPERTY.website}. Direct availability: ${PROPERTY.booking}.`;
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
    const text = messageText(body?.params);
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      result: {
        kind: "message",
        messageId: `aumara-${Date.now()}`,
        role: "agent",
        parts: [{ kind: "text", text }],
      },
    }, { headers });
  }

  return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } }, { status: 404, headers });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}
