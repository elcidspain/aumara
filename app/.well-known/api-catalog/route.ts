import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    service: "AUMARA",
    version: "1",
    description: "Public guest discovery resources for AUMARA in Benidoleig, Alicante, Spain.",
    authentication: "none for public discovery resources",
    resources: [
      { rel: "home", href: "https://www.aumara.me/", type: "text/html" },
      { rel: "guest-guide", href: "https://www.aumara.me/llms.txt", type: "text/plain" },
      { rel: "faq", href: "https://www.aumara.me/faq", type: "text/html" },
      { rel: "legal", href: "https://www.aumara.me/legal", type: "text/html" },
      { rel: "privacy", href: "https://www.aumara.me/privacy", type: "text/html" },
      { rel: "booking", href: "https://beds24.com/booking2.php?propid=324882", type: "text/html", external: true },
    ],
    note: "This catalog describes public resources. It does not advertise an OAuth, MCP server, A2A RPC endpoint or autonomous booking API that does not exist."
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
