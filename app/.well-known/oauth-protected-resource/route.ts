import { AGENT_ISSUER, AGENT_SCOPE, requestAgentOrigin } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

/**
 * `resource` follows the request host (apex or www) so RFC 9728 scanners
 * that fetch https://aumara.me/.well-known/oauth-protected-resource accept
 * the document. authorization_servers stay the www canon.
 */
export function GET(request: Request) {
  const resource = requestAgentOrigin(request);
  return Response.json({
    resource,
    authorization_servers: [AGENT_ISSUER],
    scopes_supported: [AGENT_SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "AUMARA read-only agent resource",
    resource_documentation: `${AGENT_ISSUER}/auth.md`,
  }, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
