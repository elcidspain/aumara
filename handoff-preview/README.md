# AUMARA CLEAN_LOCAL_HANDOFF (preview only)

Standalone Cesium Earth → parcel → local V2.1 GLB twin.

**Do not** assign `www.aumara.me` / `aumara.me` to this folder.
**Do not** production-deploy this as project `aumara-path-cut`.

## Contract

- `GET /` and `GET /world/aumara-site-v2_1.glb` → 200
- `GET /api/ion` is sealed: `{ ok, configured, googleMaps }` — no token/JWT/key
- Client path: `/api/ion` → `/api/ion-gate` → `/api/ion-boot`
- `?local=1` skips ion and flies the local twin immediately
- Globe stays hidden unless World Terrain height is actually proven (this preview never enables the globe)

## Deploy

Create or use a **separate** Vercel project with this directory as the root.
Copy ion env names only (`CESIUM_ION_TOKEN` / public ion token / Maps key) in the Vercel dashboard.
Add the preview origin to the Cesium ion token URL allow-list. Without that, tiles 403 and the runtime fail-closes to local.

## Verify

```bash
node tests/ion-seal.test.mjs
node tests/preview-server.mjs
# open http://127.0.0.1:4173/?local=1
```
