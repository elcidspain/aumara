export function getGuestActivationEvent(rawHref, currentOrigin, pagePath) {
  if (!rawHref || !currentOrigin || !pagePath) return null;

  let url;
  try {
    url = new URL(rawHref, currentOrigin);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "beds24.com" || hostname.endsWith(".beds24.com")) {
    return {
      name: "booking_click",
      params: { destination: "beds24", page_path: pagePath },
    };
  }

  if (url.origin === currentOrigin && url.pathname.startsWith("/spatial")) {
    return {
      name: "spatial_flight_open",
      params: { page_path: pagePath },
    };
  }

  return null;
}
