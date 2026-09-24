# AUMARA — Google Business Profile canon

Locked from owner instruction 2026-09-24 after the live Search/Knowledge Panel showed **Bungalow in Rincon del Silencio**.

There is no Google Business Profile API on this workspace. This is the click path. Website schema in `lib/schema.ts` already publishes Chalet / House / VacationRental — never Bungalow.

## What Google currently shows (wrong)

From the managed Business Profile / Search panel:

- Name: `AUMARA` (keep)
- Category line: **Bungalow in Rincon del Silencio** (remove)
- Address: `Carrer Rincón del Silencio, 3, 03750, Alicante` (wrong street type, wrong postcode, missing Benidoleig)
- Phone: `649 24 21 59` (Elena — keep as public phone)
- Map pin sits next to Cova de les Calaveres (nearby landmark only)
- Missing: exterior photo, business hours, complete profile, Book link

## Canonical NAP

- Business name: `AUMARA`
- Primary category: **Holiday home** (ES UI: *Casa vacacional* / *Alojamiento vacacional*). If that exact row is missing: **Vacation home rental agency** or **Lodge**. Never Bungalow. Never Bungalow park. Never Hotel.
- Additional categories (optional, after primary is fixed): Lodge, Cottage rental. Do not add Glamping as primary. Do not add Hotel, Hostel, Campground.
- Address: `Urb. Rincón del Silencio, 3`
- Locality: `Benidoleig` (not “Alicante” as town)
- Province / region: `Alicante`
- Postcode: `03759` (never `03750`)
- Country: Spain
- Website: `https://www.aumara.me/`
- Appointment / booking URL: `https://beds24.com/booking2.php?propid=324882`
- Public phone: `+34 649 24 21 59` (Elena). Do not bid Ads to calls.
- Maps: `https://maps.app.goo.gl/Ppyb5PX7nbvazpUR6`
- Description: Casas geodésicas independientes en Benidoleig (Chalet y Superior Chalet). Casa completa, entrada propia. Reserva directa en aumara.me. No es un bungalow.

Cova de les Calaveres is a nearby landmark only. Do not set it as the AUMARA location.

## Click path — category and address

1. Google Search → AUMARA → **You manage this Business Profile** (the panel in the screenshot) **or** business.google.com signed in as `elcidspain@gmail.com`
2. **Edit your business information**
3. Category → delete **Bungalow** → set primary **Holiday home** / *Casa vacacional* / Lodge
4. Address → `Urb. Rincón del Silencio, 3, 03759 Benidoleig, Alicante`
5. Website → `https://www.aumara.me/`
6. Add booking / appointment link → Beds24 `propid=324882`
7. **Add exterior photo** → production stills, not cave photos:
   - https://www.aumara.me/media/hero/three-houses-01.webp
   - https://www.aumara.me/media/stills/pines-domes.jpg
   - https://www.aumara.me/media/stills/colored-houses.jpg
8. Business hours: this is a vacation rental, not a shop. If Google demands hours, use check-in window only after it exists in Beds24 terms. Do not invent 09:00–18:00 shop hours.
9. Save. Wait for Google to recrawl. The Knowledge Panel subtitle should become Holiday home / Chalet in Benidoleig, not Bungalow in Rincon del Silencio.

## Ads

Search campaign `Aumara_Booking_Search` stays ON.
Do not enable PMax until billing + Book conversion exist (`docs/ADS_PMAX_INSTALL.md`).
Negatives include bungalow / bungaló / bungalow park so paid traffic does not buy the wrong category Google just invented.

Primary conversion remains confirmed Beds24 booking on www.aumara.me, property **324882**.
