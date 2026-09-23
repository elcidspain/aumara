# Serus API (operator-only)

Serus is a privacy / dark-web lookup API (`https://api.serus.ai`). AUMARA uses it as an **operator tool**, not as a guest-site feature. The secret never goes to the browser.

Official reference: [docs.serus.ai](https://docs.serus.ai/). Dashboard: [app.serus.ai](https://app.serus.ai/).

## Where the key lives

| Place | How |
| --- | --- |
| Local | `.env.local` as `SERUS_API_KEY` (gitignored). Copy from `.env.example`. |
| Production / preview | Vercel project env `SERUS_API_KEY` on `aumara-clh-v33` (encrypted, all environments). |
| Code | `lib/serus.ts` (typed client) and `npm run serus` (CLI). |

Do **not** name it `NEXT_PUBLIC_SERUS_API_KEY`. Do **not** commit the secret.

This key (`OSINT-sirius`) has scopes: `account:read`, `darkweb:read`, `darkweb:reveal`, `darkweb:scan`.

## How to use

From the repo root, after `.env.local` is filled in:

```bash
# 1. Verify the key (free, no credits)
npm run serus -- hello

# 2. Start a dark-web scan (0.25 credits)
npm run serus -- scan email you@example.com
npm run serus -- scan domain aumara.me

# 3. Poll results until status is success or failed (free)
npm run serus -- get SCAN_ID

# 4. Unmasked breach values (free, needs darkweb:reveal)
npm run serus -- get SCAN_ID --reveal
```

From application code (server-only):

```ts
import { getSerusDarkwebScan, serusHello, startSerusDarkwebScan } from "@/lib/serus";

const account = await serusHello();
const scan = await startSerusDarkwebScan({
  identifierType: "email",
  identifierValue: "you@example.com",
});
const result = await getSerusDarkwebScan(scan.id);
```

Identifier types: `email`, `phone`, `username`, `domain`, `keyword`, `origin`, `password`.

Raw HTTP (same as the CLI):

```bash
curl https://api.serus.ai/v1/hello \
  -H "Authorization: Bearer $SERUS_API_KEY"
```

## Credits

`hello`, reading a scan, and `?reveal=true` do not consume credits. Starting a scan costs **0.25 credits**. If `credits_remaining` is `0`, add balance at [app.serus.ai](https://app.serus.ai/) before running `scan`.

## Rules of use

Only look up identifiers you are allowed to check (AUMARA / EL CID accounts, staff, or people who asked). Unmasked reveal is for that same authorized set. This is not a guest-facing page on aumara.me.
