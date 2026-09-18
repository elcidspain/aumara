import { AGENT_ISSUER, AGENT_RESOURCE, AGENT_SCOPE } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

/** Always emit www canon — do not echo request Host (Radar apex/www mismatch). */
export function GET() {
  const origin = AGENT_ISSUER;
  return Response.json({
    issuer: origin,
    resource: AGENT_RESOURCE,
    authorization_servers: [origin],
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: [AGENT_SCOPE],
    bearer_methods_supported: ["header"],
    service_documentation: `${origin}/auth.md`,
    agent_auth: {
      skill: `${origin}/auth.md`,
      register_uri: `${origin}/oauth/register`,
      protected_resource_metadata: `${origin}/.well-known/oauth-protected-resource`,
      identity_types_supported: ["anonymous"],
      credential_types_supported: ["oauth2_bearer"],
      grant_types_supported: ["authorization_code"],
      scopes_supported: [AGENT_SCOPE],
    },
  }, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
