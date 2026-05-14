import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { type LessonStatus } from "@/modules/lessons/constants";
import {
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_MAX_RATING,
  REVIEW_MIN_RATING,
  type ReviewStatus,
} from "@/modules/reviews/constants";

const REVIEW_ELIGIBLE_LESSON_STATUSES: readonly LessonStatus[] = [
  "completed",
  "reviewed",
];

export class ReviewActionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type LessonReviewContextRow = {
  id: string;
  lesson_status: LessonStatus;
  student_profile_id: string;
  tutor_profile_id: string;
};

type ReviewRow = {
  comment: string | null;
  id: string;
  lesson_id: string;
  rating_value: number;
  review_status: ReviewStatus;
  submitted_at: string;
};

export type ReviewSubmissionInput = {
  comment: string | null;
  ratingValue: number;
};

export type LessonReviewEligibilityDto =
  | {
      reason: string;
      status: "ineligible";
    }
  | {
      existingReview: ReviewSummaryDto;
      status: "already_submitted";
    }
  | {
      status: "eligible";
    };

export type ReviewSummaryDto = {
  comment: string | null;
  id: string;
  ratingValue: number;
  reviewStatus: ReviewStatus;
  submittedAt: string;
};

export async function getReviewEligibilityForStudentLesson(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
): Promise<LessonReviewEligibilityDto> {
  const lesson = await loadLessonForStudent(account.id, lessonId);

  if (!lesson) {
    return {
      reason: "We couldn't find this lesson on your account.",
      status: "ineligible",
    };
  }

  if (!REVIEW_ELIGIBLE_LESSON_STATUSES.includes(lesson.lesson_status)) {
    return {
      reason: "Reviews open once the lesson is marked completed.",
      status: "ineligible",
    };
  }

  const existing = await loadReviewForLesson(lesson.id);

  if (existing) {
    return {
      existingReview: toReviewSummary(existing),
      status: "already_submitted",
    };
  }

  return { status: "eligible" };
}

export async function submitTutorReviewForLesson(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
  input: ReviewSubmissionInput,
): Promise<ReviewSummaryDto> {
  const ratingValue = normalizeRatingValue(input.ratingValue);

  if (ratingValue === null) {
    throw new ReviewActionError(
      "invalid_rating",
      `Pick a rating between ${REVIEW_MIN_RATING} and ${REVIEW_MAX_RATING} stars.`,
    );
  }

  const comment = normalizeComment(input.comment);

  const lesson = await loadLessonForStudent(account.id, lessonId);

  if (!lesson) {
    throw new ReviewActionError(
      "not_found",
      "We couldn't find this lesson on your account.",
    );
  }

  if (!REVIEW_ELIGIBLE_LESSON_STATUSES.includes(lesson.lesson_status)) {
    throw new ReviewActionError(
      "lesson_not_completed",
      "Reviews open once the lesson is marked completed.",
    );
  }

  const existing = await loadReviewForLesson(lesson.id);

  if (existing) {
    throw new ReviewActionError(
      "already_submitted",
      "You have already left a review for this lesson.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      comment,
      lesson_id: lesson.id,
      published_at: nowIso,
      rating_value: ratingValue,
      review_status: "published",
      student_profile_id: lesson.student_profile_id,
      submitted_at: nowIso,
      tutor_profile_id: lesson.tutor_profile_id,
    })
    .select("comment, id, lesson_id, rating_value, review_status, submitted_at")
    .single<ReviewRow>();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new ReviewActionError(
        "already_submitted",
        "You have already left a review for this lesson.",
      );
    }

    throw new ReviewActionError(
      "review_create_failed",
      "We couldn't save this review. Please try again in a moment.",
    );
  }

  if (lesson.lesson_status === "completed") {
    await markLessonAsReviewed(lesson.id);
  }

  return toReviewSummary(data);
}

async function loadLessonForStudent(
  appUserId: string,
  lessonId: string,
): Promise<LessonReviewContextRow | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: studentProfile, error: studentError } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("app_user_id", appUserId)
    .maybeSingle<{ id: string }>();

  if (studentError) {
    throw new ReviewActionError(
      "profile_lookup_failed",
      "We couldn't load your student profile.",
    );
  }

  if (!studentProfile) {
    return null;
  }

  const { data, error } = await supabase
    .from("lessons")
    .select("id, lesson_status, student_profile_id, tutor_profile_id")
    .eq("id", lessonId)
    .eq("student_profile_id", studentProfile.id)
    .maybeSingle<LessonReviewContextRow>();

  if (error) {
    throw new ReviewActionError(
      "lesson_lookup_failed",
      "We couldn't load this lesson.",
    );
  }

  return data ?? null;
}

async function loadReviewForLesson(lessonId: string): Promise<ReviewRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("comment, id, lesson_id, rating_value, review_status, submitted_at")
    .eq("lesson_id", lessonId)
    .maybeSingle<ReviewRow>();

  if (error) {
    throw new ReviewActionError(
      "review_lookup_failed",
      "We couldn't read existing review state for this lesson.",
    );
  }

  return data ?? null;
}

async function markLessonAsReviewed(lessonId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("lessons")
    .update({ lesson_status: "reviewed" })
    .eq("id", lessonId)
    .eq("lesson_status", "completed");

  if (error) {
    // The review was saved successfully; failing to transition the lesson
    // marker should not erase the review. Surface as a soft error.
    throw new ReviewActionError(
      "lesson_status_update_failed",
      "Your review was saved, but we couldn't update the lesson marker.",
    );
  }
}

function normalizeRatingValue(value: number): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.round(value);

  if (rounded < REVIEW_MIN_RATING || rounded > REVIEW_MAX_RATING) {
    return null;
  }

  return rounded;
}

function normalizeComment(value: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > REVIEW_COMMENT_MAX_LENGTH) {
    return trimmed.slice(0, REVIEW_COMMENT_MAX_LENGTH);
  }

  return trimmed;
}

function toReviewSummary(row: ReviewRow): ReviewSummaryDto {
  return {
    comment: row.comment,
    id: row.id,
    ratingValue: row.rating_value,
    reviewStatus: row.review_status,
    submittedAt: row.submitted_at,
  };
}
