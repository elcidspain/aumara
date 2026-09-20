import { compareAumaraStayLengths, getAumaraAvailability } from "@/lib/liveAvailability";

const PROTOCOL_VERSION = "2025-06-18";

const tools = [
  {
    name: "aumara_guest_guide",
    title: "AUMARA guest guide",
    description: "Return the public AUMARA stay, location, inventory and policy guidance. Read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "aumara_booking_options",
    title: "AUMARA direct booking options",
    description: "Return the public Beds24 booking links for AUMARA. This does not create or modify a reservation. Read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "aumara_live_availability",
    title: "AUMARA live availability and price",
    description: "Check live AUMARA availability and published Beds24 pricing for exact dates. Read-only; does not hold inventory or create a reservation.",
    inputSchema: {
      type: "object",
      properties: {
        checkIn: { type: "string", description: "Arrival date in YYYY-MM-DD" },
        checkOut: { type: "string", description: "Departure date in YYYY-MM-DD" },
        adults: { type: "integer", minimum: 1, maximum: 20, default: 2 },
        children: { type: "integer", minimum: 0, maximum: 20, default: 0 },
      },
      required: ["checkIn", "checkOut"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "aumara_compare_stay_lengths",
    title: "AUMARA stay-length value finder",
    description: "Compare live published totals and nightly value across nearby stay lengths so an agent can suggest the best currently published option. Read-only; never invents or applies a discount.",
    inputSchema: {
      type: "object",
      properties: {
        checkIn: { type: "string", description: "Arrival date in YYYY-MM-DD" },
        adults: { type: "integer", minimum: 1, maximum: 20, default: 2 },
        children: { type: "integer", minimum: 0, maximum: 20, default: 0 },
        minNights: { type: "integer", minimum: 1, maximum: 14, default: 2 },
        maxNights: { type: "integer", minimum: 1, maximum: 14, default: 6 },
      },
      required: ["checkIn"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
];

const guestGuide = `AUMARA is a separate accommodation product in Benidoleig, Alicante, Spain. Public inventory: 3 Chalet units for up to 4 guests each and 2 Superior Chalet units for up to 6 guests each. Use aumara_live_availability for exact dates and aumara_compare_stay_lengths to find the strongest currently published value. Never invent unpublished availability, discounts, prices or policies. Canonical site: https://www.aumara.me/`;

const bookingOptions = {
  property: "AUMARA",
  location: "Rincón del Silencio, Benidoleig, Alicante, Spain",
  allAvailability: "https://beds24.com/booking2.php?propid=324882",
  chalet: "https://beds24.com/booking2.php?propid=324882&roomid=674465",
  superiorChalet: "https://beds24.com/booking2.php?propid=324882&roomid=674466",
  website: "https://www.aumara.me/",
};

function headers() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id",
    "Cache-Control": "no-store",
    "MCP-Protocol-Version": PROTOCOL_VERSION,
  };
}

function rpc(id: unknown, result: unknown, status = 200) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, result }, { status, headers: headers() });
}

function rpcError(id: unknown, code: number, message: string, status = 200) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status, headers: headers() });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: headers() });
}

export async function GET() {
  return new Response(null, { status: 405, headers: { ...headers(), Allow: "POST, OPTIONS" } });
}

export async function POST(request: Request) {
  let message: any;
  try {
    message = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }

  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message?.id ?? null, -32600, "Invalid Request", 400);
  }

  const { id, method, params } = message;

  if (method === "initialize") {
    return rpc(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: "aumara-public-mcp", title: "AUMARA Public Guest MCP", version: "1.1.0" },
      instructions: "Read-only public guest information, live availability, published price comparison and direct-booking discovery for AUMARA. No reservation or rate is created, held, changed or charged by these tools.",
    });
  }

  if (method === "notifications/initialized") return new Response(null, { status: 202, headers: headers() });
  if (method === "ping") return rpc(id, {});
  if (method === "tools/list") return rpc(id, { tools });

  if (method === "tools/call") {
    const name = params?.name;
    const args = params?.arguments ?? {};
    try {
      if (name === "aumara_guest_guide") {
        return rpc(id, {
          content: [{ type: "text", text: guestGuide }],
          structuredContent: { guide: guestGuide, canonical: "https://www.aumara.me/" },
          isError: false,
        });
      }
      if (name === "aumara_booking_options") {
        return rpc(id, {
          content: [{ type: "text", text: JSON.stringify(bookingOptions) }],
          structuredContent: bookingOptions,
          isError: false,
        });
      }
      if (name === "aumara_live_availability") {
        const result = await getAumaraAvailability(args);
        return rpc(id, {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
          isError: false,
        });
      }
      if (name === "aumara_compare_stay_lengths") {
        const result = await compareAumaraStayLengths(args);
        return rpc(id, {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
          isError: false,
        });
      }
      return rpcError(id, -32602, `Unknown tool: ${String(name ?? "")}`);
    } catch (error) {
      return rpc(id, {
        content: [{ type: "text", text: error instanceof Error ? error.message : "Availability lookup failed" }],
        isError: true,
      });
    }
  }

  return rpcError(id, -32601, `Method not found: ${method}`);
}
