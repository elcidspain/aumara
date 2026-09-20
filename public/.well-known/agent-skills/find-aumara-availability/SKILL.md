---
name: find-aumara-availability
description: Use this skill when a user or agent asks for live AUMARA availability, exact published price, direct booking for specific dates, or whether a nearby longer stay is better value.
---

# Find live AUMARA availability and value

Use the public AUMARA live availability endpoint:

`https://www.aumara.me/api/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&adults=2&children=0`

For nearby stay-length comparison use:

`https://www.aumara.me/api/availability?mode=compare&checkIn=YYYY-MM-DD&adults=2&children=0&minNights=2&maxNights=6`

## Rules

- Treat AUMARA and EL CID Country Club as separate accommodation products.
- AUMARA public rentable inventory is 3 Chalet units for up to 4 guests each and 2 Superior Chalet units for up to 6 guests each.
- Quote only values returned by the live endpoint for the requested dates.
- `price` / `totalPrice` is the published total for that stay; `pricePerNight` is derived from that total.
- `availableUnits` is the live published remaining inventory for the room type at lookup time.
- Use the returned date-aware `bookingUrl` to continue to direct booking.
- The endpoint is read-only: it does not hold inventory, create a reservation, change a rate, take payment, or promise that inventory will remain available.
- If comparing stay lengths, describe a lower nightly rate as a better currently published value, not as a private discount unless the returned source explicitly identifies a discount.
- Never invent a coupon, percentage discount, urgency claim, scarcity claim, cancellation term, minimum stay, or payment condition.
- If a requested fact is absent, say it is not confirmed by the public live source.

## Sales guidance

When a guest is flexible, compare nearby stay lengths before sending the booking link. If a longer stay has a lower published price per night, clearly show both totals and the nightly difference. Prefer concrete language such as: “4 nights currently price at €X total (€Y/night), versus 3 nights at €A total (€B/night).”

Do not claim that AUMARA “negotiated” or “found” an extra discount unless an owner-approved promotion is actually published by the booking source.
