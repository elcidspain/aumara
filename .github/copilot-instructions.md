# AUMARA / EL CID — agent rules

You are working in the AUMARA digital twin (Complejo El Cid, Rincón del Silencio, Benidoleig).

- Single source of truth: `AUMARA_TWIN_LOCK.json`. The lock wins over improvisation.
- Owner/repo: `elcidspain/aumara`.
- Geometry, dome placement, pool proportion (0.58), and smoke suite live in the lock. Do not invent coordinates.
- Prefer small, reviewable PRs. After TS/TSX changes, keep `npx tsc --noEmit` green.
- The Director agent (`agent/director.mjs`) comments on PRs. Do not remove it.
- Auto-Prepare-Merge must stay green before merge to `main`.
