import { AGENT_ISSUER, AGENT_SCOPE } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    issuer: AGENT_ISSUER,
    authorization_endpoint: `${AGENT_ISSUER}/oauth/authorize`,
    token_endpoint: `${AGENT_ISSUER}/oauth/token`,
    registration_endpoint: `${AGENT_ISSUER}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: [AGENT_SCOPE],
    service_documentation: `${AGENT_ISSUER}/auth.md`,
  }, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
