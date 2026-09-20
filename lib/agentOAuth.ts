import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { AGENT_OAUTH_BUILD_KEY } from "@/lib/agentOAuthBuildKey";

export const AGENT_ISSUER = "https://www.aumara.me";
export const AGENT_RESOURCE = "https://www.aumara.me";
export const AGENT_PROTECTED_ENDPOINT = "https://www.aumara.me/api/agent/protected";
export const AGENT_SCOPE = "agent.read";
export const AGENT_TOKEN_TTL_SECONDS = 600;
const CODE_TTL_SECONDS = 300;
const AUMARA_HOSTS = new Set(["aumara.me", "www.aumara.me"]);

type ClientRegistration = {
  client_name: string;
  redirect_uris: string[];
  iat: number;
};

type AuthorizationCode = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  scope: string;
  resource: string;
  iat: number;
  exp: number;
};

type AccessClaims = {
  iss: string;
  aud: string;
  sub: string;
  scope: string;
  iat: number;
  exp: number;
};

/**
 * Origin of the current request when it is aumara.me or www.aumara.me.
 * RFC 9728 Protected Resource `resource` must match the scanned host:
 * apex Radar/isitagentready treats www-only metadata as missing (8/9).
 * Authorization-server issuer stays https://www.aumara.me (AGENT_ISSUER).
 */
export function requestAgentOrigin(req?: Request): string {
  if (!req) return AGENT_ISSUER;
  const rawHost = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "www.aumara.me")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:443$/, "");
  const host = AUMARA_HOSTS.has(rawHost) ? rawHost : "www.aumara.me";
  return `https://${host}`;
}

export function isAumaraOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && AUMARA_HOSTS.has(url.host);
  } catch {
    return false;
  }
}

function signingKey() {
  return AGENT_OAUTH_BUILD_KEY;
}

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

function signature(kind: string, payload: string) {
  return createHmac("sha256", signingKey()).update(`${kind}.${payload}`).digest("base64url");
}

function seal(kind: string, value: unknown) {
  const payload = encodeJson(value);
  return `aumara1.${kind}.${payload}.${signature(kind, payload)}`;
}

function open<T>(kind: string, token: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "aumara1" || parts[1] !== kind) return null;
  if (!safeEqual(parts[3], signature(kind, parts[2]))) return null;
  try {
    return JSON.parse(Buffer.from(parts[2], "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function validRedirectUri(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function registerAgentClient(input: { client_name?: unknown; redirect_uris?: unknown }) {
  const name = typeof input.client_name === "string" && input.client_name.trim() ? input.client_name.trim().slice(0, 120) : "Agent client";
  const redirects = Array.isArray(input.redirect_uris)
    ? input.redirect_uris.filter((v): v is string => typeof v === "string" && validRedirectUri(v)).slice(0, 8)
    : [];
  if (!redirects.length) throw new Error("redirect_uris must contain at least one HTTPS or loopback callback");
  const registration: ClientRegistration = { client_name: name, redirect_uris: redirects, iat: Math.floor(Date.now() / 1000) };
  return {
    client_id: seal("client", registration),
    client_name: name,
    redirect_uris: redirects,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code"],
    response_types: ["code"],
  };
}

export function readRegisteredClient(clientId: string) {
  return open<ClientRegistration>("client", clientId);
}

export function issueAuthorizationCode(input: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope?: string;
  resource?: string;
}) {
  const client = readRegisteredClient(input.clientId);
  if (!client || !client.redirect_uris.includes(input.redirectUri)) throw new Error("invalid_client_or_redirect_uri");
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(input.codeChallenge)) throw new Error("invalid_code_challenge");
  const scope = input.scope || AGENT_SCOPE;
  const resource = input.resource || AGENT_RESOURCE;
  if (scope !== AGENT_SCOPE || !isAumaraOrigin(resource)) throw new Error("invalid_scope_or_resource");
  const now = Math.floor(Date.now() / 1000);
  const code: AuthorizationCode = {
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    code_challenge: input.codeChallenge,
    scope,
    resource,
    iat: now,
    exp: now + CODE_TTL_SECONDS,
  };
  return seal("code", code);
}

export function exchangeAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}) {
  const grant = open<AuthorizationCode>("code", input.code);
  const now = Math.floor(Date.now() / 1000);
  if (!grant || grant.exp <= now) throw new Error("invalid_grant");
  if (grant.client_id !== input.clientId || grant.redirect_uri !== input.redirectUri) throw new Error("invalid_grant");
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(input.codeVerifier)) throw new Error("invalid_code_verifier");
  const challenge = createHash("sha256").update(input.codeVerifier).digest("base64url");
  if (!safeEqual(challenge, grant.code_challenge)) throw new Error("invalid_grant");
  return issueAgentToken(input.clientId);
}

export function issueAgentToken(clientId: string) {
  const now = Math.floor(Date.now() / 1000);
  const claims: AccessClaims = {
    iss: AGENT_ISSUER,
    aud: AGENT_RESOURCE,
    sub: clientId,
    scope: AGENT_SCOPE,
    iat: now,
    exp: now + AGENT_TOKEN_TTL_SECONDS,
  };
  return { accessToken: seal("access", claims), expiresIn: AGENT_TOKEN_TTL_SECONDS };
}

export function verifyAgentToken(token: string) {
  const claims = open<AccessClaims>("access", token);
  const now = Math.floor(Date.now() / 1000);
  if (!claims || !isAumaraOrigin(claims.iss) || !isAumaraOrigin(claims.aud)) return null;
  if (claims.scope !== AGENT_SCOPE || typeof claims.exp !== "number" || claims.exp <= now) return null;
  return claims;
}
