import { generateKeyPairSync } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const output = resolve(process.cwd(), "lib/webBotAuthBuildKey.ts");
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });

const publicJwk = {
  kty: "OKP",
  crv: "Ed25519",
  x: pub.x,
  alg: "EdDSA",
  use: "sig",
};

const privateJwk = {
  ...publicJwk,
  d: priv.d,
};

await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `// Generated during prebuild for preview/sandbox Web Bot Auth. Never commit this file.
// Production: set WEB_BOT_AUTH_PRIVATE_JWK (full OKP JWK including d) or WEB_BOT_AUTH_PUBLIC_JWK (public only).
export const WEB_BOT_AUTH_BUILD_PUBLIC_JWK = ${JSON.stringify(publicJwk, null, 2)} as const;
export const WEB_BOT_AUTH_BUILD_PRIVATE_JWK = ${JSON.stringify(privateJwk, null, 2)} as const;
`,
  { encoding: "utf8", mode: 0o600 },
);

console.log("Generated per-deployment AUMARA Web Bot Auth Ed25519 keypair (public+private build file; gitignored).");
