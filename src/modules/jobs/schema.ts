import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  jobStatuses,
  jobTypes,
  webhookProcessingStatuses,
  webhookProviders,
  webhookVerificationStatuses,
} from "@/modules/jobs/constants";

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider", { enum: webhookProviders }).notNull(),
    provider_event_id: text("provider_event_id").notNull(),
    event_type: text("event_type").notNull(),
    verification_status: text("verification_status", {
      enum: webhookVerificationStatuses,
    }).notNull(),
    processing_status: text("processing_status", {
      enum: webhookProcessingStatuses,
    })
      .notNull()
      .default("received"),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    signature_header: text("signature_header"),
    error_code: text("error_code"),
    error_message: text("error_message"),
    received_at: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    verified_at: timestamp("verified_at", { withTimezone: true }),
    processed_at: timestamp("processed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("webhook_events_provider_event_key").on(
      table.provider,
      table.provider_event_id,
    ),
    index("webhook_events_received_idx").on(table.processing_status, table.received_at),
    index("webhook_events_verified_processing_idx").on(
      table.verification_status,
      table.processing_status,
      table.received_at,
    ),
  ],
);

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    job_type: text("job_type", { enum: jobTypes }).notNull(),
    job_status: text("job_status", { enum: jobStatuses }).notNull().default("queued"),
    dedupe_key: text("dedupe_key"),
    trigger_object_type: text("trigger_object_type"),
    trigger_object_id: text("trigger_object_id"),
    attempt_number: integer("attempt_number").notNull().default(0),
    max_attempts: integer("max_attempts").notNull().default(5),
    available_at: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    claimed_at: timestamp("claimed_at", { withTimezone: true }),
    started_at: timestamp("started_at", { withTimezone: true }),
    finished_at: timestamp("finished_at", { withTimezone: true }),
    last_failed_at: timestamp("last_failed_at", { withTimezone: true }),
    dead_lettered_at: timestamp("dead_lettered_at", { withTimezone: true }),
    failure_code: text("failure_code"),
    failure_message: text("failure_message"),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    result_payload: jsonb("result_payload").$type<Record<string, unknown> | null>(),
    last_error_payload: jsonb("last_error_payload").$type<Record<string, unknown> | null>(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("job_runs_job_type_dedupe_key_key").on(table.job_type, table.dedupe_key),
    index("job_runs_due_idx").on(table.available_at, table.created_at),
    index("job_runs_trigger_object_idx").on(
      table.trigger_object_type,
      table.trigger_object_id,
    ),
  ],
);
