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
Logo: AUMARA mark only — https://www.aumara.me/media/logo.png
Do not attach the personal / ILIA logo.

## Ads account

CID `855-744-3576` · Payments `2448-5835-5959` · `elcidspain@gmail.com`
Live Search campaign: `Aumara_Booking_Search` — leave ON.
PMax pack: `docs/ADS_PMAX_INSTALL.md`. Do not enable PMax until billing + Book conversion exist.
Visa •••• 6608 declined 1 Sep 2026 — card must be replaced or nothing serves.

No Google Ads API connector on this workspace. Brand Library is a click path.

### Click path — Brand Library (the four ineligible rows)

1. ads.google.com → account 855-744-3576
2. Tools and settings → Shared library → Brand lists
   (or Campaigns → campaign → Settings → Brand settings / Brand guidelines)
3. Keep only: **AUMARA** and **EL CID** (Reconquistador if that is the exact listed name).
4. Delete / do not include: personal name, Booking.com composite name, other AUMARA domains, spelling variants as extra brands.
5. Brand exclusions on Search + PMax: `aumara.es`, `aumara.xyz`, `aumara.com`.
6. Business name field: `AUMARA`. Not El Cid Ventures. Not Ilia.

## Conversions — owner priority 2026-09-05

Primary: website visit on www.aumara.me + direct book on Beds24 property **324882**.
- Chalet room 674465
- Superior room 674466
- Final URL of ads: https://www.aumara.me/  (not Beds24, not elcidspain.com)
- Conversion 1 (primary, Purchase/Book): destination contains `beds24.com/booking2.php`
- Conversion 2 (secondary, observe): click out to Beds24 `propid=324882`

Not primary: phone +34 966 57 99 70. Keep the call asset. Do not bid to calls.

Airbnb: owner asked whether to switch it on. Default = off until explicit yes.
Do not use Booking.com as the owned conversion destination anymore.

### Site gap

`app/layout.tsx` on aumara.me has schema.org ReserveAction → Beds24, but **no Google tag / gtag / GTM**. dataLayer events exist only on the old COOKBOOK static landing. Tag must be installed on the Vercel project that serves www.aumara.me before Maximize conversions can work.

## Identity chain (do not collapse)

Brand AUMARA → legal operator EL CID VENTURES BENIDOLEIG S.L. → booking Beds24 324882.
EL CID (knight) is the sister public brand, not the stay product name.
