import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subject_code: text("subject_code").notNull(),
    slug: text("slug").notNull(),
    display_name: text("display_name").notNull(),
    sort_order: integer("sort_order").notNull().default(0),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("subjects_subject_code_key").on(table.subject_code),
    uniqueIndex("subjects_slug_key").on(table.slug),
  ],
);

export const subjectFocusAreas = pgTable(
  "subject_focus_areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    focus_area_code: text("focus_area_code").notNull(),
    slug: text("slug").notNull(),
    display_name: text("display_name").notNull(),
    sort_order: integer("sort_order").notNull().default(0),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("subject_focus_areas_focus_area_code_key").on(table.focus_area_code),
    uniqueIndex("subject_focus_areas_slug_key").on(table.slug),
  ],
);

export const languages = pgTable("languages", {
  language_code: text("language_code").primaryKey(),
  display_name: text("display_name").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const videoMediaProviders = pgTable("video_media_providers", {
  provider_key: text("provider_key").primaryKey(),
  display_name: text("display_name").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const meetingProviders = pgTable("meeting_providers", {
  provider_key: text("provider_key").primaryKey(),
  display_name: text("display_name").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
