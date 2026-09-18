import { AGENT_ISSUER, AGENT_PROTECTED_ENDPOINT, AGENT_SCOPE, verifyAgentToken } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

const commonHeaders = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Accept, Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export function GET(request: Request) {
  const origin = AGENT_ISSUER;
  const resourceMetadata = `${origin}/.well-known/oauth-protected-resource`;
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const claims = token ? verifyAgentToken(token) : null;

  if (!claims) {
    return Response.json({
      error: "invalid_token",
      error_description: "A valid short-lived AUMARA agent.read bearer token is required",
      resource_metadata: resourceMetadata,
    }, {
      status: 401,
      headers: {
        ...commonHeaders,
        "WWW-Authenticate": `Bearer realm="AUMARA", error="invalid_token", scope="${AGENT_SCOPE}", resource_metadata="${resourceMetadata}"`,
      },
    });
  }

  return Response.json({
    ok: true,
    resource: AGENT_PROTECTED_ENDPOINT,
    scope: claims.scope,
    subject: claims.sub,
    property: "AUMARA",
    access: "read-only",
    publicMcp: `${origin}/mcp`,
    publicA2a: `${origin}/a2a`,
    liveAvailability: `${origin}/api/availability`,
    directBooking: "https://beds24.com/booking2.php?propid=324882",
    note: "This protected surface contains public guest-discovery data only and cannot create, change, hold or charge a reservation.",
  }, { headers: commonHeaders });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: commonHeaders });
}
