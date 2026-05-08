import { describe, expect, it } from "vitest";

import { redactLogPayload } from "@/lib/observability/redaction";

describe("redactLogPayload", () => {
  it("redacts top-level sensitive keys regardless of casing", () => {
    const result = redactLogPayload({
      Authorization: "Bearer abc",
      password: "hunter2",
      stripe_secret: "sk_live_xxx",
      message: "private",
      safe: "value",
    });

    expect(result.Authorization).toBe("[redacted]");
    expect(result.password).toBe("[redacted]");
    expect(result.stripe_secret).toBe("[redacted]");
    expect(result.message).toBe("[redacted]");
    expect(result.safe).toBe("value");
  });

  it("recursively redacts sensitive keys nested inside arrays and objects", () => {
    const result = redactLogPayload({
      events: [
        { token: "abc", attempt: 1 },
        { token: "def", attempt: 2 },
      ],
      user: {
        id: "u_1",
        meeting_url: "https://meet.example.com/x",
      },
    });

    const events = result.events as Array<Record<string, unknown>>;
    expect(events[0].token).toBe("[redacted]");
    expect(events[0].attempt).toBe(1);
    expect(events[1].token).toBe("[redacted]");

    const user = result.user as Record<string, unknown>;
    expect(user.id).toBe("u_1");
    expect(user.meeting_url).toBe("[redacted]");
  });

  it("truncates very deeply nested structures instead of recursing forever", () => {
    const deepest: Record<string, unknown> = { keep: "value" };
    const payload = {
      a: { b: { c: { d: { e: deepest } } } },
    };

    const result = redactLogPayload(payload);
    const a = result.a as Record<string, unknown>;
    const b = a.b as Record<string, unknown>;
    const c = b.c as Record<string, unknown>;
    const d = c.d as Record<string, unknown>;

    expect(d.e).toBe("[truncated]");
  });

  it("preserves non-sensitive primitives, arrays, and nullish values verbatim", () => {
    const result = redactLogPayload({
      count: 7,
      flag: true,
      missing: null,
      tags: ["a", "b"],
    });

    expect(result.count).toBe(7);
    expect(result.flag).toBe(true);
    expect(result.missing).toBeNull();
    expect(result.tags).toEqual(["a", "b"]);
  });
});
