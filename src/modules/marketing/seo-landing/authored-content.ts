// Authored, IB-specific copy for the curated SEO landing pages introduced in
// `P15-SEO-001`. Token-swapped templates are forbidden by the task scope, so
// each entry below is hand-written for the named slug and has its own answers
// to "what / who / when / fit / next" plus its own FAQ.
//
// Slugs are sourced from `subjects.slug` and `subject_focus_areas.slug`. Pages
// are only published when an authored entry exists AND the publish gate passes;
// any slug missing from these registries returns 404 and is excluded from the
// sitemap.

export type SeoFiveQuestionAnswer = {
  body: string;
  label: "What this is" | "Who it's for" | "When it matters" | "Who fits" | "What's next";
  title: string;
};

export type SeoFaqEntry = {
  answer: string;
  question: string;
};

type SeoLandingCopyBase = {
  eyebrow: string;
  fiveAnswers: readonly SeoFiveQuestionAnswer[];
  faq: readonly SeoFaqEntry[];
  finalCta: {
    body: string;
    title: string;
  };
  heroIntro: string;
  heroTitle: string;
  metaDescription: string;
  metaTitle: string;
  pressurePoints: readonly string[];
  ranker: {
    listHeading: string;
    listIntro: string;
  };
};

export type SeoSubjectCopy = SeoLandingCopyBase & {
  kind: "subject";
  subjectSlug: string;
};

export type SeoServiceCopy = SeoLandingCopyBase & {
  kind: "service";
  needSlug: string;
};

export type SeoComboCopy = SeoLandingCopyBase & {
  kind: "combo";
  needSlug: string;
  rationale: {
    body: string;
    pillars: readonly { body: string; title: string }[];
    title: string;
  };
  subjectSlug: string;
};

const subjectCopy: SeoSubjectCopy[] = [
  {
    kind: "subject",
    subjectSlug: "biology",
    eyebrow: "Subject · Biology · Group 4",
    heroTitle: "IB Biology tutors who help your IA land and your strands click.",
    heroIntro:
      "Match-first IB Biology support for the moments that actually break students: a stuck IA hypothesis, a strand that never sat right, and the 60-day window before written exams.",
    metaTitle: "IB Biology Tutors for IA, Strand Coverage, and Exam Prep | Mentor IB",
    metaDescription:
      "Mentor IB matches you with IB Biology tutors who can read your IA draft, unblock the strand you skipped in class, and rebuild a Paper 2 plan in time.",
    pressurePoints: [
      "IA topic just got rejected",
      "Mock came back at a 4",
      "Genetics unit fog",
      "Paper 2 long-response panic",
    ],
    fiveAnswers: [
      {
        label: "What this is",
        title: "An IB Biology tutor, picked for the part you're stuck on.",
        body:
          "Mentor IB pairs you with a Biology tutor who has actually taught the SL or HL syllabus and can work in the order your problem demands — not in the order a textbook lists.",
      },
      {
        label: "Who it's for",
        title: "Students who can't afford another vague \"more practice\" plan.",
        body:
          "DP1 and DP2 students whose IA got rejected, whose strand confidence is uneven, or who have a mock-paper gap and a deadline. Parents who want a tutor that names the problem out loud.",
      },
      {
        label: "When it matters",
        title: "When a generic \"Biology tutor\" is not the right answer.",
        body:
          "Use this when your problem is specific: a flawed IA hypothesis, a missing strand, a Paper 2 LRQ pattern that keeps costing you marks. A subject-only label hides the diagnosis.",
      },
      {
        label: "Who fits",
        title: "Tutors who can teach the strand and read the rubric.",
        body:
          "We surface tutors who teach the syllabus content, mark to the IB criteria, and can move between IA feedback, strand teaching, and exam-style coaching in the same hour.",
      },
      {
        label: "What's next",
        title: "Start a match, not a bidding war.",
        body:
          "Tell Mentor IB the strand or paper that's hurting. We come back with three Biology tutors, written fit reasoning, and a real next-week trial slot.",
      },
    ],
    faq: [
      {
        question: "Can a tutor help me rewrite my IA hypothesis this week?",
        answer:
          "Yes — our IA-aware Biology tutors will read your current draft before the trial and bring a rebuilt hypothesis question, an honest read on the data plan, and the next two changes that will move it.",
      },
      {
        question: "I'm SL, not HL. Are these tutors still right for me?",
        answer:
          "Both. The Biology tutors here teach SL and HL students. Match results scope to the level you select, and the trial focuses on the paper or strand you flag in the wizard.",
      },
      {
        question: "What if my mock score is far below where I need to be?",
        answer:
          "We pair exam-prep specialists who target Paper 1 / Paper 2 LRQ patterns rather than running through every chapter again. The trial focuses on the gap that's costing you the most marks.",
      },
      {
        question: "How is pricing shown?",
        answer:
          "Each tutor card lists their own trial price and hourly rate, and the hero summary shows the live range across the Biology tutors who are accepting students this week.",
      },
    ],
    finalCta: {
      title: "Tell us the strand. We'll bring Biology tutors who can actually teach it.",
      body:
        "Match in twenty minutes, trial in 48 hours, plan after the trial. No subscription, no waiting list.",
    },
    ranker: {
      listHeading: "Biology tutors accepting new students this week.",
      listIntro:
        "Three Biology tutors selected from the live, accepting roster — ranked by examiner credentials, depth of subject coverage, and how recently their public listing was reviewed. Personalised match results live inside the matching flow.",
    },
  },
];

const serviceCopy: SeoServiceCopy[] = [
  {
    kind: "service",
    needSlug: "tok-essay",
    eyebrow: "Service · TOK essay help · IB Diploma Programme",
    heroTitle: "From a stuck PT to a TOK essay you can actually defend.",
    heroIntro:
      "When the prescribed title isn't landing, an IB-trained TOK tutor sits with you for a 50-minute session and works through the second knowledge question, the right real-world object, and the structure examiners actually reward.",
    metaTitle: "IB Tutors for TOK Essay Help | Mentor IB",
    metaDescription:
      "Mentor IB matches you with IB-trained TOK tutors who can unstick a prescribed title, read your draft, and help you rebuild the AOK structure before the deadline.",
    pressurePoints: [
      "My PT just got rejected",
      "I have 12 days",
      "Draft 1 came back red",
      "I can't pick between PT 3 and PT 5",
    ],
    fiveAnswers: [
      {
        label: "What this is",
        title: "TOK essay coaching with a tutor who has marked TOK essays.",
        body:
          "A focused, one-to-one TOK session: read the draft, name the missing knowledge question, find the second AOK example, and rebuild the structure. Not a generic \"writing tutor\".",
      },
      {
        label: "Who it's for",
        title: "Students whose prescribed title isn't moving.",
        body:
          "DP2 students who can't choose between two PTs, who got Draft 1 back red, or whose teacher said \"more depth\" without saying where. Also parents who don't want another vague essay tutor.",
      },
      {
        label: "When it matters",
        title: "Use this when the deadline is real.",
        body:
          "Use TOK essay help in the window from PT release to final upload. The earlier the better, but a focused trial in the last two weeks still moves the structure and the second example.",
      },
      {
        label: "Who fits",
        title: "TOK-trained tutors, ideally with examiner exposure.",
        body:
          "We surface tutors who can read a TOK draft against the rubric, name the AOK move that the essay is missing, and give written feedback you can act on between sessions.",
      },
      {
        label: "What's next",
        title: "Send the draft. Get matched. Start writing.",
        body:
          "Tell Mentor IB which PT you picked and what you've drafted. We come back with three TOK tutors, written fit reasoning, and a next-week slot to talk through the rebuild.",
      },
    ],
    faq: [
      {
        question: "Can a tutor read my full draft before the trial?",
        answer:
          "Yes — the TOK tutors on Mentor IB will read your draft before the trial and bring written reactions plus the structural change they would make first.",
      },
      {
        question: "What if I haven't chosen a PT yet?",
        answer:
          "That's a normal trial outcome. The session walks through the PTs that fit your strongest AOK, eliminates the ones that won't sustain a 1,600-word essay, and leaves you with one defensible choice.",
      },
      {
        question: "How is this different from a regular essay tutor?",
        answer:
          "TOK isn't a writing problem; it's a knowledge-question-and-AOK problem. The tutors here teach to the IB TOK rubric, not to a general essay rubric.",
      },
      {
        question: "Is this a subscription?",
        answer:
          "No. You book a trial, then a plan only if it makes sense. Re-matching is free if the trial doesn't fit.",
      },
    ],
    finalCta: {
      title: "Stop staring at the PT list. Get matched in twenty minutes.",
      body:
        "Tell us where the TOK essay is sticking. We'll come back with three tutors, written fit reasoning, and a real next-week slot.",
    },
    ranker: {
      listHeading: "TOK tutors accepting new students this week.",
      listIntro:
        "Three TOK tutors from the live, accepting roster — ranked by examiner credentials, depth of TOK-essay coverage, and recency of public listing review. Personalised match results live inside the matching flow.",
    },
  },
];

const comboCopy: SeoComboCopy[] = [
  {
    kind: "combo",
    subjectSlug: "english-a",
    needSlug: "tok-essay",
    eyebrow: "Curated combination · Subject × Service",
    heroTitle: "English A texts that hold up when the TOK PT is about language.",
    heroIntro:
      "When the prescribed title leans on language, comparison, or interpretation, the right tutor can hold both halves — your English A texts and the TOK rubric — in one session.",
    metaTitle: "IB English A Tutors for TOK Essay Help | Mentor IB",
    metaDescription:
      "Mentor IB pairs you with tutors who teach IB English A and coach the TOK essay so language-led prescribed titles get the right texts, AOK moves, and structure.",
    pressurePoints: [
      "PT about language",
      "IO global issue → TOK",
      "Comparative AOK move",
      "Two-week rescue",
    ],
    fiveAnswers: [
      {
        label: "What this is",
        title: "English A and TOK essay coaching from one tutor.",
        body:
          "A curated session for students whose TOK PT depends on a language-led example or whose English A interpretation lines up with their TOK AOK choice. One tutor, one rubric set, one plan.",
      },
      {
        label: "Who it's for",
        title: "DP students whose TOK and English A overlap.",
        body:
          "Students working on a TOK PT in the language-and-knowledge area, or whose IO global issue is the same texture as their TOK essay. Also students whose English A teacher and TOK teacher are giving conflicting structural advice.",
      },
      {
        label: "When it matters",
        title: "Use it when both halves are due in the same window.",
        body:
          "The combination saves time when the IO and the TOK essay are both live, or when an English A text is going to anchor a TOK example. Otherwise the parent subject or service page is enough.",
      },
      {
        label: "Who fits",
        title: "Tutors who teach English A and have read TOK essays.",
        body:
          "We surface tutors who teach the English A: Lang and Lit syllabus and have actually graded or marked TOK essays — not generalists who happen to have done the IB.",
      },
      {
        label: "What's next",
        title: "Match once. Cover both halves.",
        body:
          "Tell Mentor IB which PT and which texts. We come back with three tutors who teach both, written fit reasoning, and a next-week trial slot.",
      },
    ],
    faq: [
      {
        question: "Why isn't every English A tutor on this page?",
        answer:
          "We only show tutors who teach English A and can actually coach the TOK essay rubric. The combination is published only when there are at least three of them accepting students.",
      },
      {
        question: "Can the trial cover the IO and the TOK essay together?",
        answer:
          "Yes — the tutors here will use the trial to map your IO global issue against the TOK PT and decide which texts and AOKs carry across.",
      },
      {
        question: "Is the combo more expensive than the parent pages?",
        answer:
          "No. Each tutor sets their own price. The hero range shows the live trial-price range across the tutors qualified for both halves.",
      },
      {
        question: "What if I only need TOK help, not English A?",
        answer:
          "Then the parent service page (TOK essay help) is the better entry point. We don't push the combo when the parent matches the actual need.",
      },
    ],
    finalCta: {
      title: "One tutor. Both halves. One real next-week slot.",
      body:
        "Tell us the PT and the texts. We'll come back with three tutors who teach English A and coach the TOK essay.",
    },
    ranker: {
      listHeading: "Tutors qualified for both halves, accepting now.",
      listIntro:
        "Three tutors from the live English A and TOK roster, ranked by examiner credentials, depth of subject coverage, and recency of public listing review.",
    },
    rationale: {
      title: "Mentor IB only publishes a combination page when it can actually staff it.",
      body:
        "Most \"subject × need\" pages on the internet are SEO bait — auto-generated, no real tutor coverage. We do the opposite. We publish the combination only when these conditions are met, and we retire the page when any of them stop being true.",
      pillars: [
        {
          title: "Tutor coverage",
          body:
            "At least three active English A tutors who can also coach the TOK essay, with public listings approved and accepting new students.",
        },
        {
          title: "Content quality",
          body:
            "Unique, useful copy written for this specific overlap — not the same boilerplate scaled across hundreds of slugs.",
        },
        {
          title: "Real-world demand",
          body:
            "A demonstrated search and referral pattern from inside the product. We watch the combination for two cycles before publishing.",
        },
      ],
    },
  },
];

const subjectCopyBySlug = new Map(
  subjectCopy.map((entry) => [entry.subjectSlug, entry] as const),
);
const serviceCopyBySlug = new Map(
  serviceCopy.map((entry) => [entry.needSlug, entry] as const),
);
const comboCopyByPair = new Map(
  comboCopy.map(
    (entry) => [`${entry.subjectSlug}::${entry.needSlug}`, entry] as const,
  ),
);

export function getAuthoredSubjectCopy(slug: string) {
  return subjectCopyBySlug.get(slug) ?? null;
}

export function getAuthoredServiceCopy(slug: string) {
  return serviceCopyBySlug.get(slug) ?? null;
}

export function getAuthoredComboCopy(subjectSlug: string, needSlug: string) {
  return comboCopyByPair.get(`${subjectSlug}::${needSlug}`) ?? null;
}

export function listAuthoredSubjectSlugs() {
  return Array.from(subjectCopyBySlug.keys());
}

export function listAuthoredServiceSlugs() {
  return Array.from(serviceCopyBySlug.keys());
}

export function listAuthoredComboPairs() {
  return comboCopy.map(
    (entry) => ({ needSlug: entry.needSlug, subjectSlug: entry.subjectSlug }) as const,
  );
}
