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
            { type: "Chalet Ø7", count: 3, maxGuests: 4, url: "https://beds24.com/booking2.php?propid=324882&roomid=674465" },
            { type: "Superior Chalet Ø9", count: 2, maxGuests: 6, url: "https://beds24.com/booking2.php?propid=324882&roomid=674466" }
          ],
          allAvailability: "https://beds24.com/booking2.php?propid=324882"
        }),
      }, { signal: controller.signal });
    };

    void register().catch(() => undefined);
    return () => controller.abort();
  }, []);
  return null;
}
