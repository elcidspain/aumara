import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PUBLIC_TOKEN_KEYS = [
  "AUMARA_RUNTIME_PUBLIC_V1",
  "CESIUM_ION_PUBLIC_TOKEN",
  "NEXT_PUBLIC_CESIUM_ION_TOKEN",
] as const;
const PUBLIC_SCOPES = new Set(["assets:read", "geocode"]);
const ASSET_ENDPOINT = "https://api.cesium.com/v1/assets/2275207/endpoint";

async function assessPrivateRuntimeToken(token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  try {
    const [meResponse, allowedResponse, foreignResponse] = await Promise.all([
      fetch("https://api.cesium.com/v1/me", { headers: auth, cache: "no-store" }),
      fetch(ASSET_ENDPOINT, {
        headers: { ...auth, Referer: "https://www.aumara.me/" },
        cache: "no-store",
      }),
      fetch(ASSET_ENDPOINT, {
        headers: { ...auth, Referer: "https://example.invalid/" },
        cache: "no-store",
      }),
    ]);
    const me = meResponse.ok ? await meResponse.json() : null;
    const scopes = Array.isArray(me?.scopes) ? me.scopes.filter((scope: unknown) => typeof scope === "string") : [];
    const publicScopesOnly = scopes.length > 0 && scopes.every((scope: string) => PUBLIC_SCOPES.has(scope));
    const originRestricted = allowedResponse.ok && !foreignResponse.ok;
    return {
      usable: publicScopesOnly && originRestricted,
      publicScopesOnly,
      originRestricted,
      scopes,
      allowedStatus: allowedResponse.status,
      foreignStatus: foreignResponse.status,
    };
  } catch {
    return {
      usable: false,
      publicScopesOnly: false,
      originRestricted: false,
      scopes: [] as string[],
      allowedStatus: 0,
      foreignStatus: 0,
    };
  }
}

export async function GET(request: NextRequest) {
  const publicKey = PUBLIC_TOKEN_KEYS.find((key) => Boolean(process.env[key]?.trim())) ?? null;
  const explicitPublicToken = publicKey ? process.env[publicKey]?.trim() ?? "" : "";
  const privateToken = process.env.CESIUM_ION_TOKEN?.trim() ?? "";
  const privateAssessment = privateToken ? await assessPrivateRuntimeToken(privateToken) : null;
  const promotedPrivateToken = privateAssessment?.usable ? privateToken : "";
  const runtimeToken = explicitPublicToken || promotedPrivateToken;
  const probeOnly = request.nextUrl.searchParams.get("probe") === "1";

  return NextResponse.json(
    {
      cesiumIon: probeOnly
        ? {
            configured: Boolean(runtimeToken),
            privateConfigured: Boolean(privateToken),
            privateSafeForPublicRuntime: Boolean(privateAssessment?.usable),
            publicScopesOnly: Boolean(privateAssessment?.publicScopesOnly),
            originRestricted: Boolean(privateAssessment?.originRestricted),
            scopes: privateAssessment?.scopes ?? [],
            allowedStatus: privateAssessment?.allowedStatus ?? null,
            foreignStatus: privateAssessment?.foreignStatus ?? null,
          }
        : {
            configured: Boolean(runtimeToken),
            token: runtimeToken || null,
            privateConfigured: Boolean(privateToken),
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
