import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PUBLIC_TOKEN_KEYS = [
  "CESIUM_ION_PUBLIC_TOKEN",
  "AUMARA_RUNTIME_PUBLIC_V1",
  "NEXT_PUBLIC_CESIUM_ION_TOKEN",
] as const;

export async function GET() {
  const source = PUBLIC_TOKEN_KEYS.find((key) => Boolean(process.env[key]?.trim())) ?? null;
  const publicToken = source ? process.env[source]?.trim() ?? "" : "";

  return NextResponse.json(
    {
      cesiumIon: publicToken
        ? { configured: true, source, token: publicToken }
        : { configured: false, source: null, token: null },
      serverSecretPresent: Boolean(process.env.CESIUM_ION_TOKEN?.trim()),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
