import { describe, expect, it } from "vitest";

import { vimeoAdapter } from "./vimeo";

const VALID_ID = "76979871";

describe("vimeoAdapter.parseUrl", () => {
  it("parses canonical vimeo.com/ID URL", () => {
    const result = vimeoAdapter.parseUrl(`https://vimeo.com/${VALID_ID}`);
    expect(result).toEqual({
      externalId: VALID_ID,
      canonicalWatchUrl: `https://vimeo.com/${VALID_ID}`,
      canonicalEmbedUrl: `https://player.vimeo.com/video/${VALID_ID}`,
    });
  });

  it("parses player.vimeo.com/video/ID URL", () => {
    const result = vimeoAdapter.parseUrl(
      `https://player.vimeo.com/video/${VALID_ID}`,
    );
    expect(result?.externalId).toBe(VALID_ID);
    expect(result?.canonicalEmbedUrl).toBe(
      `https://player.vimeo.com/video/${VALID_ID}`,
    );
  });

  it("parses player URL with query params (autoplay etc.)", () => {
    const result = vimeoAdapter.parseUrl(
      `https://player.vimeo.com/video/${VALID_ID}?autoplay=1&muted=1`,
    );
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("parses vimeo.com/channels/NAME/ID URL", () => {
    const result = vimeoAdapter.parseUrl(
      `https://vimeo.com/channels/staffpicks/${VALID_ID}`,
    );
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("parses vimeo.com/groups/NAME/videos/ID-style is rejected when no /videos/", () => {
    expect(
      vimeoAdapter.parseUrl(`https://vimeo.com/groups/somegroup/${VALID_ID}`),
    ).toEqual({
      externalId: VALID_ID,
      canonicalWatchUrl: `https://vimeo.com/${VALID_ID}`,
      canonicalEmbedUrl: `https://player.vimeo.com/video/${VALID_ID}`,
    });
  });

  it("parses URL with hash fragment", () => {
    const result = vimeoAdapter.parseUrl(`https://vimeo.com/${VALID_ID}#t=30s`);
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("rejects URL with non-numeric id", () => {
    expect(vimeoAdapter.parseUrl("https://vimeo.com/abcd-not-an-id")).toBeNull();
  });

  it("rejects empty path", () => {
    expect(vimeoAdapter.parseUrl("https://vimeo.com/")).toBeNull();
  });

  it("rejects non-Vimeo hosts", () => {
    expect(vimeoAdapter.parseUrl(`https://youtube.com/${VALID_ID}`)).toBeNull();
    expect(
      vimeoAdapter.parseUrl(`https://example.com/${VALID_ID}`),
    ).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(vimeoAdapter.parseUrl("not a url")).toBeNull();
    expect(vimeoAdapter.parseUrl("")).toBeNull();
  });
});

describe("vimeoAdapter.thumbnailUrl", () => {
  it("returns null because Vimeo thumbnails require API lookup", () => {
    expect(vimeoAdapter.thumbnailUrl(VALID_ID)).toBeNull();
  });
});
