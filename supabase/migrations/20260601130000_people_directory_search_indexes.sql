-- Trigram search indexes for the admin people directories (P2-ADMIN-PEOPLE-001).
--
-- The student / tutor / admin directories search accounts with case-insensitive
-- substring matching on name + email:
--
--   full_name ILIKE '%term%' OR email ILIKE '%term%'
--
-- A leading-wildcard ILIKE cannot use a B-tree index and degrades to a
-- sequential scan as the user base grows. pg_trgm GIN indexes make these
-- ILIKE lookups index-backed, keeping the admin-only directories fast at scale
-- without copying any account PII to an external search service.
--
-- Additive, non-destructive (migration-conventions §4: additive before
-- destructive): indexes + extension only. No column, RLS, or data change. The
-- directories already work without these; this is purely a performance
-- baseline. `concurrently` is intentionally omitted so the statements stay
-- transactional inside the migration runner — the table is small enough at
-- rollout that the brief build lock is acceptable.

create extension if not exists pg_trgm with schema extensions;

create index if not exists app_users_full_name_trgm_idx
  on public.app_users using gin (full_name extensions.gin_trgm_ops);

create index if not exists app_users_email_trgm_idx
  on public.app_users using gin (email extensions.gin_trgm_ops);
