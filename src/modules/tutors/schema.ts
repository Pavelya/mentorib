import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { appUsers } from "@/modules/accounts/schema";
import {
  languages,
  subjectFocusAreas,
  subjects,
  videoMediaProviders,
} from "@/modules/reference/schema";
import {
  availabilityOverrideTypes,
  availabilityRuleVisibilityStatuses,
  payoutReadinessStatuses,
  tutorApplicationStatuses,
  tutorCredentialReviewStatuses,
  tutorProfileVisibilityStatuses,
  tutorPublicListingStatuses,
} from "@/modules/tutors/constants";

export const tutorProfiles = pgTable(
  "tutor_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    app_user_id: uuid("app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    display_name: text("display_name"),
    public_slug: text("public_slug"),
    headline: text("headline"),
    bio: text("bio"),
    teaching_style_summary: text("teaching_style_summary"),
    best_for_summary: text("best_for_summary"),
    pricing_summary: text("pricing_summary"),
    profile_visibility_status: text("profile_visibility_status", {
      enum: tutorProfileVisibilityStatuses,
    })
      .notNull()
      .default("draft"),
    application_status: text("application_status", {
      enum: tutorApplicationStatuses,
    })
      .notNull()
      .default("not_started"),
    public_listing_status: text("public_listing_status", {
      enum: tutorPublicListingStatuses,
    })
      .notNull()
      .default("not_listed"),
    payout_readiness_status: text("payout_readiness_status", {
      enum: payoutReadinessStatuses,
    })
      .notNull()
      .default("not_started"),
    intro_video_provider: text("intro_video_provider").references(
      () => videoMediaProviders.provider_key,
    ),
    intro_video_external_id: text("intro_video_external_id"),
    intro_video_url: text("intro_video_url"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tutor_profiles_app_user_id_key").on(table.app_user_id),
    uniqueIndex("tutor_profiles_public_slug_key").on(table.public_slug),
    index("tutor_profiles_application_status_idx").on(table.application_status),
    index("tutor_profiles_public_listing_visibility_idx").on(
      table.public_listing_status,
      table.profile_visibility_status,
    ),
  ],
);

export const tutorSubjectCapabilities = pgTable(
  "tutor_subject_capabilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id, { onDelete: "cascade" }),
    subject_id: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    subject_focus_area_id: uuid("subject_focus_area_id")
      .notNull()
      .references(() => subjectFocusAreas.id),
    experience_summary: text("experience_summary"),
    display_priority: integer("display_priority").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tutor_subject_capabilities_scope_key").on(
      table.tutor_profile_id,
      table.subject_id,
      table.subject_focus_area_id,
    ),
    index("tutor_subject_capabilities_subject_id_idx").on(table.subject_id),
    index("tutor_subject_capabilities_priority_idx").on(
      table.tutor_profile_id,
      table.display_priority,
    ),
  ],
);

export const tutorLanguageCapabilities = pgTable(
  "tutor_language_capabilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id, { onDelete: "cascade" }),
    language_code: text("language_code")
      .notNull()
      .references(() => languages.language_code),
    display_priority: integer("display_priority").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tutor_language_capabilities_scope_key").on(
      table.tutor_profile_id,
      table.language_code,
    ),
    index("tutor_language_capabilities_language_code_idx").on(table.language_code),
    index("tutor_language_capabilities_priority_idx").on(
      table.tutor_profile_id,
      table.display_priority,
    ),
  ],
);

export const tutorCredentials = pgTable(
  "tutor_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id, { onDelete: "cascade" }),
    credential_type: text("credential_type").notNull(),
    title: text("title").notNull(),
    issuing_body: text("issuing_body"),
    storage_object_path: text("storage_object_path").notNull(),
    review_status: text("review_status", {
      enum: tutorCredentialReviewStatuses,
    })
      .notNull()
      .default("uploaded"),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    public_display_preference: boolean("public_display_preference")
      .notNull()
      .default(false),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tutor_credentials_tutor_profile_id_review_status_idx").on(
      table.tutor_profile_id,
      table.review_status,
    ),
  ],
);

export const schedulePolicies = pgTable(
  "schedule_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id, { onDelete: "cascade" }),
    timezone: text("timezone").notNull().default("UTC"),
    minimum_notice_minutes: integer("minimum_notice_minutes")
      .notNull()
      .default(480),
    buffer_before_minutes: integer("buffer_before_minutes").notNull().default(0),
    buffer_after_minutes: integer("buffer_after_minutes").notNull().default(0),
    daily_capacity: integer("daily_capacity"),
    weekly_capacity: integer("weekly_capacity"),
    is_accepting_new_students: boolean("is_accepting_new_students")
      .notNull()
      .default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("schedule_policies_tutor_profile_id_key").on(table.tutor_profile_id)],
);

export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id, { onDelete: "cascade" }),
    day_of_week: integer("day_of_week").notNull(),
    start_local_time: time("start_local_time").notNull(),
    end_local_time: time("end_local_time").notNull(),
    visibility_status: text("visibility_status", {
      enum: availabilityRuleVisibilityStatuses,
    })
      .notNull()
      .default("active"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("availability_rules_tutor_day_window_key").on(
      table.tutor_profile_id,
      table.day_of_week,
      table.start_local_time,
      table.end_local_time,
    ),
    index("availability_rules_tutor_profile_id_day_visibility_idx").on(
      table.tutor_profile_id,
      table.day_of_week,
      table.visibility_status,
    ),
  ],
);

export const availabilityOverrides = pgTable(
  "availability_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id, { onDelete: "cascade" }),
    override_date: date("override_date", { mode: "string" }).notNull(),
    override_type: text("override_type", {
      enum: availabilityOverrideTypes,
    }).notNull(),
    start_local_time: time("start_local_time"),
    end_local_time: time("end_local_time"),
    reason: text("reason"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("availability_overrides_tutor_profile_id_override_date_idx").on(
      table.tutor_profile_id,
      table.override_date,
    ),
  ],
);
