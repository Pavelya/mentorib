import {
  index,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  accountStatuses,
  onboardingStates,
  primaryRoleContexts,
  roles,
  roleStatuses,
} from "@/modules/accounts/constants";

const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auth_user_id: uuid("auth_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    full_name: text("full_name"),
    avatar_url: text("avatar_url"),
    timezone: text("timezone").notNull().default("UTC"),
    preferred_language_code: text("preferred_language_code"),
    onboarding_state: text("onboarding_state", {
      enum: onboardingStates,
    })
      .notNull()
      .default("role_pending"),
    account_status: text("account_status", {
      enum: accountStatuses,
    })
      .notNull()
      .default("active"),
    primary_role_context: text("primary_role_context", {
      enum: primaryRoleContexts,
    }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("app_users_auth_user_id_key").on(table.auth_user_id),
    index("app_users_onboarding_state_idx").on(table.onboarding_state),
    index("app_users_primary_role_context_idx").on(table.primary_role_context),
  ],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    app_user_id: uuid("app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    role: text("role", { enum: roles }).notNull(),
    role_status: text("role_status", { enum: roleStatuses }).notNull(),
    granted_at: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_roles_app_user_id_role_key").on(table.app_user_id, table.role),
    index("user_roles_app_user_id_role_status_idx").on(
      table.app_user_id,
      table.role_status,
    ),
  ],
);

export const studentProfiles = pgTable(
  "student_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    app_user_id: uuid("app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    display_name: text("display_name"),
    current_stage_summary: text("current_stage_summary"),
    notes_visibility_preference: text("notes_visibility_preference"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("student_profiles_app_user_id_key").on(table.app_user_id)],
);

export const tutorProfiles = pgTable(
  "tutor_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    app_user_id: uuid("app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("tutor_profiles_app_user_id_key").on(table.app_user_id)],
);
