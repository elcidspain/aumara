"use strict";

const PUBLIC_TOKEN_KEYS = [
  "AUMARA_RUNTIME_PUBLIC_V1",
  "CESIUM_ION_PUBLIC_TOKEN",
  "NEXT_PUBLIC_CESIUM_ION_TOKEN",
];
const PRIVATE_TOKEN_KEYS = ["CESIUM_ION_TOKEN"];
const GOOGLE_MAPS_KEYS = ["VITE_GOOGLE_MAPS_API_KEY", "GOOGLE_MAPS_API_KEY"];
const GATE_COOKIE = "AUMARA_ION_GATE";
const GATE_TTL_SEC = 120;

function firstEnv(keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const value = typeof process.env[keys[i]] === "string" ? process.env[keys[i]].trim() : "";
    if (value) return value;
  }
  return "";
}

function ionToken() {
  return firstEnv(PUBLIC_TOKEN_KEYS) || firstEnv(PRIVATE_TOKEN_KEYS);
}

function googleMapsKey() {
  return firstEnv(GOOGLE_MAPS_KEYS);
}

function credentialsPresent() {
  return Boolean(ionToken() || googleMapsKey());
}

function noStoreHeaders(extra) {
  return Object.assign(
    {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
    extra || {},
  );
}

function applyHeaders(res, headers) {
  Object.keys(headers).forEach((key) => res.setHeader(key, headers[key]));
}

function sendJson(res, status, body, extraHeaders) {
  res.statusCode = status;
  applyHeaders(res, noStoreHeaders(Object.assign({ "Content-Type": "application/json; charset=utf-8" }, extraHeaders)));
  res.end(JSON.stringify(body));
}

function requestHost(req) {
  const raw = String((req.headers && (req.headers["x-forwarded-host"] || req.headers.host)) || "");
  return raw.split(",")[0].trim().toLowerCase();
}

function requestOriginHost(req) {
  const origin = String((req.headers && req.headers.origin) || "");
  if (!origin) return "";
  try {
    return new URL(origin).host.toLowerCase();
  } catch (error) {
    return "";
  }
}

function sameOrigin(req) {
  const originHost = requestOriginHost(req);
  if (!originHost) return true;
  const host = requestHost(req);
  return Boolean(host) && originHost === host;
}

function isHttps(req) {
  const proto = String((req.headers && req.headers["x-forwarded-proto"]) || "").split(",")[0].trim().toLowerCase();
  return proto === "https" || Boolean(req.socket && req.socket.encrypted);
}

function gateCookie(req) {
  const header = String((req.headers && req.headers.cookie) || "");
  return header.split(";").some((part) => part.trim().split("=")[0] === GATE_COOKIE && part.includes("1"));
}

function gateSetCookie(req) {
  const parts = [
    `${GATE_COOKIE}=1`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${GATE_TTL_SEC}`,
  ];
  if (isHttps(req)) parts.push("Secure");
  return parts.join("; ");
}

function handleIon(req, res) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { ok: false, configured: false });
    return;
  }
  sendJson(res, 200, {
    ok: true,
    configured: credentialsPresent(),
    googleMaps: Boolean(googleMapsKey()),
  });
}

function handleIonGate(req, res) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { ok: false, boot: null });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { ok: false, boot: null });
    return;
  }
  if (!credentialsPresent()) {
    sendJson(res, 200, { ok: false, boot: null, reason: "ion-off" });
    return;
  }
  sendJson(res, 200, { ok: true, boot: "/api/ion-boot" }, { "Set-Cookie": gateSetCookie(req) });
}

function handleIonBoot(req, res) {
  res.statusCode = 200;
  applyHeaders(res, noStoreHeaders({ "Content-Type": "application/javascript; charset=utf-8" }));
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.end("window.__AUMARA_ION_BOOT={ok:false,reason:'method'};");
    return;
  }
  if (!sameOrigin(req) || !gateCookie(req) || !credentialsPresent()) {
    res.end("window.__AUMARA_ION_BOOT={ok:false,reason:'gated'};");
    return;
  }
  const token = ionToken();
  const maps = googleMapsKey();
  res.end(
    "window.__AUMARA_ION_BOOT={ok:true};" +
      "window.__AUMARA_ION_APPLY=function(C){" +
      "if(!C)return false;" +
      (token ? "if(C.Ion)C.Ion.defaultAccessToken=" + JSON.stringify(token) + ";" : "") +
      (maps ? "if(C.GoogleMaps)C.GoogleMaps.defaultApiKey=" + JSON.stringify(maps) + ";" : "") +
      "return true;" +
      "};",
  );
}

module.exports = {
  GATE_COOKIE,
  credentialsPresent,
  handleIon,
  handleIonGate,
  handleIonBoot,
};
