import {
  index,
  integer,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { studentProfiles } from "@/modules/accounts/schema";
import { lessons } from "@/modules/lessons/schema";
import { reviewStatuses } from "@/modules/reviews/constants";
import { tutorProfiles } from "@/modules/tutors/schema";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lesson_id: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    student_profile_id: uuid("student_profile_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id, { onDelete: "cascade" }),
    rating_value: smallint("rating_value").notNull(),
    comment: text("comment"),
    review_status: text("review_status", { enum: reviewStatuses })
      .notNull()
      .default("published"),
    submitted_at: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    published_at: timestamp("published_at", { withTimezone: true }),
    flagged_at: timestamp("flagged_at", { withTimezone: true }),
    moderation_note: text("moderation_note"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("reviews_lesson_id_key").on(table.lesson_id),
    index("reviews_tutor_status_idx").on(
      table.tutor_profile_id,
      table.review_status,
    ),
    index("reviews_tutor_published_at_idx").on(
      table.tutor_profile_id,
      table.published_at,
    ),
    index("reviews_student_submitted_at_idx").on(
      table.student_profile_id,
      table.submitted_at,
    ),
  ],
);

export const tutorRatingSnapshot = pgTable("tutor_rating_snapshot", {
  tutor_profile_id: uuid("tutor_profile_id")
    .primaryKey()
    .references(() => tutorProfiles.id, { onDelete: "cascade" }),
  published_review_count: integer("published_review_count").notNull().default(0),
  rating_sum: integer("rating_sum").notNull().default(0),
  average_rating_value: numeric("average_rating_value", {
    precision: 4,
    scale: 3,
  }),
  smoothed_rating_value: numeric("smoothed_rating_value", {
    precision: 4,
    scale: 3,
  }),
  prior_review_count: integer("prior_review_count").notNull().default(5),
  prior_rating_value: numeric("prior_rating_value", {
    precision: 4,
    scale: 3,
  })
    .notNull()
    .default("4.500"),
  aggregation_version: text("aggregation_version").notNull().default("v1"),
  last_recomputed_at: timestamp("last_recomputed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
