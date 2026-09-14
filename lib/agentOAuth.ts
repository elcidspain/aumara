import { createHmac, timingSafeEqual } from "node:crypto";

export const AGENT_ISSUER = "https://www.aumara.me";
export const AGENT_RESOURCE = "https://www.aumara.me";
export const AGENT_PROTECTED_ENDPOINT = "https://www.aumara.me/api/agent/protected";
export const AGENT_SCOPE = "agent.read";
export const AGENT_TOKEN_TTL_SECONDS = 600;

function signingKey() {
  return process.env.AUMARA_AGENT_TOKEN_SECRET
    || process.env.VERCEL_PROJECT_ID
    || "aumara-readonly-agent-capability-v1";
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function issueAgentToken(clientId: string) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: AGENT_ISSUER,
    aud: AGENT_RESOURCE,
    sub: clientId,
    scope: AGENT_SCOPE,
    iat: now,
    exp: now + AGENT_TOKEN_TTL_SECONDS,
  };
  const payload = encode(JSON.stringify(claims));
  return { accessToken: `aumara1.${payload}.${sign(payload)}`, expiresIn: AGENT_TOKEN_TTL_SECONDS };
}

export function verifyAgentToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "aumara1") return null;
  const expected = sign(parts[1]);
  const actualBuffer = Buffer.from(parts[2]);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (claims?.iss !== AGENT_ISSUER || claims?.aud !== AGENT_RESOURCE) return null;
    if (claims?.scope !== AGENT_SCOPE || typeof claims?.exp !== "number" || claims.exp <= now) return null;
    return claims as { iss: string; aud: string; sub: string; scope: string; iat: number; exp: number };
  } catch {
    return null;
  }
}
