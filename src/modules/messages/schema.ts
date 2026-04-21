import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { appUsers, studentProfiles } from "@/modules/accounts/schema";
import { lessons } from "@/modules/lessons/schema";
import {
  abuseReportStatuses,
  abuseReportTypes,
  conversationStatuses,
  messageStatuses,
  participantRoles,
  userBlockStatuses,
} from "@/modules/messages/constants";
import { tutorProfiles } from "@/modules/tutors/schema";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    student_profile_id: uuid("student_profile_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    tutor_profile_id: uuid("tutor_profile_id")
      .notNull()
      .references(() => tutorProfiles.id, { onDelete: "cascade" }),
    conversation_status: text("conversation_status", {
      enum: conversationStatuses,
    })
      .notNull()
      .default("active"),
    last_message_at: timestamp("last_message_at", { withTimezone: true }),
    last_message_id: uuid("last_message_id").references(
      (): AnyPgColumn => messages.id,
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
    uniqueIndex("conversations_student_tutor_pair_key").on(
      table.student_profile_id,
      table.tutor_profile_id,
    ),
    index("conversations_last_message_at_idx").on(table.last_message_at),
  ],
);

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversation_id: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    app_user_id: uuid("app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    participant_role: text("participant_role", { enum: participantRoles }).notNull(),
    is_muted: boolean("is_muted").notNull().default(false),
    is_archived: boolean("is_archived").notNull().default(false),
    joined_at: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("conversation_participants_conversation_app_user_key").on(
      table.conversation_id,
      table.app_user_id,
    ),
    uniqueIndex("conversation_participants_conversation_role_key").on(
      table.conversation_id,
      table.participant_role,
    ),
    index("conversation_participants_app_user_archived_idx").on(
      table.app_user_id,
      table.is_archived,
    ),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversation_id: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    sender_app_user_id: uuid("sender_app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    reply_to_message_id: uuid("reply_to_message_id").references(
      (): AnyPgColumn => messages.id,
      { onDelete: "set null" },
    ),
    body: text("body").notNull(),
    message_status: text("message_status", { enum: messageStatuses })
      .notNull()
      .default("sent"),
    edited_at: timestamp("edited_at", { withTimezone: true }),
    removed_at: timestamp("removed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("messages_conversation_created_at_idx").on(
      table.conversation_id,
      table.created_at,
    ),
    index("messages_sender_created_at_idx").on(
      table.sender_app_user_id,
      table.created_at,
    ),
  ],
);

export const messageReads = pgTable(
  "message_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    message_id: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    app_user_id: uuid("app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    read_at: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("message_reads_message_app_user_key").on(
      table.message_id,
      table.app_user_id,
    ),
    index("message_reads_app_user_read_at_idx").on(table.app_user_id, table.read_at),
  ],
);

export const userBlocks = pgTable(
  "user_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blocker_app_user_id: uuid("blocker_app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    blocked_app_user_id: uuid("blocked_app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    block_status: text("block_status", { enum: userBlockStatuses })
      .notNull()
      .default("active"),
    released_at: timestamp("released_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_blocks_blocker_blocked_key").on(
      table.blocker_app_user_id,
      table.blocked_app_user_id,
    ),
    index("user_blocks_blocked_status_idx").on(
      table.blocked_app_user_id,
      table.block_status,
    ),
  ],
);

export const abuseReports = pgTable(
  "abuse_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporter_app_user_id: uuid("reporter_app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    reported_app_user_id: uuid("reported_app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    conversation_id: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "set null",
    }),
    lesson_id: uuid("lesson_id").references(() => lessons.id, {
      onDelete: "set null",
    }),
    reported_message_id: uuid("reported_message_id").references(
      (): AnyPgColumn => messages.id,
      { onDelete: "set null" },
    ),
    report_type: text("report_type", { enum: abuseReportTypes }).notNull(),
    report_status: text("report_status", { enum: abuseReportStatuses })
      .notNull()
      .default("submitted"),
    summary: text("summary").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("abuse_reports_reported_status_created_at_idx").on(
      table.reported_app_user_id,
      table.report_status,
      table.created_at,
    ),
    index("abuse_reports_reporter_created_at_idx").on(
      table.reporter_app_user_id,
      table.created_at,
    ),
  ],
);
