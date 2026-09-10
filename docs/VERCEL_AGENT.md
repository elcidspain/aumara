# Handoff for Vercel Agent (executor)

You are the executor on GitHub `elcidspain/aumara`, Vercel project `aumara-path-cut` (team `elidspaincom`).  
Grok is the other executor (Grok Build sandbox + github.io Cesium guest). We are not inventing Cesium. Read this before the next PR.

Do **not** put ion tokens in code, PRs, logs, screenshots, or chat.

## Map of the scatter (what is where)

| Layer | URL / ref | What it actually is |
|---|---|---|
| Production | https://aumara-path-cut.vercel.app | Cursor CLI deploys (`actor: cursor-cli`). Guest landing. **No `/spatial` (404).** Do not overwrite. |
| Git preview (work here) | https://aumara-path-cut-git-sandbox-v3-3-p0-densified-elidspaincom.vercel.app | Branch `sandbox/v3-3-p0-densified`. Latest SHA `8798a778` (merge PR #22). |
| `/spatial` on that preview | …/spatial | **200.** Static Cesium tour (github.io copy). Ion button still **prompts localStorage**. |
| `/v3-3-proof` | …/v3-3-proof | Densified MASTER_C: **37 804** RGB points. Owner QA. Not Cesium. |
| `/spatial-001` | Next app page | Coordination sheet only. Not the flight. |
| Canonical Cesium guest | https://elcidspain.github.io/aumara | Real 3D tour. Token via on-page Ion → localStorage. |
| Git | https://github.com/elcidspain/aumara | Already linked to `aumara-path-cut`. Your PRs: #21 spatial, #22 speed-insights. |
| Your last branches | `vercel-agent/aumara-spatial-tour`, `vercel-agent/aumara-speed-insights` | Merged into sandbox. |

Your prompt said `/spatial` exists in production and `/api/ion-boot` works. **False on production.** True-ish only on the sandbox preview, and even there `/api/ion` is `{"ok":true}` ping, not a token proxy. `/api/ion-boot` and `/api/ion-gate` are not live handlers.

## Cesium ion — stop pretending it is connected

- Viewer credential = **Access Token `assets:read`**. Not OAuth app «Aumara» client 2215.
- Logging into ion.cesium.com does **not** fill the tour.
- Owner asset **5845287** (`AUMARA_L8_1_PROMO_ENTRANCE_GROK 2`) = **PROCESSING FAILED** (`File Not Found: AUMARA_20260909_HANDOFF_QA.json`). `fromIonAssetId(5845287)` cannot stream.
- Google Photorealistic depot id **2275207**. World Terrain **1**. Both 401 without a page-origin token.
- Community plan already includes Google tiles quota. Do not ask the owner to buy Commercial to un-gray the globe.
- `/spatial` still has `prompt("Cesium ion token")` + `localStorage.CESIUM_ION_TOKEN`. That contradicts your own “no localStorage / no ?ion=” rule.

Until the owner pastes Default Token in the **Vercel project env** (name only: `CESIUM_ION_TOKEN`) **and** adds these origins on the token in ion.cesium.com:

- `https://aumara-path-cut.vercel.app`
- `https://aumara-path-cut-elidspaincom.vercel.app`
- `https://aumara-path-cut-git-sandbox-v3-3-p0-densified-elidspaincom.vercel.app`
- `https://elcidspain.github.io`
- `https://aumara.me`

…Google tiles and 5845287 will not render. **Do not report Earth→site descent as working.** Hide globe. Fly the local GLB.

Owner must set the env in Vercel dashboard. Grok cannot mint ion tokens. You cannot mint them from Git.

## Geometry lock (do not invent)

- Origin WGS84 `38.79353655, -0.02037598`
- EPSG:25830 `E 758784.34 / N 4298083.43`
- GATE `38.79383541, -0.02037032`
- Houses A–F and WP0–WP10: `AUMARA_WORLD_GEOREFERENCE_v1.json` in `/spatial`.
- GLB `world/aumara-site-v2_1.glb` is **Z-up**. Cesium glTF is **Y-up**. `eastNorthUpToFixedFrame` alone is not the axis fix. Multiply a Z-up→Y-up rotation (typically +90° about X) **before** placing. Do not move vertices.

## What you already did (keep)

- PR #21: linked landing → spatial on **sandbox**. Good. Do not promote to production until mobile QA.
- PR #22: Speed Insights in Next layout on **sandbox**. Production Cursor deploy still has 0 events until that SHA is production — **do not force production**.

## Your next execution (one arm, one leg)

Work **only** on `sandbox/v3-3-p0-densified`. Open PRs into that branch. Test this URL, not production:

`https://aumara-path-cut-git-sandbox-v3-3-p0-densified-elidspaincom.vercel.app/spatial`

1. Remove the Ion `prompt` / localStorage write from `/spatial`.
2. If `process.env.CESIUM_ION_TOKEN` is set in Vercel: add `app/api/ion/route.ts` that returns a **short-lived** token or a boot flag `{ok:true, ion:true}` without echoing the secret. Client fetches `/api/ion` and sets `Cesium.Ion.defaultAccessToken` in memory only.
3. If env is **missing**: `{ok:true, ion:false}`. No prompt. `globe.show=false`. Start camera at parcel. Show local GLB immediately. User-visible line: «3D local · ion off».
4. Apply Z-up→Y-up on the GLB modelMatrix. Keep origin/houses/WPs.
5. Hide Google tiles before local flight (already sketched). A–F labels only after GLB handoff.
6. Mobile 390×844: no 404, no gray globe, GLB visible, Beds24 CTA `propid=324882`, stills from `public/media/stills/`.
7. Do not merge to `main` / production. Do not change DNS. Do not invent houses.

PASS for ion data plane = first real Google/ion tile painted. Local GLB flight is PASS for **local twin only**. Do not mix the two in the report.

## Files to read first

- `docs/VERCEL_AGENT.md` (this file)
- `app/spatial-001/page.tsx` — coordination, not the renderer
- Guest Cesium: `elcidspain/elcidspain.github.io` `aumara/ion.js`
- Proof: `/v3-3-proof` (37804 points) — visual QA of the parcel, not a Cesium substitute

Grok stays on proof + Imagine flyovers from real stills. You stay on `/spatial` sandbox. Same coordinates. No token in git.
