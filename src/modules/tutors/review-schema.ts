import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { appUsers } from "@/modules/accounts/schema";
import { tutorApplicationReviewStatuses } from "@/modules/tutors/review-constants";
import { tutorProfiles } from "@/modules/tutors/schema";

export const tutorApplicationReviews = pgTable(
  "tutor_application_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id, { onDelete: "cascade" }),
    reviewer_app_user_id: uuid("reviewer_app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    review_status: text("review_status", {
      enum: tutorApplicationReviewStatuses,
    }).notNull(),
    reviewer_note: text("reviewer_note"),
    internal_note: text("internal_note"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tutor_application_reviews_tutor_profile_id_idx").on(
      table.tutor_profile_id,
      table.created_at,
    ),
    index("tutor_application_reviews_review_status_created_at_idx").on(
      table.review_status,
      table.created_at,
    ),
    index("tutor_application_reviews_reviewer_app_user_id_idx").on(
      table.reviewer_app_user_id,
    ),
  ],
);
