import InfoShell from "../_components/InfoShell";
import { BOOK_DIRECT, BOOK_SUPERIOR } from "@/lib/guest";

export default function FaqPage() {
  return <InfoShell eyebrow="Guest FAQ" title="Before you arrive.">
    <h2>What can I book?</h2>
    <p>AUMARA has six physical houses. Five are offered in the current guest rental inventory: three Chalet houses and two Superior Chalet houses. Live inventory in the booking engine is authoritative for a specific date.</p>
    <h2>Where is AUMARA?</h2>
    <p>AUMARA is in Benidoleig, Marina Alta, Alicante, Spain, on the Costa Blanca near Dénia. The spatial experience and recorded routes on the site are designed to show the relationship between the houses, paths and surrounding valley before you book.</p>
    <h2>Is there a house for 6 guests with direct booking?</h2>
    <p>Yes. Superior Chalet is a complete independent house for up to six guests, with a separate bedroom and its own entrance. Booking is direct on aumara.me — not Booking.com. See <a href="/superior">the Superior Chalet page</a> and the <a href={BOOK_SUPERIOR} target="_blank" rel="noreferrer">live dates for Superior Chalet</a>.</p>
    <h2>How do I check availability?</h2>
    <p>Use the <a href={BOOK_DIRECT} target="_blank" rel="noreferrer">direct booking engine</a>. It shows current room types, dates, rates and booking conditions. Beds24 is the AUMARA checkout, not an OTA listing.</p>
    <h2>Where are the final price and cancellation conditions?</h2>
    <p>The AUMARA booking flow displays the price and reservation conditions that apply to your selected dates before confirmation. Those live conditions take precedence over general website copy.</p>
    <h2>Can an AI assistant read the public stay information?</h2>
    <p>Yes. Public guest information is exposed through normal HTML plus machine-readable discovery files. Automated clients should treat the booking engine as the source of truth for real-time availability and rates.</p>
  </InfoShell>;
}
