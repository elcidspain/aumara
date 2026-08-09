# AUMARA Digital Twin

**Locked terrain + L2 scene + smoke suite → L8.1 promo → L10 interiors**

## Prod Agent (non-stop until smoke green)

1. Open [`AUMARA_TWIN_LOCK.json`](./AUMARA_TWIN_LOCK.json) — single source of truth.
2. Copy [`AUMARA_PROD_AGENT_SYSTEM_PROMPT.md`](./AUMARA_PROD_AGENT_SYSTEM_PROMPT.md) 1:1 into the agent.
3. Connectors required: **Google Drive + GitHub (this repo) + Vercel**.
4. First message to agent:  
   `Load AUMARA_TWIN_LOCK.json and start L2 smoke until green.`

### Smoke (must all pass)
| ID | Check |
|----|-------|
| SMOKE_01 | Ground continuous at 18 m |
| SMOKE_02 | Domes NOT on padel court |
| SMOKE_03 | Domes do not overlap |
| SMOKE_04 | Pool proportion 0.58 |

After green → L8.1 promo (same terrain) + L10 interiors.

## Key sources
- Planos: Drive `240307_9-PLANOS_Glamping.pdf`
- Architect: PUCHOL ARQUITECTES
- Site: Complejo El Cid, Rincón del Silencio, Benidoleig

See also: [`AUMARA_PROD_AGENT_LAUNCH.md`](./AUMARA_PROD_AGENT_LAUNCH.md)
