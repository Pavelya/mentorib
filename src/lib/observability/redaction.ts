// Keys whose values must never appear in operational logs or analytics payloads.
// This list reflects the privacy and security boundaries called out in
// docs/architecture/security-architecture-v1.md and
// docs/architecture/analytics-and-product-telemetry-architecture-v1.md.
const SENSITIVE_KEYS = new Set<string>([
  "api_key",
  "apikey",
  "auth",
  "authorization",
  "card_number",
  "client_secret",
  "credential",
  "free_text_note",
  "freetextnote",
  "join_url",
  "learning_need_note",
  "meeting_link",
  "meeting_url",
  "message",
  "message_body",
  "note",
  "password",
  "payment_intent_secret",
  "raw_body",
  "secret",
  "service_role_key",
  "stripe_secret",
  "token",
  "webhook_secret",
]);

const REDACTED_PLACEHOLDER = "[redacted]";
const MAX_DEPTH = 4;

export function redactLogPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return redact(payload, 0) as Record<string, unknown>;
}

function redact(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) {
    return "[truncated]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry, depth + 1));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        result[key] = REDACTED_PLACEHOLDER;
        continue;
      }
      result[key] = redact(entry, depth + 1);
    }
    return result;
  }

  return value;
}
