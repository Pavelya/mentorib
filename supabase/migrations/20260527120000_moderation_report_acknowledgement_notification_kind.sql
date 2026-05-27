-- Adds the `moderation_report_acknowledgement` notification kind so the
-- trust-and-safety surface introduced by `P2-OPS-001` can dispatch a
-- generic in-app heads-up to a reporter when their report is resolved
-- (upheld or rejected). The notification carries no details about the
-- resolved party — only that the report was reviewed.
--
-- This notification is mandatory (operators cannot opt out at the
-- preference layer) but in-app only; the email-mapping module short-
-- circuits delivery for this type so the notification never leaks
-- through email.

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
      'moderation_report_acknowledgement',
      'payout_processed',
      'policy_notice_updated'
    )
  );
