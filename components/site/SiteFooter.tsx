import Link from "next/link";

const linkStyle = {
  color: "#efe5d2",
  textDecoration: "none",
  opacity: 0.78,
} as const;

export default function SiteFooter() {
  return (
    <section
      aria-label="Guest information and policies"
      style={{
        background: "#10271e",
        color: "#f4ead8",
        borderTop: "1px solid rgba(255,255,255,.10)",
        padding: "18px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
          fontSize: 12,
        }}
      >
        <span style={{ opacity: 0.55, textTransform: "uppercase", letterSpacing: ".14em" }}>
          Guest information & policies
        </span>
        <nav
          aria-label="Guest information"
          style={{ display: "flex", gap: 18, flexWrap: "wrap" }}
        >
          <Link href="/chalet" style={linkStyle}>Chalet</Link>
          <Link href="/superior" style={linkStyle}>Superior Chalet</Link>
          <Link href="/faq" style={linkStyle}>FAQ</Link>
          <Link href="/terms" style={linkStyle}>Booking terms</Link>
          <Link href="/privacy" style={linkStyle}>Privacy</Link>
          <Link href="/cookies" style={linkStyle}>Cookies</Link>
          <Link href="/legal" style={linkStyle}>Legal notice</Link>
        </nav>
      </div>
    </section>
  );
}
