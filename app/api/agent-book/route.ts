import { beds24AgentCode, verifyAgentHandoff, type AgentHandoffInput } from "@/lib/agentAccess";

const PROPERTY_ID = "324882";
const AGENT_REFERRER = "AUMARA_AI_AGENT";
const ALLOWED_ROOMS = new Set(["674465", "674466"]);

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function fail(status = 404) {
  return new Response("Not found", { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId") ?? "";
  const checkIn = url.searchParams.get("checkIn") ?? "";
  const checkOut = url.searchParams.get("checkOut") ?? "";
  const adults = Number(url.searchParams.get("adults"));
  const children = Number(url.searchParams.get("children"));
  const expires = Number(url.searchParams.get("expires"));
  const signature = url.searchParams.get("signature") ?? "";

  if (
    !ALLOWED_ROOMS.has(roomId) ||
    !validDate(checkIn) ||
    !validDate(checkOut) ||
    !Number.isInteger(adults) || adults < 1 || adults > 20 ||
    !Number.isInteger(children) || children < 0 || children > 20 ||
    checkOut <= checkIn ||
    !signature
  ) return fail();

  const input: AgentHandoffInput = { roomId, checkIn, checkOut, adults, children };
  try {
    if (!verifyAgentHandoff(input, expires, signature)) return fail();

    const params = new URLSearchParams({
      propid: PROPERTY_ID,
      roomid: roomId,
      checkin: checkIn,
      checkout: checkOut,
      numadult: String(adults),
      numchild: String(children),
      agent: beds24AgentCode(),
      referer: AGENT_REFERRER,
    });
    return Response.redirect(`https://beds24.com/booking2.php?${params.toString()}`, 307);
  } catch {
    return fail(503);
  }
}
