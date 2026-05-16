-- Adds a `self_paused_at` timestamp on `tutor_profiles` so the tutor-facing
-- "Paused by you" state introduced in P2-PROFILE-001 is distinguishable from
-- the auto-flip caused by a failing readiness gate. The canonical
-- `public_listing_status` stays `not_listed` for both — the timestamp only
-- preserves the *origin* of the unlisting so the editor can render the right
-- copy and the right next action.
--
-- Tutor-initiated `paused`/`delisted` remains admin-only per
-- docs/foundations/cross-role-journey-inventory-v1.md J-INT-005 and
-- docs/data/tutor-listing-readiness-model-v1.md §5.2. We do NOT add a new
-- `self_paused` enum value here.

alter table public.tutor_profiles
  add column if not exists self_paused_at timestamptz;

comment on column public.tutor_profiles.self_paused_at is
  'Set when the tutor self-pauses their public listing via /tutor/profile; cleared on resume or admin transitions. Distinguishes tutor-initiated unlisting from gate-regression auto-flips while keeping public_listing_status = not_listed.';

create index if not exists tutor_profiles_self_paused_at_idx
  on public.tutor_profiles (self_paused_at)
  where self_paused_at is not null;

-- Extend `notifications_type_chk` with the new tutor-only
-- `tutor_listing_status_changed` kind so `setTutorListingPublication` and
-- `updateTutorProfile` can queue tutor-facing in-app notices on
-- listed↔not_listed transitions (both tutor-initiated and gate-regression
-- auto-flips). The kind is intentionally tutor-only and in-app only.
alter table public.notifications
  drop constraint notifications_type_chk;

alter table public.notifications
  add constraint notifications_type_chk check (
    notification_type in (
      'new_message',
      'lesson_request_submitted',
      'lesson_accepted',
      'lesson_declined',
      'lesson_request_expired',
      'lesson_updated',
      'upcoming_lesson_reminder',
      'lesson_issue_acknowledgement',
      'lesson_issue_resolution',
      'lesson_report_shared',
      'review_submitted',
      'tutor_application_submitted',
      'tutor_application_reviewed',
      'tutor_listing_status_changed',
      'payout_processed',
      'policy_notice_updated'
    )
  );
