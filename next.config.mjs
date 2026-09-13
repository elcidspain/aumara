/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
  { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests" },
  { key: "Content-Signal", value: "ai-train=no, search=yes, ai-input=yes" },
  { key: "Link", value: "</sitemap.xml>; rel=\"sitemap\"; type=\"application/xml\", </llms.txt>; rel=\"describedby\"; type=\"text/plain\", </auth.md>; rel=\"describedby\"; type=\"text/markdown\", </.well-known/api-catalog>; rel=\"service-desc\"; type=\"application/json\"" },
];

const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
