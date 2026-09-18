import { createHash, createPrivateKey, sign as nodeSign } from "node:crypto";
import { AGENT_ISSUER } from "@/lib/agentOAuth";
import {
  WEB_BOT_AUTH_BUILD_PRIVATE_JWK,
  WEB_BOT_AUTH_BUILD_PUBLIC_JWK,
} from "@/lib/webBotAuthBuildKey";

export const WEB_BOT_AUTH_DIRECTORY_PATH = "/.well-known/http-message-signatures-directory";
export const WEB_BOT_AUTH_DIRECTORY_MEDIA_TYPE =
  "application/http-message-signatures-directory+json";

/** Canonical agent origin for metadata (Radar / CoS). Never echo request Host. */
export const WEB_BOT_AUTH_ORIGIN = AGENT_ISSUER;

export type WebBotAuthPublicJwk = {
  kty: "OKP";
  crv: "Ed25519";
  x: string;
  kid?: string;
  alg?: "EdDSA";
  use?: "sig";
};

type WebBotAuthPrivateJwk = WebBotAuthPublicJwk & { d: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePrivateJwk(raw: string): WebBotAuthPrivateJwk | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
    if (parsed.kty !== "OKP" || parsed.crv !== "Ed25519") return null;
    if (typeof parsed.x !== "string" || typeof parsed.d !== "string") return null;
    return {
      kty: "OKP",
      crv: "Ed25519",
      x: parsed.x,
      d: parsed.d,
      kid: typeof parsed.kid === "string" ? parsed.kid : undefined,
      alg: "EdDSA",
      use: "sig",
    };
  } catch {
    return null;
  }
}

function parsePublicJwk(raw: string): WebBotAuthPublicJwk | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
    if (parsed.kty !== "OKP" || parsed.crv !== "Ed25519" || typeof parsed.x !== "string") return null;
    return {
      kty: "OKP",
      crv: "Ed25519",
      x: parsed.x,
      kid: typeof parsed.kid === "string" ? parsed.kid : undefined,
      alg: "EdDSA",
      use: "sig",
    };
  } catch {
    return null;
  }
}

function publicFromPrivate(jwk: WebBotAuthPrivateJwk): WebBotAuthPublicJwk {
  return {
    kty: "OKP",
    crv: "Ed25519",
    x: jwk.x,
    kid: jwk.kid,
    alg: "EdDSA",
    use: "sig",
  };
}

/** RFC 7638 JWK thumbprint for Ed25519 OKP (base64url SHA-256). */
export function jwkThumbprint(jwk: Pick<WebBotAuthPublicJwk, "kty" | "crv" | "x">): string {
  const required = { crv: jwk.crv, kty: jwk.kty, x: jwk.x };
  return createHash("sha256").update(JSON.stringify(required)).digest("base64url");
}

function withMeta(jwk: WebBotAuthPublicJwk): WebBotAuthPublicJwk {
  const kid = jwk.kid ?? jwkThumbprint(jwk);
  return { kty: "OKP", crv: "Ed25519", x: jwk.x, kid, alg: "EdDSA", use: "sig" };
}

function loadKeyMaterial(): {
  publicKeys: WebBotAuthPublicJwk[];
  privateJwk: WebBotAuthPrivateJwk | null;
  source: "env-private" | "env-public" | "build";
} {
  const envPrivate = process.env.WEB_BOT_AUTH_PRIVATE_JWK?.trim();
  if (envPrivate) {
    const priv = parsePrivateJwk(envPrivate);
    if (priv) {
      const pub = withMeta(publicFromPrivate(priv));
      return {
        publicKeys: [pub],
        privateJwk: { ...priv, kid: pub.kid, alg: "EdDSA", use: "sig" },
        source: "env-private",
      };
    }
  }

  const envPublic = process.env.WEB_BOT_AUTH_PUBLIC_JWK?.trim();
  if (envPublic) {
    const pub = parsePublicJwk(envPublic);
    if (pub) {
      return { publicKeys: [withMeta(pub)], privateJwk: null, source: "env-public" };
    }
  }

  const pub = withMeta({
    kty: "OKP",
    crv: "Ed25519",
    x: WEB_BOT_AUTH_BUILD_PUBLIC_JWK.x,
  });
  const priv: WebBotAuthPrivateJwk = {
    kty: "OKP",
    crv: "Ed25519",
    x: WEB_BOT_AUTH_BUILD_PRIVATE_JWK.x,
    d: WEB_BOT_AUTH_BUILD_PRIVATE_JWK.d,
    kid: pub.kid,
    alg: "EdDSA",
    use: "sig",
  };
  return { publicKeys: [pub], privateJwk: priv, source: "build" };
}

export function getWebBotAuthDirectory(): {
  body: { keys: WebBotAuthPublicJwk[] };
  privateJwk: WebBotAuthPrivateJwk | null;
  source: string;
} {
  const material = loadKeyMaterial();
  return {
    body: { keys: material.publicKeys },
    privateJwk: material.privateJwk,
    source: material.source,
  };
}

function requestAuthority(req: Request): string {
  const raw = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "www.aumara.me")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:443$/, "");
  return raw || "www.aumara.me";
}

/**
 * Sign directory response per Cloudflare Web Bot Auth hosting guidance
 * (tag=http-message-signatures-directory, @authority;req).
 */
export function signDirectoryHeaders(
  req: Request,
  privateJwk: WebBotAuthPrivateJwk,
): { signature: string; signatureInput: string } {
  const authority = requestAuthority(req);
  const keyid = privateJwk.kid ?? jwkThumbprint(privateJwk);
  const created = Math.floor(Date.now() / 1000);
  const expires = created + 300;
  const nonce = createHash("sha256").update(`${keyid}.${created}`).digest("base64url");
  const params =
    `("@authority";req);alg="ed25519";keyid="${keyid}";nonce="${nonce}";` +
    `tag="http-message-signatures-directory";created=${created};expires=${expires}`;
  const signatureBase = `"@authority";req: ${authority}\n"@signature-params": ${params}`;
  const keyObject = createPrivateKey({ key: privateJwk, format: "jwk" });
  const sig = nodeSign(null, Buffer.from(signatureBase, "utf8"), keyObject).toString("base64");
  return {
    signature: `sig1=:${sig}:`,
    signatureInput: `sig1=${params}`,
  };
}
