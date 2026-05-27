-- Policy-notice draft/publish/revoke baseline for `P2-OPS-003`.
--
-- The shipped `policy_notice_versions` table (20260421130000) defaults
-- `published_at` to `now()` and constrains it `not null`. The admin
-- policy-broadcast surface in `P2-OPS-003` introduces an explicit draft →
-- publish → revoke lifecycle:
--
--   * draft  → row exists with `published_at IS NULL`
--   * publish → `published_at = now()`
--   * revoke  → `published_at = NULL`
--
-- The existing legal-notice reader (`listLegalNoticesForAccount`) already
-- filters on `published_at <= now()`, so nullable `published_at` is the
-- minimal change needed: an unpublished or revoked row simply no longer
-- matches the filter and is invisible to consumers.

alter table public.policy_notice_versions
  alter column published_at drop not null;

alter table public.policy_notice_versions
  alter column published_at drop default;

comment on column public.policy_notice_versions.published_at is
  'Timestamp at which the notice version became visible to consumers. NULL means draft or revoked (P2-OPS-003).';
