import { redirect } from "next/navigation";

export default function SpatialEntryPage() {
  // The static spatial runtime owns flight bootstrap and starts itself on load.
  // Redirect server-side so guests do not wait for client hydration before the flight.
  redirect("/spatial/index.html");
}
