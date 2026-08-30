# AUMARA / EL CID — agent rules

This repository is **historical**. Live twin is **not** here.

- `AUMARA_TWIN_LOCK.json` status is `SUPERSEDED_DO_NOT_EXECUTE`.
- Canonical: `elcidspain/elcidspain.github.io` (`aumara/world/AUMARA_SOURCE_REGISTRY.json`).
- Do not deploy this repo, do not treat legacy dome/L2 smoke as current truth, do not use Vercel from here.
- `twin/terrain_real.json` stays as a frozen artifact; do not invent coordinates.
- Prefer small PRs. After TS/TSX changes: `npx tsc --noEmit` and `npm run lint` must pass.
- Auto-Prepare-Merge: lock gate + typecheck + lint. **No auto-commit, no auto-push to main.**
- Director (`agent/director.mjs`) comments GO or HOLD. Do not remove it.
