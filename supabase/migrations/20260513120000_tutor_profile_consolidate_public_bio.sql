-- Consolidates the two free-text tutor-profile copy columns
-- (`best_for_summary`, `teaching_style_summary`) into the existing
-- `bio` column. The Gate 2 listing-readiness evaluator and the
-- `P2-APPLY-001` tutor application now collect one bio field, so the
-- separate columns no longer carry distinct meaning.
--
-- Backfill rule: when `bio` is blank we copy the first non-blank value
-- from `teaching_style_summary` then `best_for_summary` so existing
-- profiles keep a non-empty bio after the drop.
--
-- Snapshot copies on `match_candidates.best_for_summary` are unaffected
-- because that column is a per-match-run cache, not a profile field.

update public.tutor_profiles
set bio = coalesce(
  nullif(btrim(teaching_style_summary), ''),
  nullif(btrim(best_for_summary), '')
)
where nullif(btrim(bio), '') is null;

alter table public.tutor_profiles
  drop constraint if exists tutor_profiles_teaching_style_summary_not_blank_chk,
  drop constraint if exists tutor_profiles_best_for_summary_not_blank_chk,
  drop column teaching_style_summary,
  drop column best_for_summary;

comment on column public.tutor_profiles.bio is
  'Public-facing tutor bio shown on the public profile and used to satisfy Gate 2 of the listing readiness model. Replaces the legacy best_for_summary and teaching_style_summary columns.';
