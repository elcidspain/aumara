import { agentOfferConfigured, beds24AgentCode, createAgentHandoff } from "@/lib/agentAccess";
import { getAumaraAvailability, type AvailabilityQuery } from "@/lib/liveAvailability";

const BEDS24_AVAILABILITY_URL = "https://api.beds24.com/json/getAvailabilities";
const PROPERTY_ID = "324882";
const AGENT_REFERRER = "AUMARA_AI_AGENT";

function money(value: number) {
  return Math.round(value * 100) / 100;
}

export async function getAumaraAgentOffer(query: AvailabilityQuery) {
  if (!agentOfferConfigured()) throw new Error("AUMARA private agent rate is not configured");

  const published = await getAumaraAvailability(query);
  const payload = {
    checkIn: published.checkIn.replaceAll("-", ""),
    checkOut: published.checkOut.replaceAll("-", ""),
    propId: PROPERTY_ID,
    numAdult: String(published.adults),
    numChild: String(published.children),
    agent: beds24AgentCode(),
    referer: AGENT_REFERRER,
  };

  const response = await fetch(BEDS24_AVAILABILITY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Beds24 private agent quote failed with ${response.status}`);

  const raw = (await response.json()) as Record<string, any>;
  const offers = published.inventory.map((publicRoom) => {
    const privateRoom = raw[publicRoom.roomId] ?? {};
    const agentPrice = typeof privateRoom.price === "number" ? privateRoom.price : null;
    const publicPrice = publicRoom.price;
    const availableUnits = Number(privateRoom.roomsavail ?? 0);
    const lower = publicPrice !== null && agentPrice !== null && agentPrice < publicPrice && availableUnits > 0;
    const savings = lower ? money(publicPrice - agentPrice) : null;
    const savingsPercent = lower && publicPrice > 0 ? money((savings! / publicPrice) * 100) : null;

    return {
      roomId: publicRoom.roomId,
      name: publicRoom.name,
      availableUnits,
      currency: privateRoom.currency || publicRoom.currency || raw.currency || "EUR",
      publicPrice,
      agentPrice: lower ? agentPrice : null,
      agentSavings: savings,
      agentSavingsPercent: savingsPercent,
      agentRateAvailable: lower,
      bookingHandoff: lower
        ? createAgentHandoff({
            roomId: publicRoom.roomId,
            checkIn: published.checkIn,
            checkOut: published.checkOut,
            adults: published.adults,
            children: published.children,
          })
        : null,
    };
  });

  const availableOffers = offers.filter((offer) => offer.agentRateAvailable);
  return {
    property: "AUMARA",
    location: published.location,
    checkIn: published.checkIn,
    checkOut: published.checkOut,
    nights: published.nights,
    adults: published.adults,
    children: published.children,
    offers,
    agentRateFound: availableOffers.length > 0,
    bestSavings: availableOffers.length
      ? availableOffers.reduce((best, offer) => (offer.agentSavings! > best.agentSavings! ? offer : best))
      : null,
    source: "Beds24 live private agent pricing",
    pricingNote: "A private agent rate is reported only when Beds24 returns a live price below the simultaneously fetched published price. The Beds24 agent code is never returned by this API.",
    generatedAt: new Date().toISOString(),
  };
}
