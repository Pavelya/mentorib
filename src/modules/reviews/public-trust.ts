import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import {
  REVIEW_LIST_PUBLIC_DEFAULT_LIMIT,
  REVIEW_PUBLIC_RATING_THRESHOLD,
} from "@/modules/reviews/constants";

type TutorRatingSnapshotRow = {
  average_rating_value: string | number | null;
  published_review_count: number;
  smoothed_rating_value: string | number | null;
};

type PublicReviewRow = {
  comment: string | null;
  id: string;
  lesson_id: string;
  published_at: string | null;
  rating_value: number;
};

type PublicReviewLessonRow = {
  focus_snapshot: Record<string, unknown> | null;
  id: string;
  scheduled_start_at: string | null;
  student_profile_id: string;
  subject_snapshot: Record<string, unknown> | null;
};

type PublicReviewStudentProfileRow = {
  app_user_id: string;
  id: string;
};

type PublicReviewAppUserRow = {
  full_name: string | null;
  id: string;
};

export type PublicTutorRatingSnapshotDto = {
  averageRatingValue: number | null;
  hasPublicRating: boolean;
  publishedReviewCount: number;
  smoothedRatingValue: number | null;
};

export type PublicTutorReviewDto = {
  comment: string | null;
  context: {
    focus: string | null;
    subject: string | null;
  };
  id: string;
  publishedAt: string | null;
  ratingValue: number;
  reviewerLabel: string;
};

export type PublicTutorReviewSummaryDto = {
  rating: PublicTutorRatingSnapshotDto;
  reviews: PublicTutorReviewDto[];
};

export function buildEmptyPublicTutorReviewSummary(): PublicTutorReviewSummaryDto {
  return {
    rating: {
      averageRatingValue: null,
      hasPublicRating: false,
      publishedReviewCount: 0,
      smoothedRatingValue: null,
    },
    reviews: [],
  };
}

export async function getPublicTutorReviewSummary(
  tutorProfileId: string,
  limit: number = REVIEW_LIST_PUBLIC_DEFAULT_LIMIT,
): Promise<PublicTutorReviewSummaryDto> {
  if (!isSupabaseAuthConfigured()) {
    return buildEmptyPublicTutorReviewSummary();
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: snapshotRow, error: snapshotError } = await supabase
    .from("tutor_rating_snapshot")
    .select(
      "average_rating_value, published_review_count, smoothed_rating_value",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<TutorRatingSnapshotRow>();

  if (snapshotError) {
    throw new Error("Could not load tutor rating snapshot.");
  }

  const rating = buildRatingDto(snapshotRow);

  const { data: reviewRows, error: reviewsError } = await supabase
    .from("reviews")
    .select("comment, id, lesson_id, published_at, rating_value")
    .eq("tutor_profile_id", tutorProfileId)
    .eq("review_status", "published")
    .order("published_at", { ascending: false })
    .limit(limit)
    .returns<PublicReviewRow[]>();

  if (reviewsError) {
    throw new Error("Could not load published tutor reviews.");
  }

  const reviews = reviewRows ?? [];

  if (reviews.length === 0) {
    return { rating, reviews: [] };
  }

  const lessonIds = uniqueStrings(reviews.map((review) => review.lesson_id));
  const lessons = await loadPublicReviewLessons(lessonIds);
  const studentProfileIds = uniqueStrings(
    lessons.map((lesson) => lesson.student_profile_id),
  );
  const studentProfiles = await loadPublicReviewStudentProfiles(studentProfileIds);
  const appUserIds = uniqueStrings(
    studentProfiles.map((profile) => profile.app_user_id),
  );
  const appUsers = await loadPublicReviewAppUsers(appUserIds);

  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const studentById = new Map(
    studentProfiles.map((profile) => [profile.id, profile]),
  );
  const appUserById = new Map(appUsers.map((user) => [user.id, user]));

  const items = reviews.map<PublicTutorReviewDto>((review) => {
    const lesson = lessonById.get(review.lesson_id) ?? null;
    const student = lesson ? studentById.get(lesson.student_profile_id) : null;
    const appUser = student ? appUserById.get(student.app_user_id) : null;

    return {
      comment: review.comment,
      context: {
        focus: parseSnapshotLabel(lesson?.focus_snapshot ?? null),
        subject: parseSnapshotLabel(lesson?.subject_snapshot ?? null),
      },
      id: review.id,
      publishedAt: review.published_at,
      ratingValue: review.rating_value,
      reviewerLabel: buildReviewerLabel(appUser?.full_name ?? null),
    };
  });

  return { rating, reviews: items };
}

function buildRatingDto(
  row: TutorRatingSnapshotRow | null,
): PublicTutorRatingSnapshotDto {
  if (!row) {
    return {
      averageRatingValue: null,
      hasPublicRating: false,
      publishedReviewCount: 0,
      smoothedRatingValue: null,
    };
  }

  const publishedReviewCount = row.published_review_count ?? 0;
  const averageRatingValue = parseNumeric(row.average_rating_value);
  const smoothedRatingValue = parseNumeric(row.smoothed_rating_value);

  return {
    averageRatingValue,
    hasPublicRating: publishedReviewCount >= REVIEW_PUBLIC_RATING_THRESHOLD,
    publishedReviewCount,
    smoothedRatingValue,
  };
}

async function loadPublicReviewLessons(
  lessonIds: readonly string[],
): Promise<PublicReviewLessonRow[]> {
  if (lessonIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "focus_snapshot, id, scheduled_start_at, student_profile_id, subject_snapshot",
    )
    .in("id", [...lessonIds])
    .returns<PublicReviewLessonRow[]>();

  if (error) {
    throw new Error("Could not load lesson context for published reviews.");
  }

  return data ?? [];
}

async function loadPublicReviewStudentProfiles(
  studentProfileIds: readonly string[],
): Promise<PublicReviewStudentProfileRow[]> {
  if (studentProfileIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("student_profiles")
    .select("app_user_id, id")
    .in("id", [...studentProfileIds])
    .returns<PublicReviewStudentProfileRow[]>();

  if (error) {
    throw new Error("Could not load student profiles for published reviews.");
  }

  return data ?? [];
}

async function loadPublicReviewAppUsers(
  appUserIds: readonly string[],
): Promise<PublicReviewAppUserRow[]> {
  if (appUserIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("full_name, id")
    .in("id", [...appUserIds])
    .returns<PublicReviewAppUserRow[]>();

  if (error) {
    throw new Error("Could not load reviewer summaries for published reviews.");
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

// Reviewer identity rule (section 10.2 of the trust architecture): public review
// cards use first name plus initial, never full identity. Falls back to a
// generic label when no display name is available so we never leak an empty UI.
function buildReviewerLabel(fullName: string | null): string {
  if (!fullName) {
    return "Mentor IB student";
  }

  const trimmed = fullName.trim();

  if (trimmed.length === 0) {
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

function parseSnapshotLabel(snapshot: Record<string, unknown> | null): string | null {
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
