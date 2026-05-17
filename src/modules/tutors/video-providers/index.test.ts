import { describe, expect, it } from "vitest";

import {
  getVideoProviderAdapter,
  normalizeIntroVideoUrl,
  videoProviderRegistry,
  VideoProviderValidationError,
} from "./index";

const YOUTUBE_ID = "dQw4w9WgXcQ";
const VIMEO_ID = "76979871";
const LOOM_ID = "1234567890abcdef1234567890abcdef";

const UNSUPPORTED_COPY =
  "This video link isn't supported. Use a supported public video provider.";

describe("videoProviderRegistry", () => {
  it("contains the three supported providers in deterministic order", () => {
    expect(videoProviderRegistry.map((adapter) => adapter.provider_key)).toEqual(
      ["youtube", "vimeo", "loom"],
    );
  });
});

describe("getVideoProviderAdapter", () => {
  it("looks up adapter by provider_key", () => {
    expect(getVideoProviderAdapter("youtube")?.provider_key).toBe("youtube");
    expect(getVideoProviderAdapter("vimeo")?.provider_key).toBe("vimeo");
    expect(getVideoProviderAdapter("loom")?.provider_key).toBe("loom");
  });

  it("returns null for unknown provider_key", () => {
    expect(getVideoProviderAdapter("twitch")).toBeNull();
  });
});

describe("normalizeIntroVideoUrl — supported providers", () => {
  it("normalizes a YouTube watch URL", () => {
    expect(
      normalizeIntroVideoUrl(`https://www.youtube.com/watch?v=${YOUTUBE_ID}`),
    ).toEqual({
      providerKey: "youtube",
      externalId: YOUTUBE_ID,
      canonicalWatchUrl: `https://www.youtube.com/watch?v=${YOUTUBE_ID}`,
      canonicalEmbedUrl: `https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}`,
    });
  });

  it("normalizes a youtu.be short URL", () => {
    expect(normalizeIntroVideoUrl(`https://youtu.be/${YOUTUBE_ID}`)).toEqual({
      providerKey: "youtube",
      externalId: YOUTUBE_ID,
      canonicalWatchUrl: `https://www.youtube.com/watch?v=${YOUTUBE_ID}`,
      canonicalEmbedUrl: `https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}`,
    });
  });

  it("normalizes a Vimeo URL", () => {
    expect(normalizeIntroVideoUrl(`https://vimeo.com/${VIMEO_ID}`)).toEqual({
      providerKey: "vimeo",
      externalId: VIMEO_ID,
      canonicalWatchUrl: `https://vimeo.com/${VIMEO_ID}`,
      canonicalEmbedUrl: `https://player.vimeo.com/video/${VIMEO_ID}`,
    });
  });

  it("normalizes a Loom share URL", () => {
    expect(
      normalizeIntroVideoUrl(`https://www.loom.com/share/${LOOM_ID}`),
    ).toEqual({
      providerKey: "loom",
      externalId: LOOM_ID,
      canonicalWatchUrl: `https://www.loom.com/share/${LOOM_ID}`,
      canonicalEmbedUrl: `https://www.loom.com/embed/${LOOM_ID}`,
    });
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(
      normalizeIntroVideoUrl(`   https://youtu.be/${YOUTUBE_ID}   `),
    ).toMatchObject({ providerKey: "youtube", externalId: YOUTUBE_ID });
  });
});

describe("normalizeIntroVideoUrl — rejections", () => {
  function expectRejected(input: unknown): void {
    try {
      normalizeIntroVideoUrl(input as string);
    } catch (error) {
      expect(error).toBeInstanceOf(VideoProviderValidationError);
      expect((error as VideoProviderValidationError).kind).toBe("validation");
      expect((error as Error).message).toBe(UNSUPPORTED_COPY);
      return;
    }
    throw new Error("expected normalizeIntroVideoUrl to throw");
  }

  it("rejects unsupported provider hosts (Twitch)", () => {
    expectRejected("https://www.twitch.tv/videos/123456789");
  });

  it("rejects unsupported provider hosts (Wistia)", () => {
    expectRejected("https://example.wistia.com/medias/abcdefghij");
  });

  it("rejects unsupported provider hosts (Dailymotion)", () => {
    expectRejected("https://www.dailymotion.com/video/x7tgad0");
  });

  it("rejects pasted iframe HTML", () => {
    expectRejected(
      `<iframe src="https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}" allowfullscreen></iframe>`,
    );
  });

  it("rejects input that starts with a tag-shaped character", () => {
    expectRejected(`<script>fetch('https://youtube.com/watch?v=${YOUTUBE_ID}')</script>`);
  });

  it("rejects input with internal whitespace", () => {
    expectRejected(
      `https://www.youtube.com/watch?v=${YOUTUBE_ID} extra junk`,
    );
  });

  it("rejects empty input", () => {
    expectRejected("");
    expectRejected("   ");
  });

  it("rejects non-string input", () => {
    expectRejected(null);
    expectRejected(undefined);
    expectRejected(42);
  });

  it("rejects malformed URLs", () => {
    expectRejected("not a url");
    expectRejected("ftp://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  it("rejects supported-host URLs with invalid ids", () => {
    expectRejected("https://www.youtube.com/watch");
    expectRejected("https://vimeo.com/");
    expectRejected("https://www.loom.com/share/short");
  });
});
