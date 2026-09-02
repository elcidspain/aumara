# AUMARA / EL CID — agent rules

- Public guest site is the Next.js app at `/` (aumara.me). Booking path is Beds24 property 324882.
- Do not advertise physical-vs-bookable inventory counts on guest pages.
- `AUMARA_TWIN_LOCK.json` status is `SUPERSEDED_DO_NOT_EXECUTE`. `/twin` is unlisted historical smoke — not the guest product.
- `twin/terrain_real.json` stays as a frozen artifact; do not invent coordinates, pools, or houses.
- Do not add Gaussian splat / depth diagnostics to guest pages. Do not depend on surge.sh.
- Prefer small PRs. After TS/TSX changes: `npx tsc --noEmit`, `npm run lint`, and `npm run assert-copy` must pass.
- Auto-Prepare-Merge: lock gate + typecheck + lint. **No auto-commit, no auto-push to main.**
- Director (`agent/director.mjs`) comments GO or HOLD. Do not remove it.
