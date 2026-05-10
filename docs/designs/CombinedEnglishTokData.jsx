// Mentor IB — /subjects/english-a-lang-and-lit/tok-essay-help (curated combo)
// The acceptance criteria require the combo template to be a curated few — this
// is the shape they take.

const COMBO_TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "italicWord": "land",
  "tutorCount": 3,
  "showWhyCurated": true,
  "primaryCta": "Match me with an English A + TOK tutor"
}/*EDITMODE-END*/;

const COMBO_TUTORS = [
  {
    initials: "EH",
    name: "Eleanor Halberg",
    descriptor: "English A examiner · TOK lead",
    badges: ["Reviewed", "Curated combo", "Examiner"],
    fit: "Most-requested fit when the PT touches language as an AOK.",
    bullets: [
      "Teaches English A Paper 1 + TOK essay in one weekly slot",
      "Has marked May 2024 PT 4 essays specifically",
      "Walks the comparative AOK move using English A texts",
    ],
    metrics: { rating: "4.9", reviews: "37", trial: "$54", next: "Wed 18:00" },
  },
  {
    initials: "DS",
    name: "Dr. Daniyal Saeed",
    descriptor: "English A + Philosophy · 9 years",
    badges: ["Reviewed", "Top match"],
    fit: "Best when your PT leans on language and the second AOK is human sciences.",
    bullets: [
      "Comfortable with both DP1 onboarding and DP2 rescue",
      "Strongest on PTs 1, 4, and 6 (epistemology-leaning)",
      "Reads draft + IO recording before the trial",
    ],
    metrics: { rating: "4.8", reviews: "29", trial: "$50", next: "Thu 17:00" },
  },
  {
    initials: "MA",
    name: "Mara Aoyama",
    descriptor: "English A IB lead · 6 years",
    badges: ["Reviewed", "Native English"],
    fit: "Strongest combo for the IO–TOK essay overlap weeks.",
    bullets: [
      "Coaches the global-issue thread that travels into TOK",
      "Half-session option for TOK exhibition crossover",
      "Comfortable taking on a 10-day rescue plan",
    ],
    metrics: { rating: "4.9", reviews: "24", trial: "$48", next: "Fri 09:00" },
  },
];

const COMBO_FAQ = [
  {
    q: "Is this really one tutor or two?",
    a: "One tutor. The point of a curated combination page is that we only publish it when there is real coverage of tutors who teach both English A: Lang & Lit and TOK essay craft inside a single 50-minute session. If we couldn't staff it, we wouldn't publish it.",
  },
  {
    q: "Why this specific combination?",
    a: "Because it's the highest-traffic real-world overlap. Students preparing the IO often choose a global issue that maps directly onto a prescribed title, and a tutor who can hold both contexts in the same session saves a re-teach.",
  },
  {
    q: "Will the tutor follow my school's English A reading list?",
    a: "Yes. Match cards include the works your tutor has taught most recently, and you can filter to a specific text. If your school is teaching a less-common pairing, the match call surfaces tutors who have taught it within the last two academic years.",
  },
];

window.COMBO_TWEAKS_DEFAULTS = COMBO_TWEAKS_DEFAULTS;
window.COMBO_DATA = { TUTORS: COMBO_TUTORS, FAQ: COMBO_FAQ };
