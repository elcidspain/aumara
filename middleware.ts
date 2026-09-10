import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/spatial/:path*", "/api/ion"],
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.searchParams.has("ion")) {
    url.searchParams.delete("ion");
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  const latitude = Number(request.headers.get("x-vercel-ip-latitude"));
  const longitude = Number(request.headers.get("x-vercel-ip-longitude"));

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    const northMetres = (latitude - 38.79383541) * 110540;
    const eastMetres = (longitude + 0.02037032) * 111320 * Math.cos((38.7938 * Math.PI) / 180);
    if (Math.hypot(northMetres, eastMetres) < 450) response.headers.set("x-aumara-onsite", "1");
  }

  return response;
}
