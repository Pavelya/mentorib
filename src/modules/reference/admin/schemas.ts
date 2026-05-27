import "server-only";

import {
  REFERENCE_FAMILIES,
  type ReferenceEditableField,
  type ReferenceFamilySlug,
} from "./families";

// Per-family allowlist validation for the `changes` payload accepted by
// the `updateReferenceDataRow` Server Action. The Zod-style strict-shape
// behavior is implemented manually: any key outside the per-family
// allowlist short-circuits with `forbidden` before any write reaches
// Postgres. This is the load-bearing field-allowlist check from
// `P2-OPS-003`.

export type ReferenceChangesPayload = Partial<
  Record<ReferenceEditableField, unknown>
>;

export type ValidationOk = {
  ok: true;
  value: Record<ReferenceEditableField, unknown>;
};

export type ValidationErr = {
  ok: false;
  code: "unrecognized_keys" | "invalid_value";
  message: string;
  keys?: readonly string[];
  field?: ReferenceEditableField;
};

const MAX_TEXT_LENGTH = 120;
const MAX_LONG_TEXT_LENGTH = 2000;
const MAX_SORT_ORDER = 10_000;

export function validateReferenceChanges(
  family: ReferenceFamilySlug,
  changes: Record<string, unknown>,
): ValidationOk | ValidationErr {
  const descriptor = REFERENCE_FAMILIES[family];
  const allowed = new Set<string>(descriptor.editableFields);

  const unrecognized = Object.keys(changes).filter((key) => !allowed.has(key));
  if (unrecognized.length > 0) {
    return {
      code: "unrecognized_keys",
      keys: unrecognized,
      message: `Field not editable: ${unrecognized.join(", ")}.`,
      ok: false,
    };
  }

  const sanitized: Record<string, unknown> = {};
  for (const field of descriptor.editableFields) {
    if (!(field in changes)) {
      continue;
    }
    const raw = changes[field];
    const result = sanitizeField(field, raw);
    if (!result.ok) {
      return result;
    }
    sanitized[field] = result.value;
  }

  return {
    ok: true,
    value: sanitized as Record<ReferenceEditableField, unknown>,
  };
}

function sanitizeField(
  field: ReferenceEditableField,
  raw: unknown,
):
  | { ok: true; value: unknown }
  | ValidationErr {
  switch (field) {
    case "display_name":
    case "display_label": {
      if (typeof raw !== "string" || raw.trim().length === 0) {
        return invalid(field, "must be a non-empty string");
      }
      if (raw.length > MAX_TEXT_LENGTH) {
        return invalid(field, `must be at most ${MAX_TEXT_LENGTH} characters`);
      }
      return { ok: true, value: raw.trim() };
    }
    case "display_description":
    case "helper_text": {
      if (raw === null) {
        return { ok: true, value: null };
      }
      if (typeof raw !== "string") {
        return invalid(field, "must be a string or null");
      }
      const trimmed = raw.trim();
      if (trimmed.length > MAX_LONG_TEXT_LENGTH) {
        return invalid(
          field,
          `must be at most ${MAX_LONG_TEXT_LENGTH} characters`,
        );
      }
      return { ok: true, value: trimmed.length === 0 ? null : trimmed };
    }
    case "sort_order": {
      const numeric =
        typeof raw === "number"
          ? raw
          : typeof raw === "string"
            ? Number.parseInt(raw, 10)
            : NaN;
      if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
        return invalid(field, "must be an integer");
      }
      if (numeric < 0 || numeric > MAX_SORT_ORDER) {
        return invalid(field, `must be between 0 and ${MAX_SORT_ORDER}`);
      }
      return { ok: true, value: numeric };
    }
    case "is_active": {
      if (typeof raw !== "boolean") {
        return invalid(field, "must be a boolean");
      }
      return { ok: true, value: raw };
    }
  }
}

function invalid(
  field: ReferenceEditableField,
  reason: string,
): ValidationErr {
  return {
    code: "invalid_value",
    field,
    message: `${field}: ${reason}.`,
    ok: false,
  };
}
