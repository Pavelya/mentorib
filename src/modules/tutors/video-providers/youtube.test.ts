import { describe, expect, it } from "vitest";

import { youtubeAdapter } from "./youtube";

const VALID_ID = "dQw4w9WgXcQ";

describe("youtubeAdapter.parseUrl", () => {
  it("parses canonical watch URL", () => {
    const result = youtubeAdapter.parseUrl(
      `https://www.youtube.com/watch?v=${VALID_ID}`,
    );
    expect(result).toEqual({
      externalId: VALID_ID,
      canonicalWatchUrl: `https://www.youtube.com/watch?v=${VALID_ID}`,
      canonicalEmbedUrl: `https://www.youtube-nocookie.com/embed/${VALID_ID}`,
    });
  });

  it("parses watch URL with extra query params and timestamp", () => {
    const result = youtubeAdapter.parseUrl(
      `https://www.youtube.com/watch?v=${VALID_ID}&t=42s&feature=share`,
    );
    expect(result?.externalId).toBe(VALID_ID);
    expect(result?.canonicalEmbedUrl).toBe(
      `https://www.youtube-nocookie.com/embed/${VALID_ID}`,
    );
  });

  it("parses mobile host", () => {
    const result = youtubeAdapter.parseUrl(
      `https://m.youtube.com/watch?v=${VALID_ID}`,
    );
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("parses youtu.be short URL", () => {
    const result = youtubeAdapter.parseUrl(`https://youtu.be/${VALID_ID}`);
    expect(result?.externalId).toBe(VALID_ID);
    expect(result?.canonicalWatchUrl).toBe(
      `https://www.youtube.com/watch?v=${VALID_ID}`,
    );
  });

  it("parses youtu.be with query params", () => {
    const result = youtubeAdapter.parseUrl(
      `https://youtu.be/${VALID_ID}?t=10s`,
    );
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("parses /embed URL", () => {
    const result = youtubeAdapter.parseUrl(
      `https://www.youtube.com/embed/${VALID_ID}`,
    );
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("parses youtube-nocookie /embed URL", () => {
    const result = youtubeAdapter.parseUrl(
      `https://www.youtube-nocookie.com/embed/${VALID_ID}`,
    );
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("parses /shorts URL", () => {
    const result = youtubeAdapter.parseUrl(
      `https://www.youtube.com/shorts/${VALID_ID}`,
    );
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("parses URL with timestamp fragment", () => {
    const result = youtubeAdapter.parseUrl(
      `https://www.youtube.com/watch?v=${VALID_ID}#t=30`,
    );
    expect(result?.externalId).toBe(VALID_ID);
  });

  it("rejects URL with no video id", () => {
    expect(youtubeAdapter.parseUrl("https://www.youtube.com/watch")).toBeNull();
  });

  it("rejects URL with malformed id", () => {
    expect(
      youtubeAdapter.parseUrl("https://www.youtube.com/watch?v=tooshort"),
    ).toBeNull();
    expect(
      youtubeAdapter.parseUrl(
        "https://www.youtube.com/watch?v=aaaaaaaaaaa!",
      ),
    ).toBeNull();
  });

  it("rejects non-YouTube hosts", () => {
    expect(youtubeAdapter.parseUrl(`https://vimeo.com/${VALID_ID}`)).toBeNull();
    expect(
      youtubeAdapter.parseUrl(`https://example.com/watch?v=${VALID_ID}`),
    ).toBeNull();
  });

  it("rejects non-http(s) protocols", () => {
    expect(
      youtubeAdapter.parseUrl(`javascript:alert(1)//www.youtube.com/watch?v=${VALID_ID}`),
    ).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(youtubeAdapter.parseUrl("not a url")).toBeNull();
    expect(youtubeAdapter.parseUrl("")).toBeNull();
  });
});

describe("youtubeAdapter.thumbnailUrl", () => {
  it("returns deterministic hqdefault URL for a valid id", () => {
    expect(youtubeAdapter.thumbnailUrl(VALID_ID)).toBe(
      `https://i.ytimg.com/vi/${VALID_ID}/hqdefault.jpg`,
    );
  });

  it("returns null for an invalid id", () => {
    expect(youtubeAdapter.thumbnailUrl("not-an-id")).toBeNull();
  });
});
