import { logEvent, type LogLevel } from "@/lib/observability/logger";

export function logJobsEvent(
  level: LogLevel,
  event: string,
  payload: Record<string, unknown> = {},
) {
  logEvent("jobs", level, event, payload);
}
