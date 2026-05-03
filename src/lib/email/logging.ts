import { logEvent, type LogLevel } from "@/lib/observability/logger";

export function logEmailEvent(
  level: LogLevel,
  event: string,
  payload: Record<string, unknown> = {},
) {
  logEvent("email", level, event, payload);
}
