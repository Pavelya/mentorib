import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { ReviewStatus } from "@/modules/reviews/constants";

// Admin-scoped review read for the internal tutor-detail surface
// (P2-ADMIN-PEOPLE-002). Unlike the public review loader, it returns reviews
// across every `review_status` (including `hidden`/`rejected`) so an operator
// can see the moderation state, and exposes the `moderation_note`. The reviewer
// identity is still anonymized per the rating-and-review-trust model — admins
// moderate review content, not the reviewer's full identity.

const ADMIN_TUTOR_REVIEW_LIMIT = 20;

type AdminReviewRow = {
  comment: string | null;
  id: string;
  lesson_id: string;
  moderation_note: string | null;
  published_at: string | null;
  rating_value: number;
  review_status: ReviewStatus;
  submitted_at: string;
};

type AdminReviewLessonRow = {
  focus_snapshot: Record<string, unknown> | null;
  id: string;
  student_profile_id: string;
  subject_snapshot: Record<string, unknown> | null;
};

type AdminReviewStudentProfileRow = {
  app_user_id: string;
  id: string;
};

type AdminReviewAppUserRow = {
  full_name: string | null;
  id: string;
};

type AdminRatingSnapshotRow = {
  average_rating_value: string | number | null;
  published_review_count: number;
  smoothed_rating_value: string | number | null;
};

export type AdminTutorRatingSnapshotDto = {
  averageRatingValue: number | null;
  publishedReviewCount: number;
  smoothedRatingValue: number | null;
};

export type AdminTutorReviewItemDto = {
  comment: string | null;
  focusLabel: string | null;
  id: string;
  moderationNote: string | null;
  publishedAt: string | null;
  ratingValue: number;
  reviewStatus: ReviewStatus;
  reviewerLabel: string;
  subjectLabel: string | null;
  submittedAt: string;
};

export type AdminTutorReviewPanelDto = {
  rating: AdminTutorRatingSnapshotDto;
  reviews: AdminTutorReviewItemDto[];
};

export async function getAdminTutorReviewPanel(
  tutorProfileId: string,
  limit: number = ADMIN_TUTOR_REVIEW_LIMIT,
): Promise<AdminTutorReviewPanelDto> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: snapshotRow, error: snapshotError } = await supabase
    .from("tutor_rating_snapshot")
    .select("average_rating_value, published_review_count, smoothed_rating_value")
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<AdminRatingSnapshotRow>();

  if (snapshotError) {
    throw new Error("Could not load the tutor rating snapshot.");
  }

  const rating = buildRatingDto(snapshotRow);

  const { data: reviewRows, error: reviewsError } = await supabase
    .from("reviews")
    .select(
      "comment, id, lesson_id, moderation_note, published_at, rating_value, review_status, submitted_at",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .order("submitted_at", { ascending: false })
    .limit(limit)
    .returns<AdminReviewRow[]>();

  if (reviewsError) {
    throw new Error("Could not load tutor reviews for the admin surface.");
  }

  const reviews = reviewRows ?? [];

  if (reviews.length === 0) {
    return { rating, reviews: [] };
  }

  const lessonIds = uniqueStrings(reviews.map((review) => review.lesson_id));
  const lessons = await loadReviewLessons(lessonIds);
  const studentProfileIds = uniqueStrings(
    lessons.map((lesson) => lesson.student_profile_id),
  );
  const studentProfiles = await loadReviewStudentProfiles(studentProfileIds);
  const appUserIds = uniqueStrings(
    studentProfiles.map((profile) => profile.app_user_id),
  );
  const appUsers = await loadReviewAppUsers(appUserIds);

  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const studentById = new Map(
    studentProfiles.map((profile) => [profile.id, profile]),
  );
  const appUserById = new Map(appUsers.map((user) => [user.id, user]));

  const items = reviews.map<AdminTutorReviewItemDto>((review) => {
    const lesson = lessonById.get(review.lesson_id) ?? null;
    const student = lesson ? studentById.get(lesson.student_profile_id) : null;
    const appUser = student ? appUserById.get(student.app_user_id) : null;

    return {
      comment: review.comment,
      focusLabel: parseSnapshotLabel(lesson?.focus_snapshot ?? null),
      id: review.id,
      moderationNote: review.moderation_note,
      publishedAt: review.published_at,
      ratingValue: review.rating_value,
      reviewStatus: review.review_status,
      reviewerLabel: buildReviewerLabel(appUser?.full_name ?? null),
      subjectLabel: parseSnapshotLabel(lesson?.subject_snapshot ?? null),
      submittedAt: review.submitted_at,
    };
  });

  return { rating, reviews: items };
}

function buildRatingDto(
  row: AdminRatingSnapshotRow | null,
): AdminTutorRatingSnapshotDto {
  if (!row) {
    return {
      averageRatingValue: null,
      publishedReviewCount: 0,
      smoothedRatingValue: null,
    };
  }

  return {
    averageRatingValue: parseNumeric(row.average_rating_value),
    publishedReviewCount: row.published_review_count ?? 0,
    smoothedRatingValue: parseNumeric(row.smoothed_rating_value),
  };
}

async function loadReviewLessons(
  lessonIds: readonly string[],
): Promise<AdminReviewLessonRow[]> {
  if (lessonIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("focus_snapshot, id, student_profile_id, subject_snapshot")
    .in("id", [...lessonIds])
    .returns<AdminReviewLessonRow[]>();

  if (error) {
    throw new Error("Could not load lesson context for tutor reviews.");
  }

  return data ?? [];
}

async function loadReviewStudentProfiles(
  studentProfileIds: readonly string[],
): Promise<AdminReviewStudentProfileRow[]> {
  if (studentProfileIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("student_profiles")
    .select("app_user_id, id")
    .in("id", [...studentProfileIds])
    .returns<AdminReviewStudentProfileRow[]>();

  if (error) {
    throw new Error("Could not load student profiles for tutor reviews.");
  }

  return data ?? [];
}

async function loadReviewAppUsers(
  appUserIds: readonly string[],
): Promise<AdminReviewAppUserRow[]> {
  if (appUserIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("full_name, id")
    .in("id", [...appUserIds])
    .returns<AdminReviewAppUserRow[]>();

  if (error) {
    throw new Error("Could not load reviewer summaries for tutor reviews.");
  }

  return data ?? [];
}

function parseNumeric(value: string | number | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : null;
}

// Reviewer identity rule (section 10.2 of the trust architecture): review cards
// use first name plus initial, never full identity — including the admin view.
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

function parseSnapshotLabel(
  snapshot: Record<string, unknown> | null,
): string | null {
  if (!snapshot) {
    return null;
  }

  const label = snapshot["label"];

  if (typeof label !== "string") {
    return null;
  }

  const trimmed = label.trim();

  return trimmed.length === 0 ? null : trimmed;
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}
