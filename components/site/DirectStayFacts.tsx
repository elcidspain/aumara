import Link from "next/link";
import { BOOK_SUPERIOR } from "@/lib/guest";

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
          Superior Chalet Ø9 — casa completa para 6.
        </h2>
        <p style={{ maxWidth: 720, lineHeight: 1.7, color: "#29483c", margin: "0 0 12px" }}>
          AUMARA en Benidoleig, cerca de Dénia. El Superior Chalet Ø9 es una casa independiente para hasta seis personas:
          estar amplio, dormitorio separado, entrada propia. Reserva directa en aumara.me — no en Booking.com.
        </p>
        <p style={{ maxWidth: 720, lineHeight: 1.7, color: "#29483c", margin: "0 0 12px" }}>
          Whole house for up to 6 guests. Direct booking on aumara.me, not Booking.com.
        </p>
        <p style={{ maxWidth: 720, lineHeight: 1.7, color: "#29483c", margin: "0 0 18px" }}>
          Целый дом до 6 человек в Бенидолеиге. Прямое бронирование на aumara.me, не через Booking.com.
        </p>
        <p style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 14 }}>
          <Link href="/superior" style={{ color: "#173629", fontWeight: 700 }}>
            Superior Ø9
          </Link>
          <a href={BOOK_SUPERIOR} target="_blank" rel="noreferrer" style={{ color: "#173629", fontWeight: 700 }}>
            Comprobar fechas
          </a>
        </p>
      </div>
    </section>
  );
}
