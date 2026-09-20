import { NextRequest, NextResponse } from "next/server";

const AUMARA_MARKDOWN = `# AUMARA

Independent houses among pines in Benidoleig, Marina Alta, Alicante, Spain.

## Stay

AUMARA has six physical houses. Five are currently offered for short stays: three Chalet for up to four guests each, and two Superior Chalet for up to six guests each.

Each reservation is for a complete independent house. Live availability, rates, minimum stays, payment terms and reservation-specific cancellation conditions are authoritative in the direct Beds24 booking flow.

## Direct booking

- All availability: https://beds24.com/booking2.php?propid=324882
- Chalet: https://beds24.com/booking2.php?propid=324882&roomid=674465
- Superior Chalet: https://beds24.com/booking2.php?propid=324882&roomid=674466

## Location

AUMARA is in Benidoleig, Marina Alta, Alicante, on Spain's Costa Blanca.

## Guest resources

- FAQ: https://www.aumara.me/faq
- Booking terms: https://www.aumara.me/terms
- Privacy: https://www.aumara.me/privacy
- Cookies: https://www.aumara.me/cookies
- Legal notice: https://www.aumara.me/legal
- Agent-readable guide: https://www.aumara.me/llms.txt
- Public resource catalog: https://www.aumara.me/.well-known/api-catalog
`;

export function middleware(request: NextRequest) {
  const acceptsMarkdown = (request.headers.get("accept") ?? "")
    .toLowerCase()
    .includes("text/markdown");

  if (request.method === "GET" && request.nextUrl.pathname === "/" && acceptsMarkdown) {
    return new NextResponse(AUMARA_MARKDOWN, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Signal": "ai-train=no, search=yes, ai-input=yes",
        "Cache-Control": "public, max-age=300, s-maxage=300",
        Vary: "Accept",
        Link: '</sitemap.xml>; rel="sitemap"; type="application/xml", </llms.txt>; rel="describedby"; type="text/plain", </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
