#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const API_BASE = "https://api.serus.ai";
const IDENTIFIER_TYPES = ["email", "phone", "username", "domain", "keyword", "origin", "password"];
const IDENTIFIER_ALIASES = {
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

loadDotEnv(".env.local");
loadDotEnv(".env");

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const command = args[0] ?? "help";

try {
  if (command === "hello" || command === "status") {
    printJson(await serusHello());
    process.exit(0);
  }
  if (command === "scan") {
    const identifierType = parseIdentifierType(args[1]);
    const identifierValue = parseIdentifierValue(args[2]);
    const account = await serusHello();
    if (account.credits_remaining <= 0) {
      console.error(
        "Serus API balance is empty (credits_remaining=0). Add credits at https://app.serus.ai — scans cost 0.25 credits each. Status:",
      );
      printJson(account);
      process.exit(2);
    }
    const scan = await serusRequest("POST", "/v1/darkweb/scans", { identifierType, identifierValue });
    printJson(scan);
    process.exit(0);
  }
  if (command === "get") {
    const scanId = parseScanId(args[1]);
    const reveal = args.includes("--reveal");
    const pathName = `/v1/darkweb/scans/${encodeURIComponent(scanId)}${reveal ? "?reveal=true" : ""}`;
    printJson(await serusRequest("GET", pathName));
    process.exit(0);
  }
  printHelp();
  process.exit(command === "help" || command === "-h" || command === "--help" ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`Serus operator CLI (server-only). Docs: https://docs.serus.ai/  Setup: docs/SERUS.md

Usage:
  npm run serus -- hello
  npm run serus -- scan <email|phone|username|domain|keyword|origin|password> <value>
  npm run serus -- get <scanId>
  npm run serus -- get <scanId> --reveal

Requires SERUS_API_KEY in the environment or .env.local.
hello / get are free. Starting a scan costs 0.25 credits.
Use this only for identifiers you are authorized to check (your domain, staff, guests who asked).`);
}

function getApiKey() {
  const key = (process.env.SERUS_API_KEY ?? "").trim();
  if (!key) {
    throw new Error("SERUS_API_KEY is not set. Copy .env.example to .env.local and add the Serus secret.");
  }
  if (!key.startsWith("ak_")) {
    throw new Error("SERUS_API_KEY must be a Serus secret starting with ak_");
  }
  return key;
}

async function serusHello() {
  const payload = await serusRequest("GET", "/v1/hello");
  if (!payload || typeof payload !== "object" || typeof payload.subject !== "string") {
    throw new Error("Serus /v1/hello returned an unexpected payload");
  }
  return payload;
}

async function serusRequest(method, pathname, body) {
  const headers = {
    Authorization: `Bearer ${getApiKey()}`,
    Accept: "application/json",
  };
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  if (!response.ok) {
    const fromBody =
      parsed && typeof parsed === "object"
        ? parsed.error || parsed.message || parsed.error_description
        : null;
    if (typeof fromBody === "string" && fromBody.trim()) throw new Error(fromBody.trim());
    if (response.status === 402) {
      throw new Error("Serus API balance is empty. Add credits at https://app.serus.ai");
    }
    throw new Error(`Serus request failed with HTTP ${response.status}${text ? `: ${text.slice(0, 400)}` : ""}`);
  }
  return parsed;
}

function parseIdentifierType(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`identifier type is required. One of: ${IDENTIFIER_TYPES.join(", ")}`);
  }
  const mapped = IDENTIFIER_ALIASES[value.trim().toLowerCase()];
  if (!mapped) {
    throw new Error(`unknown identifier type "${value}". One of: ${IDENTIFIER_TYPES.join(", ")}`);
  }
  return mapped;
}

function parseIdentifierValue(value) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 320) {
    throw new Error("identifier value is required (1–320 characters)");
  }
  return value.trim();
}

function parseScanId(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(value.trim())) {
    throw new Error("scanId must be 8–128 letters, numbers, _ or -");
  }
  return value.trim();
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function loadDotEnv(filename) {
  const file = path.join(process.cwd(), filename);
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || key in process.env) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
