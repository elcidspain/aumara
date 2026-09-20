import type { Metadata } from "next";
import InfoShell from "../_components/InfoShell";
import { BOOK_CHALET, BOOK_DIRECT, BOOK_SUPERIOR, SITE_URL } from "@/lib/guest";

const pageUrl = `${SITE_URL}/faq`;

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Casas Chalet y Superior Chalet en Benidoleig. Reserva directa en aumara.me. Precio y cancelación salen en el checkout de AUMARA.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Preguntas frecuentes | AUMARA",
    description: "Dónde está AUMARA, qué casas hay y cómo se reserva directo.",
    url: pageUrl,
  },
};

const faqs = [
  {
    q: "Qué casas se pueden reservar en AUMARA?",
    a: "Chalet para hasta 4 personas y Superior Chalet para hasta 6. Cada reserva es una casa completa, con entrada propia. Las fechas vivas las confirma el motor de reserva de AUMARA.",
  },
  {
    q: "Dónde está AUMARA?",
    a: "En Benidoleig, Marina Alta, Alicante, Costa Blanca, cerca de Dénia. Urb. Rincón del Silencio, 3, 03759 Benidoleig.",
  },
  {
    q: "Hay una casa para 6 personas con reserva directa?",
    a: "Sí. Superior Chalet es una casa independiente para hasta seis personas, con dormitorio separado y entrada propia. La reserva es directa en aumara.me, no en Booking.com.",
  },
  {
    q: "Hay una casa para 4 personas?",
    a: "Sí. Chalet es una casa independiente para hasta cuatro personas, con entrada propia, zona de dormir y altillo. Reserva directa en aumara.me.",
  },
  {
    q: "Cómo se consulta disponibilidad y precio?",
    a: "En el motor de reserva directa de AUMARA. Beds24 es el checkout de AUMARA, no un anuncio de OTA. Precio, estancia mínima y cancelación salen para las fechas elegidas, antes de confirmar.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AUMARA", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Preguntas frecuentes", item: pageUrl },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  },
];

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <InfoShell eyebrow="Preguntas frecuentes" title="Antes de llegar.">
        <h2>Qué casas se pueden reservar en AUMARA?</h2>
        <p>
          Chalet para hasta 4 personas y Superior Chalet para hasta 6. Cada reserva es una casa completa, con entrada
          propia. Las fechas vivas las confirma el motor de reserva de AUMARA.
        </p>
        <h2>Dónde está AUMARA?</h2>
        <p>
          AUMARA está en Benidoleig, Marina Alta, Alicante, Costa Blanca, cerca de Dénia. Urb. Rincón del Silencio, 3,
          03759 Benidoleig. El recorrido del sitio enseña la relación entre las casas, los caminos y el valle antes de
          reservar.
        </p>
        <h2>Hay una casa para 6 personas con reserva directa?</h2>
        <p>
          Sí. Superior Chalet es una casa independiente para hasta seis personas, con dormitorio separado y entrada
          propia. Reserva directa en aumara.me — no en Booking.com.{" "}
          <a href="/superior">Página del Superior Chalet</a> ·{" "}
          <a href={BOOK_SUPERIOR} target="_blank" rel="noreferrer">
            fechas vivas
          </a>
          .
        </p>
        <h2>Hay una casa para 4 personas?</h2>
        <p>
          Sí. Chalet es una casa independiente para hasta cuatro personas.{" "}
          <a href="/chalet">Página del Chalet</a> ·{" "}
          <a href={BOOK_CHALET} target="_blank" rel="noreferrer">
            fechas vivas
          </a>
          .
        </p>
        <h2>Cómo se consulta disponibilidad y precio?</h2>
        <p>
          En el{" "}
          <a href={BOOK_DIRECT} target="_blank" rel="noreferrer">
            motor de reserva directa
          </a>
          . Beds24 es el checkout de AUMARA, no un anuncio de OTA. Precio y cancelación salen para las fechas elegidas,
          antes de confirmar.
        </p>
        <h2>English</h2>
        <p>
          AUMARA is in Benidoleig, near Denia. Book Chalet (up to 4) or Superior Chalet (up to 6) directly on aumara.me
          — not Booking.com. Live dates, price and cancellation sit in the AUMARA checkout.
        </p>
      </InfoShell>
    </>
  );
}
