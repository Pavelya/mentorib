import { resolveTimezone } from "@/lib/datetime";
import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { getMatchOptionLabel } from "@/modules/lessons/match-flow-options";

type StudentProfileRecord = {
  id: string;
};

type LearningNeedRecord = {
  id: string;
  language_code: string;
  need_status: string;
  need_type: string;
  session_frequency_intent: string | null;
  subject_focus_area_id: string;
  subject_id: string;
  submitted_at: string | null;
  support_style: string | null;
  timezone: string;
  urgency_level: string;
};

type MatchRunRecord = {
  candidate_count: number;
  completed_at: string | null;
  created_at: string;
  failed_at: string | null;
  id: string;
  run_status: "completed" | "expired" | "failed" | "queued" | "running";
};

type MatchCandidateRecord = {
  availability_signal: string | null;
  best_for_summary: string | null;
  candidate_state: string;
  confidence_label: string | null;
  fit_summary: string | null;
  id: string;
  rank_position: number;
  trust_signal_snapshot: Record<string, unknown>;
  tutor_profile_id: string;
};

type TutorProfileRecord = {
  application_status: string;
  best_for_summary: string | null;
  display_name: string | null;
  headline: string | null;
  id: string;
  pricing_summary: string | null;
  profile_visibility_status: string;
  public_listing_status: string;
  public_slug: string | null;
};

type TutorLanguageCapabilityRecord = {
  language_code: string;
  tutor_profile_id: string;
};

type SchedulePolicyRecord = {
  is_accepting_new_students: boolean;
  timezone: string;
  tutor_profile_id: string;
};

type TutorSubjectCapabilityRecord = {
  experience_summary: string | null;
  subject_focus_area_id: string;
  subject_id: string;
  tutor_profile_id: string;
};

type SubjectRecord = {
  display_name: string;
  id: string;
};

type FocusAreaRecord = {
  display_name: string;
  id: string;
};

type LanguageRecord = {
  display_name: string;
  language_code: string;
};

export type MatchResultsState = "empty" | "failed" | "preview" | "queued" | "ready";

export type MatchResultCardDto = {
  availabilitySignal: string | null;
  bookingHref: string | null;
  candidateId: string;
  compareHref: string;
  confidenceLabel: string | null;
  fitReasons: string[];
  fitSummary: string;
  profileHref: string | null;
  rankPosition: number;
  state: "default" | "high_confidence_match" | "limited_availability";
  tutor: {
    acceptingNewStudents: boolean;
    displayName: string;
    headline: string | null;
    languages: string[];
    pricingSummary: string | null;
    timezone: string | null;
  };
  trustSignals: string[];
};

export type MatchResultsNeedDto = {
  headline: string;
  id: string;
  note: string | null;
  qualifiers: Array<{
    label: string;
    priority?: "default" | "support";
  }>;
  status: string;
  submittedAt: string | null;
  timezone: string;
};

export type MatchResultsPageDto = {
  currentNeed: MatchResultsNeedDto | null;
  matches: MatchResultCardDto[];
  run: {
    candidateCount: number;
    completedAt: string | null;
    createdAt: string | null;
    failedAt: string | null;
    id: string | null;
    status: MatchRunRecord["run_status"] | null;
  };
  state: MatchResultsState;
};

export async function getStudentMatchResults(
  account: Pick<ResolvedAuthAccount, "id" | "timezone">,
): Promise<MatchResultsPageDto> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: studentProfile, error: studentProfileError } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("app_user_id", account.id)
    .maybeSingle<StudentProfileRecord>();

  if (studentProfileError) {
    throw new Error("Could not resolve the student profile for results.");
  }

  if (!studentProfile) {
    return buildEmptyResultsDto();
  }

  const { data: learningNeed, error: learningNeedError } = await supabase
    .from("learning_needs")
    .select(
      [
        "id",
        "need_status",
        "need_type",
        "subject_id",
        "subject_focus_area_id",
        "urgency_level",
        "support_style",
        "language_code",
        "timezone",
        "session_frequency_intent",
        "free_text_note",
        "submitted_at",
      ].join(", "),
    )
    .eq("student_profile_id", studentProfile.id)
    .in("need_status", ["active", "matched", "booked", "draft"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<LearningNeedRecord & { free_text_note: string | null }>();

  if (learningNeedError) {
    throw new Error("Could not load the current learning need.");
  }

  if (!learningNeed) {
    return buildEmptyResultsDto();
  }

  const [subject, focusArea, language, matchRun] = await Promise.all([
    loadSubjectById(learningNeed.subject_id),
    loadFocusAreaById(learningNeed.subject_focus_area_id),
    loadLanguageByCode(learningNeed.language_code),
    loadLatestMatchRun(learningNeed.id),
  ]);

  const currentNeed = buildCurrentNeedDto({
    focusArea,
    language,
    learningNeed,
    subject,
  });

  if (!matchRun) {
    return {
      currentNeed,
      matches: [],
      run: {
        candidateCount: 0,
        completedAt: null,
        createdAt: null,
        failedAt: null,
        id: null,
        status: null,
      },
      state: "queued",
    };
  }

  const candidateRows = await loadVisibleCandidates(matchRun.id);

  if (!candidateRows.length) {
    return {
      currentNeed,
      matches: [],
      run: {
        candidateCount: matchRun.candidate_count,
        completedAt: matchRun.completed_at,
        createdAt: matchRun.created_at,
        failedAt: matchRun.failed_at,
        id: matchRun.id,
        status: matchRun.run_status,
      },
      state: matchRun.run_status === "failed" ? "failed" : "queued",
    };
  }

  const tutorProfileIds = candidateRows.map((candidate) => candidate.tutor_profile_id);
  const [profiles, schedules, capabilityRows, languageCapabilities] = await Promise.all([
    loadTutorProfilesByIds(tutorProfileIds),
    loadSchedulePoliciesByTutorIds(tutorProfileIds),
    loadTutorCapabilitiesForNeed(tutorProfileIds, learningNeed.subject_id),
    loadTutorLanguageCapabilitiesByIds(tutorProfileIds),
  ]);

  const languageCodes = languageCapabilities.map((capability) => capability.language_code);
  const languageRows = await loadLanguagesByCodes(languageCodes);
  const cards = buildMatchCards({
    accountTimezone: resolveTimezone(account.timezone),
    candidateRows,
    capabilityRows,
    focusArea,
    languageRows,
    languageCapabilities,
    needLanguage: language,
    profiles,
    schedules,
    subject,
  });

  return {
    currentNeed,
    matches: cards,
    run: {
      candidateCount: matchRun.candidate_count,
      completedAt: matchRun.completed_at,
      createdAt: matchRun.created_at,
      failedAt: matchRun.failed_at,
      id: matchRun.id,
      status: matchRun.run_status,
    },
    state: "ready",
  };
}

export function buildPreviewMatchResultsDto(timezone: string): MatchResultsPageDto {
  const resolvedTimezone = resolveTimezone(timezone);

  return {
    currentNeed: {
      headline: "Biology HL · IA feedback",
      id: "preview-learning-need",
      note: "Needs clearer IA structure and a calmer plan before the next draft deadline.",
      qualifiers: [
        { label: "Internal assessment" },
        { label: "This week" },
        { label: "Calm structure" },
        { label: "Weekly rhythm" },
        { label: "English" },
        { label: resolvedTimezone, priority: "support" },
      ],
      status: "active",
      submittedAt: "2026-04-23T09:30:00.000Z",
      timezone: resolvedTimezone,
    },
    matches: [
      {
        availabilitySignal: "Available this week with strong evening overlap.",
        bookingHref: "/book/preview-match-1",
        candidateId: "preview-match-1",
        compareHref: "/compare",
        confidenceLabel: "High confidence",
        fitReasons: [
          "Subject fit: Biology HL and IA drafting.",
          "Supports English-first sessions with Europe-friendly timing.",
          "Profile reviewed with strong lesson continuity proof.",
        ],
        fitSummary:
          "Clear step-by-step IA planning for students who need feedback without last-minute panic.",
        profileHref: "/tutors/demo-maya-chen",
        rankPosition: 1,
        state: "high_confidence_match",
        tutor: {
          acceptingNewStudents: true,
          displayName: "Maya Chen",
          headline: "Biology HL tutor focused on Paper 2 and IA structure",
          languages: ["English", "Polish"],
          pricingSummary: "From $62 per lesson",
          timezone: "Europe/London",
        },
        trustSignals: ["Profile reviewed", "89 completed lessons"],
      },
      {
        availabilitySignal: "Good weekly overlap, but fewer near-term slots.",
        bookingHref: "/book/preview-match-2",
        candidateId: "preview-match-2",
        compareHref: "/compare",
        confidenceLabel: "Strong fit",
        fitReasons: [
          "Subject fit: Biology HL revision and IA milestones.",
          "Useful when you want direct feedback on what to change next.",
          "Supports English and Spanish lessons.",
        ],
        fitSummary:
          "Best for students who want sharper critique and a tutor who can rescue the next draft quickly.",
        profileHref: "/tutors/demo-lucia-navarro",
        rankPosition: 2,
        state: "default",
        tutor: {
          acceptingNewStudents: true,
          displayName: "Lucia Navarro",
          headline: "IB science tutor for structured revision bursts",
          languages: ["English", "Spanish"],
          pricingSummary: "From $58 per lesson",
          timezone: "Europe/Madrid",
        },
        trustSignals: ["Profile reviewed", "12 published reviews"],
      },
      {
        availabilitySignal: "Useful fit, but booking may take a little longer.",
        bookingHref: null,
        candidateId: "preview-match-3",
        compareHref: "/compare",
        confidenceLabel: "Relevant fallback",
        fitReasons: [
          "Subject fit: Biology HL support with a steady accountability style.",
          "Good timezone overlap for Warsaw evenings.",
          "Strong continuity signal, but limited booking capacity this week.",
        ],
        fitSummary:
          "Helpful if steady support matters more than immediate booking speed for the next milestone.",
        profileHref: "/tutors/demo-jonas-becker",
        rankPosition: 3,
        state: "limited_availability",
        tutor: {
          acceptingNewStudents: false,
          displayName: "Jonas Becker",
          headline: "Weekly IB planning and accountability support",
          languages: ["English", "German"],
          pricingSummary: "From $55 per lesson",
          timezone: "Europe/Berlin",
        },
        trustSignals: ["Profile reviewed", "41 completed lessons"],
      },
    ],
    run: {
      candidateCount: 3,
      completedAt: "2026-04-23T09:31:00.000Z",
      createdAt: "2026-04-23T09:30:00.000Z",
      failedAt: null,
      id: "preview-run",
      status: "completed",
    },
    state: "preview",
  };
}

async function loadLatestMatchRun(learningNeedId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("match_runs")
    .select("id, run_status, candidate_count, created_at, completed_at, failed_at")
    .eq("learning_need_id", learningNeedId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<MatchRunRecord>();

  if (error) {
    throw new Error("Could not load the latest match run.");
  }

  return data;
}

async function loadVisibleCandidates(matchRunId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("match_candidates")
    .select(
      [
        "id",
        "tutor_profile_id",
        "candidate_state",
        "rank_position",
        "confidence_label",
        "fit_summary",
        "best_for_summary",
        "availability_signal",
        "trust_signal_snapshot",
      ].join(", "),
    )
    .eq("match_run_id", matchRunId)
    .neq("candidate_state", "dismissed")
    .order("rank_position", { ascending: true })
    .returns<MatchCandidateRecord[]>();

  if (error) {
    throw new Error("Could not load match candidates.");
  }

  return data ?? [];
}

async function loadTutorProfilesByIds(tutorProfileIds: string[]) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      [
        "id",
        "display_name",
        "public_slug",
        "headline",
        "best_for_summary",
        "pricing_summary",
        "application_status",
        "profile_visibility_status",
        "public_listing_status",
      ].join(", "),
    )
    .in("id", tutorProfileIds)
    .returns<TutorProfileRecord[]>();

  if (error) {
    throw new Error("Could not load tutor match profiles.");
  }

  return data ?? [];
}

async function loadSchedulePoliciesByTutorIds(tutorProfileIds: string[]) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("schedule_policies")
    .select("tutor_profile_id, is_accepting_new_students, timezone")
    .in("tutor_profile_id", tutorProfileIds)
    .returns<SchedulePolicyRecord[]>();

  if (error) {
    throw new Error("Could not load tutor scheduling context.");
  }

  return data ?? [];
}

async function loadTutorCapabilitiesForNeed(
  tutorProfileIds: string[],
  subjectId: string,
) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_subject_capabilities")
    .select("tutor_profile_id, subject_id, subject_focus_area_id, experience_summary")
    .in("tutor_profile_id", tutorProfileIds)
    .eq("subject_id", subjectId)
    .returns<TutorSubjectCapabilityRecord[]>();

  if (error) {
    throw new Error("Could not load tutor capability summaries.");
  }

  return data ?? [];
}

async function loadTutorLanguageCapabilitiesByIds(tutorProfileIds: string[]) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_language_capabilities")
    .select("tutor_profile_id, language_code")
    .in("tutor_profile_id", tutorProfileIds)
    .order("display_priority", { ascending: true })
    .returns<TutorLanguageCapabilityRecord[]>();

  if (error) {
    throw new Error("Could not load tutor language capabilities.");
  }

  return data ?? [];
}

async function loadLanguagesByCodes(languageCodes: string[]) {
  if (!languageCodes.length) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("languages")
    .select("language_code, display_name")
    .in("language_code", Array.from(new Set(languageCodes)))
    .returns<LanguageRecord[]>();

  if (error) {
    throw new Error("Could not resolve language labels for match results.");
  }

  return data ?? [];
}

async function loadSubjectById(subjectId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, display_name")
    .eq("id", subjectId)
    .single<SubjectRecord>();

  if (error || !data) {
    throw new Error("Could not resolve the subject label for the learning need.");
  }

  return data;
}

async function loadFocusAreaById(focusAreaId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subject_focus_areas")
    .select("id, display_name")
    .eq("id", focusAreaId)
    .single<FocusAreaRecord>();

  if (error || !data) {
    throw new Error("Could not resolve the focus area label for the learning need.");
  }

  return data;
}

async function loadLanguageByCode(languageCode: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("languages")
    .select("language_code, display_name")
    .eq("language_code", languageCode)
    .single<LanguageRecord>();

  if (error || !data) {
    throw new Error("Could not resolve the learning-need language label.");
  }

  return data;
}

function buildCurrentNeedDto({
  focusArea,
  language,
  learningNeed,
  subject,
}: {
  focusArea: FocusAreaRecord;
  language: LanguageRecord;
  learningNeed: LearningNeedRecord & { free_text_note: string | null };
  subject: SubjectRecord;
}): MatchResultsNeedDto {
  const qualifiers: MatchResultsNeedDto["qualifiers"] = [
    { label: focusArea.display_name },
    { label: getMatchOptionLabel("urgencyLevel", learningNeed.urgency_level) },
  ];

  if (learningNeed.support_style) {
    qualifiers.push({
      label: getMatchOptionLabel("supportStyle", learningNeed.support_style),
    });
  }

  if (learningNeed.session_frequency_intent) {
    qualifiers.push({
      label: getMatchOptionLabel("sessionFrequencyIntent", learningNeed.session_frequency_intent),
    });
  }

  qualifiers.push({ label: language.display_name });
  qualifiers.push({ label: resolveTimezone(learningNeed.timezone), priority: "support" });

  return {
    headline: `${subject.display_name} · ${getMatchOptionLabel("needType", learningNeed.need_type)}`,
    id: learningNeed.id,
    note: normalizeText(learningNeed.free_text_note),
    qualifiers,
    status: learningNeed.need_status,
    submittedAt: learningNeed.submitted_at,
    timezone: resolveTimezone(learningNeed.timezone),
  };
}

function buildMatchCards({
  accountTimezone,
  candidateRows,
  capabilityRows,
  focusArea,
  languageCapabilities,
  languageRows,
  needLanguage,
  profiles,
  schedules,
  subject,
}: {
  accountTimezone: string;
  candidateRows: MatchCandidateRecord[];
  capabilityRows: TutorSubjectCapabilityRecord[];
  focusArea: FocusAreaRecord;
  languageCapabilities: TutorLanguageCapabilityRecord[];
  languageRows: LanguageRecord[];
  needLanguage: LanguageRecord;
  profiles: TutorProfileRecord[];
  schedules: SchedulePolicyRecord[];
  subject: SubjectRecord;
}) {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const schedulesByTutorId = new Map(
    schedules.map((schedule) => [schedule.tutor_profile_id, schedule]),
  );
  const capabilityByTutorId = new Map(
    capabilityRows.map((capability) => [capability.tutor_profile_id, capability]),
  );
  const languageNameByCode = new Map(
    languageRows.map((language) => [language.language_code, language.display_name]),
  );
  const languagesByTutorId = languageCapabilities.reduce<Map<string, string[]>>((accumulator, row) => {
    const label = languageNameByCode.get(row.language_code);

    if (!label) {
      return accumulator;
    }

    const existing = accumulator.get(row.tutor_profile_id) ?? [];
    accumulator.set(row.tutor_profile_id, [...existing, label]);
    return accumulator;
  }, new Map());

  return candidateRows
    .map((candidate) => {
      const profile = profilesById.get(candidate.tutor_profile_id);

      if (!profile?.display_name) {
        return null;
      }

      const schedule = schedulesByTutorId.get(candidate.tutor_profile_id) ?? null;
      const capability = capabilityByTutorId.get(candidate.tutor_profile_id) ?? null;
      const languages = languagesByTutorId.get(candidate.tutor_profile_id) ?? [];
      const acceptingNewStudents = schedule?.is_accepting_new_students ?? true;
      const profileHref = profile.public_slug ? `/tutors/${profile.public_slug}` : null;
      const bookingHref = acceptingNewStudents ? `/book/${candidate.id}` : null;
      const trustSignals = buildTrustSignals(candidate.trust_signal_snapshot, {
        capability,
        profile,
      });
      const fitSummary = buildFitSummary({
        candidate,
        capability,
        focusArea,
        needLanguage,
        subject,
      });
      const fitReasons = buildFitReasons({
        accountTimezone,
        availabilitySignal: candidate.availability_signal,
        capability,
        fitSummary,
        focusArea,
        languages,
        needLanguage,
        schedule,
        subject,
        trustSignals,
      });

      return {
        availabilitySignal: normalizeText(candidate.availability_signal),
        bookingHref,
        candidateId: candidate.id,
        compareHref: "/compare",
        confidenceLabel: humanizeLabel(candidate.confidence_label),
        fitReasons,
        fitSummary,
        profileHref,
        rankPosition: candidate.rank_position,
        state: buildCardState({
          acceptingNewStudents,
          confidenceLabel: candidate.confidence_label,
          rankPosition: candidate.rank_position,
        }),
        tutor: {
          acceptingNewStudents,
          displayName: profile.display_name,
          headline: normalizeText(profile.headline),
          languages,
          pricingSummary: normalizeText(profile.pricing_summary),
          timezone: schedule?.timezone ?? null,
        },
        trustSignals,
      } satisfies MatchResultCardDto;
    })
    .filter((card): card is MatchResultCardDto => Boolean(card));
}

function buildFitSummary({
  candidate,
  capability,
  focusArea,
  needLanguage,
  subject,
}: {
  candidate: MatchCandidateRecord;
  capability: TutorSubjectCapabilityRecord | null;
  focusArea: FocusAreaRecord;
  needLanguage: LanguageRecord;
  subject: SubjectRecord;
}) {
  return (
    normalizeText(candidate.fit_summary) ??
    normalizeText(candidate.best_for_summary) ??
    normalizeText(capability?.experience_summary) ??
    `Strong fit for ${subject.display_name} students who need ${focusArea.display_name.toLowerCase()} in ${needLanguage.display_name}.`
  );
}

function buildFitReasons({
  accountTimezone,
  availabilitySignal,
  capability,
  fitSummary,
  focusArea,
  languages,
  needLanguage,
  schedule,
  subject,
  trustSignals,
}: {
  accountTimezone: string;
  availabilitySignal: string | null;
  capability: TutorSubjectCapabilityRecord | null;
  fitSummary: string;
  focusArea: FocusAreaRecord;
  languages: string[];
  needLanguage: LanguageRecord;
  schedule: SchedulePolicyRecord | null;
  subject: SubjectRecord;
  trustSignals: string[];
}) {
  const reasons = [
    `Subject fit: ${subject.display_name} · ${focusArea.display_name}.`,
    normalizeReason(capability?.experience_summary, fitSummary),
    normalizeText(availabilitySignal),
    buildLanguageReason(languages, needLanguage.display_name),
    buildTimezoneReason(schedule?.timezone ?? null, accountTimezone),
    trustSignals[0] ?? null,
  ].filter((reason): reason is string => Boolean(reason));

  return Array.from(new Set(reasons)).slice(0, 3);
}

function buildLanguageReason(languages: string[], preferredLanguage: string) {
  if (!languages.length) {
    return null;
  }

  if (languages.includes(preferredLanguage)) {
    return `Language match: ${preferredLanguage}.`;
  }

  return `Languages: ${languages.join(", ")}.`;
}

function buildTimezoneReason(tutorTimezone: string | null, accountTimezone: string) {
  if (!tutorTimezone) {
    return null;
  }

  if (resolveTimezone(tutorTimezone) === accountTimezone) {
    return `Timezone overlap: same local timezone (${accountTimezone}).`;
  }

  return `Timezone context: ${resolveTimezone(tutorTimezone)} against your ${accountTimezone}.`;
}

function buildTrustSignals(
  snapshot: Record<string, unknown>,
  {
    capability,
    profile,
  }: {
    capability: TutorSubjectCapabilityRecord | null;
    profile: TutorProfileRecord;
  },
) {
  const signals: string[] = [];
  const rating = getNumberFromSnapshot(snapshot, [
    "public_rating",
    "rating",
    "rating_average",
    "rating_value",
    "smoothed_rating",
  ]);
  const reviewCount = getNumberFromSnapshot(snapshot, [
    "published_review_count",
    "review_count",
    "reviews_count",
  ]);
  const lessonCount = getNumberFromSnapshot(snapshot, [
    "completed_lessons",
    "completed_lessons_count",
    "lesson_count",
    "lessons_taught",
  ]);
  const approvedCredentialCount = getNumberFromSnapshot(snapshot, [
    "approved_credential_count",
    "verified_qualification_count",
  ]);
  const responsiveness = getStringFromSnapshot(snapshot, [
    "responsiveness_label",
    "response_speed_label",
    "responsiveness",
  ]);

  if (rating !== null && reviewCount !== null && reviewCount >= 3) {
    signals.push(`${rating.toFixed(1)} rating across ${reviewCount} reviews`);
  } else if (reviewCount !== null) {
    signals.push(`${reviewCount} published review${reviewCount === 1 ? "" : "s"}`);
  }

  if (lessonCount !== null) {
    signals.push(`${lessonCount} completed lesson${lessonCount === 1 ? "" : "s"}`);
  }

  if (approvedCredentialCount !== null && approvedCredentialCount > 0) {
    signals.push(
      `${approvedCredentialCount} verified qualification${approvedCredentialCount === 1 ? "" : "s"}`,
    );
  }

  if (responsiveness) {
    signals.push(humanizeSentence(responsiveness));
  }

  if (!signals.length && isPubliclyListableProfile(profile)) {
    signals.push("Profile reviewed");
  }

  if (!signals.length && capability?.experience_summary) {
    signals.push("Matching capability reviewed");
  }

  return Array.from(new Set(signals)).slice(0, 2);
}

function buildCardState({
  acceptingNewStudents,
  confidenceLabel,
  rankPosition,
}: {
  acceptingNewStudents: boolean;
  confidenceLabel: string | null;
  rankPosition: number;
}) {
  if (!acceptingNewStudents) {
    return "limited_availability";
  }

  if ((confidenceLabel ?? "").toLowerCase().includes("high") || rankPosition === 1) {
    return "high_confidence_match";
  }

  return "default";
}

function buildEmptyResultsDto(): MatchResultsPageDto {
  return {
    currentNeed: null,
    matches: [],
    run: {
      candidateCount: 0,
      completedAt: null,
      createdAt: null,
      failedAt: null,
      id: null,
      status: null,
    },
    state: "empty",
  };
}

function isPubliclyListableProfile(profile: TutorProfileRecord) {
  return (
    profile.application_status === "approved" &&
    profile.profile_visibility_status === "public_visible" &&
    profile.public_listing_status === "listed"
  );
}

function normalizeReason(reason: string | null | undefined, fitSummary: string) {
  const normalizedReason = normalizeText(reason);

  if (!normalizedReason || normalizedReason === fitSummary) {
    return null;
  }

  return humanizeSentence(normalizedReason);
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ");

  return normalized ? normalized : null;
}

function humanizeLabel(value: string | null | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .split(/[_-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function humanizeSentence(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  const sentence = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function getNumberFromSnapshot(snapshot: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = snapshot[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function getStringFromSnapshot(snapshot: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = snapshot[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
