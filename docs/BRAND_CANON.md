# AUMARA / EL CID — brand canon

Locked 2026-09-05 from owner instruction.
There are two public brands. Not four.

## Keep

1. **AUMARA** (spoken Yaumara / Almara). Guest-facing stay brand.
   - Site: https://www.aumara.me/
   - Operator: EL CID VENTURES BENIDOLEIG S.L. · CIF B53816989
   - OEPM filing 27 Aug 2026: application **M4399369**, registro **202699801263161**
   - Gmail (not Drive): `M4399369_SOLIC_2026-08-27.pdf` from OEPM@oepm.es
   - Payment receipt: `Pago_pasarela_AEAT_B53816989.pdf`
2. **EL CID** / Reconquistador (the knight). Hotel, restaurant, country club.
   - Site: https://elcidspain.com/
   - Same legal operator.

Legal company name is not a third guest brand. CIF/razon social stay in the footer only.

## Remove from Google Ads Brand Library / Brand guidelines / Business name assets

- ILIA DOROSHENKO / personal name (already policy-rejected July 2026)
- Aumara El Cid (Booking.com listing name, not a brand)
- Almara as a separate brand row (pronunciation only)
- aumara.es, aumara.xyz, aumara.com (other people’s brands)
- any inferred 3rd/4th brand Google auto-detected from Final URL

Business name asset for AUMARA campaigns: `AUMARA` only.
Logo (header, vector): https://www.aumara.me/media/logo.svg
Raster lockup for Ads / OG: https://www.aumara.me/media/logo.png
Mark only (square Ads slot): https://www.aumara.me/media/logo-mark.png
Do not attach the personal / ILIA logo.

## Ads account

CID `855-744-3576` · Payments `2448-5835-5959` · `elcidspain@gmail.com`
Live Search campaign: `Aumara_Booking_Search` — leave ON unless an explicit spend decision changes it.
PMax pack: `docs/ADS_PMAX_INSTALL.md`. Do not enable PMax until billing + verified completed-booking conversion exist.
Visa •••• 6608 declined 1 Sep 2026 — card must be replaced or nothing serves.

Current connected tooling is sufficient for read-side account inspection; conversion creation/import is still an external Ads/GA4 configuration step.

### Click path — Brand Library (the four ineligible rows)

1. ads.google.com → account 855-744-3576
2. Tools and settings → Shared library → Brand lists
   (or Campaigns → campaign → Settings → Brand settings / Brand guidelines)
3. Keep only: **AUMARA** and **EL CID** (Reconquistador if that is the exact listed name).
4. Delete / do not include: personal name, Booking.com composite name, other AUMARA domains, spelling variants as extra brands.
5. Brand exclusions on Search + PMax: `aumara.es`, `aumara.xyz`, `aumara.com`.
6. Business name field: `AUMARA`. Not El Cid Ventures. Not Ilia.

## Conversions — owner priority 2026-09-05

Primary objective: a completed direct booking attributable to AUMARA paid traffic.
- Final URL of ads: https://www.aumara.me/  (not Beds24, not elcidspain.com)
- Primary Purchase/Book conversion: fire only after a verified successful Beds24 booking completion signal, or from an already-linked GA4 completion event.
- A destination rule that only matches the Beds24 booking page is **not** a completed-booking conversion and must never be used as the primary Purchase/Book signal.
- Secondary / observe-only: outbound click intent to Beds24 (`booking_click`) from instrumented AUMARA pages.
- Current coverage caveat: the standalone `/spatial/` static experience does not yet emit the same booking-click telemetry, so full-funnel click coverage is still open.

Not primary: phone +34 966 57 99 70. Keep the call asset. Do not bid to calls.

Airbnb: owner asked whether to switch it on. Default = off until explicit yes.
Do not use Booking.com as the owned conversion destination anymore.

### Site measurement state

`app/layout.tsx` on aumara.me ships the public Google Ads tag with consent-default-denied behavior. `booking_click` is emitted from the Next-rendered guest pages. GA4 is conditional on a real `NEXT_PUBLIC_GA_MEASUREMENT_ID` and must not be invented. The standalone `/spatial/` static experience is outside the Next root layout and remains a separate instrumentation gap.

Maximize conversions remains blocked until a real successful direct booking can be observed end-to-end in the chosen Google Ads or linked GA4 conversion action.

## Identity chain (do not collapse)

Brand AUMARA → legal operator EL CID VENTURES BENIDOLEIG S.L. → booking Beds24.
EL CID (knight) is the sister public brand, not the stay product name.
