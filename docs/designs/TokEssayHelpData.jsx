// Mentor IB — /services/tok-essay-help (P15-SEO-001 design)
// Service-led SEO landing page. Composed from shared Primitives (Btn, Badge,
// Avatar, Eyebrow, PressureChip, Panel, AppFrame) and the IB icon set.

const TOK_TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "italicWord": "defend",
  "heroLayout": "split",
  "showFiveQuestions": true,
  "showFaq": true,
  "tutorCount": 3,
  "primaryCta": "Match me with a TOK tutor"
}/*EDITMODE-END*/;

// ── Tutor data ─────────────────────────────────────────────────────────────
const TUTORS = [
  {
    initials: "MC",
    name: "Dr. Maya Chen",
    descriptor: "Former IB TOK examiner · 8 years",
    badges: ["Reviewed", "TOK examiner", "Native English"],
    fit: "Knows what cost the marks on last year's PT 3.",
    bullets: [
      "Examined ~300 TOK essays for the May 2024 cohort",
      "Specializes in PT selection and second-KQ framing",
      "Walks rubric criterion A→D in plain language",
    ],
    metrics: { rating: "4.9", reviews: "42", trial: "$48", next: "Wed 18:30" },
  },
  {
    initials: "JO",
    name: "James Okafor",
    descriptor: "TOK + English A · 6 years",
    badges: ["Reviewed", "Top match"],
    fit: "Best for students stuck between two PT options.",
    bullets: [
      "Recovers first-drafts that lost the knowledge claim",
      "Teaches the comparative AOK move examiners reward",
      "Comfortable working under a 10-day deadline",
    ],
    metrics: { rating: "4.8", reviews: "31", trial: "$44", next: "Thu 17:00" },
  },
  {
    initials: "AR",
    name: "Aditi Raman",
    descriptor: "Philosophy DPhil · TOK lead",
    badges: ["Reviewed", "Native English"],
    fit: "Strongest on epistemology-heavy PTs (1, 4, 6).",
    bullets: [
      "Heads TOK at an IB World School in Geneva",
      "Coaches the real-world object selection step",
      "Half-session option for late-stage polish",
    ],
    metrics: { rating: "5.0", reviews: "27", trial: "$52", next: "Fri 09:30" },
  },
];

const PRESSURE_POINTS = [
  { label: "PT selection", tone: "warm" },
  { label: "Second knowledge question", tone: "default" },
  { label: "Real-world object choice", tone: "default" },
  { label: "Rubric criterion A", tone: "default" },
  { label: "First-draft rescue", tone: "warm" },
  { label: "Examiner feedback gap", tone: "default" },
  { label: "Two weeks to submission", tone: "warm" },
  { label: "Comparative AOK move", tone: "default" },
  { label: "TOK exhibition crossover", tone: "default" },
];

const FIVE_QUESTIONS = [
  {
    label: "01 · What",
    title: "TOK essay support, end to end.",
    body: "From prescribed-title selection through the second knowledge question, real-world object, comparative AOK move, and a final draft sized to the 1,600-word ceiling.",
  },
  {
    label: "02 · Who it's for",
    title: "DP1 picking a PT, DP2 in the draft window.",
    body: "Most students arrive at one of two moments: the week the May or November PTs are released, or the week after their teacher returns first-draft feedback that doesn't make sense.",
  },
  {
    label: "03 · When it matters",
    title: "Two windows, one rescue.",
    body: "Window one: PT released, four weeks of unstructured planning ahead. Window two: ten to fourteen days before submission, draft is back, teacher comments are not landing.",
  },
  {
    label: "04 · Who fits",
    title: "TOK-trained, not 'philosophy in general.'",
    body: "Tutors who teach the rubric, not the discipline. Examiners and moderators where possible. Comfortable saying 'this PT is the wrong one for you' on the first call.",
  },
  {
    label: "05 · What's next",
    title: "Match call, trial, plan.",
    body: "A 20-minute match call to read your draft or PT shortlist, a 50-minute trial at the tutor's trial price, then a short plan: usually three to five sessions before the submission window closes.",
  },
];

const HOW_STEPS = [
  { n: "01", title: "Tell us the TOK pressure point", body: "PT shortlist, first draft, returned comments, or a deadline you're behind on. One paragraph is enough." },
  { n: "02", title: "Get three ranked tutors", body: "Each match comes with a written reason for fit, examiner status, recent TOK results, and a real next-week slot." },
  { n: "03", title: "Book a 50-min trial", body: "Trial prices are visible up front. The tutor reads your PT or draft before the session." },
  { n: "04", title: "Re-match free if it isn't right", body: "If the first session doesn't land, a second match is free. The active need stays attached to your account." },
];

const FAQ = [
  {
    q: "How is this different from my TOK teacher's feedback?",
    a: "Your teacher is graded on your cohort's average, so their comments are usually broad and rubric-coded. A Mentor IB TOK tutor reads your specific draft against the criterion descriptors and tells you, in writing, which criterion is currently capping your mark and what the lowest-effort change is.",
  },
  {
    q: "Will the tutor write part of my essay?",
    a: "No. Mentor IB tutors do not write, paraphrase, or rewrite essay content. They mark up structure, ask you the missing knowledge question, and pressure-test your real-world object choice. Your submission stays your work.",
  },
  {
    q: "Will my tutor know the current prescribed titles?",
    a: "Yes. TOK tutors on Mentor IB read each new PT release within 48 hours and the platform retires PT-specific reasoning when the IB rotates titles. Match cards mention which PT a tutor has the strongest read on.",
  },
  {
    q: "I've already submitted a draft to Turnitin. Can a tutor still help?",
    a: "Yes, this is the most common moment students reach out. Tutors work from your submitted draft, your teacher's comments, and the criterion descriptors. The plan is usually two sessions: one to diagnose, one to rebuild the weak section.",
  },
];

const RELATED_SUBJECTS = [
  { slug: "english-a-lang-and-lit", label: "English A: Lang & Lit", note: "Often the pair when the PT touches language." },
  { slug: "history-hl", label: "History HL", note: "AOK History is the most-picked second AOK." },
  { slug: "philosophy-hl", label: "Philosophy HL", note: "For PTs leaning epistemology or ethics." },
  { slug: "biology-hl", label: "Biology HL", note: "Strong AOK Natural Sciences pairing." },
];

const RELATED_SERVICES = [
  { slug: "tok-exhibition-help", label: "TOK exhibition help" },
  { slug: "ee-planning", label: "Extended essay planning" },
  { slug: "ia-feedback-english", label: "English A IA feedback" },
  { slug: "hl-exam-rescue", label: "HL exam rescue" },
];

window.TOK_TWEAKS_DEFAULTS = TOK_TWEAKS_DEFAULTS;
window.TOK_DATA = { TUTORS, PRESSURE_POINTS, FIVE_QUESTIONS, HOW_STEPS, FAQ, RELATED_SUBJECTS, RELATED_SERVICES };
