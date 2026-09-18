import { AGENT_ISSUER, AGENT_RESOURCE, AGENT_SCOPE } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

/** Always emit www canon — do not echo request Host (Radar apex/www mismatch). */
export function GET() {
  const origin = AGENT_ISSUER;
  return Response.json({
    resource: AGENT_RESOURCE,
    authorization_servers: [origin],
    scopes_supported: [AGENT_SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "AUMARA read-only agent resource",
    resource_documentation: `${origin}/auth.md`,
  }, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
