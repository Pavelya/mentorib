import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { appUsers, studentProfiles } from "@/modules/accounts/schema";
import { DEFAULT_PLATFORM_CURRENCY_CODE } from "@/modules/pricing/money";
import {
  bookingOperationStatuses,
  bookingOperationTypes,
  learningNeedStatuses,
  lessonIssueCaseStatuses,
  lessonIssueCounterpartyResponseTypes,
  lessonIssueResolutionOutcomes,
  lessonIssueTypes,
  lessonMeetingAccessStatuses,
  lessonMeetingMethods,
  lessonMeetingSourceTypes,
  lessonStatuses,
  matchCandidateStates,
  matchRunStatuses,
  paymentProviders,
  paymentStatuses,
} from "@/modules/lessons/constants";
import {
  languages,
  meetingProviders,
  subjectFocusAreas,
  subjects,
} from "@/modules/reference/schema";
import { tutorProfiles } from "@/modules/tutors/schema";

export const bookingOperations = pgTable(
  "booking_operations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actor_app_user_id: uuid("actor_app_user_id")
      .notNull()
      .references(() => appUsers.id),
    operation_key: text("operation_key").notNull(),
    operation_type: text("operation_type", { enum: bookingOperationTypes }).notNull(),
    operation_status: text("operation_status", {
      enum: bookingOperationStatuses,
    })
      .notNull()
      .default("started"),
    request_fingerprint: text("request_fingerprint").notNull(),
    error_code: text("error_code"),
    error_message: text("error_message"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("booking_operations_actor_operation_key").on(
      table.actor_app_user_id,
      table.operation_key,
    ),
  ],
);

export const learningNeeds = pgTable(
  "learning_needs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    student_profile_id: uuid("student_profile_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    need_status: text("need_status", { enum: learningNeedStatuses })
      .notNull()
      .default("draft"),
    need_type: text("need_type").notNull(),
    subject_id: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    subject_focus_area_id: uuid("subject_focus_area_id")
      .notNull()
      .references(() => subjectFocusAreas.id),
    urgency_level: text("urgency_level").notNull(),
    support_style: text("support_style"),
    language_code: text("language_code")
      .notNull()
      .references(() => languages.language_code),
    timezone: text("timezone").notNull().default("UTC"),
    session_frequency_intent: text("session_frequency_intent"),
    free_text_note: text("free_text_note"),
    submitted_at: timestamp("submitted_at", { withTimezone: true }),
    archived_at: timestamp("archived_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("learning_needs_student_status_updated_idx").on(
      table.student_profile_id,
      table.need_status,
      table.updated_at,
    ),
    index("learning_needs_subject_focus_idx").on(
      table.subject_id,
      table.subject_focus_area_id,
    ),
  ],
);

export const matchRuns = pgTable(
  "match_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learning_need_id: uuid("learning_need_id")
      .notNull()
      .references(() => learningNeeds.id, { onDelete: "cascade" }),
    ranking_version: text("ranking_version").notNull(),
    need_signature: text("need_signature").notNull(),
    matching_projection_version: text("matching_projection_version").notNull(),
    run_status: text("run_status", { enum: matchRunStatuses })
      .notNull()
      .default("queued"),
    candidate_count: integer("candidate_count").notNull().default(0),
    started_at: timestamp("started_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    failed_at: timestamp("failed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("match_runs_learning_need_created_at_idx").on(
      table.learning_need_id,
      table.created_at,
    ),
    index("match_runs_status_created_at_idx").on(
      table.run_status,
      table.created_at,
    ),
  ],
);

export const matchCandidates = pgTable(
  "match_candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    match_run_id: uuid("match_run_id")
      .notNull()
      .references(() => matchRuns.id, { onDelete: "cascade" }),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id),
    candidate_state: text("candidate_state", { enum: matchCandidateStates })
      .notNull()
      .default("candidate"),
    rank_position: integer("rank_position").notNull(),
    match_score: integer("match_score").notNull(),
    confidence_label: text("confidence_label"),
    fit_summary: text("fit_summary"),
    best_for_summary: text("best_for_summary"),
    availability_signal: text("availability_signal"),
    trust_signal_snapshot: jsonb("trust_signal_snapshot")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("match_candidates_tutor_per_run_key").on(
      table.match_run_id,
      table.tutor_profile_id,
    ),
    uniqueIndex("match_candidates_rank_per_run_key").on(
      table.match_run_id,
      table.rank_position,
    ),
    index("match_candidates_tutor_profile_id_idx").on(table.tutor_profile_id),
    index("match_candidates_state_rank_idx").on(
      table.match_run_id,
      table.candidate_state,
      table.rank_position,
    ),
  ],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    student_profile_id: uuid("student_profile_id")
      .notNull()
      .references(() => studentProfiles.id),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id),
    learning_need_id: uuid("learning_need_id")
      .notNull()
      .references(() => learningNeeds.id),
    match_candidate_id: uuid("match_candidate_id").references(
      () => matchCandidates.id,
      { onDelete: "set null" },
    ),
    booking_operation_id: uuid("booking_operation_id")
      .notNull()
      .references(() => bookingOperations.id),
    lesson_status: text("lesson_status", { enum: lessonStatuses })
      .notNull()
      .default("pending"),
    scheduled_start_at: timestamp("scheduled_start_at", {
      withTimezone: true,
    }).notNull(),
    scheduled_end_at: timestamp("scheduled_end_at", {
      withTimezone: true,
    }).notNull(),
    request_expires_at: timestamp("request_expires_at", {
      withTimezone: true,
    }).notNull(),
    lesson_timezone: text("lesson_timezone").notNull(),
    meeting_method: text("meeting_method", { enum: lessonMeetingMethods })
      .notNull()
      .default("external_video_call"),
    price_amount: integer("price_amount").notNull(),
    currency_code: text("currency_code")
      .notNull()
      .default(DEFAULT_PLATFORM_CURRENCY_CODE),
    is_trial: boolean("is_trial").notNull().default(false),
    subject_snapshot: jsonb("subject_snapshot")
      .$type<Record<string, unknown>>()
      .notNull(),
    focus_snapshot: jsonb("focus_snapshot")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    student_note_snapshot: text("student_note_snapshot"),
    accepted_at: timestamp("accepted_at", { withTimezone: true }),
    declined_at: timestamp("declined_at", { withTimezone: true }),
    cancelled_at: timestamp("cancelled_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lessons_booking_operation_id_key").on(table.booking_operation_id),
    uniqueIndex("lessons_tutor_active_slot_key").on(
      table.tutor_profile_id,
      table.scheduled_start_at,
      table.scheduled_end_at,
    ),
    uniqueIndex("lessons_student_active_slot_key").on(
      table.student_profile_id,
      table.scheduled_start_at,
      table.scheduled_end_at,
    ),
    index("lessons_student_status_start_idx").on(
      table.student_profile_id,
      table.lesson_status,
      table.scheduled_start_at,
    ),
    index("lessons_tutor_status_start_idx").on(
      table.tutor_profile_id,
      table.lesson_status,
      table.scheduled_start_at,
    ),
    index("lessons_learning_need_idx").on(table.learning_need_id),
  ],
);

export const lessonStatusHistory = pgTable(
  "lesson_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lesson_id: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    from_status: text("from_status", { enum: lessonStatuses }),
    to_status: text("to_status", { enum: lessonStatuses }).notNull(),
    changed_by_app_user_id: uuid("changed_by_app_user_id").references(
      () => appUsers.id,
    ),
    booking_operation_id: uuid("booking_operation_id").references(
      () => bookingOperations.id,
    ),
    change_reason: text("change_reason"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lesson_status_history_booking_operation_id_key").on(
      table.booking_operation_id,
    ),
    index("lesson_status_history_lesson_created_at_idx").on(
      table.lesson_id,
      table.created_at,
    ),
  ],
);

export const lessonMeetingAccess = pgTable(
  "lesson_meeting_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lesson_id: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    meeting_method: text("meeting_method", { enum: lessonMeetingMethods })
      .notNull()
      .default("external_video_call"),
    provider: text("provider").references(() => meetingProviders.provider_key),
    meeting_url: text("meeting_url"),
    normalized_host: text("normalized_host"),
    display_label: text("display_label"),
    source_type: text("source_type", { enum: lessonMeetingSourceTypes })
      .notNull()
      .default("tutor_default_room"),
    access_status: text("access_status", { enum: lessonMeetingAccessStatuses })
      .notNull()
      .default("missing"),
    updated_by_app_user_id: uuid("updated_by_app_user_id").references(
      () => appUsers.id,
    ),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lesson_meeting_access_current_lesson_key").on(table.lesson_id),
    index("lesson_meeting_access_provider_status_idx").on(
      table.provider,
      table.access_status,
    ),
  ],
);

export const lessonIssueCases = pgTable(
  "lesson_issue_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lesson_id: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    reported_by_app_user_id: uuid("reported_by_app_user_id")
      .notNull()
      .references(() => appUsers.id),
    issue_type: text("issue_type", { enum: lessonIssueTypes }).notNull(),
    reporter_summary: text("reporter_summary"),
    counterparty_response_type: text("counterparty_response_type", {
      enum: lessonIssueCounterpartyResponseTypes,
    }),
    counterparty_summary: text("counterparty_summary"),
    case_status: text("case_status", { enum: lessonIssueCaseStatuses })
      .notNull()
      .default("reported"),
    resolution_outcome: text("resolution_outcome", {
      enum: lessonIssueResolutionOutcomes,
    }),
    resolved_by_app_user_id: uuid("resolved_by_app_user_id").references(
      () => appUsers.id,
    ),
    resolution_note: text("resolution_note"),
    reported_at: timestamp("reported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    counterparty_deadline_at: timestamp("counterparty_deadline_at", {
      withTimezone: true,
    })
      .notNull()
      .default(sql`now() + interval '12 hours'`),
    resolved_at: timestamp("resolved_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lesson_issue_cases_open_lesson_key").on(table.lesson_id),
    index("lesson_issue_cases_status_reported_at_idx").on(
      table.case_status,
      table.reported_at,
    ),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lesson_id: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id),
    payer_app_user_id: uuid("payer_app_user_id")
      .notNull()
      .references(() => appUsers.id),
    authorization_operation_id: uuid("authorization_operation_id")
      .notNull()
      .references(() => bookingOperations.id),
    capture_operation_id: uuid("capture_operation_id").references(
      () => bookingOperations.id,
    ),
    provider: text("provider", { enum: paymentProviders })
      .notNull()
      .default("stripe"),
    provider_idempotency_key: text("provider_idempotency_key"),
    stripe_checkout_session_id: text("stripe_checkout_session_id"),
    stripe_payment_intent_id: text("stripe_payment_intent_id"),
    payment_status: text("payment_status", { enum: paymentStatuses })
      .notNull()
      .default("pending"),
    amount: integer("amount").notNull(),
    currency_code: text("currency_code")
      .notNull()
      .default(DEFAULT_PLATFORM_CURRENCY_CODE),
    authorized_at: timestamp("authorized_at", { withTimezone: true }),
    authorization_expires_at: timestamp("authorization_expires_at", {
      withTimezone: true,
    }),
    captured_at: timestamp("captured_at", { withTimezone: true }),
    capture_cancelled_at: timestamp("capture_cancelled_at", {
      withTimezone: true,
    }),
    refunded_at: timestamp("refunded_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("payments_lesson_id_key").on(table.lesson_id),
    uniqueIndex("payments_authorization_operation_id_key").on(
      table.authorization_operation_id,
    ),
    uniqueIndex("payments_capture_operation_id_key").on(
      table.capture_operation_id,
    ),
    uniqueIndex("payments_provider_idempotency_key_key").on(
      table.provider,
      table.provider_idempotency_key,
    ),
    uniqueIndex("payments_stripe_checkout_session_id_key").on(
      table.stripe_checkout_session_id,
    ),
    uniqueIndex("payments_stripe_payment_intent_id_key").on(
      table.stripe_payment_intent_id,
    ),
    index("payments_status_updated_at_idx").on(
      table.payment_status,
      table.updated_at,
    ),
  ],
);
