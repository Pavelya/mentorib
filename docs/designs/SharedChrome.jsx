// Shared site chrome for the Mentor IB SEO landing pages
// (header + footer used by every /services and /subjects route).

const SiteHeader = ({ active = "Services" }) => (
  <header style={{
    borderBottom: "1px solid var(--border-subtle)",
    background: "rgb(252 250 244 / 0.85)",
    backdropFilter: "blur(16px)",
    position: "sticky", top: 0, zIndex: 10,
  }}>
    <div style={{
      width: "min(1200px, calc(100vw - 32px))", margin: "0 auto",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 24, paddingBlock: 16, flexWrap: "wrap",
    }}>
      <a href="index.html" style={{ display: "grid", gap: 2, color: "inherit", textDecoration: "none" }}>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Mentor IB</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-500)" }}>Match-first IB tutoring</span>
      </a>
      <nav style={{ display: "flex", gap: 4, padding: 4, borderRadius: 999, background: "rgb(255 255 255 / 0.55)", border: "1px solid var(--border-subtle)" }}>
        {[
          { l: "Subjects", h: "subjects-biology-hl.html" },
          { l: "Services", h: "services-tok-essay-help.html" },
          { l: "How it works", h: "#" },
          { l: "Tutors", h: "#" },
        ].map(t => (
          <a key={t.l} href={t.h} style={{
            padding: "8px 14px", borderRadius: 999,
            background: t.l === active ? "var(--forest-700)" : "transparent",
            color: t.l === active ? "white" : "var(--ink-700)",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>{t.l}</a>
        ))}
      </nav>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <window.Btn variant="ghost" size="compact">Sign in</window.Btn>
        <window.Btn variant="primary" size="compact">Find a tutor</window.Btn>
      </div>
    </div>
  </header>
);

const MentorFooter = () => (
  <footer style={{
    borderTop: "1px solid var(--border-subtle)",
    paddingBlock: "32px 48px", display: "grid", gap: 20,
  }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <span style={{ fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Mentor IB</span>
        <span style={{ fontSize: 13, color: "var(--ink-500)" }}>Match-first IB tutoring. Built around the pressure point you got stuck on.</span>
      </div>
      {[
        { h: "Services", links: [
          { l: "TOK essay help", href: "services-tok-essay-help.html" },
          { l: "IA feedback (Biology)", href: "#" },
          { l: "HL exam rescue", href: "#" },
          { l: "Extended essay planning", href: "#" },
          { l: "All services", href: "#" },
        ]},
        { h: "Subjects", links: [
          { l: "Biology HL", href: "subjects-biology-hl.html" },
          { l: "English A: Lang & Lit", href: "subjects-english-a-tok-essay-help.html" },
          { l: "Math AA HL", href: "#" },
          { l: "History HL", href: "#" },
          { l: "All subjects", href: "#" },
        ]},
        { h: "Mentor IB", links: [
          { l: "How it works", href: "#" },
          { l: "Trust & safety", href: "#" },
          { l: "Become a tutor", href: "#" },
          { l: "Privacy", href: "#" },
          { l: "Terms", href: "#" },
        ]},
      ].map(col => (
        <div key={col.h} style={{ display: "grid", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-500)" }}>{col.h}</span>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {col.links.map(l => <li key={l.l}><a href={l.href} style={{ color: "var(--ink-700)", fontSize: 14, textDecoration: "none" }}>{l.l}</a></li>)}
          </ul>
        </div>
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
      <span style={{ fontSize: 12, color: "var(--ink-500)" }}>© 2026 Mentor IB. Not affiliated with the International Baccalaureate Organization.</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-500)" }}>EN · USD · server-rendered</span>
    </div>
  </footer>
);

window.SiteHeader = SiteHeader;
window.MentorFooter = MentorFooter;
