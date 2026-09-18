import {
  WEB_BOT_AUTH_DIRECTORY_MEDIA_TYPE,
  getWebBotAuthDirectory,
  signDirectoryHeaders,
} from "@/lib/webBotAuth";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { body, privateJwk } = getWebBotAuthDirectory();
  const payload = JSON.stringify(body);
  const headers = new Headers({
    "Content-Type": WEB_BOT_AUTH_DIRECTORY_MEDIA_TYPE,
    "Cache-Control": "public, max-age=300, s-maxage=300",
    "Access-Control-Allow-Origin": "*",
  });

  if (privateJwk) {
    const signed = signDirectoryHeaders(request, privateJwk);
    headers.set("Signature", signed.signature);
    headers.set("Signature-Input", signed.signatureInput);
  }

  return new Response(payload, { status: 200, headers });
}

export function HEAD(request: Request) {
  const response = GET(request);
  return new Response(null, { status: response.status, headers: response.headers });
}
