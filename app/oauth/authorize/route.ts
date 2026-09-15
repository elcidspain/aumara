import { NextRequest, NextResponse } from "next/server";
import { AGENT_RESOURCE, AGENT_SCOPE, issueAuthorizationCode } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const responseType = q.get("response_type");
  const clientId = q.get("client_id") ?? "";
  const redirectUri = q.get("redirect_uri") ?? "";
  const codeChallenge = q.get("code_challenge") ?? "";
  const method = q.get("code_challenge_method");
  const scope = q.get("scope") ?? AGENT_SCOPE;
  const resource = q.get("resource") ?? AGENT_RESOURCE;
  const state = q.get("state");

  if (responseType !== "code" || method !== "S256") {
    return Response.json({ error: "invalid_request", error_description: "response_type=code and code_challenge_method=S256 are required" }, { status: 400 });
  }

  try {
    const code = issueAuthorizationCode({ clientId, redirectUri, codeChallenge, scope, resource });
    const callback = new URL(redirectUri);
    callback.searchParams.set("code", code);
    if (state) callback.searchParams.set("state", state);
    callback.searchParams.set("iss", "https://www.aumara.me");
    return NextResponse.redirect(callback, 302);
  } catch (error) {
    return Response.json({
      error: "invalid_request",
      error_description: error instanceof Error ? error.message : "Authorization request rejected",
    }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
