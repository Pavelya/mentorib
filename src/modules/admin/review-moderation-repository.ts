import "server-only";

import type { Route } from "next";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_TONES,
  type StatusTone,
} from "@/modules/admin/labels";
import type { ReviewStatus } from "@/modules/reviews/constants";
import { getPublishedTutorProfilePhotoUrl } from "@/modules/tutors/media-public-assets";

// `P2-ADMIN-TRUST-001` review-moderation queue read.
//
// Surfaces tutor reviews that need an operator decision: those that have
// been reported (an open `case_kind = 'review'` moderation case references
// the review) or flagged (`reviews.flagged_at` set). Every row is a D7
// view-model — the page never sees a raw row, enum, or UUID. The reviewer
// is anonymized to first-name-plus-initial per the rating-and-review-trust
// model; admins moderate review content, not the reviewer's identity.

const OPEN_REVIEW_CASE_STATUSES = ["queued", "under_review", "escalated"] as const;

type ReviewCaseRow = {
  created_at: string;
  id: string;
  internal_summary: string | null;
  triggering_event_id: string | null;
};

type QueueReviewRow = {
  comment: string | null;
  flagged_at: string | null;
  id: string;
  lesson_id: string;
  moderation_note: string | null;
  rating_value: number;
  review_status: ReviewStatus;
  submitted_at: string;
  tutor_profile_id: string;
};

type TutorProfileRow = {
  app_user_id: string;
  headline: string | null;
  id: string;
  public_slug: string | null;
};

type LessonRow = {
  id: string;
  student_profile_id: string;
};

type StudentProfileRow = {
  app_user_id: string;
  id: string;
};

type AppUserRow = {
  full_name: string | null;
  id: string;
};

export type ReviewModerationQueueItemDto = {
  comment: string | null;
  flaggedAt: string | null;
  moderationNote: string | null;
  openCaseHref: Route | null;
  ratingValue: number;
  reasonSnippet: string | null;
  reportCount: number;
  reviewId: string;
  reviewStatus: ReviewStatus;
  reviewStatusLabel: string;
  reviewStatusTone: StatusTone;
  reviewerLabel: string;
  submittedAt: string;
  tutorAvatarSrc: string | null;
  tutorDisplayName: string;
  tutorProfileHref: Route | null;
  tutorProfileId: string;
};

export async function loadReviewModerationQueue(): Promise<
  ReviewModerationQueueItemDto[]
> {
  const supabase = createSupabaseServiceRoleClient();

  // 1. Open report cases keyed by the review they target.
  const { data: caseRows, error: caseError } = await supabase
    .from("moderation_cases")
    .select("created_at, id, internal_summary, triggering_event_id")
    .eq("case_kind", "review")
    .in("case_status", [...OPEN_REVIEW_CASE_STATUSES])
    .order("created_at", { ascending: false })
    .returns<ReviewCaseRow[]>();

  if (caseError) {
    throw new Error("Could not load review report cases.");
  }

  const reportsByReviewId = new Map<
    string,
    { count: number; latestCaseId: string; reasonSnippet: string | null }
  >();
  for (const row of caseRows ?? []) {
    if (!row.triggering_event_id) {
      continue;
    }
    const existing = reportsByReviewId.get(row.triggering_event_id);
    if (existing) {
      existing.count += 1;
    } else {
      // Rows arrive newest-first, so the first one seen is the latest report.
      reportsByReviewId.set(row.triggering_event_id, {
        count: 1,
        latestCaseId: row.id,
        reasonSnippet: snippet(row.internal_summary),
      });
    }
  }

  // 2. Flagged reviews.
  const { data: flaggedRows, error: flaggedError } = await supabase
    .from("reviews")
    .select(
      "comment, flagged_at, id, lesson_id, moderation_note, rating_value, review_status, submitted_at, tutor_profile_id",
    )
    .not("flagged_at", "is", null)
    .returns<QueueReviewRow[]>();

  if (flaggedError) {
    throw new Error("Could not load flagged reviews.");
  }

  const reviewIds = new Set<string>([
    ...reportsByReviewId.keys(),
    ...(flaggedRows ?? []).map((row) => row.id),
  ]);

  if (reviewIds.size === 0) {
    return [];
  }

  // 3. Resolve the full review rows for the union (the flagged set is already
  // loaded; fetch any reported-but-not-flagged rows too).
  const reviewById = new Map<string, QueueReviewRow>();
  for (const row of flaggedRows ?? []) {
    reviewById.set(row.id, row);
  }
  const missingIds = [...reviewIds].filter((id) => !reviewById.has(id));
  if (missingIds.length > 0) {
    const { data: reportedRows, error: reportedError } = await supabase
      .from("reviews")
      .select(
        "comment, flagged_at, id, lesson_id, moderation_note, rating_value, review_status, submitted_at, tutor_profile_id",
      )
      .in("id", missingIds)
      .returns<QueueReviewRow[]>();
    if (reportedError) {
      throw new Error("Could not load reported reviews.");
    }
    for (const row of reportedRows ?? []) {
      reviewById.set(row.id, row);
    }
  }

  const reviews = [...reviewById.values()];

  // 4. Resolve tutor identity + reviewer label.
  const tutorProfileIds = unique(reviews.map((review) => review.tutor_profile_id));
  const lessonIds = unique(reviews.map((review) => review.lesson_id));

  const [tutorProfiles, lessons] = await Promise.all([
    loadTutorProfiles(tutorProfileIds),
    loadLessons(lessonIds),
  ]);

  const studentProfileIds = unique(
    lessons.map((lesson) => lesson.student_profile_id),
  );
  const studentProfiles = await loadStudentProfiles(studentProfileIds);

  const tutorAppUserIds = tutorProfiles.map((profile) => profile.app_user_id);
  const studentAppUserIds = studentProfiles.map((profile) => profile.app_user_id);
  const appUsers = await loadAppUsers(
    unique([...tutorAppUserIds, ...studentAppUserIds]),
  );

  const tutorById = new Map(tutorProfiles.map((profile) => [profile.id, profile]));
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const studentById = new Map(
    studentProfiles.map((profile) => [profile.id, profile]),
  );
  const appUserById = new Map(appUsers.map((user) => [user.id, user]));

  const avatarByTutorId = new Map<string, string | null>(
    await Promise.all(
      tutorProfileIds.map(
        async (id) =>
          [id, await getPublishedTutorProfilePhotoUrl(id)] as const,
      ),
    ),
  );

  const items = reviews.map<ReviewModerationQueueItemDto>((review) => {
    const tutor = tutorById.get(review.tutor_profile_id) ?? null;
    const tutorAppUser = tutor ? appUserById.get(tutor.app_user_id) : null;
    const lesson = lessonById.get(review.lesson_id) ?? null;
    const student = lesson ? studentById.get(lesson.student_profile_id) : null;
    const studentAppUser = student ? appUserById.get(student.app_user_id) : null;
    const report = reportsByReviewId.get(review.id) ?? null;

    return {
      comment: review.comment,
      flaggedAt: review.flagged_at,
      moderationNote: review.moderation_note,
      openCaseHref: report
        ? (`/internal/moderation/${report.latestCaseId}` as Route)
        : null,
      ratingValue: review.rating_value,
      reasonSnippet: report?.reasonSnippet ?? null,
      reportCount: report?.count ?? 0,
      reviewId: review.id,
      reviewStatus: review.review_status,
      reviewStatusLabel: REVIEW_STATUS_LABELS[review.review_status],
      reviewStatusTone: REVIEW_STATUS_TONES[review.review_status],
      reviewerLabel: buildReviewerLabel(studentAppUser?.full_name ?? null),
      submittedAt: review.submitted_at,
      tutorAvatarSrc: avatarByTutorId.get(review.tutor_profile_id) ?? null,
      tutorDisplayName: tutorAppUser?.full_name?.trim() || "Tutor profile",
      tutorProfileHref: tutor?.public_slug
        ? (`/tutors/${tutor.public_slug}` as Route)
        : null,
      tutorProfileId: review.tutor_profile_id,
    };
  });

  // Reported reviews first (most reports first), then flagged-only, oldest
  // submission first within each band so the longest-waiting item leads.
  return items.sort((a, b) => {
    if (b.reportCount !== a.reportCount) {
      return b.reportCount - a.reportCount;
    }
    return a.submittedAt.localeCompare(b.submittedAt);
  });
}

async function loadTutorProfiles(
  ids: readonly string[],
): Promise<TutorProfileRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, headline, id, public_slug")
    .in("id", [...ids])
    .returns<TutorProfileRow[]>();
  if (error) {
    throw new Error("Could not load tutor profiles for review moderation.");
  }
  return data ?? [];
}

async function loadLessons(ids: readonly string[]): Promise<LessonRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, student_profile_id")
    .in("id", [...ids])
    .returns<LessonRow[]>();
  if (error) {
    throw new Error("Could not load lessons for review moderation.");
  }
  return data ?? [];
}

async function loadStudentProfiles(
  ids: readonly string[],
): Promise<StudentProfileRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("student_profiles")
    .select("app_user_id, id")
    .in("id", [...ids])
    .returns<StudentProfileRow[]>();
  if (error) {
    throw new Error("Could not load student profiles for review moderation.");
  }
  return data ?? [];
}

async function loadAppUsers(ids: readonly string[]): Promise<AppUserRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("full_name, id")
    .in("id", [...ids])
    .returns<AppUserRow[]>();
  if (error) {
    throw new Error("Could not load identities for review moderation.");
  }
  return data ?? [];
}

// Reviewer identity rule (section 10.2 of the trust architecture): review
// surfaces use first name plus initial, never full identity — including the
// admin moderation queue.
function buildReviewerLabel(fullName: string | null): string {
  const trimmed = fullName?.trim();
  if (!trimmed) {
    return "Mentor IB student";
  }
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] ?? "";
  if (!firstName) {
    return "Mentor IB student";
  }
  if (parts.length === 1) {
    return firstName;
  }
  const lastInitial = parts[parts.length - 1]?.[0];
  return lastInitial ? `${firstName} ${lastInitial.toUpperCase()}.` : firstName;
}

function snippet(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.length > 160 ? `${trimmed.slice(0, 159)}…` : trimmed;
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}
