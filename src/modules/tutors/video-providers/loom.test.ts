import { describe, expect, it } from "vitest";

import { loomAdapter } from "./loom";

const VALID_ID = "1234567890abcdef1234567890abcdef";

describe("loomAdapter.parseUrl", () => {
  it("parses loom.com/share/ID URL", () => {
    const result = loomAdapter.parseUrl(
      `https://www.loom.com/share/${VALID_ID}`,
    );
    expect(result).toEqual({
      externalId: VALID_ID,
      canonicalWatchUrl: `https://www.loom.com/share/${VALID_ID}`,
      canonicalEmbedUrl: `https://www.loom.com/embed/${VALID_ID}`,
    });
  });

  it("parses loom.com/embed/ID URL", () => {
    const result = loomAdapter.parseUrl(
      `https://www.loom.com/embed/${VALID_ID}`,
    );
    expect(result?.externalId).toBe(VALID_ID);
    expect(result?.canonicalEmbedUrl).toBe(
      `https://www.loom.com/embed/${VALID_ID}`,
    );
  });

  it("parses share URL with query params", () => {
    const result = loomAdapter.parseUrl(
      `https://www.loom.com/share/${VALID_ID}?sid=abc-123`,
    );
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("parses URL without www subdomain", () => {
    const result = loomAdapter.parseUrl(
      `https://loom.com/share/${VALID_ID}`,
    );
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("rejects URL with non-hex id", () => {
    expect(
      loomAdapter.parseUrl(
        "https://www.loom.com/share/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
      ),
    ).toBeNull();
  });

  it("rejects URL with wrong-length id", () => {
    expect(
      loomAdapter.parseUrl("https://www.loom.com/share/abcdef"),
    ).toBeNull();
  });

  it("rejects unsupported loom paths", () => {
    expect(
      loomAdapter.parseUrl(`https://www.loom.com/looms/${VALID_ID}`),
    ).toBeNull();
    expect(loomAdapter.parseUrl("https://www.loom.com/")).toBeNull();
  });

  it("rejects non-Loom hosts", () => {
    expect(loomAdapter.parseUrl(`https://youtube.com/share/${VALID_ID}`)).toBeNull();
    expect(
      loomAdapter.parseUrl(`https://example.com/share/${VALID_ID}`),
    ).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(loomAdapter.parseUrl("not a url")).toBeNull();
    expect(loomAdapter.parseUrl("")).toBeNull();
  });
});

describe("loomAdapter.thumbnailUrl", () => {
  it("returns null because Loom thumbnails are not deterministic", () => {
    expect(loomAdapter.thumbnailUrl(VALID_ID)).toBeNull();
  });
});
