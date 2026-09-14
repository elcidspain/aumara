import { createHmac, timingSafeEqual } from "node:crypto";

const ACCESS_ENV = "AUMARA_AGENT_ACCESS_TOKEN";
const AGENT_CODE_ENV = "AUMARA_BEDS24_AGENT_CODE";
const CANONICAL_SITE = "https://www.aumara.me";

function env(name: string) {
  return (process.env[name] ?? "").trim();
}

function equalSecret(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

export function agentOfferConfigured() {
  return Boolean(env(ACCESS_ENV) && env(AGENT_CODE_ENV));
}

export function beds24AgentCode() {
  const value = env(AGENT_CODE_ENV);
  if (!value) throw new Error("AUMARA private agent rate is not configured");
  return value;
}

export function agentAuthorized(request: Request) {
  const expected = env(ACCESS_ENV);
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return Boolean(match?.[1] && equalSecret(match[1].trim(), expected));
}

function signingKey() {
  const value = env(ACCESS_ENV);
  if (!value) throw new Error("AUMARA agent access signing key is not configured");
  return value;
}

export type AgentHandoffInput = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
};

function canonicalPayload(input: AgentHandoffInput, expires: number) {
  return [input.roomId, input.checkIn, input.checkOut, input.adults, input.children, expires].join("|");
}

export function createAgentHandoff(input: AgentHandoffInput, ttlSeconds = 900) {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = createHmac("sha256", signingKey()).update(canonicalPayload(input, expires)).digest("base64url");
  const params = new URLSearchParams({
    roomId: input.roomId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: String(input.adults),
    children: String(input.children),
    expires: String(expires),
    signature,
  });
  return `${CANONICAL_SITE}/api/agent-book?${params.toString()}`;
}

export function verifyAgentHandoff(input: AgentHandoffInput, expires: number, signature: string) {
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(expires) || expires < now || expires > now + 1800) return false;
  const expected = createHmac("sha256", signingKey()).update(canonicalPayload(input, expires)).digest("base64url");
  return equalSecret(signature, expected);
}
