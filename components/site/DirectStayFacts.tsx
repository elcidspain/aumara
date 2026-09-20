import Link from "next/link";
import { BOOK_CHALET, BOOK_SUPERIOR } from "@/lib/guest";

export default function DirectStayFacts() {
  return (
    <section
      aria-label="Direct stay facts"
      style={{
        background: "#f2eadc",
        color: "#173629",
        borderTop: "1px solid rgba(23,54,41,.12)",
        padding: "28px 24px 36px",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <p style={{ fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.55, margin: 0 }}>
          Benidoleig · Marina Alta · Costa Blanca
        </p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,42px)", fontWeight: 500, letterSpacing: "-.03em", margin: "10px 0 16px" }}>
          Chalet y Superior Chalet en Benidoleig.
        </h2>
        <p style={{ maxWidth: 720, lineHeight: 1.7, color: "#29483c", margin: "0 0 12px" }}>
          AUMARA, cerca de Dénia. Chalet: casa independiente para hasta 4 personas. Superior Chalet: casa independiente
          para hasta 6, con dormitorio separado. Reserva directa en aumara.me — no en Booking.com.
        </p>
        <p style={{ maxWidth: 720, lineHeight: 1.7, color: "#29483c", margin: "0 0 12px" }}>
          Independent houses in Benidoleig. Chalet up to 4 guests. Superior Chalet up to 6. Direct booking on aumara.me.
        </p>
        <p style={{ maxWidth: 720, lineHeight: 1.7, color: "#29483c", margin: "0 0 18px" }}>
          Бенидолеиг, рядом с Денией. Chalet до 4 человек, Superior Chalet до 6. Прямое бронирование на aumara.me.
        </p>
        <p style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 14 }}>
          <Link href="/chalet" style={{ color: "#173629", fontWeight: 700 }}>
            Chalet
          </Link>
          <Link href="/superior" style={{ color: "#173629", fontWeight: 700 }}>
            Superior Chalet
          </Link>
          <a href={BOOK_CHALET} target="_blank" rel="noreferrer" style={{ color: "#173629", fontWeight: 700 }}>
            Fechas Chalet
          </a>
          <a href={BOOK_SUPERIOR} target="_blank" rel="noreferrer" style={{ color: "#173629", fontWeight: 700 }}>
            Fechas Superior
          </a>
        </p>
      </div>
    </section>
  );
}
