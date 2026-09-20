"use client";

import { useEffect } from "react";

type ModelContextLike = {
  registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<unknown> | unknown;
};

export default function AgentWebTools() {
  useEffect(() => {
    const controller = new AbortController();
    const documentContext = (document as Document & { modelContext?: ModelContextLike }).modelContext;
    const navigatorContext = (navigator as Navigator & { modelContext?: ModelContextLike }).modelContext;
    const modelContext = documentContext ?? navigatorContext;
    if (!modelContext?.registerTool) return;

    const register = async () => {
      await modelContext.registerTool({
        name: "aumara_guest_guide",
        title: "AUMARA guest guide",
        description: "Read AUMARA's public machine-readable stay, inventory, booking and policy guide. Read-only.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
        execute: async () => (await fetch("/llms.txt", { cache: "no-store" })).text(),
      }, { signal: controller.signal });

      await modelContext.registerTool({
        name: "aumara_booking_options",
        title: "AUMARA direct booking options",
        description: "Return public AUMARA inventory and direct Beds24 booking links. This does not create a reservation. Read-only.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
        execute: async () => JSON.stringify({
          property: "AUMARA",
          location: "Benidoleig, Alicante, Spain",
          rentableInventory: [
            { type: "Chalet", count: 3, maxGuests: 4, url: "https://beds24.com/booking2.php?propid=324882&roomid=674465" },
            { type: "Superior Chalet", count: 2, maxGuests: 6, url: "https://beds24.com/booking2.php?propid=324882&roomid=674466" }
          ],
          allAvailability: "https://beds24.com/booking2.php?propid=324882"
        }),
      }, { signal: controller.signal });

      await modelContext.registerTool({
        name: "aumara_live_availability",
        title: "AUMARA live availability and price",
        description: "Return live Beds24 availability and published prices for exact AUMARA dates. Read-only; it never holds inventory or creates a reservation.",
        inputSchema: {
          type: "object",
          properties: {
            checkIn: { type: "string", description: "YYYY-MM-DD" },
            checkOut: { type: "string", description: "YYYY-MM-DD" },
            adults: { type: "integer", minimum: 1, maximum: 20 },
            children: { type: "integer", minimum: 0, maximum: 20 }
          },
          required: ["checkIn", "checkOut"],
          additionalProperties: false
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
        execute: async (args: any) => {
          const p = new URLSearchParams({ checkIn: args.checkIn, checkOut: args.checkOut });
          if (args.adults !== undefined) p.set("adults", String(args.adults));
          if (args.children !== undefined) p.set("children", String(args.children));
          const response = await fetch(`/api/availability?${p.toString()}`, { cache: "no-store" });
          return response.text();
        },
      }, { signal: controller.signal });

      await modelContext.registerTool({
        name: "aumara_compare_stay_lengths",
        title: "AUMARA stay-length value finder",
        description: "Compare live published totals across nearby stay lengths and identify better nightly value. Read-only; never invents or applies a discount.",
        inputSchema: {
          type: "object",
          properties: {
            checkIn: { type: "string", description: "YYYY-MM-DD" },
            adults: { type: "integer", minimum: 1, maximum: 20 },
            children: { type: "integer", minimum: 0, maximum: 20 },
            minNights: { type: "integer", minimum: 1, maximum: 14 },
            maxNights: { type: "integer", minimum: 1, maximum: 14 }
          },
          required: ["checkIn"],
          additionalProperties: false
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
        execute: async (args: any) => {
          const p = new URLSearchParams({ mode: "compare", checkIn: args.checkIn });
          for (const key of ["adults", "children", "minNights", "maxNights"] as const) {
            if (args[key] !== undefined) p.set(key, String(args[key]));
          }
          const response = await fetch(`/api/availability?${p.toString()}`, { cache: "no-store" });
          return response.text();
        },
      }, { signal: controller.signal });
    };

    void register().catch(() => undefined);
    return () => controller.abort();
  }, []);
  return null;
}
