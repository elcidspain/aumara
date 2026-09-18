import { AGENT_SCOPE, requestAgentOrigin } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const origin = requestAgentOrigin(request);
  return Response.json({
    resource: origin,
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
