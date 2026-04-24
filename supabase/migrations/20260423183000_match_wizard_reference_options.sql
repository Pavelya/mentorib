create table public.learning_need_option_values (
  id uuid primary key default gen_random_uuid(),
  option_group text not null,
  option_key text not null,
  display_label text not null,
  helper_text text,
  subject_focus_area_code text references public.subject_focus_areas (focus_area_code),
  allowed_subject_codes text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_need_option_values_option_group_chk check (
    option_group in ('need_type', 'urgency_level', 'session_frequency_intent', 'support_style')
  ),
  constraint learning_need_option_values_option_key_not_blank_chk check (btrim(option_key) <> ''),
  constraint learning_need_option_values_display_label_not_blank_chk check (btrim(display_label) <> ''),
  constraint learning_need_option_values_helper_text_not_blank_chk check (
    helper_text is null or btrim(helper_text) <> ''
  ),
  constraint learning_need_option_values_sort_order_nonnegative_chk check (sort_order >= 0),
  constraint learning_need_option_values_focus_area_consistency_chk check (
    (
      option_group = 'need_type'
      and subject_focus_area_code is not null
    )
    or (
      option_group <> 'need_type'
      and subject_focus_area_code is null
    )
  )
);

comment on table public.learning_need_option_values is
  'Editable wizard option vocabulary for learning-need capture, including need type, urgency, frequency, and support-style choices.';

create unique index learning_need_option_values_group_key
  on public.learning_need_option_values (option_group, option_key);

create trigger set_learning_need_option_values_updated_at
before update on public.learning_need_option_values
for each row execute function public.set_updated_at();

alter table public.learning_need_option_values enable row level security;

create policy learning_need_option_values_select_active
on public.learning_need_option_values
for select
using (is_active = true);

insert into public.subjects (
  subject_code,
  slug,
  display_name,
  sort_order,
  is_active
)
values
  ('english_a', 'english-a', 'English A', 10, true),
  ('mathematics_aa', 'mathematics-analysis-and-approaches', 'Mathematics AA', 20, true),
  ('mathematics_ai', 'mathematics-applications-and-interpretation', 'Mathematics AI', 30, true),
  ('biology', 'biology', 'Biology', 40, true),
  ('chemistry', 'chemistry', 'Chemistry', 50, true),
  ('physics', 'physics', 'Physics', 60, true),
  ('history', 'history', 'History', 70, true),
  ('business_management', 'business-management', 'Business Management', 80, true),
  ('economics', 'economics', 'Economics', 90, true),
  ('psychology', 'psychology', 'Psychology', 100, true),
  ('tok', 'tok', 'TOK', 110, true)
on conflict (subject_code) do update
set
  slug = excluded.slug,
  display_name = excluded.display_name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.subject_focus_areas (
  focus_area_code,
  slug,
  display_name,
  sort_order,
  is_active
)
values
  ('topic_support', 'topic-support', 'Topic help', 10, true),
  ('ia_feedback', 'ia-feedback', 'IA feedback', 20, true),
  ('exam_prep', 'exam-prep', 'Exam prep', 30, true),
  ('essay_support', 'essay-support', 'Essay help', 40, true),
  ('tok_essay', 'tok-essay', 'TOK essay', 50, true),
  ('extended_essay', 'extended-essay', 'Extended essay', 60, true),
  ('oral_practice', 'oral-practice', 'Oral practice', 70, true)
on conflict (focus_area_code) do update
set
  slug = excluded.slug,
  display_name = excluded.display_name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.languages (
  language_code,
  display_name,
  sort_order,
  is_active
)
values
  ('en', 'English', 10, true),
  ('pl', 'Polish', 20, true),
  ('es', 'Spanish', 30, true),
  ('fr', 'French', 40, true)
on conflict (language_code) do update
set
  display_name = excluded.display_name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.learning_need_option_values (
  option_group,
  option_key,
  display_label,
  helper_text,
  subject_focus_area_code,
  allowed_subject_codes,
  sort_order,
  is_active
)
values
  (
    'need_type',
    'topic_help',
    'Topic help',
    'You need a concept explained, practice on a topic, or help getting unstuck.',
    'topic_support',
    array[
      'english_a',
      'mathematics_aa',
      'mathematics_ai',
      'biology',
      'chemistry',
      'physics',
      'history',
      'business_management',
      'economics',
      'psychology',
      'tok'
    ]::text[],
    10,
    true
  ),
  (
    'need_type',
    'ia_feedback',
    'IA feedback',
    'You already have work in progress and want clear, focused feedback.',
    'ia_feedback',
    array[
      'mathematics_aa',
      'mathematics_ai',
      'biology',
      'chemistry',
      'physics',
      'history',
      'business_management',
      'economics',
      'psychology'
    ]::text[],
    20,
    true
  ),
  (
    'need_type',
    'exam_prep',
    'Exam prep',
    'You want targeted help before a test, mock, or final exam.',
    'exam_prep',
    array[
      'english_a',
      'mathematics_aa',
      'mathematics_ai',
      'biology',
      'chemistry',
      'physics',
      'history',
      'business_management',
      'economics',
      'psychology'
    ]::text[],
    30,
    true
  ),
  (
    'need_type',
    'essay_help',
    'Essay help',
    'You want support with structure, argument, drafting, or written feedback.',
    'essay_support',
    array[
      'english_a',
      'history',
      'business_management',
      'economics',
      'psychology'
    ]::text[],
    40,
    true
  ),
  (
    'need_type',
    'tok_essay',
    'TOK essay',
    'You need help with your TOK essay or exhibition thinking.',
    'tok_essay',
    array['tok']::text[],
    50,
    true
  ),
  (
    'need_type',
    'extended_essay',
    'Extended essay',
    'You need help choosing a question, planning structure, or improving a draft.',
    'extended_essay',
    array[
      'english_a',
      'mathematics_aa',
      'mathematics_ai',
      'biology',
      'chemistry',
      'physics',
      'history',
      'business_management',
      'economics',
      'psychology'
    ]::text[],
    60,
    true
  ),
  (
    'need_type',
    'oral_practice',
    'Oral practice',
    'You want speaking practice, timing help, and direct oral feedback.',
    'oral_practice',
    array['english_a']::text[],
    70,
    true
  ),
  (
    'urgency_level',
    'this_week',
    'This week',
    'A deadline or exam is close and you need help soon.',
    null,
    '{}'::text[],
    10,
    true
  ),
  (
    'urgency_level',
    'next_two_weeks',
    'Next 2 weeks',
    'You have a little room, but the next milestone matters.',
    null,
    '{}'::text[],
    20,
    true
  ),
  (
    'urgency_level',
    'this_month',
    'This month',
    'You want to build momentum without last-minute panic.',
    null,
    '{}'::text[],
    30,
    true
  ),
  (
    'urgency_level',
    'flexible',
    'Flexible',
    'You are planning ahead and want the right fit more than speed.',
    null,
    '{}'::text[],
    40,
    true
  ),
  (
    'session_frequency_intent',
    'one_off',
    'One lesson first',
    'Start with one focused session and decide after that.',
    null,
    '{}'::text[],
    10,
    true
  ),
  (
    'session_frequency_intent',
    'short_burst',
    '2–3 lessons',
    'A short run of lessons around a deadline or assessment.',
    null,
    '{}'::text[],
    20,
    true
  ),
  (
    'session_frequency_intent',
    'weekly',
    'Weekly',
    'Regular lessons with continuity and accountability.',
    null,
    '{}'::text[],
    30,
    true
  ),
  (
    'session_frequency_intent',
    'not_sure',
    'Not sure yet',
    'You want to find the right tutor first and decide the rhythm later.',
    null,
    '{}'::text[],
    40,
    true
  ),
  (
    'support_style',
    'clear_explanations',
    'Clear explanations',
    'You want ideas broken down simply before moving into practice.',
    null,
    '{}'::text[],
    10,
    true
  ),
  (
    'support_style',
    'direct_feedback',
    'Direct feedback',
    'You want clear critique on what to change and why.',
    null,
    '{}'::text[],
    20,
    true
  ),
  (
    'support_style',
    'calm_structure',
    'Calm structure',
    'You want a tutor who makes the next steps feel manageable.',
    null,
    '{}'::text[],
    30,
    true
  ),
  (
    'support_style',
    'exam_strategy',
    'Exam strategy',
    'You want timing, exam technique, and smart question approach.',
    null,
    '{}'::text[],
    40,
    true
  ),
  (
    'support_style',
    'accountability',
    'Accountability',
    'You want check-ins, milestones, and momentum between lessons.',
    null,
    '{}'::text[],
    50,
    true
  )
on conflict (option_group, option_key) do update
set
  display_label = excluded.display_label,
  helper_text = excluded.helper_text,
  subject_focus_area_code = excluded.subject_focus_area_code,
  allowed_subject_codes = excluded.allowed_subject_codes,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
