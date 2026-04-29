type LogLevel = "info" | "warn" | "error";

export function logEmailEvent(
  level: LogLevel,
  event: string,
  payload: Record<string, unknown> = {},
) {
  const entry = JSON.stringify({
    level,
    scope: "email",
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
