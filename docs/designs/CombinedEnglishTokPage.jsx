// Mentor IB — curated combo page: English A Lang & Lit × TOK essay help.

const { Btn, Badge, Avatar, Eyebrow, PressureChip } = window;
const CMono = ({ children }) => (
  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-500)" }}>{children}</span>
);
const CSerif = ({ children }) => (
  <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>{children}</span>
);

const ComboBreadcrumbs = () => (
  <nav style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", color: "var(--ink-500)", fontSize: 13 }}>
    {["Home", "Subjects", "English A: Lang & Lit", "TOK essay help"].map((c, i, arr) => (
      <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <a href="#" style={{ color: i === arr.length - 1 ? "var(--ink-900)" : "var(--ink-500)", textDecoration: "none", fontWeight: i === arr.length - 1 ? 600 : 400 }}>{c}</a>
        {i < arr.length - 1 && <span aria-hidden style={{ color: "var(--ink-300)" }}>/</span>}
      </span>
    ))}
  </nav>
);

const ComboHero = ({ tweaks }) => {
  const Eng = window.EnglishIcon || (() => null);
  const Tok = window.TokIcon || (() => null);
  return (
    <section style={{ display: "grid", gap: 32, paddingBlock: "32px 56px" }}>
      <div style={{ display: "grid", gap: 12 }}>
        <ComboBreadcrumbs />
        <Eyebrow>Curated combination · Subject × Service</Eyebrow>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 1fr)", gap: 40, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 24, maxWidth: 720 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 14, background: "var(--forest-100)", color: "var(--forest-700)" }}><Eng /></span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)", fontSize: 24, fontWeight: 500 }}>×</span>
            <span style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 14, background: "var(--state-trust-surface)", color: "var(--gold-500)" }}><Tok /></span>
            <Badge tone="trust">Curated combination · 9 active tutors</Badge>
          </div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "clamp(2.25rem, 2.6vw + 1.5rem, 3.5rem)", lineHeight: 1.06, letterSpacing: "-0.01em", color: "var(--ink-900)", textWrap: "balance" }}>
            English A texts that <CSerif>{tweaks.italicWord}</CSerif> when the prescribed title is about language.
          </h1>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55, color: "var(--ink-700)", maxWidth: 620, textWrap: "pretty" }}>
            One tutor, both subjects, one 50-minute session. We only publish this combination when there's real staffing — nine tutors who teach English A: Lang & Lit <em>and</em> coach the TOK essay are accepting students this week.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Btn variant="primary">{tweaks.primaryCta} →</Btn>
            <Btn variant="secondary">See the 9 tutors</Btn>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8 }}>
            {["PT 4 (language)", "IO global issue → TOK", "Comparative AOK move", "10-day rescue"].map(t => <PressureChip key={t} tone="warm">{t}</PressureChip>)}
          </div>
        </div>
        <aside style={{ display: "grid", gap: 18, padding: 24, borderRadius: 22, border: "1px solid var(--border-subtle)", background: "var(--panel-warm)", boxShadow: "var(--shadow-soft)" }}>
          <Eyebrow>This combination · this week</Eyebrow>
          {[
            { k: "Tutors qualified", v: "9", sub: "Both subjects, one session" },
            { k: "Examiners on staff", v: "4", sub: "TOK or English A or both" },
            { k: "Median first match", v: "26 min", sub: "Wed–Sun, 09:00–22:00 UTC" },
            { k: "Trial session", v: "$48 – $54", sub: "50 min · combined" },
          ].map(m => (
            <div key={m.k} style={{ display: "grid", gap: 4, paddingBlock: 10, borderBottom: "1px solid var(--border-subtle)" }}>
              <CMono>{m.k}</CMono>
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

const WhyCurated = () => (
  <section style={{ display: "grid", gap: 24, paddingBlock: 56, borderTop: "1px solid var(--border-subtle)" }}>
    <header style={{ display: "grid", gap: 8, maxWidth: 720 }}>
      <Eyebrow>Why this page exists</Eyebrow>
      <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
        Mentor IB only publishes a combination page when it can <CSerif>actually</CSerif> staff it.
      </h2>
      <p style={{ margin: 0, color: "var(--ink-700)", fontSize: 17, lineHeight: 1.55, maxWidth: 720 }}>
        Most "subject × need" pages on the internet are SEO bait — auto-generated, no real tutor coverage, no real content. We do the opposite. We publish the combination only when three conditions are met, and we retire the page when any of them stop being true.
      </p>
    </header>
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      {[
        { n: "01", t: "Tutor coverage", b: "At least 6 active tutors who teach both English A: Lang & Lit and the TOK essay, with a non-empty calendar in the next 14 days." },
        { n: "02", t: "Content quality", b: "Unique, useful copy written against this specific overlap — not the same boilerplate scaled across 400 slugs." },
        { n: "03", t: "Real-world demand", b: "A demonstrated search and referral pattern from inside the product. We watch it for two cycles before publishing." },
      ].map(c => (
        <li key={c.n} style={{ display: "grid", gap: 8, padding: 22, borderRadius: 22, background: "var(--surface-panel)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-soft)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, color: "var(--forest-700)", letterSpacing: "-0.02em" }}>{c.n}</span>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{c.t}</h3>
          <p style={{ margin: 0, color: "var(--ink-700)", fontSize: 15, lineHeight: 1.55 }}>{c.b}</p>
        </li>
      ))}
    </ol>
  </section>
);

const ComboTutors = ({ count }) => {
  const tutors = window.COMBO_DATA.TUTORS.slice(0, count);
  return (
    <section style={{ display: "grid", gap: 24, paddingBlock: 56 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
          <Eyebrow>Tutors who match this combination</Eyebrow>
          <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
            Three of the nine tutors who can <CSerif>hold both</CSerif> in one session.
          </h2>
        </div>
        <Btn variant="ghost" size="compact">See all 9 →</Btn>
      </header>
      <div style={{ display: "grid", gap: 14 }}>
        {tutors.map((t, i) => (
          <article key={t.name} style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(0, 1.35fr) minmax(180px, auto)", gap: 28, alignItems: "start", padding: 24, borderRadius: 22, background: "var(--surface-panel)", border: "1px solid var(--border-subtle)", boxShadow: i === 0 ? "var(--shadow-raised)" : "var(--shadow-soft)" }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar initials={t.initials} size="lg" tone={i === 0 ? "gold" : "default"} />
                <div style={{ display: "grid", gap: 2 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t.name}</h3>
                  <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{t.descriptor}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {t.badges.map(b => <Badge key={b} tone={b === "Top match" || b === "Curated combo" || b === "Examiner" ? "trust" : "info"}>{b}</Badge>)}
              </div>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 19, lineHeight: 1.35, color: "var(--ink-900)" }}>
                <CSerif>Why fit:</CSerif> {t.fit}
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
                <div style={{ display: "flex", justifyContent: "space-between" }}><CMono>Trial</CMono><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink-900)" }}>{t.metrics.trial}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><CMono>Next slot</CMono><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink-900)" }}>{t.metrics.next}</span></div>
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

const ComboFaq = () => (
  <section style={{ display: "grid", gap: 24, paddingBlock: 56, borderTop: "1px solid var(--border-subtle)" }}>
    <header style={{ display: "grid", gap: 8, maxWidth: 720 }}>
      <Eyebrow>FAQ for this combination</Eyebrow>
      <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 1vw + 1.5rem, 2.25rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" }}>What students ask before booking the combo.</h2>
    </header>
    <dl style={{ margin: 0, display: "grid", gap: 0, borderTop: "1px solid var(--border-subtle)" }}>
      {window.COMBO_DATA.FAQ.map(f => (
        <div key={f.q} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 0.5fr) minmax(0, 1fr)", gap: 32, paddingBlock: 22, borderBottom: "1px solid var(--border-subtle)", alignItems: "start" }}>
          <dt style={{ fontSize: 17, fontWeight: 600, color: "var(--ink-900)" }}>{f.q}</dt>
          <dd style={{ margin: 0, color: "var(--ink-700)", fontSize: 16, lineHeight: 1.6 }}>{f.a}</dd>
        </div>
      ))}
    </dl>
  </section>
);

const ComboParents = () => (
  <section style={{ display: "grid", gap: 24, paddingBlock: 56 }}>
    <header style={{ display: "grid", gap: 8, maxWidth: 720 }}>
      <Eyebrow>Or jump to a parent page</Eyebrow>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>This combination is part of two larger surfaces.</h2>
    </header>
    <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
      {[
        { l: "All English A: Lang & Lit help", note: "Subject page · 41 active tutors", href: "subjects-biology-hl.html", k: "/subjects/english-a-lang-and-lit" },
        { l: "All TOK essay help", note: "Service page · 23 active tutors", href: "services-tok-essay-help.html", k: "/services/tok-essay-help" },
      ].map(c => (
        <a key={c.l} href={c.href} style={{ display: "grid", gap: 6, padding: 22, borderRadius: 22, background: "var(--surface-panel)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-soft)", textDecoration: "none", color: "var(--ink-900)" }}>
          <CMono>{c.k}</CMono>
          <span style={{ fontWeight: 600, fontSize: 18 }}>{c.l} →</span>
          <span style={{ color: "var(--ink-500)", fontSize: 14 }}>{c.note}</span>
        </a>
      ))}
    </div>
  </section>
);

const ComboCta = ({ primary }) => (
  <section style={{ paddingBlock: "32px 64px" }}>
    <div style={{ borderRadius: 28, padding: "56px 48px", background: "var(--panel-forest)", color: "white", display: "grid", gap: 24, position: "relative", overflow: "hidden", boxShadow: "var(--shadow-action)" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 0%, rgb(184 145 61 / 0.28), transparent 55%)" }} />
      <div style={{ position: "relative", display: "grid", gap: 16, maxWidth: 720 }}>
        <Eyebrow dark>One tutor · both subjects</Eyebrow>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: "clamp(2rem, 1.6vw + 1.4rem, 2.75rem)", lineHeight: 1.1, letterSpacing: "-0.01em", color: "white" }}>
          Skip the re-teach. Get one person reading <CSerif>both</CSerif> drafts.
        </h2>
      </div>
      <div style={{ position: "relative", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <window.Btn variant="onForest">{primary} →</window.Btn>
        <window.Btn variant="ghost"><span style={{ color: "rgb(255 255 255 / 0.84)" }}>How matching works →</span></window.Btn>
      </div>
    </div>
  </section>
);

const ComboPage = () => {
  const [tweaks, setTweak] = window.useTweaks ? window.useTweaks(window.COMBO_TWEAKS_DEFAULTS) : [window.COMBO_TWEAKS_DEFAULTS, () => {}];
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 8% -4%, rgb(243 222 215 / 0.45), transparent 32%), radial-gradient(circle at 92% 8%, rgb(242 232 200 / 0.55), transparent 30%), linear-gradient(180deg, var(--surface-section), var(--surface-page))", color: "var(--ink-900)", fontFamily: "var(--font-sans)" }} data-screen-label="01 /subjects/english-a-lang-and-lit/tok-essay-help">
      <window.SiteHeader active="Subjects" />
      <main style={{ width: "min(1200px, calc(100vw - 32px))", margin: "0 auto" }}>
        <ComboHero tweaks={tweaks} />
        {tweaks.showWhyCurated && <WhyCurated />}
        <ComboTutors count={tweaks.tutorCount} />
        <ComboFaq />
        <ComboParents />
        <ComboCta primary={tweaks.primaryCta} />
      </main>
      <div style={{ width: "min(1200px, calc(100vw - 32px))", margin: "0 auto" }}><window.MentorFooter /></div>
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Headline">
            <window.TweakRadio label="Italic word" value={tweaks.italicWord} onChange={v => setTweak("italicWord", v)} options={["land", "click", "stick", "earn"]} />
          </window.TweakSection>
          <window.TweakSection title="Layout">
            <window.TweakToggle label="Why curated block" value={tweaks.showWhyCurated} onChange={v => setTweak("showWhyCurated", v)} />
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

window.ComboPage = ComboPage;
