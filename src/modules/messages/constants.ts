export const conversationStatuses = [
  "active",
  "blocked",
  "archived",
] as const;

export type ConversationStatus = (typeof conversationStatuses)[number];

export const participantRoles = ["student", "tutor"] as const;

export type ParticipantRole = (typeof participantRoles)[number];

export const messageStatuses = [
  "sent",
  "edited",
  "removed",
  "flagged",
] as const;

export type MessageStatus = (typeof messageStatuses)[number];

export const userBlockStatuses = ["active", "released"] as const;

export type UserBlockStatus = (typeof userBlockStatuses)[number];

export const abuseReportTypes = [
  "message",
  "safety",
  "spam",
  "harassment",
  "other",
] as const;

export type AbuseReportType = (typeof abuseReportTypes)[number];

export const abuseReportStatuses = [
  "submitted",
  "under_review",
  "resolved",
  "dismissed",
] as const;

export type AbuseReportStatus = (typeof abuseReportStatuses)[number];
