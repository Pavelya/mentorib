// Mentor IB — TOK essay help service page (sections)
// Composes shared Primitives into the SEO landing layout for /services/tok-essay-help.

const { Btn, Badge, Avatar, Eyebrow, PressureChip, Panel } = window;

// ── Small helpers ──────────────────────────────────────────────────────────
const Mono = ({ children, style = {} }) => (
  <span style={{
    fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.04em",
    textTransform: "uppercase", color: "var(--ink-500)", ...style,
  }}>{children}</span>
);

const Serif = ({ children }) => (
  <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>{children}</span>
);

const Headline = ({ italicWord, primary }) => {
  // "From a stuck PT to a TOK essay you can actually <i>defend</i>."
  const head = "From a stuck PT to a TOK essay you can actually";
  return (
    <h1 style={{
      margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600,
      fontSize: "clamp(2.25rem, 2.6vw + 1.5rem, 3.5rem)", lineHeight: 1.06,
      letterSpacing: "-0.01em", color: "var(--ink-900)", textWrap: "balance",
    }}>
      {head} <Serif>{italicWord}</Serif>.
    </h1>
  );
};

// ── Breadcrumbs ────────────────────────────────────────────────────────────
const Breadcrumbs = () => (
  <nav style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", color: "var(--ink-500)", fontSize: 13 }}>
    {["Home", "Services", "TOK essay help"].map((c, i, arr) => (
      <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <a href="#" style={{ color: i === arr.length - 1 ? "var(--ink-900)" : "var(--ink-500)", textDecoration: "none", fontWeight: i === arr.length - 1 ? 600 : 400 }}>{c}</a>
        {i < arr.length - 1 && <span aria-hidden style={{ color: "var(--ink-300)" }}>/</span>}
      </span>
    ))}
  </nav>
);

// ── Hero ───────────────────────────────────────────────────────────────────
const Hero = ({ tweaks }) => (
  <section style={{ display: "grid", gap: 32, paddingBlock: "32px 56px" }}>
    <div style={{ display: "grid", gap: 12 }}>
      <Breadcrumbs />
      <Eyebrow>Service · TOK essay help · IBDP</Eyebrow>
    </div>
    <div style={{
      display: "grid",
      gridTemplateColumns: tweaks.heroLayout === "split" ? "minmax(0, 1.35fr) minmax(280px, 1fr)" : "1fr",
      gap: 40, alignItems: "start",
    }}>
      <div style={{ display: "grid", gap: 24, maxWidth: 720 }}>
        <Headline italicWord={tweaks.italicWord} />
        <p style={{
          margin: 0, fontFamily: "var(--font-sans)", fontSize: 19, lineHeight: 1.55,
          color: "var(--ink-700)", maxWidth: 620, textWrap: "pretty",
        }}>
          When the prescribed title isn't landing, an IB-trained TOK tutor sits with you for 50 minutes and helps you find the second knowledge question, the right real-world object, and the structure examiners actually reward.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Btn variant="primary">{tweaks.primaryCta} →</Btn>
          <Btn variant="secondary">See sample tutors</Btn>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8 }}>
          {["My PT just got rejected", "I have 12 days", "Draft 1 came back red", "I can't pick between PT 3 and PT 5"].map(t => (
            <PressureChip key={t} tone="warm">{t}</PressureChip>
          ))}
        </div>
      </div>
      {tweaks.heroLayout === "split" && <HeroAside />}
    </div>
  </section>
);

const HeroAside = () => (
  <aside style={{
    display: "grid", gap: 18, padding: 24, borderRadius: 22,
    border: "1px solid var(--border-subtle)", background: "var(--panel-warm)",
    boxShadow: "var(--shadow-soft)",
  }}>
    <Eyebrow>This week · TOK essay help</Eyebrow>
    <div style={{ display: "grid", gap: 14 }}>
      {[
        { k: "Tutors available", v: "23", sub: "Examiners on staff: 6" },
        { k: "Median first match", v: "19 min", sub: "Wed–Sun, 08:00–22:00 UTC" },
        { k: "Trial session", v: "$44 – $52", sub: "50 min · re-match free" },
        { k: "Recent results", v: "84%", sub: "Of trial students booked a plan" },
      ].map((m) => (
        <div key={m.k} style={{ display: "grid", gap: 4, paddingBlock: 10, borderBottom: "1px solid var(--border-subtle)" }}>
          <Mono>{m.k}</Mono>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 600, color: "var(--ink-900)", letterSpacing: "-0.01em" }}>{m.v}</span>
            <span style={{ fontSize: 12, color: "var(--ink-500)", textAlign: "right" }}>{m.sub}</span>
          </div>
        </div>
      ))}
    </div>
    <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--ink-500)", fontSize: 12 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--success-500)" }} />
      Live tutor coverage · updated 4 min ago
    </div>
  </aside>
);

// ── Five Questions ─────────────────────────────────────────────────────────
const FiveQuestions = () => {
  const items = window.TOK_DATA.FIVE_QUESTIONS;
  return (
    <section style={{ display: "grid", gap: 24, paddingBlock: 56, borderTop: "1px solid var(--border-subtle)" }}>
      <header style={{ display: "grid", gap: 8, maxWidth: 720 }}>
        <Eyebrow>What this is</Eyebrow>
        <h2 style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
          Five questions, answered before you book.
        </h2>
        <p style={{ margin: 0, color: "var(--ink-700)", fontSize: 17, lineHeight: 1.55 }}>
          Every Mentor IB service page commits to the same five answers. No platform copy, no "world-class experts" — just what's true for TOK essay help.
        </p>
      </header>
      <div style={{
        display: "grid", gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      }}>
        {items.map((it) => (
          <article key={it.label} style={{
            display: "grid", gap: 10, padding: 22, borderRadius: 22,
            background: "var(--surface-panel)", border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-soft)",
          }}>
            <Mono>{it.label}</Mono>
            <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 600, color: "var(--ink-900)", lineHeight: 1.25 }}>{it.title}</h3>
            <p style={{ margin: 0, color: "var(--ink-700)", fontSize: 15, lineHeight: 1.55 }}>{it.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

// ── How matching works ────────────────────────────────────────────────────
const HowItWorks = () => {
  const steps = window.TOK_DATA.HOW_STEPS;
  return (
    <section style={{
      display: "grid", gap: 28, paddingBlock: 56,
    }}>
      <header style={{ display: "grid", gap: 8, maxWidth: 720 }}>
        <Eyebrow>How matching works</Eyebrow>
        <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
          From <Serif>stuck</Serif> to a tutor reading your draft, in under a day.
        </h2>
      </header>
      <ol style={{
        listStyle: "none", margin: 0, padding: 0,
        display: "grid", gap: 0,
        borderTop: "1px solid var(--border-subtle)",
      }}>
        {steps.map((s) => (
          <li key={s.n} style={{
            display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto",
            gap: 24, alignItems: "center",
            paddingBlock: 22, borderBottom: "1px solid var(--border-subtle)",
          }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 32, fontWeight: 500,
              color: "var(--forest-700)", letterSpacing: "-0.02em", minWidth: 56,
            }}>{s.n}</span>
            <div style={{ display: "grid", gap: 4 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: "var(--ink-900)" }}>{s.title}</h3>
              <p style={{ margin: 0, color: "var(--ink-700)", fontSize: 15, lineHeight: 1.55 }}>{s.body}</p>
            </div>
            <span style={{ color: "var(--ink-300)", fontFamily: "var(--font-mono)", fontSize: 13 }}>STEP {s.n}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};

// ── Tutors who match ───────────────────────────────────────────────────────
const TutorMatchRow = ({ t, top }) => (
  <article style={{
    display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(0, 1.35fr) minmax(180px, auto)",
    gap: 28, alignItems: "start",
    padding: 24, borderRadius: 22, background: "var(--surface-panel)",
    border: "1px solid var(--border-subtle)", boxShadow: top ? "var(--shadow-raised)" : "var(--shadow-soft)",
  }}>
    {/* Identity */}
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Avatar initials={t.initials} size="lg" tone={top ? "gold" : "default"} />
        <div style={{ display: "grid", gap: 2 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>{t.name}</h3>
          <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{t.descriptor}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {t.badges.map(b => (
          <Badge key={b} tone={b === "Top match" ? "trust" : b === "TOK examiner" ? "trust" : "info"}>{b}</Badge>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--gold-500)", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
        ★ {t.metrics.rating} <span style={{ color: "var(--ink-500)", fontWeight: 400 }}>· {t.metrics.reviews} reviews</span>
      </div>
    </div>
    {/* Fit */}
    <div style={{ display: "grid", gap: 12 }}>
      <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 19, lineHeight: 1.35, color: "var(--ink-900)", textWrap: "pretty" }}>
        <Serif>Why fit:</Serif> {t.fit}
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {t.bullets.map(b => (
          <li key={b} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 10, color: "var(--ink-700)", fontSize: 14, lineHeight: 1.55 }}>
            <span aria-hidden style={{ color: "var(--forest-700)", marginTop: 6, width: 6, height: 6, borderRadius: 999, background: "var(--forest-700)", placeSelf: "start center" }} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
    {/* Metrics + CTA */}
    <div style={{ display: "grid", gap: 10, minWidth: 180 }}>
      <div style={{ display: "grid", gap: 6, padding: 14, background: "var(--surface-support)", borderRadius: 14, border: "1px solid var(--border-support)" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Mono>Trial</Mono>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink-900)" }}>{t.metrics.trial}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Mono>Next slot</Mono>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink-900)" }}>{t.metrics.next}</span>
        </div>
      </div>
      <Btn variant="primary" size="compact" fullWidth>Book trial</Btn>
      <Btn variant="ghost" size="compact" fullWidth>View profile →</Btn>
    </div>
  </article>
);

const TutorsSection = ({ count }) => {
  const tutors = window.TOK_DATA.TUTORS.slice(0, count);
  return (
    <section style={{ display: "grid", gap: 24, paddingBlock: 56 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
          <Eyebrow>Tutors who match TOK essay help</Eyebrow>
          <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
            Three TOK tutors, ranked for the way <Serif>you</Serif> got stuck.
          </h2>
          <p style={{ margin: 0, color: "var(--ink-700)", fontSize: 16, lineHeight: 1.55 }}>
            Live coverage. The tutors below are accepting new TOK students this week. Match results in your account are personalized to your draft and PT shortlist.
          </p>
        </div>
        <Btn variant="ghost" size="compact">See all 23 →</Btn>
      </header>
      <div style={{ display: "grid", gap: 14 }}>
        {tutors.map((t, i) => <TutorMatchRow key={t.name} t={t} top={i === 0} />)}
      </div>
    </section>
  );
};

// ── Pressure points cloud ─────────────────────────────────────────────────
const PressureCloud = () => {
  const points = window.TOK_DATA.PRESSURE_POINTS;
  return (
    <section style={{ display: "grid", gap: 20, paddingBlock: 56 }}>
      <header style={{ display: "grid", gap: 8, maxWidth: 720 }}>
        <Eyebrow>Common TOK pressure points</Eyebrow>
        <h2 style={{ margin: 0, fontSize: "clamp(1.5rem, 0.6vw + 1.4rem, 2rem)", fontWeight: 600, lineHeight: 1.2 }}>
          Where students actually get stuck.
        </h2>
        <p style={{ margin: 0, color: "var(--ink-700)", fontSize: 16, lineHeight: 1.55 }}>
          Pick the one that sounds like your week. Each links to a tutor view filtered for that pressure point.
        </p>
      </header>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {points.map(p => <PressureChip key={p.label} tone={p.tone}>{p.label} →</PressureChip>)}
      </div>
    </section>
  );
};

// ── FAQ ────────────────────────────────────────────────────────────────────
const FaqSection = () => {
  const faq = window.TOK_DATA.FAQ;
  return (
    <section style={{ display: "grid", gap: 24, paddingBlock: 56, borderTop: "1px solid var(--border-subtle)" }}>
      <header style={{ display: "grid", gap: 8, maxWidth: 720 }}>
        <Eyebrow>FAQ</Eyebrow>
        <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
          What students and parents ask before booking.
        </h2>
      </header>
      <dl style={{ margin: 0, display: "grid", gap: 0, borderTop: "1px solid var(--border-subtle)" }}>
        {faq.map((f) => (
          <div key={f.q} style={{
            display: "grid", gridTemplateColumns: "minmax(180px, 0.5fr) minmax(0, 1fr)",
            gap: 32, paddingBlock: 22, borderBottom: "1px solid var(--border-subtle)",
            alignItems: "start",
          }}>
            <dt style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 600, color: "var(--ink-900)", textWrap: "balance" }}>{f.q}</dt>
            <dd style={{ margin: 0, color: "var(--ink-700)", fontSize: 16, lineHeight: 1.6, textWrap: "pretty" }}>{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

// ── Internal linking blocks ────────────────────────────────────────────────
const RelatedBlock = () => {
  const subs = window.TOK_DATA.RELATED_SUBJECTS;
  const svcs = window.TOK_DATA.RELATED_SERVICES;
  return (
    <section style={{ display: "grid", gap: 32, paddingBlock: 56 }}>
      <div style={{
        display: "grid", gap: 28,
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      }}>
        <div style={{ display: "grid", gap: 16 }}>
          <Eyebrow>Subjects this often pairs with</Eyebrow>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Curated subject + TOK combinations</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {subs.map(s => (
              <li key={s.slug}>
                <a href={`/subjects/${s.slug}/tok-essay-help`} style={{
                  display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12,
                  paddingBlock: 14, borderTop: "1px solid var(--border-subtle)",
                  color: "var(--ink-900)", textDecoration: "none",
                }}>
                  <span style={{ display: "grid", gap: 2 }}>
                    <span style={{ fontWeight: 600 }}>{s.label} <span style={{ color: "var(--ink-500)", fontWeight: 400 }}>→ TOK essay help</span></span>
                    <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{s.note}</span>
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-500)" }}>/{s.slug}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          <Eyebrow>Other IB pressure points</Eyebrow>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Related services</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {svcs.map(s => (
              <li key={s.slug}>
                <a href={`/services/${s.slug}`} style={{
                  display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12,
                  paddingBlock: 14, borderTop: "1px solid var(--border-subtle)",
                  color: "var(--ink-900)", textDecoration: "none",
                }}>
                  <span style={{ fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-500)" }}>/services/{s.slug}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

// ── Final CTA ──────────────────────────────────────────────────────────────
const FinalCta = ({ primaryCta }) => (
  <section style={{ paddingBlock: "32px 64px" }}>
    <div style={{
      borderRadius: 28, padding: "56px 48px",
      background: "var(--panel-forest)", color: "white",
      display: "grid", gap: 24, position: "relative", overflow: "hidden",
      boxShadow: "var(--shadow-action)",
    }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 0%, rgb(184 145 61 / 0.28), transparent 55%)" }} />
      <div style={{ position: "relative", display: "grid", gap: 16, maxWidth: 720 }}>
        <Eyebrow dark>Ready when you are</Eyebrow>
        <h2 style={{
          margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600,
          fontSize: "clamp(2rem, 1.6vw + 1.4rem, 2.75rem)", lineHeight: 1.1,
          letterSpacing: "-0.01em", color: "white",
        }}>
          Stop staring at the PT list. Get matched in <Serif>twenty</Serif> minutes.
        </h2>
        <p style={{ margin: 0, color: "rgb(255 255 255 / 0.78)", fontSize: 17, lineHeight: 1.55, maxWidth: 600 }}>
          Tell us where the TOK essay is sticking. We'll come back with three tutors, written fit reasoning, and a real next-week slot. No subscription, no waiting list.
        </p>
      </div>
      <div style={{ position: "relative", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Btn variant="onForest">{primaryCta} →</Btn>
        <Btn variant="ghost" onClick={() => {}}>
          <span style={{ color: "rgb(255 255 255 / 0.84)" }}>How matching works →</span>
        </Btn>
      </div>
    </div>
  </section>
);

// ── Footer ─────────────────────────────────────────────────────────────────
const ServiceFooter = () => (
  <footer style={{
    borderTop: "1px solid var(--border-subtle)",
    paddingBlock: "32px 48px",
    display: "grid", gap: 20,
  }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <span style={{ fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Mentor IB</span>
        <span style={{ fontSize: 13, color: "var(--ink-500)" }}>Match-first IB tutoring. Built around the pressure point you got stuck on.</span>
      </div>
      {[
        { h: "Services", links: ["TOK essay help", "Extended essay planning", "IA feedback", "HL exam rescue", "All services"] },
        { h: "Subjects", links: ["English A", "Math AA HL", "Biology HL", "History HL", "All subjects"] },
        { h: "Mentor IB", links: ["How it works", "Trust & safety", "Become a tutor", "Privacy", "Terms"] },
      ].map(col => (
        <div key={col.h} style={{ display: "grid", gap: 8 }}>
          <Mono>{col.h}</Mono>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {col.links.map(l => <li key={l}><a href="#" style={{ color: "var(--ink-700)", fontSize: 14, textDecoration: "none" }}>{l}</a></li>)}
          </ul>
        </div>
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
      <span style={{ fontSize: 12, color: "var(--ink-500)" }}>© 2026 Mentor IB. Not affiliated with the International Baccalaureate Organization.</span>
      <Mono>EN · USD · server-rendered</Mono>
    </div>
  </footer>
);

// ── Site header (keeps SEO page lean — not full AppFrame chrome) ──────────
const SiteHeader = () => (
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
      <a href="#" style={{ display: "grid", gap: 2, color: "inherit", textDecoration: "none" }}>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Mentor IB</span>
        <Mono>Match-first IB tutoring</Mono>
      </a>
      <nav style={{ display: "flex", gap: 4, padding: 4, borderRadius: 999, background: "rgb(255 255 255 / 0.55)", border: "1px solid var(--border-subtle)" }}>
        {["Subjects", "Services", "How it works", "Tutors"].map(t => (
          <a key={t} href="#" style={{
            padding: "8px 14px", borderRadius: 999,
            background: t === "Services" ? "var(--forest-700)" : "transparent",
            color: t === "Services" ? "white" : "var(--ink-700)",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>{t}</a>
        ))}
      </nav>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Btn variant="ghost" size="compact">Sign in</Btn>
        <Btn variant="primary" size="compact">Find a tutor</Btn>
      </div>
    </div>
  </header>
);

// ── Page composition ──────────────────────────────────────────────────────
const TokEssayHelpPage = () => {
  const [tweaks, setTweak] = window.useTweaks ? window.useTweaks(window.TOK_TWEAKS_DEFAULTS) : [window.TOK_TWEAKS_DEFAULTS, () => {}];
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 8% -4%, rgb(243 222 215 / 0.55), transparent 32%), radial-gradient(circle at 92% 8%, rgb(231 238 240 / 0.5), transparent 30%), linear-gradient(180deg, var(--surface-section), var(--surface-page))",
      color: "var(--ink-900)", fontFamily: "var(--font-sans)",
    }} data-screen-label="01 /services/tok-essay-help">
      <SiteHeader />
      <main style={{ width: "min(1200px, calc(100vw - 32px))", margin: "0 auto" }}>
        <Hero tweaks={tweaks} />
        {tweaks.showFiveQuestions && <FiveQuestions />}
        <HowItWorks />
        <TutorsSection count={tweaks.tutorCount} />
        <PressureCloud />
        {tweaks.showFaq && <FaqSection />}
        <RelatedBlock />
        <FinalCta primaryCta={tweaks.primaryCta} />
      </main>
      <div style={{ width: "min(1200px, calc(100vw - 32px))", margin: "0 auto" }}>
        <ServiceFooter />
      </div>
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Headline">
            <window.TweakRadio label="Italic word" value={tweaks.italicWord} onChange={v => setTweak("italicWord", v)} options={["defend", "finish", "trust", "explain"]} />
          </window.TweakSection>
          <window.TweakSection title="Layout">
            <window.TweakRadio label="Hero" value={tweaks.heroLayout} onChange={v => setTweak("heroLayout", v)} options={["split", "centered"]} />
            <window.TweakToggle label="Five-questions block" value={tweaks.showFiveQuestions} onChange={v => setTweak("showFiveQuestions", v)} />
            <window.TweakToggle label="FAQ block" value={tweaks.showFaq} onChange={v => setTweak("showFaq", v)} />
            <window.TweakSlider label="Tutor cards" value={tweaks.tutorCount} min={1} max={3} step={1} onChange={v => setTweak("tutorCount", v)} />
          </window.TweakSection>
          <window.TweakSection title="Copy">
            <window.TweakText label="Primary CTA" value={tweaks.primaryCta} onChange={v => setTweak("primaryCta", v)} />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
};

window.TokEssayHelpPage = TokEssayHelpPage;
