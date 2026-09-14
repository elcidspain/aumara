import { NextRequest } from "next/server";
import { compareAumaraStayLengths, getAumaraAvailability } from "@/lib/liveAvailability";

export const dynamic = "force-dynamic";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type",
  "Cache-Control": "no-store",
};

function integerParam(value: string | null) {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const mode = url.searchParams.get("mode") ?? "quote";
  const checkIn = url.searchParams.get("checkIn") ?? "";
  const adults = integerParam(url.searchParams.get("adults"));
  const children = integerParam(url.searchParams.get("children"));

  try {
    if (mode === "compare") {
      const result = await compareAumaraStayLengths({
        checkIn,
        adults,
        children,
        minNights: integerParam(url.searchParams.get("minNights")),
        maxNights: integerParam(url.searchParams.get("maxNights")),
      });
      return Response.json(result, { headers });
    }

    const checkOut = url.searchParams.get("checkOut") ?? "";
    const result = await getAumaraAvailability({ checkIn, checkOut, adults, children });
    return Response.json(result, { headers });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Availability lookup failed" },
      { status: 400, headers }
    );
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
