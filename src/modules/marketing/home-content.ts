import type { Route } from "next";

import type { ChipTone } from "@/components/ui";
import type { MatchResultCardDto } from "@/modules/lessons/match-results";

export type HomePressurePoint = {
  label: string;
  tone: ChipTone;
};

export type HomeTrustProofItem = {
  body: string;
  title: string;
};

export const pressurePoints: readonly HomePressurePoint[] = [
  { label: "IA feedback", tone: "positive" },
  { label: "TOK essay", tone: "default" },
  { label: "IO practice", tone: "default" },
  { label: "EE planning", tone: "default" },
  { label: "HL exam rescue", tone: "destructive" },
  { label: "Weekly support", tone: "trust" },
] as const;

export const matchingSteps: readonly string[] = [
  "Name the IB pressure point that needs attention now.",
  "Review ranked tutor fits with clear reasons and availability overlap.",
  "Move into booking, messages, and lessons with the context still attached.",
] as const;

export const reassurancePoints: readonly string[] = [
  "IB-specific tutors and scenario-led fit language",
  "Visible trust proof before a profile deep dive",
  "Timezone-aware booking and shared message continuity",
] as const;

export const trustProof: readonly HomeTrustProofItem[] = [
  {
    body: "Tutors are framed by the exact scenarios they solve, not generic subject labels alone.",
    title: "IB-specific context",
  },
  {
    body: "Students can see why a tutor was surfaced before committing time to a profile.",
    title: "Visible fit reasoning",
  },
  {
    body: "Booking, lessons, and messages preserve one shared context instead of splitting the journey.",
    title: "Safe continuity",
  },
] as const;

export const sampleMatches: readonly MatchResultCardDto[] = [
  {
    availabilitySignal: "Next slot · Wed 18:30",
    bookingHref: "/match" as Route,
    candidateId: "sample-ivan-m",
    compareHref: "/compare" as Route,
    confidenceLabel: "Best fit",
    fitReasons: [
      "Strong written feedback language for English A HL and commentary planning.",
      "Open evening overlap for Europe and Middle East timezones this week.",
    ],
    fitSummary: "Best for students who need fast, clear IA structure feedback.",
    profileHref: "/tutors/ivan-m" as Route,
    rankPosition: 1,
    state: "high_confidence_match",
    trustSignals: ["42 reviews", "4.9 rating · verified credentials"],
    tutor: {
      acceptingNewStudents: true,
      displayName: "Ivan M.",
      headline: "English A, TOK, EE guidance",
      languages: [],
      pricingSummary: "Trial · $48",
      timezone: null,
    },
  },
  {
    availabilitySignal: "Availability · Thu 16:00",
    bookingHref: "/match" as Route,
    candidateId: "sample-alicia-r",
    compareHref: "/compare" as Route,
    confidenceLabel: "Structured thinker",
    fitReasons: [
      "Good for students who need a calm TOK or oral-practice plan.",
      "Strong review proof for turning vague drafts into next steps.",
    ],
    fitSummary: "Best for students who need structured thinking and calm explanation.",
    profileHref: "/tutors/alicia-r" as Route,
    rankPosition: 2,
    state: "default",
    trustSignals: ["4.8 rating · strong review proof"],
    tutor: {
      acceptingNewStudents: true,
      displayName: "Alicia R.",
      headline: "TOK essay, oral prep, weekly support",
      languages: [],
      pricingSummary: "Lesson · $52",
      timezone: null,
    },
  },
] as const;
