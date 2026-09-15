import { AGENT_ISSUER, AGENT_RESOURCE, AGENT_SCOPE } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    resource: AGENT_RESOURCE,
    authorization_servers: [AGENT_ISSUER],
    scopes_supported: [AGENT_SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "AUMARA read-only agent resource",
    resource_documentation: `${AGENT_ISSUER}/auth.md`,
  }, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
