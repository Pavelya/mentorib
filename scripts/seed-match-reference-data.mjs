import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const SUBJECT_ROWS = [
  { subject_code: "english_a", slug: "english-a", display_name: "English A", sort_order: 10, is_active: true },
  {
    subject_code: "mathematics_aa",
    slug: "mathematics-analysis-and-approaches",
    display_name: "Mathematics AA",
    sort_order: 20,
    is_active: true,
  },
  {
    subject_code: "mathematics_ai",
    slug: "mathematics-applications-and-interpretation",
    display_name: "Mathematics AI",
    sort_order: 30,
    is_active: true,
  },
  { subject_code: "biology", slug: "biology", display_name: "Biology", sort_order: 40, is_active: true },
  { subject_code: "chemistry", slug: "chemistry", display_name: "Chemistry", sort_order: 50, is_active: true },
  { subject_code: "physics", slug: "physics", display_name: "Physics", sort_order: 60, is_active: true },
  { subject_code: "history", slug: "history", display_name: "History", sort_order: 70, is_active: true },
  {
    subject_code: "business_management",
    slug: "business-management",
    display_name: "Business Management",
    sort_order: 80,
    is_active: true,
  },
  { subject_code: "economics", slug: "economics", display_name: "Economics", sort_order: 90, is_active: true },
  { subject_code: "psychology", slug: "psychology", display_name: "Psychology", sort_order: 100, is_active: true },
  { subject_code: "tok", slug: "tok", display_name: "TOK", sort_order: 110, is_active: true },
];

const FOCUS_AREA_ROWS = [
  {
    focus_area_code: "topic_support",
    slug: "topic-support",
    display_name: "Topic help",
    sort_order: 10,
    is_active: true,
  },
  {
    focus_area_code: "ia_feedback",
    slug: "ia-feedback",
    display_name: "IA feedback",
    sort_order: 20,
    is_active: true,
  },
  {
    focus_area_code: "exam_prep",
    slug: "exam-prep",
    display_name: "Exam prep",
    sort_order: 30,
    is_active: true,
  },
  {
    focus_area_code: "essay_support",
    slug: "essay-support",
    display_name: "Essay help",
    sort_order: 40,
    is_active: true,
  },
  {
    focus_area_code: "tok_essay",
    slug: "tok-essay",
    display_name: "TOK essay",
    sort_order: 50,
    is_active: true,
  },
  {
    focus_area_code: "extended_essay",
    slug: "extended-essay",
    display_name: "Extended essay",
    sort_order: 60,
    is_active: true,
  },
  {
    focus_area_code: "oral_practice",
    slug: "oral-practice",
    display_name: "Oral practice",
    sort_order: 70,
    is_active: true,
  },
];

const LANGUAGE_ROWS = [
  { language_code: "en", display_name: "English", sort_order: 10, is_active: true },
  { language_code: "pl", display_name: "Polish", sort_order: 20, is_active: true },
  { language_code: "es", display_name: "Spanish", sort_order: 30, is_active: true },
  { language_code: "fr", display_name: "French", sort_order: 40, is_active: true },
];

const OPTION_ROWS = [
  {
    option_group: "need_type",
    option_key: "topic_help",
    display_label: "Topic help",
    helper_text: "You need a concept explained, practice on a topic, or help getting unstuck.",
    subject_focus_area_code: "topic_support",
    allowed_subject_codes: [
      "english_a",
      "mathematics_aa",
      "mathematics_ai",
      "biology",
      "chemistry",
      "physics",
      "history",
      "business_management",
      "economics",
      "psychology",
      "tok",
    ],
    sort_order: 10,
    is_active: true,
  },
  {
    option_group: "need_type",
    option_key: "ia_feedback",
    display_label: "IA feedback",
    helper_text: "You already have work in progress and want clear, focused feedback.",
    subject_focus_area_code: "ia_feedback",
    allowed_subject_codes: [
      "mathematics_aa",
      "mathematics_ai",
      "biology",
      "chemistry",
      "physics",
      "history",
      "business_management",
      "economics",
      "psychology",
    ],
    sort_order: 20,
    is_active: true,
  },
  {
    option_group: "need_type",
    option_key: "exam_prep",
    display_label: "Exam prep",
    helper_text: "You want targeted help before a test, mock, or final exam.",
    subject_focus_area_code: "exam_prep",
    allowed_subject_codes: [
      "english_a",
      "mathematics_aa",
      "mathematics_ai",
      "biology",
      "chemistry",
      "physics",
      "history",
      "business_management",
      "economics",
      "psychology",
    ],
    sort_order: 30,
    is_active: true,
  },
  {
    option_group: "need_type",
    option_key: "essay_help",
    display_label: "Essay help",
    helper_text: "You want support with structure, argument, drafting, or written feedback.",
    subject_focus_area_code: "essay_support",
    allowed_subject_codes: [
      "english_a",
      "history",
      "business_management",
      "economics",
      "psychology",
    ],
    sort_order: 40,
    is_active: true,
  },
  {
    option_group: "need_type",
    option_key: "tok_essay",
    display_label: "TOK essay",
    helper_text: "You need help with your TOK essay or exhibition thinking.",
    subject_focus_area_code: "tok_essay",
    allowed_subject_codes: ["tok"],
    sort_order: 50,
    is_active: true,
  },
  {
    option_group: "need_type",
    option_key: "extended_essay",
    display_label: "Extended essay",
    helper_text: "You need help choosing a question, planning structure, or improving a draft.",
    subject_focus_area_code: "extended_essay",
    allowed_subject_codes: [
      "english_a",
      "mathematics_aa",
      "mathematics_ai",
      "biology",
      "chemistry",
      "physics",
      "history",
      "business_management",
      "economics",
      "psychology",
    ],
    sort_order: 60,
    is_active: true,
  },
  {
    option_group: "need_type",
    option_key: "oral_practice",
    display_label: "Oral practice",
    helper_text: "You want speaking practice, timing help, and direct oral feedback.",
    subject_focus_area_code: "oral_practice",
    allowed_subject_codes: ["english_a"],
    sort_order: 70,
    is_active: true,
  },
  {
    option_group: "urgency_level",
    option_key: "this_week",
    display_label: "This week",
    helper_text: "A deadline or exam is close and you need help soon.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 10,
    is_active: true,
  },
  {
    option_group: "urgency_level",
    option_key: "next_two_weeks",
    display_label: "Next 2 weeks",
    helper_text: "You have a little room, but the next milestone matters.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 20,
    is_active: true,
  },
  {
    option_group: "urgency_level",
    option_key: "this_month",
    display_label: "This month",
    helper_text: "You want to build momentum without last-minute panic.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 30,
    is_active: true,
  },
  {
    option_group: "urgency_level",
    option_key: "flexible",
    display_label: "Flexible",
    helper_text: "You are planning ahead and want the right fit more than speed.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 40,
    is_active: true,
  },
  {
    option_group: "session_frequency_intent",
    option_key: "one_off",
    display_label: "One lesson first",
    helper_text: "Start with one focused session and decide after that.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 10,
    is_active: true,
  },
  {
    option_group: "session_frequency_intent",
    option_key: "short_burst",
    display_label: "2-3 lessons",
    helper_text: "A short run of lessons around a deadline or assessment.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 20,
    is_active: true,
  },
  {
    option_group: "session_frequency_intent",
    option_key: "weekly",
    display_label: "Weekly",
    helper_text: "Regular lessons with continuity and accountability.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 30,
    is_active: true,
  },
  {
    option_group: "session_frequency_intent",
    option_key: "not_sure",
    display_label: "Not sure yet",
    helper_text: "You want to find the right tutor first and decide the rhythm later.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 40,
    is_active: true,
  },
  {
    option_group: "support_style",
    option_key: "clear_explanations",
    display_label: "Clear explanations",
    helper_text: "You want ideas broken down simply before moving into practice.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 10,
    is_active: true,
  },
  {
    option_group: "support_style",
    option_key: "direct_feedback",
    display_label: "Direct feedback",
    helper_text: "You want clear critique on what to change and why.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 20,
    is_active: true,
  },
  {
    option_group: "support_style",
    option_key: "calm_structure",
    display_label: "Calm structure",
    helper_text: "You want a tutor who makes the next steps feel manageable.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 30,
    is_active: true,
  },
  {
    option_group: "support_style",
    option_key: "exam_strategy",
    display_label: "Exam strategy",
    helper_text: "You want timing, exam technique, and smart question approach.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 40,
    is_active: true,
  },
  {
    option_group: "support_style",
    option_key: "accountability",
    display_label: "Accountability",
    helper_text: "You want check-ins, milestones, and momentum between lessons.",
    subject_focus_area_code: null,
    allowed_subject_codes: [],
    sort_order: 50,
    is_active: true,
  },
];

async function main() {
  const env = await readLocalEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await upsertTable(supabase, "subjects", SUBJECT_ROWS, "subject_code");
  await upsertTable(supabase, "subject_focus_areas", FOCUS_AREA_ROWS, "focus_area_code");
  await upsertTable(supabase, "languages", LANGUAGE_ROWS, "language_code");

  const optionSeedResult = await tryUpsertOptions(supabase);
  const counts = await loadCounts(supabase);

  console.log("Seeded match reference data.");
  console.log(JSON.stringify({ counts, optionSeedResult }, null, 2));
}

async function readLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  const file = await readFile(envPath, "utf8");
  const entries = file
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separatorIndex = line.indexOf("=");

      if (separatorIndex === -1) {
        return null;
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "");

      return [key, value];
    })
    .filter(Boolean);

  return Object.fromEntries(entries);
}

async function upsertTable(supabase, table, rows, onConflict) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict });

  if (error) {
    throw new Error(`Failed to seed ${table}: ${error.message}`);
  }
}

async function tryUpsertOptions(supabase) {
  const { error } = await supabase
    .from("learning_need_option_values")
    .upsert(OPTION_ROWS, { onConflict: "option_group,option_key" });

  if (!error) {
    return "learning_need_option_values seeded";
  }

  if (isMissingTableError(error)) {
    return "learning_need_option_values skipped (table not present in remote database yet)";
  }

  throw new Error(`Failed to seed learning_need_option_values: ${error.message}`);
}

async function loadCounts(supabase) {
  const [subjects, focusAreas, languages, optionValues] = await Promise.all([
    countRows(supabase, "subjects"),
    countRows(supabase, "subject_focus_areas"),
    countRows(supabase, "languages"),
    countRows(supabase, "learning_need_option_values"),
  ]);

  return {
    subjects,
    subject_focus_areas: focusAreas,
    languages,
    learning_need_option_values: optionValues,
  };
}

async function countRows(supabase, table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    if (isMissingTableError(error)) {
      return null;
    }

    throw new Error(`Failed to count ${table}: ${error.message}`);
  }

  return count ?? 0;
}

function isMissingTableError(error) {
  return (
    error?.code === "42P01" ||
    error?.message?.includes("Could not find the table") ||
    error?.message?.includes("relation") && error?.message?.includes("does not exist")
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
