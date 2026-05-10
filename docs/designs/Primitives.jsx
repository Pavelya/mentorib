// Mentor IB shared UI primitives
// Mirrors src/components/ui/** in Pavelya/mentorib@main

const Btn = ({ variant = "primary", size = "default", children, onClick, fullWidth = false }) => {
  const kitBtnStyles = {
    base: {
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      gap: 8, border: "1px solid transparent", borderRadius: 14,
      fontFamily: "var(--font-sans)", fontWeight: 600, lineHeight: 1.2,
      cursor: "pointer", textDecoration: "none",
      transition: "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
      width: fullWidth ? "100%" : "auto",
    },
    default: { minHeight: 48, padding: "12px 16px", fontSize: 14 },
    compact: { minHeight: 40, padding: "10px 14px", fontSize: 13 },
    primary: { background: "var(--forest-700)", color: "white", boxShadow: "var(--shadow-action)" },
    secondary: { borderColor: "var(--border-strong)", background: "var(--surface-panel)", color: "var(--ink-900)" },
    ghost: { background: "transparent", color: "var(--ink-700)" },
    accent: { background: "var(--clay-600)", color: "white", boxShadow: "0 18px 50px rgb(180 87 62 / 0.22)" },
    danger: { background: "var(--danger-500)", color: "white" },
    onForest: { background: "white", color: "var(--forest-700)", boxShadow: "none" },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...kitBtnStyles.base, ...kitBtnStyles[size], ...kitBtnStyles[variant] }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {children}
    </button>
  );
};

const Badge = ({ tone = "info", children }) => {
  const toneMap = {
    positive:    { bg: "var(--state-positive-surface)", bd: "var(--state-positive-border)", c: "var(--success-500)" },
    warning:     { bg: "var(--state-warning-surface)",  bd: "var(--state-warning-border)",  c: "var(--warning-500)" },
    destructive: { bg: "var(--state-danger-surface)",   bd: "var(--state-danger-border)",   c: "var(--danger-500)" },
    trust:       { bg: "var(--state-trust-surface)",    bd: "var(--state-trust-border)",    c: "var(--gold-500)" },
    info:        { bg: "var(--state-info-surface)",     bd: "var(--state-info-border)",     c: "var(--ink-700)" },
  };
  const t = toneMap[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", minHeight: 32,
      padding: "5px 11px", border: `1px solid ${t.bd}`, borderRadius: 999,
      background: t.bg, color: t.c,
      fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, lineHeight: 1.45,
    }}>{children}</span>
  );
};

const Avatar = ({ initials, size = "md", tone = "default" }) => {
  const sizeMap = { sm: 40, md: 48, lg: 64 };
  const fontMap = { sm: 12, md: 14, lg: 16 };
  const px = sizeMap[size];
  const bg = tone === "gold"
    ? "linear-gradient(135deg, rgb(242 232 200 / 0.92), rgb(184 145 61 / 0.18))"
    : "linear-gradient(135deg, rgb(220 235 228 / 0.92), rgb(242 232 200 / 0.86))";
  return (
    <span style={{
      width: px, height: px, borderRadius: 999,
      display: "inline-grid", placeItems: "center",
      border: "1px solid rgb(23 60 52 / 0.16)",
      background: bg, color: "var(--forest-700)",
      fontFamily: "var(--font-mono)", fontSize: fontMap[size], fontWeight: 700,
      flexShrink: 0,
    }}>{initials}</span>
  );
};

const Eyebrow = ({ children, dark = false }) => (
  <p style={{
    margin: 0,
    fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.45,
    letterSpacing: "0.04em", textTransform: "uppercase",
    color: dark ? "rgb(255 255 255 / 0.72)" : "var(--ink-500)",
  }}>{children}</p>
);

const PressureChip = ({ children, tone = "default", active = false, onClick }) => {
  const toneMap = {
    default: { bd: "var(--border-support)", bg: "rgb(255 255 255 / 0.72)", c: "var(--ink-700)" },
    active:  { bd: "var(--state-selected-border)", bg: "var(--state-selected-surface)", c: "var(--forest-700)" },
    warm:    { bd: "var(--state-danger-border)",  bg: "var(--state-danger-surface)",  c: "var(--clay-600)" },
    gold:    { bd: "var(--state-trust-border)",   bg: "var(--state-trust-surface)",   c: "var(--gold-500)" },
  };
  const t = toneMap[active ? "active" : tone];
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", minHeight: 34,
      padding: "5px 12px", border: `1px solid ${t.bd}`, borderRadius: 999,
      background: t.bg, color: t.c,
      fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
      cursor: "pointer", lineHeight: 1.45,
    }}>{children}</button>
  );
};

const Panel = ({ tone = "default", eyebrow, title, children, style = {} }) => {
  const toneStyles = {
    default: { background: "var(--surface-panel)", color: "var(--ink-900)" },
    warm:    { background: "var(--panel-warm)", color: "var(--ink-900)" },
    mist:    { background: "var(--surface-support)", color: "var(--ink-900)", borderColor: "var(--border-support)" },
    forest:  { background: "var(--panel-forest)", color: "white", borderColor: "transparent" },
    raised:  { background: "var(--surface-raised)", color: "var(--ink-900)", boxShadow: "var(--shadow-raised)" },
  };
  const dark = tone === "forest";
  return (
    <section style={{
      display: "grid", gap: 16, padding: 24,
      border: "1px solid var(--border-subtle)",
      borderRadius: 22, boxShadow: "var(--shadow-soft)",
      ...toneStyles[tone], ...style,
    }}>
      {(eyebrow || title) && (
        <header style={{ display: "grid", gap: 8 }}>
          {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
          {title && (
            <h2 style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>
              {title}
            </h2>
          )}
        </header>
      )}
      {children}
    </section>
  );
};

const AppFrame = ({ tabs = [], activeTab, onTabChange, children, footerNote }) => (
  <div style={{
    minHeight: "100vh",
    display: "grid", gridTemplateRows: "auto 1fr auto",
    background: "radial-gradient(circle at top left, rgb(243 222 215 / 0.65), transparent 28%), linear-gradient(180deg, var(--surface-section), var(--surface-page))",
    color: "var(--ink-900)",
    fontFamily: "var(--font-sans)",
  }}>
    <header style={{
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgb(252 250 244 / 0.9)",
      backdropFilter: "blur(16px)",
    }}>
      <div style={{
        width: "min(1120px, calc(100vw - 32px))", margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 24, padding: "16px 0", flexWrap: "wrap",
      }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-900)" }}>
            Mentor IB
          </span>
          <Eyebrow>Match-first IB tutoring</Eyebrow>
        </div>
        {tabs.length > 0 && (
          <nav style={{ display: "flex", gap: 4, padding: 4, borderRadius: 999, background: "rgb(255 255 255 / 0.55)", border: "1px solid var(--border-subtle)" }}>
            {tabs.map((t) => (
              <button key={t} onClick={() => onTabChange?.(t)}
                style={{
                  padding: "8px 14px", borderRadius: 999, border: "none",
                  background: activeTab === t ? "var(--forest-700)" : "transparent",
                  color: activeTab === t ? "white" : "var(--ink-700)",
                  fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>{t}</button>
            ))}
          </nav>
        )}
      </div>
    </header>
    <main style={{ width: "min(1120px, calc(100vw - 32px))", margin: "0 auto", padding: "32px 0 48px" }}>
      {children}
    </main>
    {footerNote && (
      <footer style={{
        width: "min(1120px, calc(100vw - 32px))", margin: "0 auto",
        padding: "16px 0 32px", color: "var(--ink-500)", fontSize: 14,
      }}>{footerNote}</footer>
    )}
  </div>
);

Object.assign(window, { Btn, Badge, Avatar, Eyebrow, PressureChip, Panel, AppFrame });
