import type { Metadata } from "next";
import InfoShell from "../_components/InfoShell";
import { SITE_URL } from "@/lib/guest";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Quién trata los datos de AUMARA, para qué, y cómo contactar con EL CID VENTURES BENIDOLEIG S.L.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return <InfoShell eyebrow="Privacy" title="Guest data, kept purposeful.">
    <h2>Controller and contact</h2>
    <p>For the AUMARA website, the identified lodging operator is EL CID VENTURES BENIDOLEIG S.L. Privacy enquiries can be sent to <a href="mailto:elcidspain@gmail.com">elcidspain@gmail.com</a>.</p>
    <h2>Website requests</h2>
    <p>Hosting, CDN and security providers may process IP address, browser/device data, requested URLs, timestamps and security signals needed to deliver and protect the site.</p>
    <h2>Direct reservations</h2>
    <p>When you open the direct reservation flow, booking data is processed in the Beds24 booking environment. The information requested there is used to check availability, quote the stay, create and administer a reservation, communicate with guests and meet legal or accounting obligations that apply to the booking.</p>
    <h2>Analytics and advertising tags</h2>
    <p>The site can load configured Google measurement tags. Google Consent Mode is initialised with advertising and analytics storage denied by default. This notice will be updated if additional optional tracking or consent flows are introduced.</p>
    <h2>Your rights</h2>
    <p>Where applicable data-protection law gives you rights of access, rectification, erasure, restriction, portability or objection, you may exercise them through the contact above. Identity verification may be requested where necessary to protect personal data.</p>
    <p>Last updated: 13 September 2026.</p>
  </InfoShell>;
}
