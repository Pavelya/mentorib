import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "@/lib/auth/allowed-redirects";

describe("getSafeRedirectPath", () => {
  it("returns null for empty / nullish candidates", () => {
    expect(getSafeRedirectPath(null)).toBeNull();
    expect(getSafeRedirectPath(undefined)).toBeNull();
    expect(getSafeRedirectPath("")).toBeNull();
    expect(getSafeRedirectPath("   ")).toBeNull();
  });

  it("rejects candidates that are not same-origin paths", () => {
    expect(getSafeRedirectPath("https://evil.example.com")).toBeNull();
    expect(getSafeRedirectPath("//evil.example.com/match")).toBeNull();
    expect(getSafeRedirectPath("javascript:alert(1)")).toBeNull();
  });

  it("rejects paths inside the auth route family", () => {
    expect(getSafeRedirectPath("/auth/sign-in")).toBeNull();
    expect(getSafeRedirectPath("/auth/verify")).toBeNull();
    expect(getSafeRedirectPath("/auth/callback")).toBeNull();
  });

  it("rejects paths that are not on the approved-return allowlist", () => {
    expect(getSafeRedirectPath("/not-a-real-route")).toBeNull();
    expect(getSafeRedirectPath("/internal/moderation/escalate")).toBeNull();
  });

  it("preserves the path, query, and hash for an approved exact route", () => {
    expect(getSafeRedirectPath("/match")).toBe("/match");
    expect(getSafeRedirectPath("/results?subject=math")).toBe(
      "/results?subject=math",
    );
    expect(getSafeRedirectPath("/settings#privacy")).toBe("/settings#privacy");
  });

  it("accepts approved prefix routes", () => {
    expect(getSafeRedirectPath("/book/abc-123")).toBe("/book/abc-123");
    expect(getSafeRedirectPath("/tutors/jane-doe")).toBe("/tutors/jane-doe");
  });
});
