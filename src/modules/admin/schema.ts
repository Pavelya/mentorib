import {
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { appUsers } from "@/modules/accounts/schema";
import {
  MODERATION_CASE_KINDS,
  MODERATION_CASE_RESOLUTION_KINDS,
  MODERATION_CASE_STATUSES,
  MODERATION_CASE_SUBJECT_KINDS,
  SUPPORT_TICKET_CHANNELS,
  SUPPORT_TICKET_STATUSES,
} from "@/modules/admin/constants";

export const adminActionLogs = pgTable(
  "admin_action_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actor_app_user_id: uuid("actor_app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    action_key: text("action_key").notNull(),
    target_type: text("target_type").notNull(),
    target_id: text("target_id").notNull(),
    before_state: jsonb("before_state"),
    after_state: jsonb("after_state"),
    reason: text("reason"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_action_logs_actor_app_user_id_created_at_idx").on(
      table.actor_app_user_id,
      table.created_at,
    ),
    index("admin_action_logs_target_type_target_id_created_at_idx").on(
      table.target_type,
      table.target_id,
      table.created_at,
    ),
    index("admin_action_logs_action_key_created_at_idx").on(
      table.action_key,
      table.created_at,
    ),
  ],
);

export const moderationCases = pgTable(
  "moderation_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    case_kind: text("case_kind", {
      enum: MODERATION_CASE_KINDS,
    }).notNull(),
    case_status: text("case_status", {
      enum: MODERATION_CASE_STATUSES,
    })
      .notNull()
      .default("queued"),
    reporter_app_user_id: uuid("reporter_app_user_id").references(
      () => appUsers.id,
      { onDelete: "set null" },
    ),
    subject_kind: text("subject_kind", {
      enum: MODERATION_CASE_SUBJECT_KINDS,
    }).notNull(),
    subject_id: uuid("subject_id").notNull(),
    triggering_event_kind: text("triggering_event_kind"),
    triggering_event_id: uuid("triggering_event_id"),
    priority: smallint("priority").notNull().default(0),
    claimed_by_app_user_id: uuid("claimed_by_app_user_id").references(
      () => appUsers.id,
      { onDelete: "set null" },
    ),
    claimed_at: timestamp("claimed_at", { withTimezone: true }),
    resolved_by_app_user_id: uuid("resolved_by_app_user_id").references(
      () => appUsers.id,
      { onDelete: "set null" },
    ),
    resolved_at: timestamp("resolved_at", { withTimezone: true }),
    resolution_kind: text("resolution_kind", {
      enum: MODERATION_CASE_RESOLUTION_KINDS,
    }),
    internal_summary: text("internal_summary"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("moderation_cases_queue_priority_idx").on(
      table.case_status,
      table.priority,
      table.created_at,
    ),
    index("moderation_cases_subject_idx").on(
      table.subject_kind,
      table.subject_id,
    ),
  ],
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requester_app_user_id: uuid("requester_app_user_id").references(
      () => appUsers.id,
      { onDelete: "set null" },
    ),
    requester_email: text("requester_email").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    channel: text("channel", { enum: SUPPORT_TICKET_CHANNELS })
      .notNull()
      .default("contact_form"),
    status: text("status", { enum: SUPPORT_TICKET_STATUSES })
      .notNull()
      .default("open"),
    assigned_to_app_user_id: uuid("assigned_to_app_user_id").references(
      () => appUsers.id,
      { onDelete: "set null" },
    ),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("support_tickets_status_created_at_idx").on(
      table.status,
      table.created_at,
    ),
    index("support_tickets_requester_email_created_at_idx").on(
      table.requester_email,
      table.created_at,
    ),
  ],
);

export const moderationCaseNotes = pgTable(
  "moderation_case_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    case_id: uuid("case_id")
      .notNull()
      .references(() => moderationCases.id, { onDelete: "cascade" }),
    author_app_user_id: uuid("author_app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("moderation_case_notes_case_id_created_at_idx").on(
      table.case_id,
      table.created_at,
    ),
  ],
);
