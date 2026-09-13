import InfoShell from "../_components/InfoShell";
import { BOOK_DIRECT } from "@/lib/guest";

export default function TermsPage() {
  return <InfoShell eyebrow="Booking terms" title="The live booking terms are the terms that matter.">
    <h2>Availability and price</h2>
    <p>AUMARA&apos;s website describes the property and routes guests to direct booking. Availability and pricing for specific dates are dynamic. The <a href={BOOK_DIRECT} target="_blank" rel="noreferrer">Beds24 booking engine</a> is the authoritative source for the quote presented for the dates and accommodation selected.</p>
    <h2>Reservation-specific conditions</h2>
    <p>Minimum stay, payment schedule, cancellation conditions, taxes, inclusions and any rate-specific restrictions shown before confirmation form part of the reservation. Do not rely on an old screenshot or general promotional copy instead of the conditions displayed for the booking you are making.</p>
    <h2>Accuracy</h2>
    <p>AUMARA aims to keep descriptions and visual material accurate. Photography, video and spatial experiences help explain the property but do not replace the exact room/rate details presented during booking.</p>
    <h2>Third-party systems</h2>
    <p>Reservation processing uses Beds24 and may involve payment or communication providers required to complete and administer the stay. Those services can have additional terms that apply to their part of the transaction.</p>
    <h2>Lawful use</h2>
    <p>Do not interfere with the website, attempt to bypass technical controls, misuse booking systems or submit false or unlawful reservation information.</p>
    <p>Last updated: 13 September 2026.</p>
  </InfoShell>;
}
