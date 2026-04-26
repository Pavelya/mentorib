alter table public.subjects
  add column display_description text;

alter table public.subjects
  add constraint subjects_display_description_not_blank_chk check (
    display_description is null or btrim(display_description) <> ''
  );

comment on column public.subjects.display_description is
  'Short description shown next to a subject in match-flow and discovery surfaces.';

update public.subjects
set display_description = case subject_code
  when 'biology' then 'Concepts, data questions, lab work, and revision.'
  when 'business_management' then 'Case analysis, structure, and exam support.'
  when 'chemistry' then 'Calculations, data, concepts, and lab support.'
  when 'economics' then 'Diagrams, explanations, essays, and data response.'
  when 'english_a' then 'Commentary, oral work, essays, and written analysis.'
  when 'history' then 'Source work, essays, structure, and revision.'
  when 'mathematics_aa' then 'Algebra, functions, calculus, and proof-heavy work.'
  when 'mathematics_ai' then 'Modeling, statistics, interpretation, and real-world math.'
  when 'physics' then 'Concepts, calculations, and exam-style problems.'
  when 'psychology' then 'Studies, essays, and structured argument.'
  when 'tok' then 'Essay, exhibition, claims, and knowledge questions.'
  else display_description
end
where subject_code in (
  'biology',
  'business_management',
  'chemistry',
  'economics',
  'english_a',
  'history',
  'mathematics_aa',
  'mathematics_ai',
  'physics',
  'psychology',
  'tok'
);
