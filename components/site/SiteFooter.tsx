import Link from "next/link";
import { BOOK_DIRECT } from "@/lib/guest";

const linkStyle = { color: "#efe5d2", textDecoration: "none", opacity: 0.78 } as const;

export default function SiteFooter() {
  return (
    <footer style={{ background: "#173629", color: "#f4ead8", padding: "48px 24px 32px", borderTop: "1px solid rgba(255,255,255,.12)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 34, letterSpacing: "-.03em" }}>AUMARA</div>
          <p style={{ maxWidth: 390, lineHeight: 1.65, opacity: .72, margin: "12px 0 0" }}>Independent geodesic stays in Benidoleig, Marina Alta. Explore the place, check live availability and book direct.</p>
        </div>
        <div>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".16em", opacity: .55, marginBottom: 14 }}>Plan your stay</div>
          <a href={BOOK_DIRECT} rel="noreferrer" target="_blank" style={{ display: "inline-block", background: "#f4ead8", color: "#173629", padding: "12px 18px", borderRadius: 999, textDecoration: "none", fontWeight: 700 }}>Check availability & book direct</a>
        </div>
        <div>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".16em", opacity: .55, marginBottom: 14 }}>Guest information</div>
          <div style={{ display: "grid", gap: 9 }}>
            <Link href="/faq" style={linkStyle}>FAQ</Link>
            <Link href="/terms" style={linkStyle}>Booking terms</Link>
            <Link href="/privacy" style={linkStyle}>Privacy</Link>
            <Link href="/cookies" style={linkStyle}>Cookies</Link>
            <Link href="/legal" style={linkStyle}>Legal notice</Link>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1180, margin: "34px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.1)", fontSize: 12, opacity: .55, display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
        <span>© 2026 AUMARA · Benidoleig, Alicante, Spain</span>
        <span>Direct reservations are completed in the Beds24 booking engine.</span>
      </div>
    </footer>
  );
}
