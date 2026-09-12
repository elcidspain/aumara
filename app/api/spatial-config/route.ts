import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PUBLIC_TOKEN_KEYS = [
  "AUMARA_RUNTIME_PUBLIC_V1",
  "CESIUM_ION_PUBLIC_TOKEN",
  "NEXT_PUBLIC_CESIUM_ION_TOKEN",
] as const;

export async function GET(request: NextRequest) {
  const publicKey = PUBLIC_TOKEN_KEYS.find((key) => Boolean(process.env[key]?.trim())) ?? null;
  const publicToken = publicKey ? process.env[publicKey]?.trim() ?? "" : "";
  const configured = Boolean(publicToken);
  const privateConfigured = Boolean(process.env.CESIUM_ION_TOKEN?.trim());
  const probeOnly = request.nextUrl.searchParams.get("probe") === "1";

  return NextResponse.json(
    {
      cesiumIon: probeOnly
        ? { configured, privateConfigured }
        : { configured, token: publicToken || null, privateConfigured },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
