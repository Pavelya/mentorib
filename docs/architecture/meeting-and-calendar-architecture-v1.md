# Mentor IB Meeting And Calendar Architecture v1

**Date:** 2026-04-08
**Status:** Standalone architecture for lesson meeting access, external conferencing links, and calendar export behavior
**Scope:** lesson meeting-link model, tutor meeting preferences, external meeting providers, meeting-link visibility, lesson snapshots, add-to-calendar behavior, and future calendar-sync posture

## 1. Why This Document Exists

This document defines how Mentor IB should handle the actual meeting access layer for lessons.

It exists now because the approved product already implies the need for:

- a reliable way for tutors and students to join lessons
- clear join actions on lesson surfaces
- support for tutors who already use Google Meet, Zoom, Teams, or similar tools
- calendar actions that help both sides keep scheduled lessons visible

Without an explicit architecture, lesson meeting access tends to become:

- a loose text field on the lesson record
- inconsistent between tutor and student views
- mixed up with public media or messaging concepts
- difficult to evolve later into richer calendar behavior

## 2. What This Document Does Not Redefine

This document does not replace the approved scheduling, media, security, or background-work architecture.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`

It does not define:

- final lesson-room UI
- final reminder copy
- final tutor preference screens
- future two-way calendar synchronization UI

Those can come later as implementation artifacts.

## 3. Core Recommendation

Mentor IB should not build native video conferencing for MVP.

Instead, the MVP should use:

- Mentor IB-owned lesson scheduling and lesson state
- tutor-provided external meeting links
- lesson-scoped meeting access objects
- add-to-calendar actions that do not require full calendar sync

The practical rule is:

- Mentor IB owns lesson scheduling, status, reminders, and continuity
- the conferencing provider owns the actual call
- meeting access belongs to the `Lesson` domain, not the public media domain
- calendar export belongs to lesson operations, not availability logic

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means meeting access and calendar behavior should be:

- explicit
- lesson-scoped
- provider-aware
- snapshot-safe
- privacy-aware

The architecture should not rely on:

- a raw untyped `meeting_url` field with no semantics
- public exposure of lesson links
- calendar behavior inferred from UI copy alone
- ad hoc provider parsing inside components

## 5. Goals

The meeting and calendar architecture should:

- make it easy for tutors to use their existing meeting tools
- keep the product simple and low-cost for MVP
- preserve a consistent join experience across providers
- avoid forcing native conferencing or calendar sync too early
- keep a clean path for richer integrations later

## 6. Main Boundary Rule

Meeting access is not the same thing as public media.

Public tutor intro videos belong to the profile-media architecture.

Lesson meeting links belong to the lesson and scheduling architecture.

The two systems may use similar URL-normalization ideas, but they have different:

- visibility
- lifecycle
- permissions
- product meaning

## 7. Canonical Lesson Meeting Model

## 7.1 Main rule

Every confirmed or bookable lesson that requires live attendance should support one explicit meeting-access model.

## 7.2 Recommended lesson meeting object

The architecture should support a lesson-scoped object such as `LessonMeetingAccess`.

Suggested attributes:

- lesson id
- meeting method
- provider
- join URL
- host URL if distinct later
- display label
- source type
- visibility state
- created at
- last updated at

## 7.3 Recommended meeting methods

At the architecture level, the system should support at least:

- external video call
- custom external meeting room
- in-person later if ever introduced
- no meeting link required only if the lesson type genuinely allows it

For MVP, the active focus is external online meetings.

## 7.4 Source-type rule

The meeting access source should be explicit.

Examples:

- tutor default room
- tutor per-lesson custom link
- platform-generated future link if ever introduced

## 7.5 Visibility rule

Meeting links should be visible only to the lesson participants and authorized internal operators.

They should never appear on:

- public tutor pages
- public metadata
- public structured data
- public analytics payloads

## 8. Tutor Meeting Preference Model

## 8.1 Main rule

Tutors should be able to define a preferred meeting method for operational convenience.

## 8.2 Recommended preference object

The architecture should support a tutor-scoped object such as `TutorMeetingPreference`.

Suggested attributes:

- tutor id
- preferred provider
- default meeting URL
- display label
- active flag
- last validated at

## 8.3 Snapshot rule

A lesson should not depend forever on the tutor's current preference record.

Once a lesson is booked or confirmed, the lesson should store its own stable meeting-access snapshot.

This matches the approved lesson-snapshot scheduling rule.

## 8.4 Override rule

Tutors should be able to override the default meeting link for a specific lesson when needed.

## 9. Provider Support Strategy

## 9.1 Recommended MVP provider posture

Use external meeting providers owned or chosen by tutors.

Do not attempt to provision meetings directly from Mentor IB in MVP.

## 9.2 Recommended MVP recognized providers

The architecture should recognize at least:

- Google Meet
- Zoom
- Microsoft Teams
- Whereby

These are enough to cover common tutor workflows without forcing one provider.

## 9.3 Generic-link fallback

The system may also support a generic secure meeting link if it is:

- valid HTTPS
- not obviously unsafe
- not blocked by policy

This keeps the MVP practical even when tutors use another tool.

## 9.4 No arbitrary embed rule

Meeting links are navigational or launch URLs.

Do not treat them as arbitrary iframe embed content inside the product by default.

The join action should open or route the user to the trusted provider experience.

## 9.5 Provider-normalization rule

Recognized providers should use a small adapter layer responsible for:

- provider detection
- URL validation
- normalized provider labeling
- icon or display treatment

This is similar in spirit to public video references, but it remains a separate domain object.

## 10. Join Experience Architecture

## 10.1 Main rule

The lesson object should drive the join experience, not the provider itself.

## 10.2 Shared join-state rule

Both tutor and student should see the same lesson join state with role-appropriate actions.

Examples:

- join available
- meeting link pending
- meeting changed
- lesson completed

## 10.3 Missing-link rule

If a lesson is confirmed but no meeting link exists yet, the product should represent that explicitly.

Do not pretend the lesson is fully join-ready when it is not.

## 10.4 Change-notification rule

If the meeting access for an upcoming lesson changes, that should flow through the approved notifications and background-work architecture.

## 10.5 Lesson-issue entry rule

If a confirmed or recently started lesson fails operationally, both participants should have a clear `Report issue` action from the lesson surface.

Do not force users into generic support contact just to say the tutor was absent or the meeting link was wrong.

## 10.6 MVP issue-reason rule

The first structured lesson-issue reasons should include:

- tutor absent
- student absent
- wrong or missing meeting link
- major technical problem
- lesson delivered only partially

Structured issue selection should come first, with optional summary text as supporting context.

## 10.7 Reporting-window rule

Lesson-issue reporting should be available only in a bounded operational window tied to the lesson lifecycle.

For MVP, the exact timing should follow the approved lesson policy, but the product should treat it as a short post-start or post-end reporting window rather than an indefinite support form.

## 10.8 Resolution posture

If both tutor and student report the same operational problem, the product may auto-resolve the lesson issue according to policy.

If the reports conflict, or only one side reports a high-impact problem, the lesson issue should move into review rather than immediately applying penalties or payout consequences from a one-sided claim.

## 10.9 Lesson-linking rule

Lesson issues belong to the lesson object and its operational history.

They may link out to support, trust, payout, or notification behavior, but they should not live as ad hoc chat messages or free-floating support notes.

## 11. Security And Privacy Boundaries

## 11.1 Main rule

Meeting links are private operational lesson data.

## 11.2 Exposure rule

Do not leak meeting links into:

- public pages
- public emails beyond intended participants
- open logs
- public analytics systems

## 11.3 Validation rule

Meeting-link save flows should validate:

- valid URL structure
- allowed protocol
- provider classification if recognizable

At minimum, require secure `https://` URLs unless a future approved exception exists.

## 11.4 Rotation rule

If a meeting link is believed to be compromised or wrong, tutors or authorized internal operators should be able to replace it without rewriting lesson history improperly.

## 12. Calendar Architecture

## 12.1 Main rule

Calendar behavior should help users keep lessons visible, but it should not replace the platform's own lesson model.

## 12.2 Recommended MVP calendar posture

For MVP, support:

- add to Google Calendar
- portable calendar export for non-Google users

Do not require:

- Google OAuth calendar sync
- two-way calendar synchronization
- direct event write access to user calendars

## 12.3 Why this is the default

This keeps the system:

- low-friction
- low-cost
- low-risk
- consistent with the current minimal-tools principle

## 12.4 Recommended export model

The architecture should support a lesson-scoped calendar-export layer that can produce:

- a Google Calendar add link
- an `.ics` file or equivalent portable event export

## 12.5 Calendar content rule

Calendar export should reflect the lesson snapshot, including:

- title
- date and time
- timezone
- lesson description or short context
- join link when appropriate

## 12.6 Visibility rule

Do not include more private context in exported calendar content than the feature requires.

Especially for student-facing lessons, the event title and description should be useful without oversharing sensitive notes.

## 13. Add-To-Google-Calendar Posture

## 13.1 Recommended MVP behavior

Expose an `Add to Google Calendar` action from lesson confirmation and lesson detail surfaces.

## 13.2 Architecture rule

This action should be generated from canonical lesson data, not manually typed UI strings.

## 13.3 OAuth rule

Phase 1 should not depend on Google Calendar OAuth integration just to support the add-to-calendar action.

## 13.4 Future sync rule

If true Google Calendar sync becomes strategically valuable later, it should be added as a separate integration layer without replacing the lesson as the canonical scheduling object.

## 14. ICS And Cross-Calendar Posture

## 14.1 Main rule

Google Calendar support should not trap the architecture into Google-only behavior.

## 14.2 Recommended portability rule

The lesson export layer should stay provider-neutral enough to support `.ics` downloads for:

- Apple Calendar
- Outlook
- other compatible calendar tools

## 14.3 Why this matters

This gives the product a practical fallback even if:

- a user does not use Google Calendar
- the Google-specific add flow changes later
- richer sync is postponed indefinitely

## 15. Scheduling Boundary Rule

External meeting and calendar integrations do not replace the approved native availability model.

The system should continue to own:

- availability rules
- slot generation
- booking logic
- lesson status
- reschedule integrity

Meeting access and calendar export sit on top of the lesson layer.

They do not become the source of truth.

## 16. Background Work Integration

## 16.1 Main rule

Meeting-link reminders, calendar-friendly notifications, and join updates should use the approved background-jobs and notifications architecture.

## 16.2 Good async candidates

Good async uses include:

- upcoming lesson reminders
- notification when a meeting link changes
- validation retries for saved external links if needed later

## 16.3 Not-everything-async rule

Saving a tutor meeting link or generating a calendar export should remain simple and synchronous where practical.

## 17. Recommended Phase Scope

## 17.1 Phase 1

Phase 1 should support:

- tutor default external meeting preference
- lesson-specific meeting-link override
- recognized provider labeling
- generic secure-link fallback
- add to Google Calendar action
- `.ics` export

## 17.2 Phase 1.5

Good next candidates:

- stronger tutor meeting-preference management
- richer lesson reminder timing
- better provider-specific labeling and diagnostics

## 17.3 Phase 2

Consider later:

- Google Calendar OAuth sync
- Outlook calendar sync
- automated event updates across connected calendars
- provider-created meeting provisioning if a strong product reason appears

## 18. Decisions To Lock Now

The architecture should lock the following decisions now:

- Mentor IB does not build native conferencing for MVP
- lessons use tutor-provided external meeting links
- meeting access belongs to the lesson domain, not public media
- recognized providers should be normalized through adapter logic
- a generic secure-link fallback is allowed
- calendar support starts with add-to-Google-calendar and `.ics` export
- calendar sync is later and optional
- the lesson remains the canonical scheduling object

## 19. Final Recommendation

Mentor IB should treat meeting access as a lesson-level operational integration, not as a media feature and not as a native conferencing product.

The recommended MVP is:

- tutor-owned external meeting links
- lesson-scoped meeting snapshots
- provider-aware but simple join actions
- add-to-Google-calendar support without OAuth dependency
- `.ics` export for portability

This gives tutors flexibility, keeps the product operationally lightweight, and preserves a clean path for better integrations later without overbuilding the MVP.

## 20. Official Source Notes

The recommendation above is informed by current official documentation for:

- Google Calendar event creation: `https://developers.google.com/workspace/calendar/api/guides/create-events`
- Google Calendar event model: `https://developers.google.com/calendar/api/concepts/events-calendars`
- Google Calendar event insert reference: `https://developers.google.com/workspace/calendar/api/v3/reference/events/insert`
- RFC 5545 iCalendar format: `https://datatracker.ietf.org/doc/html/rfc5545`
