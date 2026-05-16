type LogLevel = "info" | "warn" | "error";

type SafeMessageEventPayload = {
  actor_app_user_id?: string;
  body_length?: number;
  conversation_id?: string;
  message_id?: string;
  reaction_key?: string;
  reason?: string;
  recipient_app_user_id?: string;
  unread_marked?: number;
};

export function logMessagesEvent(
  level: LogLevel,
  event: string,
  payload: SafeMessageEventPayload = {},
) {
  const entry = JSON.stringify({
    level,
    scope: "messages",
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  if (level === "warn") {
    console.warn(entry);
    return;
  }

  console.log(entry);
}
