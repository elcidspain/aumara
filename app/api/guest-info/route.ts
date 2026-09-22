import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    brand: "AUMARA",
    location: "Benidoleig, Marina Alta, Alicante, Spain",
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
