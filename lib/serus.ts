/**
 * Server-only Serus API client (https://docs.serus.ai/).
 * Import from Node scripts or Next.js route handlers — never from client components.
 */

export const SERUS_API_BASE = "https://api.serus.ai";

export const SERUS_IDENTIFIER_TYPES = [
  "email",
  "phone",
  "username",
  "domain",
  "keyword",
  "origin",
  "password",
] as const;

export type SerusIdentifierType = (typeof SERUS_IDENTIFIER_TYPES)[number];

const IDENTIFIER_ALIASES: Record<string, SerusIdentifierType> = {
  email: "email",
  phone: "phone",
  "phone number": "phone",
  phone_number: "phone",
  username: "username",
  domain: "domain",
  keyword: "keyword",
  origin: "origin",
  password: "password",
};

export type SerusHello = {
  subject: string;
  scopes: string[];
  credits_remaining: number;
};

export type SerusDarkwebScan = {
  id: string;
  status: string;
  identifierType?: string;
  identifierValue?: string;
  error?: string;
  findings?: unknown;
};

export class SerusApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "SerusApiError";
    this.status = status;
    this.body = body;
  }
}

export class SerusConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SerusConfigError";
  }
}

export function isSerusConfigured(): boolean {
  return Boolean(readSerusApiKey());
}

export function getSerusApiKey(): string {
  const key = readSerusApiKey();
  if (!key) {
    throw new SerusConfigError(
      "SERUS_API_KEY is not set. Add it to .env.local (local) or the Vercel project env (production). See docs/SERUS.md.",
    );
  }
  if (!key.startsWith("ak_")) {
    throw new SerusConfigError("SERUS_API_KEY must be a Serus secret starting with ak_");
  }
  return key;
}

export function parseSerusIdentifierType(value: string): SerusIdentifierType {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SerusConfigError("identifierType is required");
  }
  const mapped = IDENTIFIER_ALIASES[value.trim().toLowerCase()];
  if (!mapped) {
    throw new SerusConfigError(
      `identifierType must be one of: ${SERUS_IDENTIFIER_TYPES.join(", ")}`,
    );
  }
  return mapped;
}

export function parseSerusIdentifierValue(value: string): string {
  if (typeof value !== "string") {
    throw new SerusConfigError("identifierValue is required");
  }
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 320) {
    throw new SerusConfigError("identifierValue must be 1–320 characters");
  }
  return trimmed;
}

export function parseSerusScanId(value: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(value.trim())) {
    throw new SerusConfigError("scanId must be 8–128 letters, numbers, _ or -");
  }
  return value.trim();
}

export async function serusHello(): Promise<SerusHello> {
  const payload = await serusRequest("GET", "/v1/hello");
  return asHello(payload);
}

export async function startSerusDarkwebScan(input: {
  identifierType: string;
  identifierValue: string;
}): Promise<SerusDarkwebScan> {
  const identifierType = parseSerusIdentifierType(input.identifierType);
  const identifierValue = parseSerusIdentifierValue(input.identifierValue);
  const payload = await serusRequest("POST", "/v1/darkweb/scans", {
    identifierType,
    identifierValue,
  });
  return asScan(payload);
}

export async function getSerusDarkwebScan(
  scanId: string,
  options?: { reveal?: boolean },
): Promise<SerusDarkwebScan> {
  const id = parseSerusScanId(scanId);
  const reveal = options?.reveal === true;
  const path = `/v1/darkweb/scans/${encodeURIComponent(id)}${reveal ? "?reveal=true" : ""}`;
  const payload = await serusRequest("GET", path);
  return asScan(payload);
}

function readSerusApiKey(): string {
  return (process.env.SERUS_API_KEY ?? "").trim();
}

async function serusRequest(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, string>,
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getSerusApiKey()}`,
    Accept: "application/json",
  };
  if (body) headers["Content-Type"] = "application/json";

  const response = await fetch(`${SERUS_API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    throw new SerusApiError(
      serusErrorMessage(response.status, parsed, text),
      response.status,
      text.slice(0, 2000),
    );
  }

  return parsed;
}

function serusErrorMessage(status: number, parsed: unknown, text: string): string {
  const fromBody = readErrorString(parsed);
  if (fromBody) return fromBody;
  if (status === 402 || /credit/i.test(text)) {
    return "Serus API balance is empty. Add credits at https://app.serus.ai before starting scans.";
  }
  return `Serus request failed with HTTP ${status}`;
}

function readErrorString(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  for (const key of ["error", "message", "error_description"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function asHello(payload: unknown): SerusHello {
  if (!payload || typeof payload !== "object") {
    throw new SerusApiError("Serus /v1/hello returned a non-object", 200, "");
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.subject !== "string" || record.subject.trim() === "") {
    throw new SerusApiError("Serus /v1/hello missing subject", 200, "");
  }
  const scopes = Array.isArray(record.scopes)
    ? record.scopes.filter((item): item is string => typeof item === "string")
    : [];
  const credits =
    typeof record.credits_remaining === "number" && Number.isFinite(record.credits_remaining)
      ? record.credits_remaining
      : 0;
  return {
    subject: record.subject,
    scopes,
    credits_remaining: credits,
  };
}

function asScan(payload: unknown): SerusDarkwebScan {
  if (!payload || typeof payload !== "object") {
    throw new SerusApiError("Serus scan response was not an object", 200, "");
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id.trim() === "") {
    throw new SerusApiError("Serus scan response missing id", 200, "");
  }
  return {
    id: record.id,
    status: typeof record.status === "string" ? record.status : "unknown",
    identifierType: typeof record.identifierType === "string" ? record.identifierType : undefined,
    identifierValue: typeof record.identifierValue === "string" ? record.identifierValue : undefined,
    error: typeof record.error === "string" ? record.error : undefined,
    findings: "findings" in record ? record.findings : undefined,
  };
}
