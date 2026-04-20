type LogLevel = "info" | "warn" | "error";

export function logJobsEvent(
  level: LogLevel,
  event: string,
  payload: Record<string, unknown> = {},
) {
  const entry = JSON.stringify({
    level,
    scope: "jobs",
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
