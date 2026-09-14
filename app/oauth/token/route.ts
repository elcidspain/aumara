import { AGENT_RESOURCE, AGENT_SCOPE, exchangeAuthorizationCode } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400, headers });
  }

  if (String(form.get("grant_type") ?? "") !== "authorization_code") {
    return Response.json({ error: "unsupported_grant_type" }, { status: 400, headers });
  }

  try {
    const token = exchangeAuthorizationCode({
      code: String(form.get("code") ?? ""),
      clientId: String(form.get("client_id") ?? ""),
      redirectUri: String(form.get("redirect_uri") ?? ""),
      codeVerifier: String(form.get("code_verifier") ?? ""),
    });
    return Response.json({
      access_token: token.accessToken,
      token_type: "Bearer",
      expires_in: token.expiresIn,
      scope: AGENT_SCOPE,
      resource: AGENT_RESOURCE,
    }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token exchange rejected";
    const status = message.includes("not configured") ? 503 : 400;
    return Response.json({ error: status === 503 ? "temporarily_unavailable" : "invalid_grant", error_description: message }, { status, headers });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
