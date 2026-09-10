# Vercel Edge Middleware · architecture for AUMARA

Next.js in `elcidspain/aumara`: **14.2.35**. File = `middleware.ts` at repo root (not `proxy.ts` — that is Next 16+).
There is **no middleware today**. `vercel.json` = `{ "framework": "nextjs" }`.

## Where it sits

```
phone
  → Vercel POP (edge)
      → Middleware  ← before cache, milliseconds
          → static (/spatial/index.html, GLB, b64)
          → Node Route Handler (/api/ion)
          → RSC pages (/v3-3-proof)
```

Default runtime: **edge** (V8 isolate). Node.js only with `export const config = { runtime: 'nodejs' }` (experimental).
No `fs`, no Node crypto, no long `fetch`. Conformance: **NO_FETCH_FROM_MIDDLEWARE**.

API: standard `Request` + `NextResponse`. Geo from the POP:

- `x-vercel-ip-country` / `-city` / `-latitude` / `-longitude`
- or `geolocation(request)` from `@vercel/functions`

Do not use `request.geo` (removed).

Matcher is required. Without it MW hits every `/p0-points-*.b64` (19 proof chunks) and kills TTFB.

```ts
export const config = {
  matcher: ["/", "/spatial/:path*", "/api/ion"],
};
```

## What MW can / cannot do for Cesium

| Can | Cannot / must not |
|---|---|
| Strip `?ion=` before HTML | Serve ion tiles (those are api.cesium.com) |
| Rewrite `/spatial` ↔ static | Store the GLB in the isolate |
| Header `x-aumara-onsite` from POP geo | Hide a secret from the browser |
| Redirect a prod 404 | Replace `CESIUM_ION_TOKEN` |

CesiumJS still talks to `api.cesium.com` from the browser. Edge is not the ion data plane.
Token path: **Node Route Handler** `/api/ion` + origin allow-list on ion.cesium.com.
Middleware only cleans the URL and sets flags.

## AUMARA split (Vercel Agent)

1. `middleware.ts` (edge) — routing + geo + strip query. No secret.
2. `app/api/ion/route.ts` (nodejs) — `{ ok, ion }` / short-lived token. Env `CESIUM_ION_TOKEN`. Never log it.
3. `/spatial` static — Cesium Viewer. No `prompt`, no localStorage.
4. Production Cursor — `/spatial` is 404. MW cannot invent those files. Do not rewrite prod → sandbox without the owner.

### Geo on-site (GATE 38.79383541, −0.02037032, 450 m)

POP geo is coarse (±km in Spain), not a survey. `x-aumara-onsite` is a guest-nearby heuristic, not capture truth.

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = { matcher: ["/", "/spatial/:path*", "/api/ion"] };

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  if (url.searchParams.has("ion")) {
    url.searchParams.delete("ion");
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  const lat = Number(req.headers.get("x-vercel-ip-latitude"));
  const lon = Number(req.headers.get("x-vercel-ip-longitude"));
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    const dlat = (lat - 38.79383541) * 110540;
    const dlon = (lon + 0.02037032) * 111320 * Math.cos((38.7938 * Math.PI) / 180);
    if (Math.hypot(dlat, dlon) < 450) res.headers.set("x-aumara-onsite", "1");
  }
  return res;
}
```

Do not commit the token. Do not fetch ion from MW. Do not match `/v3-3-proof` chunks.
