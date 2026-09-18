/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
  { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests" },
  { key: "Content-Signal", value: "ai-train=no, search=yes, ai-input=yes" },
  { key: "Link", value: "</sitemap.xml>; rel=\"sitemap\"; type=\"application/xml\", </llms.txt>; rel=\"describedby\"; type=\"text/plain\", </auth.md>; rel=\"describedby\"; type=\"text/markdown\", </openapi.json>; rel=\"service-desc\"; type=\"application/json\", </.well-known/api-catalog>; rel=\"api-catalog\"; type=\"application/linkset+json\", </.well-known/agent-skills/index.json>; rel=\"agent-skills\"; type=\"application/json\", </.well-known/agent-skills/index.json>; rel=\"describedby\"; type=\"application/json\", </.well-known/mcp.json>; rel=\"mcp-server\"; type=\"application/json\", </.well-known/mcp/server-card.json>; rel=\"mcp-server-card\"; type=\"application/json\", </.well-known/mcp/server-card.json>; rel=\"describedby\"; type=\"application/json\", </.well-known/agent-card.json>; rel=\"describedby\"; type=\"application/json\", </.well-known/ai-catalog.json>; rel=\"ai-catalog\"; type=\"application/json\", </.well-known/oauth-authorization-server>; rel=\"oauth-authorization-server\"; type=\"application/json\", </.well-known/oauth-authorization-server>; rel=\"describedby\"; type=\"application/json\", </.well-known/oauth-protected-resource>; rel=\"oauth-protected-resource\"; type=\"application/json\", </.well-known/oauth-protected-resource>; rel=\"describedby\"; type=\"application/json\"" },
];

const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
