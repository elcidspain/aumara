import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PUBLIC_TOKEN_KEYS = [
  "AUMARA_RUNTIME_PUBLIC_V1",
  "CESIUM_ION_PUBLIC_TOKEN",
  "NEXT_PUBLIC_CESIUM_ION_TOKEN",
] as const;
const GOOGLE_MAPS_KEY = "VITE_GOOGLE_MAPS_API_KEY";

export async function GET(request: NextRequest) {
  const publicKey = PUBLIC_TOKEN_KEYS.find((key) => Boolean(process.env[key]?.trim())) ?? null;
  const explicitPublicToken = publicKey ? process.env[publicKey]?.trim() ?? "" : "";
  const privateConfigured = Boolean(process.env.CESIUM_ION_TOKEN?.trim());
  const googleMapsKey = process.env[GOOGLE_MAPS_KEY]?.trim() ?? "";
  const probeOnly = request.nextUrl.searchParams.get("probe") === "1";

  return NextResponse.json(
    {
      cesiumIon: probeOnly
        ? {
            configured: Boolean(explicitPublicToken),
            explicitPublicConfigured: Boolean(explicitPublicToken),
            privateConfigured,
          }
        : {
            configured: Boolean(explicitPublicToken),
            token: explicitPublicToken || null,
          },
      googleMaps: probeOnly
        ? {
            configured: Boolean(googleMapsKey),
            envPresent: Boolean(googleMapsKey),
          }
        : {
            configured: Boolean(googleMapsKey),
            key: googleMapsKey || null,
          },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
