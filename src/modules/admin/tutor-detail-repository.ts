import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  adminActionLabel,
  APPLICATION_REVIEW_STATUS_LABELS,
  LESSON_STATUS_LABELS,
  LESSON_STATUS_TONES,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_TONES,
  type StatusTone,
} from "@/modules/admin/labels";
import { loadAppUserIdentities } from "@/modules/admin/moderation-case-repository";
import { getAdminTutorLessonList } from "@/modules/lessons/tutor-lessons";
import {
  buildTutorEarningsDto,
  loadTutorPayoutProfile,
} from "@/modules/payouts/service";
import {
  type AdminTutorReviewItemDto,
  getAdminTutorReviewPanel,
} from "@/modules/reviews/admin-reviews";
import type { TutorApplicationReviewStatus } from "@/modules/tutors/review-constants";

// `P2-ADMIN-PEOPLE-002` D7 tutor-detail panels.
//
// Composes the operating picture for a tutor shown on `/internal/users/[id]`:
// a lifecycle timeline (application reviews + lifecycle admin actions), the
// tutor's lessons, rating/reviews with moderation state, and gross earnings.
// Everything is humanized at this boundary so the page renders no raw rows,
// enum values, or UUIDs.

const LIFECYCLE_LIMIT = 25;

// Application decisions already surface as review-history entries, so the
// matching `tutor_application.*` audit rows are filtered out of the lifecycle
// timeline to avoid printing each decision twice.
const LIFECYCLE_EXCLUDED_ACTION_PREFIX = "tutor_application.";

const COMMISSION_PENDING_NOTE =
  "Commission paid will appear once the revenue model ships.";

export type InternalTutorLifecycleEntryDto = {
  actorAvatarSrc: string | null;
  actorDisplayName: string | null;
  detail: string | null;
  id: string;
  occurredAt: string;
  title: string;
};

export type InternalTutorLessonRowDto = {
  hasOpenIssue: boolean;
  id: string;
  isTrial: boolean;
  lessonStatusLabel: string;
  lessonStatusTone: StatusTone;
  priceLabel: string;
  startAt: string;
  student: {
    appUserId: string;
    avatarSrc: string | null;
    displayName: string;
  };
  subjectLabel: string | null;
};

export type InternalTutorRatingDto = {
  averageRatingValue: number | null;
  publishedReviewCount: number;
};

export type InternalTutorReviewRowDto = {
  comment: string | null;
  id: string;
  moderationNote: string | null;
  ratingValue: number;
  reviewStatusLabel: string;
  reviewStatusTone: StatusTone;
  reviewerLabel: string;
  subjectLabel: string | null;
  timestamp: string;
};

export type InternalTutorEarningsMonthDto = {
  earningsLabel: string;
  lessonCount: number;
  monthLabel: string;
  monthStartIso: string;
};

export type InternalTutorEarningsDto = {
  commissionNote: string;
  monthlySummary: InternalTutorEarningsMonthDto[];
  totalEarningsLabel: string | null;
  totalLessonCount: number;
};

export type InternalTutorDetailDto = {
  earnings: InternalTutorEarningsDto;
  lessons: InternalTutorLessonRowDto[];
  lifecycle: InternalTutorLifecycleEntryDto[];
  rating: InternalTutorRatingDto;
  reviews: InternalTutorReviewRowDto[];
};

export async function getInternalTutorDetail(input: {
  appUserId: string;
  tutorProfileId: string;
}): Promise<InternalTutorDetailDto> {
  const [lifecycle, lessons, reviewPanel, earnings] = await Promise.all([
    loadLifecycle(input),
    loadLessons(input.tutorProfileId),
    getAdminTutorReviewPanel(input.tutorProfileId),
    loadEarnings(input.appUserId),
  ]);

  return {
    earnings,
    lessons,
    lifecycle,
    rating: {
      averageRatingValue: reviewPanel.rating.averageRatingValue,
      publishedReviewCount: reviewPanel.rating.publishedReviewCount,
    },
    reviews: reviewPanel.reviews.map(mapReviewRow),
  };
}

type ApplicationReviewRow = {
  created_at: string;
  id: string;
  internal_note: string | null;
  review_status: TutorApplicationReviewStatus;
  reviewer_app_user_id: string;
  reviewer_note: string | null;
};

type LifecycleActionRow = {
  action_key: string;
  actor_app_user_id: string;
  created_at: string;
  id: string;
  reason: string | null;
};

async function loadLifecycle(input: {
  appUserId: string;
  tutorProfileId: string;
}): Promise<InternalTutorLifecycleEntryDto[]> {
  const supabase = createSupabaseServiceRoleClient();

  const [reviewsResult, actionsResult] = await Promise.all([
    supabase
      .from("tutor_application_reviews")
      .select(
        "created_at, id, internal_note, review_status, reviewer_app_user_id, reviewer_note",
      )
      .eq("tutor_profile_id", input.tutorProfileId)
      .order("created_at", { ascending: false })
      .limit(LIFECYCLE_LIMIT)
      .returns<ApplicationReviewRow[]>(),
    supabase
      .from("admin_action_logs")
      .select("action_key, actor_app_user_id, created_at, id, reason")
      .in("target_type", ["app_user", "tutor_profile"])
      .in("target_id", [input.appUserId, input.tutorProfileId])
      .order("created_at", { ascending: false })
      .limit(LIFECYCLE_LIMIT)
      .returns<LifecycleActionRow[]>(),
  ]);

  const reviewRows = reviewsResult.data ?? [];
  const actionRows = (actionsResult.data ?? []).filter(
    (row) => !row.action_key.startsWith(LIFECYCLE_EXCLUDED_ACTION_PREFIX),
  );

  const actorIdentities = await loadAppUserIdentities([
    ...reviewRows.map((row) => row.reviewer_app_user_id),
    ...actionRows.map((row) => row.actor_app_user_id),
  ]);

  const reviewEntries = reviewRows.map<InternalTutorLifecycleEntryDto>((row) => {
    const actor = actorIdentities.get(row.reviewer_app_user_id);
    return {
      actorAvatarSrc: actor?.avatarUrl ?? null,
      actorDisplayName: actor?.displayName ?? null,
      detail: row.reviewer_note?.trim() || row.internal_note?.trim() || null,
      id: `review-${row.id}`,
      occurredAt: row.created_at,
      title: APPLICATION_REVIEW_STATUS_LABELS[row.review_status],
    };
  });

  const actionEntries = actionRows.map<InternalTutorLifecycleEntryDto>((row) => {
    const actor = actorIdentities.get(row.actor_app_user_id);
    return {
      actorAvatarSrc: actor?.avatarUrl ?? null,
      actorDisplayName: actor?.displayName ?? null,
      detail: row.reason?.trim() || null,
      id: `action-${row.id}`,
      occurredAt: row.created_at,
      title: adminActionLabel(row.action_key),
    };
  });

  return [...reviewEntries, ...actionEntries]
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, LIFECYCLE_LIMIT);
}

async function loadLessons(
  tutorProfileId: string,
): Promise<InternalTutorLessonRowDto[]> {
  const lessons = await getAdminTutorLessonList(tutorProfileId);

  return lessons.map((lesson) => ({
    hasOpenIssue: lesson.hasOpenIssue,
    id: lesson.id,
    isTrial: lesson.isTrial,
    lessonStatusLabel: LESSON_STATUS_LABELS[lesson.lessonStatus],
    lessonStatusTone: LESSON_STATUS_TONES[lesson.lessonStatus],
    priceLabel: lesson.priceLabel,
    startAt: lesson.startAt,
    student: {
      appUserId: lesson.student.appUserId,
      avatarSrc: lesson.student.avatarUrl,
      displayName: lesson.student.displayName,
    },
    subjectLabel: lesson.subjectLabel,
  }));
}

async function loadEarnings(
  appUserId: string,
): Promise<InternalTutorEarningsDto> {
  const profile = await loadTutorPayoutProfile(appUserId);

  if (!profile) {
    return {
      commissionNote: COMMISSION_PENDING_NOTE,
      monthlySummary: [],
      totalEarningsLabel: null,
      totalLessonCount: 0,
    };
  }

  const earnings = await buildTutorEarningsDto(profile);

  return {
    commissionNote: COMMISSION_PENDING_NOTE,
    monthlySummary: earnings.monthlySummary.map((bucket) => ({
      earningsLabel: bucket.earningsLabel,
      lessonCount: bucket.lessonCount,
      monthLabel: bucket.monthLabel,
      monthStartIso: bucket.monthStartIso,
    })),
    totalEarningsLabel: earnings.totalEarningsLabel || null,
    totalLessonCount: earnings.totalLessonCount,
  };
}

function mapReviewRow(
  review: AdminTutorReviewItemDto,
): InternalTutorReviewRowDto {
  return {
    comment: review.comment,
    id: review.id,
    moderationNote: review.moderationNote,
    ratingValue: review.ratingValue,
    reviewStatusLabel: REVIEW_STATUS_LABELS[review.reviewStatus],
    reviewStatusTone: REVIEW_STATUS_TONES[review.reviewStatus],
    reviewerLabel: review.reviewerLabel,
    subjectLabel: review.subjectLabel,
    timestamp: review.publishedAt ?? review.submittedAt,
  };
}
