import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function probe(url: string, token: string) {
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return response.status;
  } catch {
    return 0;
  }
}

export async function GET() {
  const token = process.env.CESIUM_ION_TOKEN?.trim() ?? "";
  const tokenAdminStatus = token
    ? await probe("https://api.cesium.com/v2/tokens?limit=1", token)
    : 0;
  const googleAssetStatus = token
    ? await probe("https://api.cesium.com/v1/assets/2275207", token)
    : 0;

  return NextResponse.json(
    {
      privateConfigured: Boolean(token),
      tokenAdminStatus,
      tokenAdminReadable: tokenAdminStatus >= 200 && tokenAdminStatus < 300,
      googleAssetStatus,
      googleAssetReadable: googleAssetStatus >= 200 && googleAssetStatus < 300,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
