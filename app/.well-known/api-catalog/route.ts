import { NextResponse } from "next/server";

export const dynamic = "force-static";

const catalog = {
  linkset: [
    {
      anchor: "https://www.aumara.me/api/guest-info",
      "service-doc": [
        { href: "https://www.aumara.me/llms.txt", type: "text/plain" }
      ],
      "service-meta": [
        { href: "https://www.aumara.me/.well-known/agent-skills/index.json", type: "application/json" }
      ]
    }
  ]
};

const headers = {
  "Content-Type": "application/linkset+json; profile=\"https://www.rfc-editor.org/info/rfc9727\"",
  "Cache-Control": "public, max-age=300",
  Link: '</.well-known/api-catalog>; rel="api-catalog"'
};

export function GET() {
  return new NextResponse(JSON.stringify(catalog), { status: 200, headers });
}

export function HEAD() {
  return new NextResponse(null, { status: 200, headers });
}
