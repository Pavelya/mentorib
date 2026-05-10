-- P15-DATA-003: Structured examiner credential typing.
-- Backfill existing free-text `credential_type` values into the canonical
-- enumerated taxonomy and add nullable subject / focus-area FK columns so SEO
-- pages, public profiles, match cards, and admin surfaces can derive examiner
-- badges and "examiners on staff" counts from a real signal.
--
-- The backfill is non-throwing: any unmappable existing label is tagged
-- `professional_certification` so the new check constraint is satisfied for
-- every pre-existing row.

update public.tutor_credentials
set credential_type = case
  when lower(btrim(credential_type)) in (
    'examiner',
    'ib examiner',
    'ib_examiner',
    'subject examiner',
    'examiner (ib)'
  ) then 'examiner'
  when lower(btrim(credential_type)) in (
    'teaching_qualification',
    'teaching qualification',
    'qts',
    'pgce',
    'teaching_license',
    'teaching license',
    'teacher_certification'
  ) then 'teaching_qualification'
  when lower(btrim(credential_type)) in (
    'degree',
    'bachelor',
    'bachelors',
    'bsc',
    'ba',
    'masters',
    'master',
    'msc',
    'ma',
    'phd',
    'doctorate'
  ) then 'degree'
  when lower(btrim(credential_type)) in (
    'language_certification',
    'language certification',
    'cefr',
    'ielts',
    'toefl',
    'delf',
    'dele',
    'goethe'
  ) then 'language_certification'
  else 'professional_certification'
end
where credential_type is not null;

alter table public.tutor_credentials
  drop constraint if exists tutor_credentials_credential_type_not_blank_chk,
  add constraint tutor_credentials_credential_type_chk check (
    credential_type in (
      'examiner',
      'teaching_qualification',
      'degree',
      'professional_certification',
      'language_certification'
    )
  );

alter table public.tutor_credentials
  add column credential_subject_id uuid references public.subjects (id),
  add column credential_subject_focus_area_id uuid references public.subject_focus_areas (id),
  add constraint tutor_credentials_examiner_scope_chk check (
    credential_type <> 'examiner'
    or credential_subject_id is not null
    or credential_subject_focus_area_id is not null
  );

comment on column public.tutor_credentials.credential_type is
  'Enumerated credential taxonomy. Examiner rows must reference at least one of credential_subject_id or credential_subject_focus_area_id.';

comment on column public.tutor_credentials.credential_subject_id is
  'Optional FK to subjects.id. Required (with or alongside credential_subject_focus_area_id) for examiner credentials so examiner counts can be aggregated per subject.';

comment on column public.tutor_credentials.credential_subject_focus_area_id is
  'Optional FK to subject_focus_areas.id. Required (with or alongside credential_subject_id) for examiner credentials so examiner counts can be aggregated per focus area.';

create index tutor_credentials_examiner_subject_idx
  on public.tutor_credentials (credential_subject_id)
  where credential_type = 'examiner' and credential_subject_id is not null;

create index tutor_credentials_examiner_focus_area_idx
  on public.tutor_credentials (credential_subject_focus_area_id)
  where credential_type = 'examiner' and credential_subject_focus_area_id is not null;
