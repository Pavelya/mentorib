// Mentor IB — /subjects/biology-hl page (subject SEO template).

const { Btn, Badge, Avatar, Eyebrow, PressureChip } = window;

const BMono = ({ children }) => (
  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-500)" }}>{children}</span>
);
const BSerif = ({ children }) => (
  <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>{children}</span>
);

const BioBreadcrumbs = () => (
  <nav style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", color: "var(--ink-500)", fontSize: 13 }}>
    {[
      { l: "Home", h: "#" },
      { l: "Subjects", h: "#" },
      { l: "Biology HL", h: "#" },
    ].map((c, i, arr) => (
      <span key={c.l} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <a href={c.h} style={{ color: i === arr.length - 1 ? "var(--ink-900)" : "var(--ink-500)", textDecoration: "none", fontWeight: i === arr.length - 1 ? 600 : 400 }}>{c.l}</a>
        {i < arr.length - 1 && <span aria-hidden style={{ color: "var(--ink-300)" }}>/</span>}
      </span>
    ))}
  </nav>
);

const BioHero = ({ tweaks }) => {
  const Bio = window.BiologyIcon || (() => null);
  return (
    <section style={{ display: "grid", gap: 32, paddingBlock: "32px 56px" }}>
      <div style={{ display: "grid", gap: 12 }}>
        <BioBreadcrumbs />
        <Eyebrow>Subject · Biology · Higher Level · Group 4</Eyebrow>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 1fr)", gap: 40, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 24, maxWidth: 720 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 16, background: "var(--forest-100)", color: "var(--forest-700)" }}><Bio /></span>
            <Badge tone="trust">May 2025 syllabus · strands A–D</Badge>
          </div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "clamp(2.25rem, 2.6vw + 1.5rem, 3.5rem)", lineHeight: 1.06, letterSpacing: "-0.01em", color: "var(--ink-900)", textWrap: "balance" }}>
            Biology HL tutors who help your IA <BSerif>{tweaks.italicWord}</BSerif>.
          </h1>
          <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 19, lineHeight: 1.55, color: "var(--ink-700)", maxWidth: 620, textWrap: "pretty" }}>
            Match-first Biology HL support for the three pressure points that actually break students: a stuck IA, the genetics unit gap, and the 60-day window before written exams.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Btn variant="primary">{tweaks.primaryCta} →</Btn>
            <Btn variant="secondary">See sample tutors</Btn>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8 }}>
            {["IA topic rejected", "Mock came back at 4", "Genetics unit fog", "Paper 2 LRQ"].map(t => (
              <PressureChip key={t} tone="warm">{t}</PressureChip>
            ))}
          </div>
        </div>
        <aside style={{ display: "grid", gap: 18, padding: 24, borderRadius: 22, border: "1px solid var(--border-subtle)", background: "var(--panel-warm)", boxShadow: "var(--shadow-soft)" }}>
          <Eyebrow>This week · Biology HL</Eyebrow>
          {[
            { k: "Tutors available", v: "31", sub: "Examiners on staff: 9" },
            { k: "IA-specialist tutors", v: "14", sub: "Read your draft before trial" },
            { k: "Median first match", v: "22 min", sub: "Mon–Sun, 07:00–22:00 UTC" },
            { k: "Trial session", v: "$44 – $58", sub: "50 min · re-match free" },
          ].map((m) => (
            <div key={m.k} style={{ display: "grid", gap: 4, paddingBlock: 10, borderBottom: "1px solid var(--border-subtle)" }}>
              <BMono>{m.k}</BMono>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 600, color: "var(--ink-900)", letterSpacing: "-0.01em" }}>{m.v}</span>
                <span style={{ fontSize: 12, color: "var(--ink-500)", textAlign: "right" }}>{m.sub}</span>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
};

const StrandRail = () => (
  <section style={{ display: "grid", gap: 20, paddingBlock: 56, borderTop: "1px solid var(--border-subtle)" }}>
    <header style={{ display: "grid", gap: 8, maxWidth: 720 }}>
      <Eyebrow>Strand coverage · May 2025 syllabus</Eyebrow>
      <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
        Tutors by the strand <BSerif>you</BSerif> are stuck on.
      </h2>
    </header>
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
      {window.BIO_DATA.STRANDS.map(s => (
        <article key={s.code} style={{ display: "grid", gap: 10, padding: 22, borderRadius: 22, background: "var(--surface-panel)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-soft)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 600, color: "var(--forest-700)", letterSpacing: "-0.02em" }}>{s.code}</span>
            <BMono>{s.coverage}</BMono>
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>{s.name}</h3>
          <p style={{ margin: 0, color: "var(--ink-700)", fontSize: 14, lineHeight: 1.55 }}>{s.weight}</p>
          <a href="#" style={{ marginTop: 4, fontSize: 13, color: "var(--forest-700)", fontWeight: 600, textDecoration: "none" }}>See strand-{s.code} tutors →</a>
        </article>
      ))}
    </div>
  </section>
);

const BioFiveQuestions = () => (
  <section style={{ display: "grid", gap: 24, paddingBlock: 56, borderTop: "1px solid var(--border-subtle)" }}>
    <header style={{ display: "grid", gap: 8, maxWidth: 720 }}>
      <Eyebrow>What this is</Eyebrow>
      <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
        Five questions, answered before you book.
      </h2>
    </header>
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      {window.BIO_DATA.FIVE.map(it => (
        <article key={it.label} style={{ display: "grid", gap: 10, padding: 22, borderRadius: 22, background: "var(--surface-panel)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-soft)" }}>
          <BMono>{it.label}</BMono>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ink-900)", lineHeight: 1.25 }}>{it.title}</h3>
          <p style={{ margin: 0, color: "var(--ink-700)", fontSize: 15, lineHeight: 1.55 }}>{it.body}</p>
        </article>
      ))}
    </div>
  </section>
);

const BioTutorCards = ({ count }) => {
  const tutors = window.BIO_DATA.TUTORS.slice(0, count);
  return (
    <section style={{ display: "grid", gap: 24, paddingBlock: 56 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
          <Eyebrow>Tutors who match Biology HL</Eyebrow>
          <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
            Three Biology HL tutors, ranked for your <BSerif>specific</BSerif> pressure point.
          </h2>
        </div>
        <Btn variant="ghost" size="compact">See all 31 →</Btn>
      </header>
      <div style={{ display: "grid", gap: 14 }}>
        {tutors.map((t, i) => (
          <article key={t.name} style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(0, 1.35fr) minmax(180px, auto)", gap: 28, alignItems: "start", padding: 24, borderRadius: 22, background: "var(--surface-panel)", border: "1px solid var(--border-subtle)", boxShadow: i === 0 ? "var(--shadow-raised)" : "var(--shadow-soft)" }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar initials={t.initials} size="lg" tone={i === 0 ? "gold" : "default"} />
                <div style={{ display: "grid", gap: 2 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>{t.name}</h3>
                  <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{t.descriptor}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {t.badges.map(b => <Badge key={b} tone={b === "Top match" || b === "HL examiner" ? "trust" : "info"}>{b}</Badge>)}
              </div>
              <div style={{ color: "var(--gold-500)", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>★ {t.metrics.rating} <span style={{ color: "var(--ink-500)", fontWeight: 400 }}>· {t.metrics.reviews} reviews</span></div>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 19, lineHeight: 1.35, color: "var(--ink-900)" }}>
                <BSerif>Why fit:</BSerif> {t.fit}
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {t.bullets.map(b => (
                  <li key={b} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 10, color: "var(--ink-700)", fontSize: 14, lineHeight: 1.55 }}>
                    <span aria-hidden style={{ marginTop: 6, width: 6, height: 6, borderRadius: 999, background: "var(--forest-700)", placeSelf: "start center" }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ display: "grid", gap: 10, minWidth: 180 }}>
              <div style={{ display: "grid", gap: 6, padding: 14, background: "var(--surface-support)", borderRadius: 14, border: "1px solid var(--border-support)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><BMono>Trial</BMono><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink-900)" }}>{t.metrics.trial}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><BMono>Next slot</BMono><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink-900)" }}>{t.metrics.next}</span></div>
              </div>
              <Btn variant="primary" size="compact" fullWidth>Book trial</Btn>
              <Btn variant="ghost" size="compact" fullWidth>View profile →</Btn>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const BioRelated = () => (
  <section style={{ display: "grid", gap: 32, paddingBlock: 56 }}>
    <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
      <div style={{ display: "grid", gap: 16 }}>
        <Eyebrow>Curated services for Biology HL</Eyebrow>
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Biology HL × pressure point</h3>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {window.BIO_DATA.RELATED_SERVICES.map(s => (
            <li key={s.slug}>
              <a href={`/subjects/biology-hl/${s.slug}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12, paddingBlock: 14, borderTop: "1px solid var(--border-subtle)", color: "var(--ink-900)", textDecoration: "none" }}>
                <span style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{s.label} <span style={{ color: "var(--ink-500)", fontWeight: 400 }}>→ for Biology HL</span></span>
                  <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{s.note}</span>
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-500)" }}>/biology-hl/{s.slug}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        <Eyebrow>Common subject pairings</Eyebrow>
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Other HL subjects to look at</h3>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {window.BIO_DATA.RELATED_SUBJECTS.map(s => (
            <li key={s.slug}>
              <a href={`/subjects/${s.slug}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12, paddingBlock: 14, borderTop: "1px solid var(--border-subtle)", color: "var(--ink-900)", textDecoration: "none" }}>
                <span style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{s.note}</span>
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-500)" }}>/{s.slug}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

const BioFaq = () => (
  <section style={{ display: "grid", gap: 24, paddingBlock: 56, borderTop: "1px solid var(--border-subtle)" }}>
    <header style={{ display: "grid", gap: 8, maxWidth: 720 }}>
      <Eyebrow>FAQ</Eyebrow>
      <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>What students and parents ask before booking.</h2>
    </header>
    <dl style={{ margin: 0, display: "grid", gap: 0, borderTop: "1px solid var(--border-subtle)" }}>
      {window.BIO_DATA.FAQ.map(f => (
        <div key={f.q} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 0.5fr) minmax(0, 1fr)", gap: 32, paddingBlock: 22, borderBottom: "1px solid var(--border-subtle)", alignItems: "start" }}>
          <dt style={{ fontSize: 17, fontWeight: 600, color: "var(--ink-900)", textWrap: "balance" }}>{f.q}</dt>
          <dd style={{ margin: 0, color: "var(--ink-700)", fontSize: 16, lineHeight: 1.6, textWrap: "pretty" }}>{f.a}</dd>
        </div>
      ))}
    </dl>
  </section>
);

const BioFinalCta = ({ primary }) => (
  <section style={{ paddingBlock: "32px 64px" }}>
    <div style={{ borderRadius: 28, padding: "56px 48px", background: "var(--panel-forest)", color: "white", display: "grid", gap: 24, position: "relative", overflow: "hidden", boxShadow: "var(--shadow-action)" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 0%, rgb(184 145 61 / 0.28), transparent 55%)" }} />
      <div style={{ position: "relative", display: "grid", gap: 16, maxWidth: 720 }}>
        <Eyebrow dark>Ready when you are</Eyebrow>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: "clamp(2rem, 1.6vw + 1.4rem, 2.75rem)", lineHeight: 1.1, letterSpacing: "-0.01em", color: "white" }}>
          Tell us the strand. We'll bring three Biology HL tutors who can <BSerif>actually</BSerif> teach it.
        </h2>
        <p style={{ margin: 0, color: "rgb(255 255 255 / 0.78)", fontSize: 17, lineHeight: 1.55, maxWidth: 600 }}>
          Match in twenty minutes, trial in 48 hours, plan after the trial. No subscription.
        </p>
      </div>
      <div style={{ position: "relative", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Btn variant="onForest">{primary} →</Btn>
        <Btn variant="ghost"><span style={{ color: "rgb(255 255 255 / 0.84)" }}>How matching works →</span></Btn>
      </div>
    </div>
  </section>
);

const BioPage = () => {
  const [tweaks, setTweak] = window.useTweaks ? window.useTweaks(window.BIO_TWEAKS_DEFAULTS) : [window.BIO_TWEAKS_DEFAULTS, () => {}];
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 8% -4%, rgb(220 235 228 / 0.65), transparent 32%), radial-gradient(circle at 92% 6%, rgb(231 238 240 / 0.6), transparent 30%), linear-gradient(180deg, var(--surface-section), var(--surface-page))", color: "var(--ink-900)", fontFamily: "var(--font-sans)" }} data-screen-label="01 /subjects/biology-hl">
      <window.SiteHeader active="Subjects" />
      <main style={{ width: "min(1200px, calc(100vw - 32px))", margin: "0 auto" }}>
        <BioHero tweaks={tweaks} />
        {tweaks.showStrandRail && <StrandRail />}
        <BioFiveQuestions />
        <BioTutorCards count={tweaks.tutorCount} />
        <BioRelated />
        <BioFaq />
        <BioFinalCta primary={tweaks.primaryCta} />
      </main>
      <div style={{ width: "min(1200px, calc(100vw - 32px))", margin: "0 auto" }}><window.MentorFooter /></div>
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Headline">
            <window.TweakRadio label="Italic word" value={tweaks.italicWord} onChange={v => setTweak("italicWord", v)} options={["land", "earn 7", "click", "stick"]} />
          </window.TweakSection>
          <window.TweakSection title="Layout">
            <window.TweakToggle label="Strand rail" value={tweaks.showStrandRail} onChange={v => setTweak("showStrandRail", v)} />
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

window.BioPage = BioPage;
