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

A separate preview project was published (not `aumara-path-cut`, no www domains):

- Alias: `https://aumara-clh-live-v33-elidspaincom.vercel.app`
- Inspector: `https://vercel.com/elidspaincom/aumara-clh-live-v33`

Team SSO still wraps that URL (302 to Vercel login). This MCP token cannot disable Deployment Protection on the new project. In the Vercel dashboard for **aumara-clh-live-v33**:

1. Turn off Vercel Authentication / SSO for that project only
2. Copy ion env names only (`CESIUM_ION_TOKEN` / public ion token / Maps key)
3. Allow-list the preview origin on the URL-restricted Cesium ion token

Without (2)+(3), tiles 403 (expected) and the runtime stays local.
World assets may rewrite to already-public `aumara-path-cut.vercel.app/spatial/...` paths (read-only). That is not a www promote.

## Verify

```bash
node tests/ion-seal.test.mjs
node tests/preview-server.mjs
# open http://127.0.0.1:4173/?local=1
```
