import { createHash, randomBytes } from "crypto";
import { appendFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";

export type DeliveryReceiptEntry = {
  receiptId: string;
  ts: string;
  method: string;
  callerHint: string;
  dates: { checkIn?: string; checkOut?: string } | null;
  unitCount: number;
  payloadHash: string;
  httpStatus: 200;
};

/** `aumara-a2a-` + timestamp + short random. */
export function createReceiptId(): string {
  const ts = Date.now().toString(36);
  const rand = randomBytes(4).toString("hex");
  return `aumara-a2a-${ts}-${rand}`;
}

/**
 * SHA-256 hex of canonical JSON without meta.receiptId circularity.
 * Strips meta.receiptId if present before hashing.
 */
export function payloadHash(payload: unknown): string {
  const clone = structuredClone(payload) as Record<string, unknown> | unknown;
  if (clone && typeof clone === "object" && !Array.isArray(clone)) {
    const obj = clone as Record<string, unknown>;
    if (obj.meta && typeof obj.meta === "object" && !Array.isArray(obj.meta)) {
      const meta = { ...(obj.meta as Record<string, unknown>) };
      delete meta.receiptId;
      obj.meta = meta;
    }
  }
  const canonical = JSON.stringify(clone);
  return createHash("sha256").update(canonical).digest("hex");
}

/** Hash of UA+Origin for caller hint — no raw PII stored. */
export function callerHintFromRequest(request: Request): string {
  const ua = request.headers.get("user-agent") ?? "";
  const origin = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  return createHash("sha256").update(`${ua}|${origin}`).digest("hex").slice(0, 16);
}

function candidateLogPaths(): string[] {
  const cwd = process.cwd();
  return [
    join(cwd, "aumara/jobs/AUMARA_A2A_DELIVERY_LOG.jsonl"),
    "/tmp/AUMARA_A2A_DELIVERY_LOG.jsonl",
  ];
}

/**
 * Append one JSON line to the delivery log.
 * Prefers repo path `aumara/jobs/AUMARA_A2A_DELIVERY_LOG.jsonl` if writable,
 * else `/tmp/AUMARA_A2A_DELIVERY_LOG.jsonl`.
 */
export function appendDeliveryReceipt(entry: DeliveryReceiptEntry): string {
  const line = JSON.stringify(entry) + "\n";
  for (const path of candidateLogPaths()) {
    try {
      const dir = dirname(path);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      if (!existsSync(path)) writeFileSync(path, "", "utf8");
      appendFileSync(path, line, "utf8");
      return path;
    } catch {
      // try next candidate
    }
  }
  // Last resort: swallow write failure so response still succeeds
  return "";
}
