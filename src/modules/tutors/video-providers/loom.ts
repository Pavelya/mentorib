import type { ParsedVideoUrl, VideoProviderAdapter } from "./types";

const LOOM_ID_PATTERN = /^[a-f0-9]{32}$/;

const LOOM_HOSTS = new Set(["loom.com", "www.loom.com"]);

function isValidId(id: string | null | undefined): id is string {
  return typeof id === "string" && LOOM_ID_PATTERN.test(id);
}

function extractIdFromLoomHost(parsed: URL): string | null {
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const kind = segments[0];
  const candidate = segments[1] ?? "";
  if (kind !== "share" && kind !== "embed") return null;
  return isValidId(candidate) ? candidate : null;
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
  if (!LOOM_HOSTS.has(host)) return null;

  const id = extractIdFromLoomHost(parsed);
  if (!id) return null;

  return {
    externalId: id,
    canonicalWatchUrl: `https://www.loom.com/share/${id}`,
    canonicalEmbedUrl: `https://www.loom.com/embed/${id}`,
  };
}

export const loomAdapter: VideoProviderAdapter = {
  provider_key: "loom",
  displayName: "Loom",
  parseUrl: parse,
  thumbnailUrl: () => null,
};
