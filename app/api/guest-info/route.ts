import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    brand: "AUMARA",
    location: {
      label: "Urb. Rincón del Silencio, 3, 03759 Benidoleig, Alicante, Spain",
      latitude: 38.79353655,
      longitude: -0.02037598,
      maps: "https://maps.app.goo.gl/Ppyb5PX7nbvazpUR6",
      geoResource: "https://www.aumara.me/geo.json",
      note: "These coordinates identify AUMARA. Cova de les Calaveres is a nearby landmark, not the AUMARA location."
    },
    inventory: {
      physicalHouses: 6,
      shortStayHouses: 6,
      chalet: { name: "Chalet", count: 4, maxGuests: 4 },
      superiorChalet: { name: "Superior Chalet", count: 2, maxGuests: 6 }
    },
    booking: {
      all: "https://beds24.com/booking2.php?propid=324882",
      chalet: "https://beds24.com/booking2.php?propid=324882&roomid=674465",
      superiorChalet: "https://beds24.com/booking2.php?propid=324882&roomid=674466"
    },
    note: "Live availability, rates and reservation-specific conditions are authoritative in Beds24."
  }, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Content-Signal": "ai-train=no, search=yes, ai-input=yes"
    }
  });
}
