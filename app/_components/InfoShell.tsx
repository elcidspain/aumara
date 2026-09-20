import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BOOK_DIRECT } from "@/lib/guest";

const page: CSSProperties = { minHeight: "100vh", background: "#f2eadc", color: "#173629", padding: "48px 22px 72px" };
const wrap: CSSProperties = { maxWidth: 900, margin: "0 auto" };
const body: CSSProperties = { fontSize: 16, lineHeight: 1.72, color: "#29483c" };
const link: CSSProperties = { color: "#173629", textDecorationThickness: 1, textUnderlineOffset: 3 };

export default function InfoShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ ...link, textDecoration: "none", fontWeight: 800, letterSpacing: ".08em" }}>AUMARA</Link>
          <a href={BOOK_DIRECT} target="_blank" rel="noreferrer" style={{ background: "#173629", color: "#fff7e8", padding: "10px 16px", borderRadius: 999, textDecoration: "none", fontWeight: 700 }}>Book direct</a>
        </div>
        <div style={{ marginTop: 72, fontSize: 12, textTransform: "uppercase", letterSpacing: ".18em", opacity: .55 }}>{eyebrow}</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px,8vw,72px)", lineHeight: .98, letterSpacing: "-.045em", margin: "16px 0 34px", fontWeight: 500 }}>{title}</h1>
        <div style={body}>{children}</div>
        <nav style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid rgba(23,54,41,.18)", display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13 }}>
          <Link href="/superior" style={link}>Superior Chalet</Link><Link href="/faq" style={link}>FAQ</Link><Link href="/terms" style={link}>Booking terms</Link><Link href="/privacy" style={link}>Privacy</Link><Link href="/cookies" style={link}>Cookies</Link><Link href="/legal" style={link}>Legal notice</Link>
        </nav>
      </div>
    </main>
  );
}
