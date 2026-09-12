import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PUBLIC_TOKEN_KEYS = [
  "AUMARA_RUNTIME_PUBLIC_V1",
  "CESIUM_ION_PUBLIC_TOKEN",
  "NEXT_PUBLIC_CESIUM_ION_TOKEN",
] as const;
const GOOGLE_MAPS_KEY = "VITE_GOOGLE_MAPS_API_KEY";
const PUBLIC_SCOPES = new Set(["assets:read", "geocode"]);
const ION_ASSET_ENDPOINT = "https://api.cesium.com/v1/assets/2275207/endpoint";
const GOOGLE_TILES_ROOT = "https://tile.googleapis.com/v1/3dtiles/root.json";

async function assessPrivateRuntimeToken(token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  try {
    const [meResponse, allowedResponse, foreignResponse] = await Promise.all([
      fetch("https://api.cesium.com/v1/me", { headers: auth, cache: "no-store" }),
      fetch(ION_ASSET_ENDPOINT, {
        headers: { ...auth, Referer: "https://www.aumara.me/" },
        cache: "no-store",
      }),
      fetch(ION_ASSET_ENDPOINT, {
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

async function assessGoogleMapsRuntimeKey(key: string) {
  const endpoint = `${GOOGLE_TILES_ROOT}?key=${encodeURIComponent(key)}`;
  try {
    const [allowedResponse, foreignResponse] = await Promise.all([
      fetch(endpoint, { headers: { Referer: "https://www.aumara.me/" }, cache: "no-store" }),
      fetch(endpoint, { headers: { Referer: "https://example.invalid/" }, cache: "no-store" }),
    ]);
    const originRestricted = allowedResponse.ok && !foreignResponse.ok;
    return {
      usable: originRestricted,
      originRestricted,
      allowedStatus: allowedResponse.status,
      foreignStatus: foreignResponse.status,
    };
  } catch {
    return { usable: false, originRestricted: false, allowedStatus: 0, foreignStatus: 0 };
  }
}

export async function GET(request: NextRequest) {
  const publicKey = PUBLIC_TOKEN_KEYS.find((key) => Boolean(process.env[key]?.trim())) ?? null;
  const explicitPublicToken = publicKey ? process.env[publicKey]?.trim() ?? "" : "";
  const privateToken = process.env.CESIUM_ION_TOKEN?.trim() ?? "";
  const privateAssessment = privateToken ? await assessPrivateRuntimeToken(privateToken) : null;
  const promotedPrivateToken = privateAssessment?.usable ? privateToken : "";
  const runtimeToken = explicitPublicToken || promotedPrivateToken;

  const googleMapsKey = process.env[GOOGLE_MAPS_KEY]?.trim() ?? "";
  const googleAssessment = googleMapsKey ? await assessGoogleMapsRuntimeKey(googleMapsKey) : null;
  const runtimeGoogleMapsKey = googleAssessment?.usable ? googleMapsKey : "";
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
      googleMaps: probeOnly
        ? {
            configured: Boolean(runtimeGoogleMapsKey),
            envPresent: Boolean(googleMapsKey),
            originRestricted: Boolean(googleAssessment?.originRestricted),
            allowedStatus: googleAssessment?.allowedStatus ?? null,
            foreignStatus: googleAssessment?.foreignStatus ?? null,
          }
        : {
            configured: Boolean(runtimeGoogleMapsKey),
            key: runtimeGoogleMapsKey || null,
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
