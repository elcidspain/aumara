import type { Metadata } from "next";
import InfoShell from "../_components/InfoShell";
import { SITE_URL } from "@/lib/guest";

export const metadata: Metadata = {
  title: "Aviso legal",
  description:
    "AUMARA es la marca de alojamiento. Operador: EL CID VENTURES BENIDOLEIG S.L., NIF B53816989, Benidoleig, Alicante.",
  alternates: { canonical: `${SITE_URL}/legal` },
};

export default function LegalPage() {
  return <InfoShell eyebrow="Aviso legal · Legal notice" title="AUMARA, clearly identified.">
    <h2>Website and accommodation operator</h2>
    <p><strong>AUMARA</strong> is the guest-facing accommodation brand. The legal operator identified for this website and the lodging activity is <strong>EL CID VENTURES BENIDOLEIG S.L.</strong>, NIF <strong>B53816989</strong>.</p>
    <p>Registered/public contact for the website: Urb. Rincón del Silencio, 3, 03759 Benidoleig, Alicante, Spain · <a href="mailto:elcidspain@gmail.com">elcidspain@gmail.com</a> · <a href="tel:+34966579970">+34 966 579 970</a>.</p>
    <h2>Purpose of the site</h2>
    <p>The site presents AUMARA, its guest accommodation, visual/spatial material and direct reservation access. Real-time availability, rates and reservation-specific terms are supplied by the connected Beds24 booking engine.</p>
    <h2>Intellectual property</h2>
    <p>Unless otherwise indicated, AUMARA website text, original photography, video, spatial presentation and design are protected content. Third-party names, maps, software and services remain subject to their own rights and terms.</p>
    <h2>External services</h2>
    <p>The site links to third-party services used for reservations, mapping, analytics or infrastructure. Their own legal and privacy terms apply when you use those services.</p>
    <p>Última actualización / Last updated: 13 September 2026.</p>
  </InfoShell>;
}
