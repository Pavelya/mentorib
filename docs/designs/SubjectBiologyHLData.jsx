// Mentor IB — /subjects/biology-hl data
// Subject SEO landing page. Subject-led, pairs to services for curated combos.

const BIO_TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "italicWord": "land",
  "showStrandRail": true,
  "tutorCount": 3,
  "primaryCta": "Match me with a Biology HL tutor"
}/*EDITMODE-END*/;

const BIO_TUTORS = [
  {
    initials: "PN",
    name: "Dr. Priya Nair",
    descriptor: "Biology HL examiner · 10 years",
    badges: ["Reviewed", "HL examiner", "IA specialist"],
    fit: "Best for IA recovery in the 4 weeks before submission.",
    bullets: [
      "Marked ~400 HL Biology IAs across May 2024–25",
      "Strongest on personal engagement + analysis criteria",
      "Half-session option for late-stage polish",
    ],
    metrics: { rating: "4.9", reviews: "58", trial: "$48", next: "Wed 19:00" },
  },
  {
    initials: "TO",
    name: "Tomás Oliveira",
    descriptor: "Biology HL + Chemistry · 7 years",
    badges: ["Reviewed", "Top match"],
    fit: "Pairs Biology HL with Chemistry — the most common HL combo.",
    bullets: [
      "Targets Paper 2 long-response and data analysis",
      "Builds revision schedules at 60-day and 14-day horizons",
      "Available for full mock-exam debriefs",
    ],
    metrics: { rating: "4.8", reviews: "41", trial: "$44", next: "Thu 17:30" },
  },
  {
    initials: "RA",
    name: "Dr. Rohan Asante",
    descriptor: "Genetics PhD · MYP→DP bridge",
    badges: ["Reviewed", "Native English"],
    fit: "Best for DP1 students who are behind on the genetics unit.",
    bullets: [
      "Covers gene expression and biotech in plain language",
      "Comfortable with students moving from MYP biology",
      "Uses past-paper questions from session one",
    ],
    metrics: { rating: "5.0", reviews: "29", trial: "$52", next: "Fri 10:00" },
  },
];

const BIO_STRANDS = [
  { code: "A", name: "Unity & diversity", weight: "Cells, viruses, evolution", coverage: "23 tutors" },
  { code: "B", name: "Form & function", weight: "Membranes, gas exchange, transport", coverage: "21 tutors" },
  { code: "C", name: "Interaction & interdependence", weight: "Neurons, hormones, ecosystems", coverage: "18 tutors" },
  { code: "D", name: "Continuity & change", weight: "Genetics, biotech, populations", coverage: "20 tutors" },
];

const BIO_PRESSURE = [
  { label: "IA topic stuck", tone: "warm" },
  { label: "Paper 2 long-response", tone: "default" },
  { label: "Data-analysis question", tone: "default" },
  { label: "Genetics unit behind", tone: "warm" },
  { label: "60-day revision plan", tone: "default" },
  { label: "Lab safety scaffold", tone: "default" },
  { label: "Statistical test choice", tone: "default" },
  { label: "Mock came back at 4", tone: "warm" },
];

const BIO_FIVE = [
  {
    label: "01 · What",
    title: "Biology HL support, end to end.",
    body: "From syllabus strands A–D through IA scaffolding, lab statistical analysis, Paper 1/2/3 strategy, and a personalised revision plan sized to whichever exam window you're in.",
  },
  {
    label: "02 · Who it's for",
    title: "DP1 students settling into HL, DP2 in IA or revision.",
    body: "Most students arrive at three moments: the start of HL, four weeks before IA submission, or sixty days before a written exam window when the mock score didn't land where they wanted.",
  },
  {
    label: "03 · When it matters",
    title: "Three windows, one plan.",
    body: "Window one: HL onboarding and the genetics unit. Window two: IA topic, methodology, and analysis criterion. Window three: written paper rescue when content recall is fine but technique isn't.",
  },
  {
    label: "04 · Who fits",
    title: "Biology-trained HL tutors, often examiners.",
    body: "Tutors who teach HL Biology specifically — not 'a science background.' Many are current or former IB examiners. All know the May 2024 syllabus refresh and the new strand structure.",
  },
  {
    label: "05 · What's next",
    title: "Tell us the strand, the IA, or the exam window.",
    body: "A 20-minute match call to read your IA draft or last mock paper, a 50-minute trial at the tutor's trial price, then a short plan: usually four to eight sessions before the deadline.",
  },
];

const BIO_RELATED_SERVICES = [
  { slug: "ia-feedback-biology", label: "Biology IA feedback", note: "Most common entry. Two-session diagnose-then-rebuild." },
  { slug: "hl-exam-rescue", label: "HL exam rescue", note: "Sixty-day plan when the mock came back at 4." },
  { slug: "tok-essay-help", label: "TOK essay help", note: "Often the AOK Natural Sciences pairing." },
  { slug: "ee-planning", label: "Extended essay planning", note: "Biology EE supervisors are scarce — start early." },
];

const BIO_RELATED_SUBJECTS = [
  { slug: "chemistry-hl", label: "Chemistry HL", note: "The most common HL pairing." },
  { slug: "math-aa-hl", label: "Math AA HL", note: "Stats unit underpins the IA analysis criterion." },
  { slug: "psychology-hl", label: "Psychology HL", note: "Common HL3 for life-sciences-track students." },
  { slug: "ess-sl", label: "ESS SL", note: "If you're balancing Group 4 between two subjects." },
];

const BIO_FAQ = [
  {
    q: "My IA topic was rejected. Can a tutor help me find a new one?",
    a: "Yes. The first session is usually a 20-minute conversation about what you've already tried, plus a quick read of your teacher's comments on the rejected proposal. Tutors come with three or four topic shapes that have worked at HL recently and that fit the time you have left.",
  },
  {
    q: "Is the new May 2025 syllabus reflected here?",
    a: "Yes. Every Biology HL tutor on Mentor IB has been re-onboarded against the strand A–D structure introduced for first assessment in 2025. Match cards mention which strand a tutor has the strongest read on.",
  },
  {
    q: "Will a tutor write code or run statistics for my IA?",
    a: "No. Tutors do not run your statistical tests for you. They can teach you to choose the right test, interpret the output, and write the analysis criterion to the rubric — but the work and the results stay yours.",
  },
  {
    q: "How quickly can someone read my IA draft?",
    a: "Most match cards include a 'reads draft before trial' badge. The tutor receives your PDF when you book and comes to the trial having read it once and having marked up the criterion that's currently capping your score.",
  },
];

window.BIO_TWEAKS_DEFAULTS = BIO_TWEAKS_DEFAULTS;
window.BIO_DATA = { TUTORS: BIO_TUTORS, STRANDS: BIO_STRANDS, PRESSURE: BIO_PRESSURE, FIVE: BIO_FIVE, RELATED_SERVICES: BIO_RELATED_SERVICES, RELATED_SUBJECTS: BIO_RELATED_SUBJECTS, FAQ: BIO_FAQ };
