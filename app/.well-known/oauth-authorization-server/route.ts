import { AGENT_ISSUER, AGENT_RESOURCE, AGENT_SCOPE } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    issuer: AGENT_ISSUER,
    resource: AGENT_RESOURCE,
    authorization_servers: [AGENT_ISSUER],
    authorization_endpoint: `${AGENT_ISSUER}/oauth/authorize`,
    token_endpoint: `${AGENT_ISSUER}/oauth/token`,
    registration_endpoint: `${AGENT_ISSUER}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: [AGENT_SCOPE],
    bearer_methods_supported: ["header"],
    service_documentation: `${AGENT_ISSUER}/auth.md`,
    agent_auth: {
      skill: `${AGENT_ISSUER}/auth.md`,
      register_uri: `${AGENT_ISSUER}/oauth/register`,
      protected_resource_metadata: `${AGENT_ISSUER}/.well-known/oauth-protected-resource`,
      identity_types_supported: ["anonymous"],
      credential_types_supported: ["oauth2_bearer"],
      grant_types_supported: ["authorization_code"],
      scopes_supported: [AGENT_SCOPE],
    },
  }, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
