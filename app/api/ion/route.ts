import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { ok: true, ion: Boolean(process.env.CESIUM_ION_TOKEN) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
