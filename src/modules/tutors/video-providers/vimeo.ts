import type { ParsedVideoUrl, VideoProviderAdapter } from "./types";

const VIMEO_ID_PATTERN = /^[1-9][0-9]{0,15}$/;

const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com"]);
const VIMEO_PLAYER_HOSTS = new Set(["player.vimeo.com"]);

function isValidId(id: string | null | undefined): id is string {
  return typeof id === "string" && VIMEO_ID_PATTERN.test(id);
}

function extractIdFromVimeoHost(parsed: URL): string | null {
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const last = segments[segments.length - 1] ?? "";

  if (segments[0] === "channels" || segments[0] === "groups") {
    return isValidId(last) ? last : null;
  }

  if (segments[0] === "showcase" || segments[0] === "album") {
    if (segments[2] === "video" && segments[3]) {
      return isValidId(segments[3]) ? segments[3] : null;
    }
    return null;
  }

  if (segments.length === 1) {
    return isValidId(segments[0] ?? "") ? (segments[0] ?? null) : null;
  }

  if (segments.length === 2 && /^[A-Za-z0-9-]+$/.test(segments[0] ?? "")) {
    return isValidId(segments[1] ?? "") ? (segments[1] ?? null) : null;
  }

  return null;
}

function extractIdFromPlayerHost(parsed: URL): string | null {
  const match = parsed.pathname.match(/^\/video\/([^/?#]+)\/?$/);
  if (!match) return null;
  return isValidId(match[1]) ? match[1] : null;
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
  if (VIMEO_HOSTS.has(host)) {
    id = extractIdFromVimeoHost(parsed);
  } else if (VIMEO_PLAYER_HOSTS.has(host)) {
    id = extractIdFromPlayerHost(parsed);
  } else {
    return null;
  }

  if (!id) return null;

  return {
    externalId: id,
    canonicalWatchUrl: `https://vimeo.com/${id}`,
    canonicalEmbedUrl: `https://player.vimeo.com/video/${id}`,
  };
}

export const vimeoAdapter: VideoProviderAdapter = {
  provider_key: "vimeo",
  displayName: "Vimeo",
  parseUrl: parse,
  thumbnailUrl: () => null,
};
