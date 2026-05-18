-- Adds the `tutor_credential_reviewed` notification kind so the internal
-- credential review panel introduced by `P2-MEDIA-001-09` can dispatch an
-- in-app + email notification when an admin approves, rejects, or marks a
-- tutor credential expired.
--
-- The kind shares the existing `tutor_application_updates` notification
-- category (see `src/modules/notifications/constants.ts`) — there is no new
-- preference toggle. Mandatory delivery is not required: the tutor can opt
-- out at the category level.

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
      'tutor_credential_reviewed',
      'tutor_listing_status_changed',
      'payout_processed',
      'policy_notice_updated'
    )
  );
