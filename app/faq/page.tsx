import InfoShell from "../_components/InfoShell";
import { BOOK_DIRECT } from "@/lib/guest";

export default function FaqPage() {
  return <InfoShell eyebrow="Guest FAQ" title="Before you arrive.">
    <h2>What can I book?</h2>
    <p>AUMARA has six physical geodesic houses. Five are offered in the current guest rental inventory: three Chalet Ø7 houses and two Superior Chalet Ø9 houses. Live inventory in the booking engine is authoritative for a specific date.</p>
    <h2>Where is AUMARA?</h2>
    <p>AUMARA is in Benidoleig, Marina Alta, Alicante, Spain. The website's spatial experience and real recorded routes are designed to show the relationship between the houses, paths and surrounding valley before you book.</p>
    <h2>How do I check availability?</h2>
    <p>Use the <a href={BOOK_DIRECT} target="_blank" rel="noreferrer">direct booking engine</a>. It shows current room types, dates, rates and booking conditions.</p>
    <h2>Where are the final price and cancellation conditions?</h2>
    <p>The Beds24 booking flow displays the price and reservation conditions that apply to your selected dates before confirmation. Those live conditions take precedence over general website copy.</p>
    <h2>Can an AI assistant read the public stay information?</h2>
    <p>Yes. Public guest information is exposed through normal HTML plus machine-readable discovery files. Automated clients should treat the booking engine as the source of truth for real-time availability and rates.</p>
  </InfoShell>;
}
