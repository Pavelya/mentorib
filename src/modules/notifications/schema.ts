import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { appUsers } from "@/modules/accounts/schema";
import { jobRuns } from "@/modules/jobs/schema";
import {
  notificationChannels,
  notificationDeliveryStatuses,
  notificationStatuses,
  notificationTypes,
  policyNoticeTypes,
} from "@/modules/notifications/constants";

export const policyNoticeVersions = pgTable(
  "policy_notice_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notice_type: text("notice_type", { enum: policyNoticeTypes }).notNull(),
    version_label: text("version_label").notNull(),
    published_at: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    effective_at: timestamp("effective_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    requires_acknowledgement: boolean("requires_acknowledgement")
      .notNull()
      .default(false),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    document_url: text("document_url").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("policy_notice_versions_notice_type_version_key").on(
      table.notice_type,
      table.version_label,
    ),
    index("policy_notice_versions_notice_type_published_at_idx").on(
      table.notice_type,
      table.published_at,
    ),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    app_user_id: uuid("app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    notification_type: text("notification_type", {
      enum: notificationTypes,
    }).notNull(),
    notification_status: text("notification_status", {
      enum: notificationStatuses,
    })
      .notNull()
      .default("unread"),
    object_type: text("object_type").notNull(),
    object_id: uuid("object_id"),
    title: text("title").notNull(),
    body_summary: text("body_summary").notNull(),
    read_at: timestamp("read_at", { withTimezone: true }),
    dismissed_at: timestamp("dismissed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_owner_status_created_at_idx").on(
      table.app_user_id,
      table.notification_status,
      table.created_at,
    ),
    index("notifications_object_idx").on(table.object_type, table.object_id),
  ],
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notification_id: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    job_run_id: uuid("job_run_id").references(() => jobRuns.id, {
      onDelete: "set null",
    }),
    channel: text("channel", { enum: notificationChannels }).notNull(),
    delivery_status: text("delivery_status", {
      enum: notificationDeliveryStatuses,
    })
      .notNull()
      .default("queued"),
    attempt_number: integer("attempt_number").notNull().default(1),
    provider: text("provider"),
    provider_message_id: text("provider_message_id"),
    attempted_at: timestamp("attempted_at", { withTimezone: true }),
    accepted_at: timestamp("accepted_at", { withTimezone: true }),
    failed_at: timestamp("failed_at", { withTimezone: true }),
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
    uniqueIndex("notification_deliveries_attempt_key").on(
      table.notification_id,
      table.channel,
      table.attempt_number,
    ),
    index("notification_deliveries_pending_idx").on(
      table.delivery_status,
      table.created_at,
    ),
    index("notification_deliveries_job_run_idx").on(table.job_run_id),
    uniqueIndex("notification_deliveries_provider_message_key").on(
      table.provider,
      table.provider_message_id,
    ),
  ],
);

export const policyNoticeReceipts = pgTable(
  "policy_notice_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policy_notice_version_id: uuid("policy_notice_version_id")
      .notNull()
      .references(() => policyNoticeVersions.id, { onDelete: "restrict" }),
    app_user_id: uuid("app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    first_shown_at: timestamp("first_shown_at", { withTimezone: true }),
    viewed_at: timestamp("viewed_at", { withTimezone: true }),
    acknowledged_at: timestamp("acknowledged_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("policy_notice_receipts_notice_user_key").on(
      table.policy_notice_version_id,
      table.app_user_id,
    ),
    index("policy_notice_receipts_app_user_notice_idx").on(
      table.app_user_id,
      table.policy_notice_version_id,
    ),
  ],
);
