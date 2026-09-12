import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PUBLIC_TOKEN_KEYS = [
  "AUMARA_RUNTIME_PUBLIC_V1",
  "CESIUM_ION_PUBLIC_TOKEN",
  "NEXT_PUBLIC_CESIUM_ION_TOKEN",
] as const;

export async function GET() {
  const publicKey = PUBLIC_TOKEN_KEYS.find((key) => Boolean(process.env[key]?.trim())) ?? null;
  const publicToken = publicKey ? process.env[publicKey]?.trim() ?? "" : "";

  return NextResponse.json(
    {
      cesiumIon: {
        configured: Boolean(publicToken),
        token: publicToken || null,
        privateConfigured: Boolean(process.env.CESIUM_ION_TOKEN?.trim()),
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
