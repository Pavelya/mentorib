import type { ParsedVideoUrl, VideoProviderAdapter } from "./types";

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const YOUTU_BE_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

function isValidId(id: string | null | undefined): id is string {
  return typeof id === "string" && YOUTUBE_ID_PATTERN.test(id);
}

function extractIdFromYoutubeHost(parsed: URL): string | null {
  const path = parsed.pathname;

  if (path === "/watch" || path === "/watch/") {
    const id = parsed.searchParams.get("v");
    return isValidId(id) ? id : null;
  }

  const embedMatch = path.match(/^\/embed\/([^/?#]+)\/?$/);
  if (embedMatch && isValidId(embedMatch[1])) {
    return embedMatch[1];
  }

  const shortsMatch = path.match(/^\/shorts\/([^/?#]+)\/?$/);
  if (shortsMatch && isValidId(shortsMatch[1])) {
    return shortsMatch[1];
  }

  const vMatch = path.match(/^\/v\/([^/?#]+)\/?$/);
  if (vMatch && isValidId(vMatch[1])) {
    return vMatch[1];
  }

  return null;
}

function extractIdFromYoutuBeHost(parsed: URL): string | null {
  const trimmed = parsed.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!trimmed) return null;
  const firstSegment = trimmed.split("/")[0] ?? "";
  return isValidId(firstSegment) ? firstSegment : null;
}

function parse(url: string): ParsedVideoUrl | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  const host = parsed.hostname.toLowerCase();

  let id: string | null = null;
  if (YOUTUBE_HOSTS.has(host)) {
    id = extractIdFromYoutubeHost(parsed);
  } else if (YOUTU_BE_HOSTS.has(host)) {
    id = extractIdFromYoutuBeHost(parsed);
  } else {
    return null;
  }

  if (!id) return null;

  return {
    externalId: id,
    canonicalWatchUrl: `https://www.youtube.com/watch?v=${id}`,
    canonicalEmbedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
  };
}

export const youtubeAdapter: VideoProviderAdapter = {
  provider_key: "youtube",
  displayName: "YouTube",
  parseUrl: parse,
  thumbnailUrl: (externalId) =>
    isValidId(externalId)
      ? `https://i.ytimg.com/vi/${externalId}/hqdefault.jpg`
      : null,
};
