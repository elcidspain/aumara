# AUMARA / EL CID — agent rules

- Public guest site is the Next.js app at `/` (aumara.me). Booking path is Beds24 property 324882.
- AUMARA is independent geodesic houses (Chalet / Superior Chalet). Never publish it as a bungalow. Google Business Profile click path: `docs/GBP_CANON.md`.
- Do not advertise physical-vs-bookable inventory counts on guest pages.
- Guest-facing creative is AUMARA only. Do not put EL CID sister-brand links, labels, navigation, map tags, hotel/restaurant imagery, or EL CID marketing copy in the AUMARA guest layer. Legal operator disclosure belongs in footer/legal surfaces only.
- Machine-readable inventory truth: six physical houses; five currently sellable for short stays; current sellable mix is 3 Chalet + 2 Superior Chalet. Never publish 4 Chalet + 2 Superior as current inventory.
- `AUMARA_TWIN_LOCK.json` status is `SUPERSEDED_DO_NOT_EXECUTE`. `/twin` is unlisted historical smoke — not the guest product.
- `twin/terrain_real.json` stays as a frozen artifact; do not invent coordinates, pools, or houses.
- Do not add Gaussian splat / depth diagnostics to guest pages. Do not depend on surge.sh.
- Prefer small PRs. After TS/TSX changes: `npx tsc --noEmit`, `npm run lint`, and `npm run assert-copy` must pass.
- Auto-Prepare-Merge: lock gate + typecheck + lint. **No auto-commit, no auto-push to main.**
- Director (`agent/director.mjs`) comments GO or HOLD. Do not remove it.
