import { getRuntimeEnvironment } from "@/lib/observability/env";
import { redactLogPayload } from "@/lib/observability/redaction";

export type LogLevel = "info" | "warn" | "error";

export type LogScope =
  | "analytics"
  | "auth"
  | "booking"
  | "email"
  | "jobs"
  | "match"
  | "stripe"
  | "webhook";

type LogPayload = Record<string, unknown>;

export function logEvent(
  scope: LogScope,
  level: LogLevel,
  event: string,
  payload: LogPayload = {},
) {
  const entry = JSON.stringify({
    level,
    scope,
    event,
    environment: getRuntimeEnvironment(),
    timestamp: new Date().toISOString(),
    ...redactLogPayload(payload),
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
