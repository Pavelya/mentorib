import { describe, expect, it } from "vitest";

import { getInitials } from "@/lib/identity/initials";
import { resolveViewerIdentity } from "@/lib/identity/viewer";

describe("resolveViewerIdentity", () => {
  it("uses full_name when present", () => {
    const viewer = resolveViewerIdentity({
      avatar_url: "https://example.com/me.jpg",
      email: "alex@example.com",
      full_name: "Pavel Yampolsky",
    });

    expect(viewer.displayName).toBe("Pavel Yampolsky");
    expect(viewer.avatarUrl).toBe("https://example.com/me.jpg");
    expect(viewer.settingsHref).toBe("/settings");
    expect(getInitials(viewer.displayName)).toBe("PY");
  });

  it("falls back to email local-part when full_name is blank", () => {
    const viewer = resolveViewerIdentity({
      avatar_url: null,
      email: "alex@example.com",
      full_name: null,
    });

    expect(viewer.displayName).toBe("alex");
    expect(getInitials(viewer.displayName)).toBe("A");
  });

  it("renders email leading digit when full_name is null", () => {
    const viewer = resolveViewerIdentity({
      avatar_url: null,
      email: "2pavelya@gmail.com",
      full_name: null,
    });

    expect(viewer.displayName).toBe("2pavelya");
    expect(getInitials(viewer.displayName)).toBe("2");
  });

  it("handles non-Latin names", () => {
    const viewer = resolveViewerIdentity({
      avatar_url: null,
      email: "lxm@example.com",
      full_name: "李 小明",
    });

    expect(viewer.displayName).toBe("李 小明");
    expect(getInitials(viewer.displayName)).toBe("李小");
  });

  it("treats whitespace-only full_name as missing", () => {
    const viewer = resolveViewerIdentity({
      avatar_url: null,
      email: "kim@example.com",
      full_name: "   ",
    });

    expect(viewer.displayName).toBe("kim");
  });

  it("falls back to ? when neither full_name nor email is usable", () => {
    const viewer = resolveViewerIdentity({
      avatar_url: null,
      email: "",
      full_name: null,
    });

    expect(viewer.displayName).toBe("?");
    expect(getInitials(viewer.displayName)).toBe("?");
  });
});
